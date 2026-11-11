
"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";

import {
  UploadCloud,
  FileText,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Database,
  Activity,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

import {
  useAnalysis,
  type PredictionResponse,
} from "@/components/analysis-provider";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:8000";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function formatPercent(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

function getClassStyle(className: string) {
  if (className === "Normal") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (className === "System Anomaly") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-red-200 bg-red-50 text-red-700";
}

export default function DataIngestionPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Shared state: other dashboard pages can access these results.
  const {
    analysis: result,
    setAnalysis,
    clearAnalysis,
  } = useAnalysis();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------------------------------------------
  // FILE VALIDATION
  // -------------------------------------------------------

  function validateFile(file: File): string | null {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      return "Please select a CSV file.";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "File size exceeds the 10 MB upload limit.";
    }

    if (file.size === 0) {
      return "The selected file is empty.";
    }

    return null;
  }

  function selectFile(file: File | null) {
    setError(null);

    if (!file) return;

    const validationError = validateFile(file);

    if (validationError) {
      setSelectedFile(null);
      setError(validationError);
      return;
    }

    setSelectedFile(file);

    // Clear previous results when selecting a new dataset.
    clearAnalysis();
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    selectFile(event.target.files?.[0] ?? null);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0] ?? null;
    selectFile(file);
  }

  // -------------------------------------------------------
  // CSV UPLOAD AND PREDICTION
  // -------------------------------------------------------

  async function handleUpload() {
    if (!selectedFile || uploading) return;

    setUploading(true);
    setError(null);
    clearAnalysis();

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(
        `${API_BASE_URL}/api/v1/predict/csv`,
        {
          method: "POST",
          body: formData,
        }
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const detail = payload?.detail;

        throw new Error(
          typeof detail === "string"
            ? detail
            : "CSV processing failed. Please check your file."
        );
      }

      if (!payload?.data?.predictions) {
        throw new Error(
          "The backend returned an invalid response."
        );
      }

      // Store results globally for all dashboard pages.
      setAnalysis(payload as PredictionResponse);

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to communicate with the backend."
      );
    } finally {
      setUploading(false);
    }
  }

  // -------------------------------------------------------
  // RESET
  // -------------------------------------------------------

  function resetUpload() {
    setSelectedFile(null);
    setError(null);
    clearAnalysis();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // -------------------------------------------------------
  // PAGE UI
  // -------------------------------------------------------

  return (
    <main className="min-h-screen space-y-7 px-5 py-7 sm:px-8 lg:px-10">

      {/* PAGE HEADING */}

      <section>
        <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700">
          <Activity size={14} />
          Data processing
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Data ingestion
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
              Upload cloud monitoring metrics and system logs
              to detect normal activity, system anomalies and
              malicious events.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Prediction API available
          </div>
        </div>
      </section>

      {/* MODEL INFORMATION */}

      <section className="grid gap-4 sm:grid-cols-3">

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
              <ShieldCheck size={20} />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Active model
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                AISAPSO-inspired LightGBM
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-violet-50 p-2.5 text-violet-600">
              <Database size={20} />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Numerical features
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                35 features
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
              <Activity size={20} />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Combined model inputs
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                1,035 features
              </p>
            </div>
          </div>
        </div>

      </section>

      {/* UPLOAD SECTION */}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

        <div className="mb-5">
          <h2 className="text-base font-semibold text-slate-900">
            Upload cloud monitoring dataset
          </h2>

          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Upload a CSV file containing one row per cloud case.
            Maximum file size: 10 MB.
          </p>
        </div>

        <input
          ref={fileInputRef}
          id="cloudsentinel-csv-upload"
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />

        <label
          htmlFor="cloudsentinel-csv-upload"
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={handleDrop}
          className={`flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-9 text-center transition ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-slate-300 bg-slate-50/60 hover:border-blue-400 hover:bg-blue-50/40"
          }`}
        >
          <div className="mb-4 rounded-xl bg-white p-4 text-blue-600 shadow-sm">
            <UploadCloud size={30} />
          </div>

          <h3 className="text-sm font-semibold text-slate-800">
            Drag and drop your CSV file here
          </h3>

          <p className="mt-2 text-xs text-slate-500">
            or click to browse files from your computer
          </p>

          <span className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white">
            Choose CSV file
          </span>

          <p className="mt-3 text-[10px] text-slate-400">
            Supported format: .csv · Maximum size: 10 MB
          </p>
        </label>

        {/* SELECTED FILE */}

        {selectedFile && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">

            <div className="flex min-w-0 items-center gap-3">
              <div className="rounded-lg bg-white p-2.5 text-blue-600">
                <FileText size={21} />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {selectedFile.name}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB · CSV file
                </p>
              </div>
            </div>

            <button
              onClick={resetUpload}
              disabled={uploading}
              className="text-xs font-medium text-slate-500 hover:text-red-600 disabled:opacity-50"
            >
              Remove file
            </button>

          </div>
        )}

        {/* ERROR */}

        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <XCircle
              className="mt-0.5 shrink-0 text-red-600"
              size={19}
            />

            <div>
              <p className="text-sm font-semibold text-red-700">
                Processing failed
              </p>

              <p className="mt-1 text-xs leading-relaxed text-red-700/80">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* UPLOAD BUTTON */}

        <div className="mt-6 flex flex-wrap items-center gap-3">

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {uploading ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                Processing dataset...
              </>
            ) : (
              <>
                <Activity size={15} />
                Analyze dataset
              </>
            )}
          </button>

          <p className="text-xs text-slate-400">
            Predictions are generated using your trained model.
          </p>

        </div>
      </section>

      {/* INPUT GUIDANCE */}

      <section className="rounded-xl border border-blue-100 bg-blue-50/60 p-5">

        <h2 className="text-sm font-semibold text-blue-950">
          Expected input format
        </h2>

        <p className="mt-2 text-xs leading-relaxed text-blue-900/80">
          Include a log-text column named log_text, log, logs,
          message or raw_log. Include the 35 numerical metric
          summary columns where available, along with an optional
          case_id column.
        </p>

        <p className="mt-3 text-xs leading-relaxed text-blue-900/80">
          Missing numerical columns or invalid values are filled
          using the saved median imputer. For meaningful predictions,
          provide actual cloud metric summaries using the same
          definitions and units as the training data.
        </p>

      </section>

      {/* PREDICTION RESULTS */}

      {result && (
        <section className="space-y-6" aria-live="polite">

          <div className="flex flex-wrap items-center justify-between gap-3">

            <div>
              <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                <CheckCircle2 size={15} />
                Analysis completed
              </div>

              <h2 className="text-xl font-semibold text-slate-900">
                Prediction results
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {result.file_name} · {result.data.model_name}
              </p>
            </div>

            <button
              onClick={resetUpload}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              New analysis
            </button>

          </div>

          {/* SUMMARY CARDS */}

          <div className="grid gap-4 sm:grid-cols-3">

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs text-slate-500">
                Cases processed
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {result.data.total_cases}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs text-slate-500">
                Combined model features
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {result.data.preprocessing.total_model_features}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-xs text-slate-500">
                Missing numerical cells
              </p>

              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {result.data.preprocessing.missing_numerical_cells}
              </p>
            </div>

          </div>

          {/* PREPROCESSING WARNINGS */}

          {result.data.warnings.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">

              <div className="flex items-start gap-3">
                <AlertTriangle
                  className="mt-0.5 shrink-0 text-amber-600"
                  size={19}
                />

                <div>
                  <h3 className="text-sm font-semibold text-amber-900">
                    Data preprocessing warnings
                  </h3>

                  <ul className="mt-2 space-y-1">
                    {result.data.warnings.map((warning, index) => (
                      <li
                        key={index}
                        className="text-xs leading-relaxed text-amber-800"
                      >
                        {warning}
                      </li>
                    ))}
                  </ul>

                  {result.data.preprocessing.missing_numerical_columns
                    .length ===
                    result.data.preprocessing.numerical_features && (
                    <p className="mt-3 text-xs font-semibold leading-relaxed text-amber-900">
                      All 35 numerical feature columns are absent.
                      These predictions are suitable for testing
                      the pipeline, not operational assessment.
                      Upload actual cloud metric summaries for
                      meaningful analysis.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* PREDICTION TABLE */}

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-900">
                Case classifications
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Predicted class and estimated probabilities for each case.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">

                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Case
                    </th>

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Prediction
                    </th>

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Confidence
                    </th>

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Normal
                    </th>

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      System anomaly
                    </th>

                    <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      Malicious event
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">

                  {result.data.predictions.map((prediction) => (
                    <tr
                      key={`${prediction.row_number}-${prediction.case_id ?? "case"}`}
                      className="transition hover:bg-slate-50"
                    >

                      <td className="px-5 py-4">
                        <p className="text-xs font-semibold text-slate-800">
                          {prediction.case_id ||
                            `Case ${prediction.row_number}`}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-400">
                          Row {prediction.row_number}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-semibold ${getClassStyle(
                            prediction.predicted_class
                          )}`}
                        >
                          {prediction.predicted_class}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-xs font-semibold text-slate-800">
                          {formatPercent(prediction.confidence)}
                        </span>
                      </td>

                      {[
                        "Normal",
                        "System Anomaly",
                        "Malicious Event",
                      ].map((className) => (
                        <td
                          key={className}
                          className="px-5 py-4 text-xs text-slate-600"
                        >
                          {formatPercent(
                            prediction.probabilities[className] ?? 0
                          )}
                        </td>
                      ))}

                    </tr>
                  ))}

                </tbody>
              </table>
            </div>
          </div>

          {/* PREPROCESSING DETAILS */}

          <div className="rounded-xl border border-slate-200 bg-white p-5">

            <h3 className="text-sm font-semibold text-slate-900">
              Processing details
            </h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <div>
                <p className="text-xs text-slate-500">
                  Numerical features
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {result.data.preprocessing.numerical_features}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  TF-IDF features
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {result.data.preprocessing.tfidf_features}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Missing numerical columns
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {result.data.preprocessing.missing_numerical_columns.length}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Empty log rows
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {result.data.preprocessing.empty_log_rows}
                </p>
              </div>

            </div>
          </div>

        </section>
      )}

      {/* SHARED STATE INDICATOR */}

      {!result && (
        <p className="text-center text-xs text-slate-400">
          Upload a dataset to begin a new analysis.
        </p>
      )}

    </main>
  );
}
