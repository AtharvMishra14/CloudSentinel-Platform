
import json
import sqlite3

from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator


# ---------------------------------------------------------
# DATABASE CONFIGURATION
# ---------------------------------------------------------

BACKEND_DIR = Path(__file__).resolve().parents[1]

DATA_DIR = BACKEND_DIR / "data"
DATABASE_PATH = DATA_DIR / "cloudsentinel.db"


# ---------------------------------------------------------
# DATABASE CONNECTION
# ---------------------------------------------------------

@contextmanager
def get_connection() -> Iterator[sqlite3.Connection]:
    """Create a database connection and manage its transaction."""

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    connection = sqlite3.connect(
        DATABASE_PATH,
        timeout=10,
    )

    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")

    try:
        yield connection
        connection.commit()

    except Exception:
        connection.rollback()
        raise

    finally:
        connection.close()


# ---------------------------------------------------------
# DATABASE INITIALIZATION
# ---------------------------------------------------------

def initialize_database() -> None:
    """Create database tables if they do not already exist."""

    with get_connection() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS analyses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_name TEXT NOT NULL,
                model_name TEXT NOT NULL,
                total_cases INTEGER NOT NULL
                    CHECK(total_cases >= 0),
                created_at TEXT NOT NULL,
                preprocessing_json TEXT NOT NULL,
                warnings_json TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                analysis_id INTEGER NOT NULL,
                row_number INTEGER NOT NULL
                    CHECK(row_number > 0),
                case_id TEXT,
                predicted_class_id INTEGER NOT NULL
                    CHECK(predicted_class_id BETWEEN 0 AND 2),
                predicted_class TEXT NOT NULL,
                confidence REAL NOT NULL
                    CHECK(confidence BETWEEN 0 AND 1),
                probabilities_json TEXT NOT NULL,

                FOREIGN KEY (analysis_id)
                    REFERENCES analyses(id)
                    ON DELETE CASCADE,

                UNIQUE (analysis_id, row_number)
            );

            CREATE INDEX IF NOT EXISTS
                idx_predictions_analysis_id
            ON predictions(analysis_id);

            CREATE INDEX IF NOT EXISTS
                idx_analyses_created_at
            ON analyses(created_at);
            """
        )

    print("CloudSentinel database initialized successfully.")


# ---------------------------------------------------------
# SAVE ANALYSIS
# ---------------------------------------------------------

def save_analysis(
    file_name: str,
    data: dict[str, Any],
) -> int:
    """Save an analysis and its predictions. Return its ID."""

    if not file_name or not file_name.strip():
        raise ValueError("A valid file name is required.")

    predictions = data.get("predictions")

    if not isinstance(predictions, list) or not predictions:
        raise ValueError(
            "The analysis must contain at least one prediction."
        )

    total_cases = int(
        data.get("total_cases", len(predictions))
    )

    if total_cases != len(predictions):
        raise ValueError(
            "The total case count does not match the predictions."
        )

    created_at = datetime.now(timezone.utc).isoformat()

    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO analyses (
                file_name,
                model_name,
                total_cases,
                created_at,
                preprocessing_json,
                warnings_json
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                file_name,
                data.get("model_name", "Unknown model"),
                total_cases,
                created_at,
                json.dumps(
                    data.get("preprocessing", {}),
                    ensure_ascii=False,
                ),
                json.dumps(
                    data.get("warnings", []),
                    ensure_ascii=False,
                ),
            ),
        )

        analysis_id = int(cursor.lastrowid)

        prediction_records = []

        for prediction in predictions:
            prediction_records.append(
                (
                    analysis_id,
                    int(prediction["row_number"]),
                    prediction.get("case_id"),
                    int(prediction["predicted_class_id"]),
                    prediction["predicted_class"],
                    float(prediction["confidence"]),
                    json.dumps(
                        prediction["probabilities"],
                        ensure_ascii=False,
                    ),
                )
            )

        connection.executemany(
            """
            INSERT INTO predictions (
                analysis_id,
                row_number,
                case_id,
                predicted_class_id,
                predicted_class,
                confidence,
                probabilities_json
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            prediction_records,
        )

    return analysis_id


