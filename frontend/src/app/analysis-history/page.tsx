
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Activity,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Database,
  FileText,
  History,
  RefreshCw,
  ShieldAlert,
  XCircle,
} from "lucide-react";

import { useAnalysis } from "@/components/analysis-provider";

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString();
}

export default function AnalysisHistoryPage() {
  const router = useRouter();

  const {
    history,
    historyLoading,
    historyError,
    refreshHistory,
    loadAnalysis,
    analysis,
  } = useAnalysis();

  const [openingId, setOpeningId] = useState<number | null>(
    null
  );

  // -------------------------------------------------------
  // OPEN A SAVED ANALYSIS
  // -------------------------------------------------------

  async function handleOpenAnalysis(id: number) {
    setOpeningId(id);

    const success = await loadAnalysis(id);

    setOpeningId(null);

    if (success) {
      router.push("/investigations");
    }
  }

  // -------------------------------------------------------
  // PAGE
  // -------------------------------------------------------

  return (
    <main className="min-h-screen space-y-7 px-5 py-7 sm:px-8 lg:px-10">

      {/* PAGE HEADING */}

      <section>
        <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700">
          <History size={14} />
          Analysis management
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Analysis History
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
              Browse previously uploaded datasets, reopen saved
              predictions and continue your investigations.
            </p>
          </div>

          <button
            onClick={() => void refreshHistory()}
            disabled={historyLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={historyLoading ? "animate-spin" : ""}
            />
            Refresh history
          </button>
        </div>
      </section>

      {/* SUMMARY */}

      <section className="grid gap-4 sm:grid-cols-3">

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Saved analyses
            </p>
            <Database size={19} className="text-blue-600" />
          </div>

          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {history.length}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Stored in SQLite
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Latest dataset
            </p>
            <CalendarClock size={19} className="text-blue-600" />
          </div>

          <p className="mt-3 truncate text-sm font-semibold text-slate-900">
            {history[0]?.file_name ?? "No saved analyses"}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {history[0]
              ? formatDate(history[0].created_at)
              : "Upload a dataset to get started"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Current analysis
            </p>
            <Activity size={19} className="text-emerald-600" />
          </div>

          <p className="mt-3 text-2xl font-semibold text-slate-900">
            {analysis?.data.total_cases ?? 0}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Cases currently loaded
          </p>
        </div>

      </section>

      {/* ERROR */}

      {historyError && (
        <section className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <XCircle size={19} className="mt-0.5 shrink-0 text-red-600" />

          <div>
            <h2 className="text-sm font-semibold text-red-800">
              Unable to complete request
            </h2>

            <p className="mt-1 text-xs leading-relaxed text-red-700">
              {historyError}
            </p>
          </div>
        </section>
      )}

      {/* HISTORY LIST */}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Saved analyses
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Select any saved analysis to restore its predictions.
            </p>
          </div>

          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-semibold text-slate-600">
            {history.length} records
          </span>
        </div>

        {historyLoading ? (
          <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
            <RefreshCw size={18} className="animate-spin" />
            Loading saved analyses...
          </div>
        ) : history.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FileText size={26} />
            </div>

            <h3 className="text-base font-semibold text-slate-900">
              No saved analyses yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-slate-500">
              Your completed CSV uploads will appear here
              automatically once they are saved in the database.
            </p>

            <Link
              href="/data-ingestion"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              Upload a dataset
              <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">

            {history.map((item) => {
              const isCurrent =
                analysis?.analysis_id === item.id;

              const isOpening = openingId === item.id;

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                      <Database size={20} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-slate-900">
                          {item.file_name}
                        </h3>

                        {isCurrent && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                            <CheckCircle2 size={11} />
                            Current
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        {item.model_name}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400">
                        <span>
                          Analysis ID: #{item.id}
                        </span>

                        <span>
                          {item.total_cases} cases
                        </span>

                        <span>
                          {formatDate(item.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                    <button
                      onClick={() => void handleOpenAnalysis(item.id)}
                      disabled={openingId !== null}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isOpening ? (
                        <>
                          <RefreshCw
                            size={13}
                            className="animate-spin"
                          />
                          Opening...
                        </>
                      ) : (
                        <>
                          <ShieldAlert size={14} />
                          Open analysis
                          <ArrowRight size={13} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}

          </div>
        )}
      </section>

      {/* INFORMATION */}

      <section className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-5">
        <CheckCircle2
          size={18}
          className="mt-0.5 shrink-0 text-blue-600"
        />

        <div>
          <h2 className="text-xs font-semibold text-blue-950">
            Persistent analysis storage
          </h2>

          <p className="mt-1 text-xs leading-relaxed text-blue-900/80">
            Saved analyses are retrieved from the local SQLite
            database. Opening a previous analysis restores its
            predictions in the dashboard, including the
            Investigations and Reports pages.
          </p>
        </div>
      </section>

    </main>
  );
}
