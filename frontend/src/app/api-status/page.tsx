
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

type HealthResponse = {
  status: string;
  service: string;
  version: string;
  timestamp: string;
};

export default function ApiStatusPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/v1/health`, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`API returned HTTP ${response.status}`);
      }

      const data: HealthResponse = await response.json();

      if (data.status !== "ok") {
        throw new Error("Backend returned an unexpected health status.");
      }

      setHealth(data);
    } catch (err) {
      setHealth(null);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to the backend."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkHealth();
  }, [checkHealth]);

  return (
    <main className="min-h-[calc(100vh-80px)] px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-4xl space-y-7">
        <section>
          <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700">
            <Activity size={14} />
            System monitoring
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Backend API Status
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Monitor the connection between CloudSentinel frontend and backend.
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                <Server size={23} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  FastAPI backend
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {API_URL}
                </p>
              </div>
            </div>

            <button
              onClick={() => void checkHealth()}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={loading ? "animate-spin" : ""}
              />
              Refresh status
            </button>
          </div>

          <div className="mt-7 rounded-lg border border-slate-100 bg-slate-50 p-5">
            {loading ? (
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <RefreshCw size={18} className="animate-spin" />
                Checking backend connection...
              </div>
            ) : error ? (
              <div className="flex items-start gap-3">
                <XCircle className="mt-0.5 text-red-500" size={21} />

                <div>
                  <h3 className="text-sm font-semibold text-red-700">
                    Backend connection failed
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    {error}
                  </p>

                  <p className="mt-2 text-xs text-slate-500">
                    Make sure the FastAPI server is running on port 8000.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <CheckCircle2
                  className="mt-0.5 text-emerald-600"
                  size={22}
                />

                <div>
                  <h3 className="text-sm font-semibold text-emerald-700">
                    Backend connected successfully
                  </h3>

                  <p className="mt-1 text-xs text-slate-600">
                    CloudSentinel frontend can communicate with FastAPI.
                  </p>
                </div>
              </div>
            )}
          </div>

          {health && !error && (
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs text-slate-500">Service</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {health.service}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs text-slate-500">API version</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {health.version}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs text-slate-500">Status</p>
                <p className="mt-2 text-sm font-semibold text-emerald-700">
                  {health.status.toUpperCase()}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