# ---------------------------------------------------------
# LIST PREVIOUS ANALYSES
# ---------------------------------------------------------

def list_analyses(
    limit: int = 50,
) -> list[dict[str, Any]]:
    """Return the most recent analyses."""

    safe_limit = max(1, min(int(limit), 100))

    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT
                id,
                file_name,
                model_name,
                total_cases,
                created_at
            FROM analyses
            ORDER BY id DESC
            LIMIT ?
            """,
            (safe_limit,),
        ).fetchall()

    return [dict(row) for row in rows]


# ---------------------------------------------------------
# GET ONE ANALYSIS WITH ALL PREDICTIONS
# ---------------------------------------------------------

def get_analysis(
    analysis_id: int,
) -> dict[str, Any] | None:
    """Retrieve one saved analysis and all its predictions."""

    with get_connection() as connection:
        analysis = connection.execute(
            """
            SELECT *
            FROM analyses
            WHERE id = ?
            """,
            (analysis_id,),
        ).fetchone()

        if analysis is None:
            return None

        prediction_rows = connection.execute(
            """
            SELECT
                row_number,
                case_id,
                predicted_class_id,
                predicted_class,
                confidence,
                probabilities_json
            FROM predictions
            WHERE analysis_id = ?
            ORDER BY row_number
            """,
            (analysis_id,),
        ).fetchall()

    predictions = []

    for row in prediction_rows:
        predictions.append(
            {
                "row_number": row["row_number"],
                "case_id": row["case_id"],
                "predicted_class_id": row["predicted_class_id"],
                "predicted_class": row["predicted_class"],
                "confidence": row["confidence"],
                "probabilities": json.loads(
                    row["probabilities_json"]
                ),
            }
        )

    return {
        "id": analysis["id"],
        "created_at": analysis["created_at"],
        "file_name": analysis["file_name"],
        "data": {
            "model_name": analysis["model_name"],
            "total_cases": analysis["total_cases"],
            "predictions": predictions,
            "preprocessing": json.loads(
                analysis["preprocessing_json"]
            ),
            "warnings": json.loads(
                analysis["warnings_json"]
            ),
        },
    }


# ---------------------------------------------------------
# DASHBOARD SUMMARY
# ---------------------------------------------------------

def get_dashboard_summary() -> dict[str, Any]:
    """
    Calculate dashboard statistics across all saved analyses.

    Counts are based on saved prediction records. If the same
    dataset is uploaded multiple times, its records are counted
    once for each saved analysis.
    """

    class_names = [
        "Normal",
        "System Anomaly",
        "Malicious Event",
    ]

    classification_counts = {
        name: 0 for name in class_names
    }

    with get_connection() as connection:

        # Overall analysis and processed-record counts.
        totals = connection.execute(
            """
            SELECT
                COUNT(*) AS total_analyses,
                COALESCE(SUM(total_cases), 0)
                    AS total_cases_processed
            FROM analyses
            """
        ).fetchone()

        # Classification counts across all saved predictions.
        class_rows = connection.execute(
            """
            SELECT
                predicted_class,
                COUNT(*) AS case_count
            FROM predictions
            GROUP BY predicted_class
            """
        ).fetchall()

        for row in class_rows:
            class_name = row["predicted_class"]

            if class_name in classification_counts:
                classification_counts[class_name] = row[
                    "case_count"
                ]

        # Latest uploaded analysis.
        latest_row = connection.execute(
            """
            SELECT
                id,
                file_name,
                model_name,
                total_cases,
                created_at
            FROM analyses
            ORDER BY id DESC
            LIMIT 1
            """
        ).fetchone()

        # Five most recent analyses.
        recent_rows = connection.execute(
            """
            SELECT
                id,
                file_name,
                model_name,
                total_cases,
                created_at
            FROM analyses
            ORDER BY id DESC
            LIMIT 5
            """
        ).fetchall()

    return {
        "total_analyses": totals["total_analyses"],
        "total_cases_processed": totals[
            "total_cases_processed"
        ],
        "classifications": classification_counts,
        "latest_analysis": (
            dict(latest_row) if latest_row else None
        ),
        "recent_analyses": [
            dict(row) for row in recent_rows
        ],
    }
