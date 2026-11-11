"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Cloud,
  Database,
  FileText,
  RefreshCw,
  ShieldAlert,
  UploadCloud,
  XCircle,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import {
  useAnalysis,
  type AnalysisSummary,
} from "@/components/analysis-provider";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:8000";

// ---------------------------------------------------------
// DATA TYPES
// ---------------------------------------------------------

type DashboardSummary = {
  total_analyses: number;
  total_cases_processed: number;
  classifications: {
    Normal: number;
    "System Anomaly": number;
    "Malicious Event": number;
  };
  latest_analysis: AnalysisSummary | null;
  recent_analyses: AnalysisSummary[];
};

type ModelInfo = {
  model_name: string;
  model_type: string;
  numerical_features: number;
  tfidf_features: number;
  total_model_features: number;
  classes: string[];
  training_cases: number;
  status: string;
};

type DashboardData = {
  summary: DashboardSummary;
  modelInfo: ModelInfo | null;
  backendOnline: boolean;
};

// Fetch dashboard data without changing React state.
// State updates happen after the asynchronous request completes.
async function fetchDashboardData(): Promise<DashboardData> {
  const [summaryResponse, modelResponse, healthResponse] =
    await Promise.all([
      fetch(`${API_BASE_URL}/api/v1/dashboard/summary`, {
        cache: "no-store",
      }),
      fetch(`${API_BASE_URL}/api/v1/model/info`, {
        cache: "no-store",
      }).catch(() => null),
      fetch(`${API_BASE_URL}/api/v1/health`, {
        cache: "no-store",
      }).catch(() => null),
    ]);

  if (!summaryResponse.ok) {
    throw new Error(
      `Dashboard API returned HTTP ${summaryResponse.status}.`
    );
  }

  const summary: DashboardSummary = await summaryResponse.json();

  let modelInfo: ModelInfo | null = null;

  if (modelResponse?.ok) {
    modelInfo = await modelResponse.json();
  }

  return {
    summary,
    modelInfo,
    backendOnline: healthResponse?.ok === true,
  };
}

// ---------------------------------------------------------
// HELPERS
// ---------------------------------------------------------

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function formatDate(value: string | undefined) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// ---------------------------------------------------------
// REUSABLE STAT CARD
// ---------------------------------------------------------

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor,
}: {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-slate-500">
          {title}
        </p>

        <div className={`rounded-lg bg-slate-50 p-2.5 ${iconColor}`}>
          <Icon size={19} />
        </div>
      </div>

      <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    </div>
  );
}

// ---------------------------------------------------------
// OVERVIEW DASHBOARD
// ---------------------------------------------------------

