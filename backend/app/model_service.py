
import json
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
import scipy.sparse as sp


# ---------------------------------------------------------
# MODEL FILE LOCATIONS
# ---------------------------------------------------------

BACKEND_DIR = Path(__file__).resolve().parents[1]
MODEL_DIR = BACKEND_DIR / "models"

MODEL_PATH = MODEL_DIR / "cloudsentinel_model_bundle.joblib"
SCHEMA_PATH = MODEL_DIR / "cloudsentinel_input_schema.json"


# ---------------------------------------------------------
# CLOUDSENTINEL MODEL SERVICE
# ---------------------------------------------------------

class CloudSentinelModelService:
    """
    Loads the saved CloudSentinel model bundle and reproduces
    the original Streamlit application's inference pipeline.

    Reuses:
    - Saved numerical median imputer
    - Saved TF-IDF vectorizer
    - Trained LightGBM classifier
    - Saved class names and feature definitions
    """

    def __init__(self) -> None:
        self.bundle: dict[str, Any] = {}
        self.schema: dict[str, Any] = {}

        self.model = None
        self.imputer = None
        self.vectorizer = None

        self.feature_columns: list[str] = []
        self.class_names: list[str] = []

        self.log_text_column = "log_text"
        self.case_id_column = "case_id"
        self.model_name = "CloudSentinel"

        self._load_model()

    # -----------------------------------------------------
    # LOAD SAVED MODEL AND SCHEMA
    # -----------------------------------------------------

    def _load_model(self) -> None:
        if not MODEL_PATH.is_file():
            raise FileNotFoundError(
                f"Model bundle not found: {MODEL_PATH}"
            )

        if not SCHEMA_PATH.is_file():
            raise FileNotFoundError(
                f"Input schema not found: {SCHEMA_PATH}"
            )

        with SCHEMA_PATH.open("r", encoding="utf-8") as file:
            self.schema = json.load(file)

        # Only load model artifacts created by a trusted source.
        self.bundle = joblib.load(MODEL_PATH)

        required_components = [
            "model",
            "imputer",
            "vectorizer",
            "feature_columns",
            "class_names",
        ]

        missing_components = [
            key
            for key in required_components
            if key not in self.bundle
        ]

        if missing_components:
            raise ValueError(
                "Model bundle is missing components: "
                + ", ".join(missing_components)
            )

        self.model = self.bundle["model"]
        self.imputer = self.bundle["imputer"]
        self.vectorizer = self.bundle["vectorizer"]

        self.feature_columns = list(
            self.bundle["feature_columns"]
        )

        self.class_names = list(
            self.bundle["class_names"]
        )

        self.model_name = self.bundle.get(
            "model_name",
            "CloudSentinel LightGBM"
        )

        self.log_text_column = self.schema.get(
            "log_text_column",
            "log_text"
        )

        self.case_id_column = self.schema.get(
            "optional_case_id_column",
            "case_id"
        )

        self._validate_model_configuration()

        print(
            f"CloudSentinel model loaded successfully: "
            f"{self.model_name}"
        )

    # -----------------------------------------------------
    # VALIDATE MODEL CONFIGURATION
    # -----------------------------------------------------

    def _validate_model_configuration(self) -> None:
        schema_features = self.schema.get(
            "feature_columns",
            []
        )

        if schema_features != self.feature_columns:
            raise ValueError(
                "Feature columns in the model bundle do not "
                "match the input schema."
            )

        schema_classes = self.schema.get(
            "class_names",
            []
        )

        if schema_classes != self.class_names:
            raise ValueError(
                "Class names in the model bundle do not "
                "match the input schema."
            )

        if len(self.feature_columns) != self.imputer.n_features_in_:
            raise ValueError(
                "The numerical feature count does not match "
                "the saved imputer."
            )

        if len(self.class_names) != 3:
            raise ValueError(
                "CloudSentinel expects exactly three classes."
            )

        expected_features = (
            len(self.feature_columns)
            + len(self.vectorizer.vocabulary_)
        )

        actual_features = self.model.n_features_in_

        if expected_features != actual_features:
            raise ValueError(
                f"Feature dimension mismatch. "
                f"Expected {expected_features}, "
                f"but LightGBM expects {actual_features}."
            )

        model_classes = {
            int(class_id)
            for class_id in self.model.classes_
        }

        expected_classes = set(range(len(self.class_names)))

        if model_classes != expected_classes:
            raise ValueError(
                "LightGBM class IDs do not match the "
                "configured class names."
            )

    # -----------------------------------------------------
    # MODEL INFORMATION
    # -----------------------------------------------------

    def get_model_info(self) -> dict[str, Any]:
        return {
            "model_name": self.model_name,
            "model_type": type(self.model).__name__,
            "numerical_features": len(self.feature_columns),
            "tfidf_features": len(self.vectorizer.vocabulary_),
            "total_model_features": int(
                self.model.n_features_in_
            ),
            "classes": self.class_names,
            "training_cases": self.bundle.get(
                "training_cases"
            ),
            "status": "loaded",
        }

    # -----------------------------------------------------
    # PREPARE AND VALIDATE INPUT DATA
    # -----------------------------------------------------

    def _prepare_input(
        self,
        raw: pd.DataFrame,
    ) -> tuple[pd.DataFrame, list[str], list[str], int, int]:

        if not isinstance(raw, pd.DataFrame):
            raise TypeError(
                "Input must be a pandas DataFrame."
            )

        if raw.empty:
            raise ValueError(
                "The uploaded dataset contains no records."
            )

        if raw.columns.duplicated().any():
            raise ValueError(
                "The dataset contains duplicate column names."
            )

        normalized_columns = [
            str(column).strip().lower()
            for column in raw.columns
        ]

        if len(set(normalized_columns)) != len(normalized_columns):
            raise ValueError(
                "The dataset contains column names that become "
                "duplicates after ignoring capitalization or spaces."
            )

        # Find the log-text column using the same aliases
        # supported by the original Streamlit application.
        name_map = {
            str(column).strip().lower(): column
            for column in raw.columns
        }

        supported_log_columns = [
            self.log_text_column,
            "log_text",
            "log",
            "logs",
            "message",
            "raw_log",
        ]

        supported_log_columns = list(
            dict.fromkeys(
                str(name).strip().lower()
                for name in supported_log_columns
            )
        )

        text_column = next(
            (
                name_map[name]
                for name in supported_log_columns
                if name in name_map
            ),
            None,
        )

        if text_column is None:
            raise ValueError(
                "Missing log text. Add a column named "
                "log_text, log, logs, message, or raw_log."
            )

        logs = (
            raw[text_column]
            .fillna("")
            .astype(str)
            .tolist()
        )

        empty_log_rows = sum(
            not text.strip()
            for text in logs
        )

        if empty_log_rows == len(logs):
            raise ValueError(
                "All log-text values are empty."
            )

        # Prepare the 35 numerical features in the exact
        # order expected by the saved imputer.
        numeric = pd.DataFrame(index=raw.index)

        missing_columns: list[str] = []

        for column in self.feature_columns:
            if column in raw.columns:
                numeric[column] = pd.to_numeric(
                    raw[column],
                    errors="coerce"
                )
            else:
                numeric[column] = np.nan
                missing_columns.append(column)

        # Match the original Streamlit preprocessing.
        numeric = numeric.replace(
            [np.inf, -np.inf],
            np.nan
        )

        missing_cells = int(
            numeric.isna().sum().sum()
        )

        # Return ALL values required by the prediction method.
        return (
            numeric,
            logs,
            missing_columns,
            missing_cells,
            empty_log_rows,
        )

    # -----------------------------------------------------
    # PREDICTION PIPELINE
    # -----------------------------------------------------

    def predict_dataframe(
        self,
        raw: pd.DataFrame,
    ) -> dict[str, Any]:

        (
            numeric,
            logs,
            missing_columns,
            missing_cells,
            empty_log_rows,
        ) = self._prepare_input(raw)

        # Step 1: Apply the original saved median imputer.
        X_num = self.imputer.transform(numeric)

        # Step 2: Apply the original saved TF-IDF vectorizer.
        X_text = self.vectorizer.transform(logs)

        # Step 3: Combine numerical and text features.
        X = sp.hstack(
            [
                sp.csr_matrix(X_num),
                X_text,
            ],
            format="csr",
        )

        # Safety check before model inference.
        if X.shape[1] != self.model.n_features_in_:
            raise ValueError(
                f"Prepared data has {X.shape[1]} features, "
                f"but the model expects "
                f"{self.model.n_features_in_}."
            )

        # Step 4: Generate predictions and probabilities.
        prediction_ids = (
            self.model.predict(X).astype(int)
        )

        raw_probabilities = self.model.predict_proba(X)

        # Step 5: Arrange probabilities using the
        # configured class IDs, not assumed model ordering.
        probabilities = np.zeros(
            (len(raw), len(self.class_names)),
            dtype=float,
        )

        for position, class_id in enumerate(
            self.model.classes_
        ):
            class_index = int(class_id)

            probabilities[:, class_index] = (
                raw_probabilities[:, position]
            )

        # Step 6: Prepare JSON-friendly prediction results.
        predictions: list[dict[str, Any]] = []

        for row_position, prediction_id in enumerate(
            prediction_ids
        ):
            class_id = int(prediction_id)

            probability_by_class = {
                class_name: float(
                    probabilities[row_position, class_index]
                )
                for class_index, class_name
                in enumerate(self.class_names)
            }

            case_id = None

            if self.case_id_column in raw.columns:
                raw_case_id = raw[
                    self.case_id_column
                ].iloc[row_position]

                if not pd.isna(raw_case_id):
                    case_id = str(raw_case_id)

            predictions.append(
                {
                    "row_number": row_position + 1,
                    "case_id": case_id,
                    "predicted_class_id": class_id,
                    "predicted_class": self.class_names[
                        class_id
                    ],
                    "confidence": float(
                        probabilities[row_position, class_id]
                    ),
                    "probabilities": probability_by_class,
                }
            )

        # Step 7: Return predictions and preprocessing details.
        warnings: list[str] = []

        if missing_columns:
            warnings.append(
                f"{len(missing_columns)} numerical feature "
                "columns were absent and filled using the "
                "saved median imputer."
            )

        if missing_cells:
            warnings.append(
                f"{missing_cells} numerical cells were "
                "missing or invalid and were imputed."
            )

        if empty_log_rows:
            warnings.append(
                f"{empty_log_rows} records had empty log text."
            )

        return {
            "model_name": self.model_name,
            "total_cases": len(raw),
            "predictions": predictions,
            "preprocessing": {
                "numerical_features": len(self.feature_columns),
                "tfidf_features": len(
                    self.vectorizer.vocabulary_
                ),
                "total_model_features": int(X.shape[1]),
                "missing_numerical_columns": missing_columns,
                "missing_numerical_cells": missing_cells,
                "empty_log_rows": empty_log_rows,
            },
            "warnings": warnings,
        }


# ---------------------------------------------------------
# SHARED MODEL SERVICE INSTANCE
# ---------------------------------------------------------

model_service = CloudSentinelModelService()
