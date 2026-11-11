# CloudSentinel

### Machine Learning-Based Anomaly Detection Platform for Cloud Systems

CloudSentinel is a research-oriented cloud security analytics application that uses machine learning to classify cloud-system records into **Normal**, **System Anomaly**, and **Malicious Event** categories.

Built as part of the CloudAnoBench research project, CloudSentinel combines numerical cloud telemetry features with log-text features using an AISAPSO-inspired LightGBM classification model.

The application provides CSV-based batch analysis, prediction confidence and probability breakdowns, persistent analysis history, model evaluation visualizations, and downloadable reports.

> **Project status:** Local research prototype. Production deployment and security hardening are not yet complete.

---

## 1. Features

### Security Analytics
- Three-class cloud anomaly classification.
- Combined numerical telemetry and log-text analysis.
- LightGBM-based machine learning inference.
- Estimated probabilities for all three output classes.
- Case-level investigation and classification breakdown.

### Data Ingestion
- CSV-based batch prediction.
- Support for log-text column aliases:
  - `log_text`
  - `log`
  - `logs`
  - `message`
  - `raw_log`
- Automatic handling of missing numerical values using the saved median imputer.
- Automatic fallback case identifiers when `case_id` is absent.
- Input validation for malformed CSV files and duplicate column names.

### Dashboard and Reporting
- Live workspace statistics.
- Prediction distribution charts.
- Active model information.
- Investigation interface with case-level probabilities.
- Model evaluation dashboard.
- Persistent analysis history.
- CSV prediction export.
- JSON analysis report export.

### Storage
- SQLite-based analysis persistence.
- Automatic analysis retrieval after application restarts.
- Ability to reopen previous analyses.

---

## 2. Technology Stack

| Component | Technology |
|---|---|
| Frontend | Next.js 16 |
| UI | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Python and FastAPI |
| Machine Learning | LightGBM |
| Text Processing | TF-IDF |
| Data Processing | NumPy and Pandas |
| Model Preprocessing | Scikit-learn |
| Model Serialization | Joblib |
| Database | SQLite |
| API Server | Uvicorn |

---

## 3. System Architecture

```text
                  USER
                    |
                    v
          NEXT.JS FRONTEND
             React / TypeScript
                    |
                    | HTTP API
                    v
             FASTAPI BACKEND
                    |
          +---------+---------+
          |                   |
          v                   v
     CSV VALIDATION      MODEL SERVICE
          |                   |
          v                   v
    DATA PREPROCESSING   SAVED MODEL BUNDLE
          |                   |
          +---------+---------+
                    |
                    v
              PREDICTIONS
                    |
          +---------+---------+
          |                   |
          v                   v
      SQLITE DATABASE     REPORT EXPORT
          |               CSV / JSON
          v
      ANALYSIS HISTORY
```

---

## 4. Machine Learning Pipeline

CloudSentinel uses an AISAPSO-inspired LightGBM model.

The combined input representation consists of:

| Feature group | Number of features |
|---|---:|
| Numerical telemetry | 35 |
| TF-IDF log-text features | 1,000 |
| **Total** | **1,035** |

The numerical features represent five cloud resource groups:

- CPU usage
- Memory usage
- Disk I/O
- Inbound network traffic
- Outbound network traffic

Each group contains seven statistical summaries: mean, median, standard deviation, minimum, maximum, 10th percentile, and 90th percentile.

### Classification Outputs

1. Normal
2. System Anomaly
3. Malicious Event

The backend applies the saved preprocessing pipeline, combines numerical and text features, performs model inference, and returns class probabilities.

### Missing Data Handling

- Missing numerical values are converted to missing values and processed using the saved median imputer.
- Missing numerical columns are filled using the model's saved preprocessing configuration.
- Completely empty log-text inputs are rejected.
- Partially empty log-text records are flagged through preprocessing warnings.

---

## 5. Research Evaluation

The underlying CloudAnoBench experiment retained 1,241 cases across three classes:

| Class | Cases |
|---|---:|
| Normal | 558 |
| System Anomaly | 460 |
| Malicious Event | 223 |
| **Total** | **1,241** |

The research compared five machine learning approaches using five scenario-aware outer folds.

### AISAPSO-Inspired LightGBM Results

| Metric | Mean ± Standard Deviation |
|---|---:|
| Accuracy | 0.8313 ± 0.0336 |
| Macro F1-score | 0.7919 ± 0.0540 |
| Weighted F1-score | 0.8271 ± 0.0354 |

The AISAPSO-inspired approach is an adaptation inspired by the published optimization method, not a claim of exact reproduction.

**Research limitations:**