export default function OverviewPage() {
  const router = useRouter();

  const { loadAnalysis } = useAnalysis();

  const [summary, setSummary] =
    useState<DashboardSummary | null>(null);

  const [modelInfo, setModelInfo] =
    useState<ModelInfo | null>(null);

  const [backendOnline, setBackendOnline] =
    useState<boolean | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [openingId, setOpeningId] =
    useState<number | null>(null);

  const [openError, setOpenError] =
    useState<string | null>(null);

  // -------------------------------------------------------
  // INITIAL LOAD
  // -------------------------------------------------------

  useEffect(() => {
    let isActive = true;

    fetchDashboardData()
      .then((data) => {
        if (!isActive) return;

        setSummary(data.summary);
        setModelInfo(data.modelInfo);
        setBackendOnline(data.backendOnline);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!isActive) return;

        setSummary(null);
        setModelInfo(null);
        setBackendOnline(false);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load dashboard information."
        );
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  // -------------------------------------------------------
  // MANUAL REFRESH
  // -------------------------------------------------------

  async function handleRefreshDashboard() {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchDashboardData();

      setSummary(data.summary);
      setModelInfo(data.modelInfo);
      setBackendOnline(data.backendOnline);
    } catch (err) {
      setSummary(null);
      setModelInfo(null);
      setBackendOnline(false);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard information."
      );
    } finally {
      setLoading(false);
    }
  }

  // -------------------------------------------------------
  // REOPEN SAVED ANALYSIS
  // -------------------------------------------------------

  async function handleOpenAnalysis(id: number) {
    setOpeningId(id);
    setOpenError(null);

    const success = await loadAnalysis(id);

    setOpeningId(null);

    if (success) {
      router.push("/investigations");
    } else {
      setOpenError(
        "Unable to reopen this analysis. Please check the backend connection."
      );
    }
  }

  // -------------------------------------------------------
  // PREPARE CLASSIFICATION CHART DATA
  // -------------------------------------------------------

  const chartData = summary
    ? [
        {
          name: "Normal",
          cases: summary.classifications.Normal ?? 0,
        },
        {
          name: "System Anomaly",
          cases:
            summary.classifications["System Anomaly"] ?? 0,
        },
        {
          name: "Malicious Event",
          cases:
            summary.classifications["Malicious Event"] ?? 0,
        },
      ]
    : [];

  // -------------------------------------------------------
  // LOADING STATE
  // -------------------------------------------------------

  if (loading && !summary) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-5">
        <div className="text-center">
          <RefreshCw
            size={27}
            className="mx-auto animate-spin text-blue-600"
          />

          <p className="mt-4 text-sm font-medium text-slate-700">
            Loading CloudSentinel dashboard...
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Retrieving live statistics from SQLite.
          </p>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------
  // ERROR STATE
  // -------------------------------------------------------

  if (error && !summary) {
    return (
      <main className="px-5 py-10 sm:px-8 lg:px-10">
        <section className="mx-auto max-w-2xl rounded-xl border border-red-200 bg-white p-8 text-center">
          <XCircle
            size={30}
            className="mx-auto text-red-500"
          />

          <h1 className="mt-4 text-lg font-semibold text-slate-900">
            Dashboard unavailable
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>

          <button
            onClick={() => void handleRefreshDashboard()}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-xs font-semibold text-white hover:bg-blue-700"
          >
            <RefreshCw size={14} />
            Retry connection
          </button>
        </section>
      </main>
    );
  }

  // -------------------------------------------------------
  // MAIN DASHBOARD
  // -------------------------------------------------------

  return (
    <main className="min-h-screen space-y-7 px-5 py-7 sm:px-8 lg:px-10">
      {/* PAGE HEADER */}

      <section>
        <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700">
          <Cloud size={14} />
          Cloud security overview
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Overview
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
              Monitor uploaded datasets, classification activity,
              model status and recent cloud anomaly analyses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600">
              {backendOnline ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Backend online
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Backend unavailable
                </>
              )}
            </div>

            <button
              onClick={() => void handleRefreshDashboard()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>
      </section>

      {/* ERROR BANNER */}

      {error && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-medium text-amber-800">
            Some dashboard data could not be refreshed: {error}
          </p>
        </section>
      )}

      {/* PRIMARY STATISTICS */}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Workspace statistics
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Live totals retrieved from your saved analyses.
            </p>
          </div>

          <span className="text-[10px] text-slate-400">
            SQLite database
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Saved analyses"
            value={formatNumber(summary?.total_analyses ?? 0)}
            description="Uploaded datasets stored"
            icon={Database}
            iconColor="text-blue-600"
          />

          <StatCard
            title="Cases processed"
            value={formatNumber(
              summary?.total_cases_processed ?? 0
            )}
            description="Across all saved uploads"
            icon={Activity}
            iconColor="text-violet-600"
          />

          <StatCard
            title="System anomalies"
            value={formatNumber(
              summary?.classifications["System Anomaly"] ?? 0
            )}
            description="Predicted system anomalies"
            icon={ShieldAlert}
            iconColor="text-amber-600"
          />

          <StatCard
            title="Malicious events"
            value={formatNumber(
              summary?.classifications["Malicious Event"] ?? 0
            )}
            description="Predicted malicious events"
            icon={ShieldAlert}
            iconColor="text-red-600"
          />
        </div>

        <p className="mt-3 text-[10px] leading-relaxed text-slate-400">
          These counts include every saved upload. Uploading the same
          dataset more than once counts its cases again.
        </p>
      </section>

      {/* CLASSIFICATION AND MODEL STATUS */}

      <section className="grid gap-5 xl:grid-cols-3">
        {/* CLASSIFICATION CHART */}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-slate-900">
              Prediction distribution
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Total predicted classifications across saved analyses.
            </p>
          </div>

          <div className="h-72">
            {chartData.some((item) => item.cases > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 15,
                    left: -15,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    interval={0}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 10 }}
                  />

                  <Tooltip
                    formatter={(value) => [
                      formatNumber(Number(value)),
                      "Predicted cases",
                    ]}
                  />

                  <Bar
                    dataKey="cases"
                    fill="#3767e8"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={85}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <BarChart3
                  size={28}
                  className="text-slate-300"
                />

                <p className="mt-3 text-sm font-medium text-slate-600">
                  No classification data yet
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Upload a dataset to generate predictions.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-5 border-t border-slate-100 pt-4 text-[10px] text-slate-500">
            {[
              {
                name: "Normal",
                color: "bg-emerald-500",
                value: summary?.classifications.Normal ?? 0,
              },
              {
                name: "System Anomaly",
                color: "bg-amber-500",
                value:
                  summary?.classifications["System Anomaly"] ?? 0,
              },
              {
                name: "Malicious Event",
                color: "bg-red-500",
                value:
                  summary?.classifications["Malicious Event"] ?? 0,
              },
            ].map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-2"
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${item.color}`}
                />

                <span>
                  {item.name}: {formatNumber(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* MODEL STATUS */}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Active model
            </h2>

            <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
              <ShieldAlert size={20} />
            </div>
          </div>

          {modelInfo ? (
            <>
              <p className="mt-5 text-base font-semibold leading-snug text-slate-900">
                {modelInfo.model_name}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {modelInfo.model_type}
              </p>

              <div className="mt-5 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <CheckCircle2
                  size={16}
                  className="text-emerald-600"
                />

                <span className="text-xs font-semibold text-emerald-700">
                  Model loaded successfully
                </span>
              </div>

              <div className="mt-5 space-y-4">
                <div className="flex justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Numerical features
                  </span>

                  <span className="text-xs font-semibold text-slate-800">
                    {formatNumber(modelInfo.numerical_features)}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    TF-IDF features
                  </span>

                  <span className="text-xs font-semibold text-slate-800">
                    {formatNumber(modelInfo.tfidf_features)}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Total input features
                  </span>

                  <span className="text-xs font-semibold text-slate-800">
                    {formatNumber(modelInfo.total_model_features)}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Training cases
                  </span>

                  <span className="text-xs font-semibold text-slate-800">
                    {formatNumber(modelInfo.training_cases)}
                  </span>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Output classifications
                </p>

                <div className="mt-3 space-y-2">
                  {modelInfo.classes.map((className) => (
                    <div
                      key={className}
                      className="flex items-center gap-2 text-xs text-slate-600"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                      {className}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="mt-5 rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                Model information is currently unavailable.
              </p>
            </div>
          )}

          <Link
            href="/model-performance"
            className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            View model evaluation
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* RECENT ANALYSES */}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Recent analyses
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Latest datasets stored in CloudSentinel.
            </p>
          </div>

          <Link
            href="/analysis-history"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            View all history
            <ArrowRight size={13} />
          </Link>
        </div>

        {summary?.recent_analyses.length ? (
          <div className="divide-y divide-slate-100">
            {summary.recent_analyses.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-4 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                    <FileText size={20} />
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-slate-800">
                      {item.file_name}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {item.model_name}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-400">
                      <span>
                        Analysis #{item.id}
                      </span>

                      <span>
                        {formatNumber(item.total_cases)} cases
                      </span>

                      <span className="inline-flex items-center gap-1">
                        <Clock3 size={11} />
                        {formatDate(item.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => void handleOpenAnalysis(item.id)}
                  disabled={openingId !== null}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50"
                >
                  {openingId === item.id ? (
                    <>
                      <RefreshCw
                        size={13}
                        className="animate-spin"
                      />
                      Opening...
                    </>
                  ) : (
                    <>
                      Open analysis
                      <ArrowRight size={13} />
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center">
            <Database
              size={27}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm font-medium text-slate-700">
              No analyses saved yet
            </p>

            <Link
              href="/data-ingestion"
              className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-blue-600"
            >
              Upload your first dataset
              <ArrowRight size={13} />
            </Link>
          </div>
        )}

        {openError && (
          <div className="border-t border-red-100 bg-red-50 px-5 py-3">
            <p className="text-xs text-red-700">
              {openError}
            </p>
          </div>
        )}
      </section>

      {/* QUICK ACTIONS */}

      <section>
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Quick actions
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Access the main CloudSentinel workspaces.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "Upload dataset",
              description: "Analyze new cloud monitoring data.",
              href: "/data-ingestion",
              icon: UploadCloud,
            },
            {
              title: "Investigations",
              description: "Inspect case classifications and probabilities.",
              href: "/investigations",
              icon: ShieldAlert,
            },
            {
              title: "Model performance",
              description: "Explore research model comparisons.",
              href: "/model-performance",
              icon: BarChart3,
            },
            {
              title: "Analysis history",
              description: "Reopen previously saved analyses.",
              href: "/analysis-history",
              icon: Database,
            },
          ].map((action) => {
            const Icon = action.icon;

            return (
              <Link
                key={action.href}
                href={action.href}
                className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div className="rounded-lg bg-blue-50 p-3 text-blue-600 transition group-hover:bg-blue-100">
                  <Icon size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-slate-800">
                    {action.title}
                  </h3>

                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    {action.description}
                  </p>
                </div>

                <ArrowRight
                  size={15}
                  className="mt-1 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600"
                />
              </Link>
            );
          })}
        </div>
      </section>

      {/* DASHBOARD FOOTNOTE */}

      <section className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50/50 p-4">
        <Activity
          size={16}
          className="mt-0.5 shrink-0 text-blue-600"
        />

        <p className="text-xs leading-relaxed text-blue-900/80">
          Workspace statistics are retrieved from the local SQLite
          database. Classification totals represent saved prediction
          records, not independently verified security incidents.
          Research performance metrics are displayed separately in
          the Model Performance section.
        </p>
      </section>
    </main>
  );
}