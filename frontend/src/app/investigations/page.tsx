
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Search,
  ShieldAlert,
  X,
  FileText,
  Database,
  Filter,
} from "lucide-react";

import {
  useAnalysis,
  type Prediction,
} from "@/components/analysis-provider";

type ClassFilter =
  | "All"
  | "Normal"
  | "System Anomaly"
  | "Malicious Event";

const FILTERS: ClassFilter[] = [
  "All",
  "Normal",
  "System Anomaly",
  "Malicious Event",
];

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

function getClassIcon(className: string) {
  if (className === "Normal") {
    return CheckCircle2;
  }

  if (className === "System Anomaly") {
    return AlertTriangle;
  }

  return ShieldAlert;
}

export default function InvestigationsPage() {
  const { analysis } = useAnalysis();

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] =
    useState<ClassFilter>("All");
  const [selectedPrediction, setSelectedPrediction] =
    useState<Prediction | null>(null);

  const predictions = useMemo(
    () => analysis?.data.predictions ?? [],
    [analysis]
  );

  // -------------------------------------------------------
  // CLASSIFICATION COUNTS
  // -------------------------------------------------------

  const normalCount = predictions.filter(
    (item) => item.predicted_class === "Normal"
  ).length;

  const anomalyCount = predictions.filter(
    (item) => item.predicted_class === "System Anomaly"
  ).length;

  const maliciousCount = predictions.filter(
    (item) => item.predicted_class === "Malicious Event"
  ).length;

  // -------------------------------------------------------
  // SEARCH AND FILTER
  // -------------------------------------------------------

  const filteredPredictions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return predictions.filter((prediction) => {
      const caseId = (
        prediction.case_id ??
        `Case ${prediction.row_number}`
      ).toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        caseId.includes(normalizedSearch) ||
        prediction.predicted_class
          .toLowerCase()
          .includes(normalizedSearch) ||
        String(prediction.row_number).includes(normalizedSearch);

      const matchesFilter =
        classFilter === "All" ||
        prediction.predicted_class === classFilter;

      return matchesSearch && matchesFilter;
    });
  }, [predictions, search, classFilter]);

  // -------------------------------------------------------
  // EMPTY STATE
  // -------------------------------------------------------

  if (!analysis) {
    return (
      <main className="min-h-screen px-5 py-8 sm:px-8 lg:px-10">
        <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <ShieldAlert size={30} />
          </div>

          <h1 className="text-2xl font-semibold text-slate-900">
            No investigation data available
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-500">
            Upload a cloud monitoring dataset through Data Ingestion
            to create case records, review classifications and inspect
            prediction probabilities.
          </p>

          <Link
            href="/data-ingestion"
            className="mt-7 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-xs font-semibold text-white transition hover:bg-blue-700"
          >
            Go to Data Ingestion
            <ArrowRight size={15} />
          </Link>
        </section>
      </main>
    );
  }

  // -------------------------------------------------------
  // INVESTIGATIONS PAGE
  // -------------------------------------------------------

  return (
    <main className="min-h-screen space-y-7 px-5 py-7 sm:px-8 lg:px-10">
      {/* PAGE HEADING */}

      <section>
        <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700">
          <ShieldAlert size={14} />
          Security investigations
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Investigations
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
              Review cloud cases, investigate anomaly classifications
              and inspect the model&apos;s estimated class probabilities.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
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
                Active analysis dataset
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
            href="/data-ingestion"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            View dataset
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* SUMMARY CARDS */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Total cases
            </p>

            <Database size={19} className="text-blue-600" />
          </div>

          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {predictions.length}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Processed records
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Normal
            </p>

            <CheckCircle2 size={19} className="text-emerald-600" />
          </div>

          <p className="mt-3 text-3xl font-semibold text-emerald-700">
            {normalCount}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Normal classifications
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              System anomalies
            </p>

            <AlertTriangle size={19} className="text-amber-600" />
          </div>

          <p className="mt-3 text-3xl font-semibold text-amber-700">
            {anomalyCount}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            System anomaly classifications
          </p>
        </div>

        <div className="rounded-xl border border-red-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Malicious events
            </p>

            <ShieldAlert size={19} className="text-red-600" />
          </div>

          <p className="mt-3 text-3xl font-semibold text-red-700">
            {maliciousCount}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Malicious event classifications
          </p>
        </div>
      </section>

      {/* CLASSIFICATION DISTRIBUTION */}

      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Classification distribution
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Distribution of predicted classes in the current dataset.
          </p>
        </div>

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
            predictions.length > 0
              ? (item.count / predictions.length) * 100
              : 0;

          return (
            <div key={item.name} className="mb-5 last:mb-0">
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
                  className={`h-full rounded-full ${item.color} transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </section>

      {/* CASE SEARCH AND FILTER */}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Case investigation records
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Search cases and inspect individual predictions.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 text-xs text-slate-500">
              <Activity size={15} />
              {filteredPredictions.length} results
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by case ID or classification..."
                className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-4 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="relative lg:w-56">
              <Filter
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={classFilter}
                onChange={(event) =>
                  setClassFilter(event.target.value as ClassFilter)
                }
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-3 pl-9 pr-4 text-xs text-slate-700 outline-none focus:border-blue-400"
              >
                {FILTERS.map((filter) => (
                  <option key={filter} value={filter}>
                    {filter === "All"
                      ? "All classifications"
                      : filter}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* CASE TABLE */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Case ID
                </th>

                <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Classification
                </th>

                <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Confidence
                </th>

                <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Malicious probability
                </th>

                <th className="px-5 py-4 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredPredictions.map((prediction) => {
                const Icon = getClassIcon(
                  prediction.predicted_class
                );

                return (
                  <tr
                    key={`${prediction.row_number}-${prediction.case_id ?? "case"}`}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <p className="text-xs font-semibold text-slate-900">
                        {prediction.case_id ||
                          `Case ${prediction.row_number}`}
                      </p>

                      <p className="mt-1 text-[10px] text-slate-400">
                        Row {prediction.row_number}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-semibold ${getClassStyle(
                          prediction.predicted_class
                        )}`}
                      >
                        <Icon size={12} />
                        {prediction.predicted_class}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-xs font-semibold text-slate-800">
                        {formatPercent(prediction.confidence)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-xs font-medium text-slate-700">
                        {formatPercent(
                          prediction.probabilities[
                            "Malicious Event"
                          ] ?? 0
                        )}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        onClick={() =>
                          setSelectedPrediction(prediction)
                        }
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-[10px] font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      >
                        Investigate
                        <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredPredictions.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center"
                  >
                    <Search
                      size={22}
                      className="mx-auto mb-3 text-slate-300"
                    />

                    <p className="text-sm font-semibold text-slate-700">
                      No matching cases found
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Try another search term or classification filter.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* SELECTED CASE DETAILS */}

      {selectedPrediction && (
        <section className="rounded-xl border border-blue-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 p-5">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
                <FileText size={14} />
                Case investigation
              </div>

              <h2 className="text-lg font-semibold text-slate-900">
                {selectedPrediction.case_id ||
                  `Case ${selectedPrediction.row_number}`}
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Prediction details · Row {selectedPrediction.row_number}
              </p>
            </div>

            <button
              onClick={() => setSelectedPrediction(null)}
              aria-label="Close case details"
              className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
            >
              <X size={17} />
            </button>
          </div>

          <div className="grid gap-5 p-5 lg:grid-cols-2">
            {/* SELECTED CLASS */}

            <div className="rounded-lg border border-slate-200 p-5">
              <p className="text-xs text-slate-500">
                Predicted classification
              </p>

              <span
                className={`mt-3 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${getClassStyle(
                  selectedPrediction.predicted_class
                )}`}
              >
                {selectedPrediction.predicted_class}
              </span>

              <p className="mt-5 text-xs text-slate-500">
                Model confidence
              </p>

              <p className="mt-1 text-3xl font-semibold text-slate-900">
                {formatPercent(selectedPrediction.confidence)}
              </p>

              <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
                Confidence is the model&apos;s estimated probability
                for the predicted class. It is not a verified
                measure of detection accuracy.
              </p>
            </div>

            {/* CLASS PROBABILITIES */}

            <div className="rounded-lg border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-900">
                Class probability breakdown
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Estimated probability assigned to each class.
              </p>

              <div className="mt-5 space-y-5">
                {[
                  {
                    name: "Normal",
                    color: "bg-emerald-500",
                    text: "text-emerald-700",
                  },
                  {
                    name: "System Anomaly",
                    color: "bg-amber-500",
                    text: "text-amber-700",
                  },
                  {
                    name: "Malicious Event",
                    color: "bg-red-500",
                    text: "text-red-700",
                  },
                ].map((item) => {
                  const probability =
                    selectedPrediction.probabilities[item.name] ?? 0;

                  return (
                    <div key={item.name}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-700">
                          {item.name}
                        </span>

                        <span
                          className={`text-xs font-semibold ${item.text}`}
                        >
                          {formatPercent(probability)}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${item.color}`}
                          style={{
                            width: `${probability * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
            <p className="text-xs leading-relaxed text-slate-500">
              This investigation currently contains model-generated
              classifications and probabilities only. Raw log
              evidence, timestamps and operational remediation
              actions are not yet connected.
            </p>
          </div>
        </section>
      )}

      {/* FOOTER */}

      <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-4">
        <Activity
          size={16}
          className="mt-0.5 shrink-0 text-blue-600"
        />

        <p className="text-xs leading-relaxed text-slate-500">
          Investigation records are based on the most recent
          analysis stored in the current browser session.
          Refreshing the application or starting a new analysis
          will clear the current in-memory results.
        </p>
      </div>
    </main>
  );
}