- The observed improvement over the combined LightGBM baseline is modest.
- Statistical significance of the improvement has not been established.
- External validation has not been completed.
- The six-case demonstration dataset contains training-derived examples.
- Synthetic upload tests validate application behaviour, not real-world detection accuracy.

CloudSentinel should therefore be treated as a research prototype rather than a production-certified security monitoring system.

---

## 6. Project Structure

```text
CloudSentinel-Platform/
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── model_service.py
│   │   └── database.py
│   │
│   ├── models/
│   │   ├── cloudsentinel_model_bundle.joblib
│   │   └── cloudsentinel_input_schema.json
│   │
│   ├── data/
│   │   └── cloudsentinel.db
│   │
│   ├── requirements.txt
│   └── .gitignore
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx
│   │   │   ├── data-ingestion/
│   │   │   ├── investigations/
│   │   │   ├── model-performance/
│   │   │   ├── analysis-history/
│   │   │   ├── reports/
│   │   │   └── api-status/
│   │   │
│   │   └── components/
│   │       ├── analysis-provider.tsx
│   │       └── dashboard-shell.tsx
│   │
│   ├── package.json
│   ├── package-lock.json
│   └── .gitignore
│
├── .gitignore
└── README.md
```

The local SQLite database is generated automatically by the backend and is not committed to Git.

---

## 7. Prerequisites

Install the following software:

- Python 3.13 or a compatible Python version.
- Node.js and npm.
- Git.
- A modern web browser.

---

## 8. Installation and Setup

Clone the repository:

```powershell
git clone https://github.com/AtharvMishra14/CloudSentinel-Platform.git

cd CloudSentinel-Platform
```

### Backend Setup

Navigate to the backend:

```powershell
cd backend
```

Create a Python virtual environment:

```powershell
python -m venv .venv
```

Activate it:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
python -m pip install --upgrade pip

pip install -r requirements.txt
```

Start the FastAPI backend:

```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend address:

```text
http://127.0.0.1:8000
```

### Frontend Setup

Open a second terminal and navigate to the frontend:

```powershell
cd frontend
```

Install dependencies:

```powershell
npm install
```

Create a file named `.env.local` inside the frontend directory with:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

Start the frontend:

```powershell
npm run dev
```

Frontend address:

```text
http://localhost:3000
```

Keep both development servers running while using CloudSentinel.

---

## 9. API Endpoints

The FastAPI backend currently exposes the following endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Backend root |
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/model/info` | Model information |
| GET | `/api/v1/dashboard/summary` | Dashboard statistics |
| POST | `/api/v1/predict/csv` | Upload and analyse CSV |
| GET | `/api/v1/analyses` | Retrieve saved analyses |
| GET | `/api/v1/analyses/{analysis_id}` | Retrieve an individual analysis |

Interactive API documentation is available locally at:

```text
http://127.0.0.1:8000/docs
```

---

## 10. Upload Validation Limits

The current backend implements the following limits:

| Validation | Limit |
|---|---:|
| Maximum CSV file size | 10 MiB |
| Maximum records per upload | 5,000 |
| Required log-text data | At least one supported log-text column |
| Empty CSV | Rejected |
| Malformed CSV | Rejected |
| Duplicate column names | Rejected |

Missing numerical telemetry can be imputed, but predictions made without actual telemetry should be interpreted cautiously.

---

## 11. Database

CloudSentinel uses SQLite for local analysis persistence.

Default database location:

```text
backend/data/cloudsentinel.db
```

The database stores saved analysis information and prediction records.

The database file is excluded from Git. Each local installation creates its own database.

For deployment, use persistent storage and a suitable backup strategy. Do not assume that an ephemeral application filesystem will preserve SQLite data.

---

## 12. Current Limitations and Deployment Considerations

CloudSentinel is currently a local research application.

Before production deployment, the following work is required:

- Authentication and authorization.
- Secure API access and production CORS configuration.
- Production database and persistent storage configuration.
- Rate limiting and additional upload security.
- Production logging and monitoring.
- Secure environment-variable management.
- Deployment-specific frontend and backend configuration.
- Database backup and recovery strategy.
- External and operational model validation.

Do not use this prototype as the sole basis for real-world security incident decisions.

---

## 13. License

No open-source license has been added yet. All rights are reserved by the project owner unless a separate license is published.

---

## Author

**Atharv Mishra**

B.Tech Computer Science and Engineering

GitHub: [AtharvMishra14](https://github.com/AtharvMishra14)

Project: [CloudSentinel-Platform](https://github.com/AtharvMishra14/CloudSentinel-Platform)

---

*CloudSentinel — CloudAnoBench Research Project*
