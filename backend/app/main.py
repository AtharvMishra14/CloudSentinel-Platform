
import csv
import io
import logging

from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

import pandas as pd

from fastapi import (
    FastAPI,
    File,
    HTTPException,
    UploadFile,
    Query,
    Path as APIPath,
)

from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.model_service import model_service

from app.database import (
    initialize_database,
    save_analysis,
    list_analyses,
    get_analysis,
    get_dashboard_summary,
)


# ---------------------------------------------------------
# APPLICATION CONFIGURATION
# ---------------------------------------------------------

APP_NAME = "CloudSentinel API"
APP_VERSION = "0.4.0"

MAX_FILE_SIZE = 10 * 1024 * 1024
MAX_ROWS = 5000

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cloudsentinel")


# ---------------------------------------------------------
# APPLICATION LIFESPAN
# ---------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    yield


# ---------------------------------------------------------
# FASTAPI APPLICATION
# ---------------------------------------------------------

app = FastAPI(
    title=APP_NAME,
    description=(
        "Backend API for CloudSentinel, "
        "a cloud anomaly detection and investigation platform."
    ),
    version=APP_VERSION,
    lifespan=lifespan,
)


# ---------------------------------------------------------
# CORS CONFIGURATION
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# RESPONSE SCHEMAS
# ---------------------------------------------------------

class HealthResponse(BaseModel):
    status: Literal["ok"]
    service: str
    version: str
    timestamp: datetime


# ---------------------------------------------------------
# ROOT ENDPOINT
# ---------------------------------------------------------

@app.get("/", tags=["System"])
async def root():
    return {
        "message": "Welcome to CloudSentinel API",
        "service": APP_NAME,
        "version": APP_VERSION,
        "documentation": "/docs",
        "health_check": "/api/v1/health",
    }


# ---------------------------------------------------------
# HEALTH CHECK
# ---------------------------------------------------------

@app.get(
    "/api/v1/health",
    response_model=HealthResponse,
    tags=["System"],
)
async def health_check():
    return HealthResponse(
        status="ok",
        service=APP_NAME,
        version=APP_VERSION,
        timestamp=datetime.now(timezone.utc),
    )


# ---------------------------------------------------------
# MODEL INFORMATION
# ---------------------------------------------------------

@app.get(
    "/api/v1/model/info",
    tags=["Model"],
)
async def get_model_info():
    return model_service.get_model_info()


# ---------------------------------------------------------
# DASHBOARD SUMMARY
# ---------------------------------------------------------

@app.get(
    "/api/v1/dashboard/summary",
    tags=["Dashboard"],
)
async def dashboard_summary():
    """
    Return statistics calculated from saved SQLite records.
    """

    try:
        return get_dashboard_summary()

    except Exception:
        logger.exception("Unable to retrieve dashboard summary.")

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve dashboard summary.",
        )


# ---------------------------------------------------------
# CSV PREDICTION AND DATABASE STORAGE
# ---------------------------------------------------------

@app.post(
    "/api/v1/predict/csv",
    tags=["Predictions"],
)
async def predict_csv(
    file: UploadFile = File(...),
):
    filename = file.filename or ""

    if Path(filename).suffix.lower() != ".csv":
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are supported.",
        )

    try:
        contents = await file.read(MAX_FILE_SIZE + 1)
    finally:
        await file.close()

    if not contents:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty.",
        )

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="File exceeds the maximum allowed size of 10 MB.",
        )

    try:
        try:
            decoded_text = contents.decode("utf-8-sig")
        except UnicodeDecodeError:
            decoded_text = contents.decode("cp1252")

    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Could not decode the CSV file.",
        )

    # Validate CSV headers.
    try:
        reader = csv.reader(io.StringIO(decoded_text))
        headers = next(reader, None)

        if not headers:
            raise HTTPException(
                status_code=400,
                detail="The CSV file does not contain a header row.",
            )

        normalized_headers = [
            str(header).strip().lower()
            for header in headers
        ]

        if any(not header for header in normalized_headers):
            raise HTTPException(
                status_code=400,
                detail="The CSV contains an empty column name.",
            )

        if len(set(normalized_headers)) != len(normalized_headers):
            raise HTTPException(
                status_code=400,
                detail="The CSV contains duplicate column names.",
            )

    except csv.Error:
        raise HTTPException(
            status_code=400,
            detail="The CSV header could not be read.",
        )

    # Parse CSV.
    try:
        raw = pd.read_csv(io.StringIO(decoded_text))

    except pd.errors.EmptyDataError:
        raise HTTPException(
            status_code=400,
            detail="The CSV file contains no data.",
        )

    except pd.errors.ParserError:
        raise HTTPException(
            status_code=400,
            detail="The CSV format is invalid or malformed.",
        )

    except Exception:
        logger.exception("CSV parsing failed.")

        raise HTTPException(
            status_code=400,
            detail="Unable to read the uploaded CSV file.",
        )

    if raw.empty:
        raise HTTPException(
            status_code=400,
            detail="The CSV contains no data rows.",
        )

    if len(raw) > MAX_ROWS:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum supported records per upload: {MAX_ROWS}.",
        )

    # Generate predictions and save them.
    try:
        result = model_service.predict_dataframe(raw)

        analysis_id = save_analysis(
            filename,
            result,
        )

        stored_analysis = get_analysis(analysis_id)

        if stored_analysis is None:
            raise RuntimeError(
                "Analysis was not found after database insertion."
            )

        logger.info(
            "Analysis %s saved successfully. Cases: %s",
            analysis_id,
            result["total_cases"],
        )

        return {
            "message": "CSV processed and analysis saved successfully.",
            "analysis_id": analysis_id,
            "created_at": stored_analysis["created_at"],
            "file_name": filename,
            "data": stored_analysis["data"],
        }

    except (ValueError, TypeError) as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception:
        logger.exception(
            "CloudSentinel prediction or database storage failed."
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Prediction or database storage failed. "
                "Check the backend logs."
            ),
        )


# ---------------------------------------------------------
# ANALYSIS HISTORY
# ---------------------------------------------------------

@app.get(
    "/api/v1/analyses",
    tags=["Analysis History"],
)
async def get_analysis_history(
    limit: int = Query(default=50, ge=1, le=100),
):
    try:
        analyses = list_analyses(limit=limit)

        return {
            "count": len(analyses),
            "analyses": analyses,
        }

    except Exception:
        logger.exception(
            "Unable to retrieve analysis history."
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve analysis history.",
        )


# ---------------------------------------------------------
# RETRIEVE ONE SAVED ANALYSIS
# ---------------------------------------------------------

@app.get(
    "/api/v1/analyses/{analysis_id}",
    tags=["Analysis History"],
)
async def retrieve_analysis(
    analysis_id: int = APIPath(gt=0),
):
    try:
        analysis = get_analysis(analysis_id)

        if analysis is None:
            raise HTTPException(
                status_code=404,
                detail=f"Analysis {analysis_id} was not found.",
            )

        return {
            "message": "Analysis retrieved successfully.",
            "analysis_id": analysis["id"],
            "created_at": analysis["created_at"],
            "file_name": analysis["file_name"],
            "data": analysis["data"],
        }

    except HTTPException:
        raise

    except Exception:
        logger.exception(
            "Unable to retrieve analysis %s.",
            analysis_id,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve the requested analysis.",
        )
