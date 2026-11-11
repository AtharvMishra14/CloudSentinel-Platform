"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  FileText,
  ShieldAlert,
} from "lucide-react";

import {
  useAnalysis,
  type PredictionResponse,
} from "@/components/analysis-provider";

const CLASS_NAMES = [
  "Normal",
  "System Anomaly",
  "Malicious Event",
];

function formatPercent(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

function csvEscape(value: unknown) {
  let text = String(value ?? "");

  // Reduce the risk of spreadsheet formula injection.
  if (/^[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

function downloadFile(
  filename: string,
  content: string,
  mimeType: string
) {
  const blob = new Blob([content], {
    type: mimeType,
  });

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 1000);
}

function getSafeFilename(filename: string) {
  return (
    filename
      .replace(/\.csv$/i, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "_") ||
    "cloudsentinel"
  );
}

function buildReport(
  analysis: PredictionResponse
) {
  const predictions = analysis.data.predictions;

  const classificationSummary = CLASS_NAMES.map(
    (className) => {
      const count = predictions.filter(
        (prediction) =>
          prediction.predicted_class === className
      ).length;

      return {
        class_name: className,
        count,
        percentage:
          predictions.length > 0
            ? Number(
                ((count / predictions.length) * 100).toFixed(2)
              )
            : 0,
      };
    }
  );

  return {
    application: "CloudSentinel",
    report_type: "Prediction Analysis Report",
    generated_at: new Date().toISOString(),

    dataset: {
      file_name: analysis.file_name,
      total_cases: analysis.data.total_cases,
    },

    model: {
      name: analysis.data.model_name,
    },

    classification_summary: classificationSummary,

    preprocessing: analysis.data.preprocessing,

    warnings: analysis.data.warnings,

    predictions,
  };
}

export default function ReportsPage() {
  const { analysis } = useAnalysis();

  const predictions = useMemo(
    () => analysis?.data.predictions ?? [],
    [analysis]
  );

  const classificationSummary = useMemo(
    () =>
      CLASS_NAMES.map((className) => {
        const count = predictions.filter(
          (prediction) =>
            prediction.predicted_class === className
        ).length;

        return {
          name: className,
          count,
          percentage:
            predictions.length > 0
              ? (count / predictions.length) * 100
              : 0,
        };
      }),
    [predictions]
  );

  // -------------------------------------------------------
  // CSV EXPORT
  // -------------------------------------------------------

  function exportCSV() {
    if (!analysis) return;

    const headers = [
      "case_id",
      "row_number",
      "predicted_class_id",
      "predicted_class",
      "confidence",
      "normal_probability",
      "system_anomaly_probability",
      "malicious_event_probability",
    ];

    const rows = predictions.map((prediction) => [
      prediction.case_id ??
        `Case ${prediction.row_number}`,
      prediction.row_number,
      prediction.predicted_class_id,
      prediction.predicted_class,
      prediction.confidence,
      prediction.probabilities["Normal"] ?? 0,
      prediction.probabilities["System Anomaly"] ?? 0,
      prediction.probabilities["Malicious Event"] ?? 0,
    ]);

    const csvContent = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row.map(csvEscape).join(",")
      )
      .join("\r\n");

    const reportName = getSafeFilename(
      analysis.file_name
    );

    downloadFile(
      `${reportName}_predictions.csv`,
      "\uFEFF" + csvContent,
      "text/csv;charset=utf-8"
    );
  }

  // -------------------------------------------------------
  // JSON REPORT EXPORT
  // -------------------------------------------------------

  function exportJSON() {
    if (!analysis) return;

    const report = buildReport(analysis);

    const reportName = getSafeFilename(
      analysis.file_name
    );

    downloadFile(
      `${reportName}_analysis_report.json`,
      JSON.stringify(report, null, 2),
      "application/json"
    );
  }

  // -------------------------------------------------------
  // EMPTY STATE
  // -------------------------------------------------------

  if (!analysis) {
    return (
      <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-10">
        <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <FileText size={30} />
          </div>

          <h1 className="text-2xl font-semibold text-slate-900">
            No reports available
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-500">
            Upload and analyze a cloud monitoring dataset first.
            CloudSentinel will then generate downloadable prediction
            results and analysis summaries.
          </p>

          <Link
            href="/data-ingestion"
            className="mt-7 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-xs font-semibold text-white transition hover:bg-blue-700"
          >
            Go to Data Ingestion
            <Download size={15} />
          </Link>
        </section>
      </main>
    );
  }

  const totalCases = predictions.length;

  const normalCount =
    classificationSummary[0].count;

  const anomalyCount =
    classificationSummary[1].count;

  const maliciousCount =
    classificationSummary[2].count;

  return (
    <main className="min-h-screen space-y-7 px-5 py-7 sm:px-8 lg:px-10">

      {/* PAGE HEADING */}

      <section>
        <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700">
          <FileText size={14} />
          Reporting and exports
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Reports
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
              Generate downloadable prediction results and
              classification summaries from your CloudSentinel
              analysis.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
            <CheckCircle2 size={14} />
            Analysis available
          </div>
        </div>
      </section>

      {/* DATASET INFORMATION */}

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">

          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <Database size={21} />
            </div>

            <div className="min-w-0">
              <p className="text-xs text-slate-500">
                Analysis source
              </p>

              <h2 className="mt-1 truncate text-sm font-semibold text-slate-900">
                {analysis.file_name}
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {analysis.data.model_name}
              </p>
            </div>
          </div>

          <Link
            href="/investigations"
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            View investigations
          </Link>

        </div>
      </section>

      {/* SUMMARY CARDS */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {[
          {
            title: "Total cases",
            value: totalCases,
            detail: "Processed records",
            icon: Database,
            color: "text-blue-600",
          },
          {
            title: "Normal",
            value: normalCount,
            detail: "Normal classifications",
            icon: CheckCircle2,
            color: "text-emerald-600",
          },
          {
            title: "System anomalies",
            value: anomalyCount,
            detail: "System anomaly classifications",
            icon: AlertTriangle,
            color: "text-amber-600",
          },
          {
            title: "Malicious events",
            value: maliciousCount,
            detail: "Malicious classifications",
            icon: ShieldAlert,
            color: "text-red-600",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  {item.title}
                </p>

                <Icon size={19} className={item.color} />
              </div>

              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {item.value}
              </p>

              <p className="mt-1 text-xs text-slate-400">
                {item.detail}
              </p>
            </div>
          );
        })}

      </section>

      {/* DOWNLOAD SECTION */}

      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">

        <div className="mb-5">
          <h2 className="text-base font-semibold text-slate-900">
            Download analysis reports
          </h2>

          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            Export the current prediction results for external
            analysis, record keeping and further processing.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">

          {/* CSV DOWNLOAD */}

          <div className="rounded-xl border border-slate-200 p-5 transition hover:border-blue-200">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700">
                <FileSpreadsheet size={23} />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Prediction results CSV
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Spreadsheet-compatible case-level predictions.
                </p>
              </div>
            </div>

            <ul className="mt-5 space-y-2 text-xs text-slate-500">
              <li>• Case identifiers and classifications</li>
              <li>• Model confidence</li>
              <li>• Probabilities for all three classes</li>
            </ul>

            <button
              onClick={exportCSV}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              <Download size={15} />
              Download CSV
            </button>
          </div>

          {/* JSON DOWNLOAD */}

          <div className="rounded-xl border border-slate-200 p-5 transition hover:border-blue-200">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-violet-50 p-3 text-violet-700">
                <FileJson size={23} />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Complete analysis JSON
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Structured report with prediction and preprocessing data.
                </p>
              </div>
            </div>

            <ul className="mt-5 space-y-2 text-xs text-slate-500">
              <li>• Dataset and model information</li>
              <li>• Classification distribution</li>
              <li>• Preprocessing information and warnings</li>
              <li>• Complete case-level predictions</li>
            </ul>

            <button
              onClick={exportJSON}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              <Download size={15} />
              Download JSON report
            </button>
          </div>

        </div>
      </section>

      {/* CLASSIFICATION SUMMARY */}

      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">

        <div className="mb-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Classification summary
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Distribution of predicted classes in the current dataset.
          </p>
        </div>

        <div className="space-y-5">
          {[
            {
              name: "Normal",
              count: normalCount,
              color: "bg-emerald-500",
              text: "text-emerald-700",
            },
            {
              name: "System Anomaly",
              count: anomalyCount,
              color: "bg-amber-500",
              text: "text-amber-700",
            },
            {
              name: "Malicious Event",
              count: maliciousCount,
              color: "bg-red-500",
              text: "text-red-700",
            },
          ].map((item) => {
            const percentage =
              totalCases > 0
                ? (item.count / totalCases) * 100
                : 0;

            return (
              <div key={item.name}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-700">
                    {item.name}
                  </span>

                  <span className={`text-xs font-semibold ${item.text}`}>
                    {item.count} cases · {percentage.toFixed(1)}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CASE PREVIEW */}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Report preview
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Preview of the exported case-level results.
              </p>
            </div>

            <span className="text-xs text-slate-400">
              {predictions.length} records
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left">

            <thead className="bg-slate-50">
              <tr>
                {[
                  "Case ID",
                  "Prediction",
                  "Confidence",
                  "Normal",
                  "System anomaly",
                  "Malicious event",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {predictions.slice(0, 10).map((prediction) => (
                <tr
                  key={`${prediction.row_number}-${prediction.case_id ?? "case"}`}
                  className="transition hover:bg-slate-50"
                >
                  <td className="px-5 py-4 text-xs font-semibold text-slate-800">
                    {prediction.case_id ||
                      `Case ${prediction.row_number}`}
                  </td>

                  <td className="px-5 py-4 text-xs text-slate-700">
                    {prediction.predicted_class}
                  </td>

                  <td className="px-5 py-4 text-xs font-semibold text-slate-800">
                    {formatPercent(prediction.confidence)}
                  </td>

                  {CLASS_NAMES.map((className) => (
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

        {predictions.length > 10 && (
          <div className="border-t border-slate-100 px-5 py-3">
            <p className="text-xs text-slate-400">
              Showing the first 10 records. Download the CSV or JSON
              report to access all {predictions.length} predictions.
            </p>
          </div>
        )}
      </section>

      {/* PREPROCESSING INFORMATION */}

      <section className="rounded-xl border border-slate-200 bg-white p-5">

        <div className="flex items-start gap-3">
          <Activity size={19} className="mt-0.5 shrink-0 text-blue-600" />

          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Preprocessing summary
            </h2>

            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Numerical and text features used during the prediction process.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div>
            <p className="text-xs text-slate-500">
              Numerical features
            </p>

            <p className="mt-1 text-xl font-semibold text-slate-900">
              {analysis.data.preprocessing.numerical_features}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">
              TF-IDF features
            </p>

            <p className="mt-1 text-xl font-semibold text-slate-900">
              {analysis.data.preprocessing.tfidf_features}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">
              Missing numerical cells
            </p>

            <p className="mt-1 text-xl font-semibold text-slate-900">
              {analysis.data.preprocessing.missing_numerical_cells}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">
              Empty log rows
            </p>

            <p className="mt-1 text-xl font-semibold text-slate-900">
              {analysis.data.preprocessing.empty_log_rows}
            </p>
          </div>

        </div>

        {analysis.data.warnings.length > 0 && (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle
                size={16}
                className="text-amber-600"
              />

              <h3 className="text-xs font-semibold text-amber-900">
                Preprocessing warnings
              </h3>
            </div>

            <ul className="mt-2 space-y-1">
              {analysis.data.warnings.map((warning, index) => (
                <li
                  key={index}
                  className="text-xs leading-relaxed text-amber-800"
                >
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* REPORT INFORMATION */}

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-start gap-2">
          <Clock3
            size={15}
            className="mt-0.5 shrink-0 text-slate-400"
          />

          <p className="text-xs leading-relaxed text-slate-500">
            Reports are generated from the most recent analysis stored
            in the current browser session. Downloaded files contain
            prediction outputs and preprocessing information, not raw
            source logs or independently verified detection outcomes.
            Refreshing the application clears the current in-memory
            analysis.
          </p>
        </div>
      </section>

    </main>
  );
}