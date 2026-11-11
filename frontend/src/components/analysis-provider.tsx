
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://127.0.0.1:8000";

// ---------------------------------------------------------
// DATA TYPES
// ---------------------------------------------------------

export type Prediction = {
  row_number: number;
  case_id: string | null;
  predicted_class_id: number;
  predicted_class: string;
  confidence: number;
  probabilities: Record<string, number>;
};

export type PredictionResponse = {
  message: string;
  analysis_id?: number;
  created_at?: string;
  file_name: string;
  data: {
    model_name: string;
    total_cases: number;
    predictions: Prediction[];
    preprocessing: {
      numerical_features: number;
      tfidf_features: number;
      total_model_features: number;
      missing_numerical_columns: string[];
      missing_numerical_cells: number;
      empty_log_rows: number;
    };
    warnings: string[];
  };
};

export type AnalysisSummary = {
  id: number;
  file_name: string;
  model_name: string;
  total_cases: number;
  created_at: string;
};

type AnalysisContextType = {
  analysis: PredictionResponse | null;
  history: AnalysisSummary[];
  historyLoading: boolean;
  historyError: string | null;
  setAnalysis: (result: PredictionResponse) => void;
  clearAnalysis: () => void;
  refreshHistory: () => Promise<void>;
  loadAnalysis: (analysisId: number) => Promise<boolean>;
};

// ---------------------------------------------------------
// CONTEXT
// ---------------------------------------------------------

const AnalysisContext = createContext<
  AnalysisContextType | undefined
>(undefined);

// ---------------------------------------------------------
// PROVIDER
// ---------------------------------------------------------

export function AnalysisProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [analysis, setAnalysisState] =
    useState<PredictionResponse | null>(null);

  const [history, setHistory] =
    useState<AnalysisSummary[]>([]);

  const [historyLoading, setHistoryLoading] =
    useState(true);

  const [historyError, setHistoryError] =
    useState<string | null>(null);

  // -------------------------------------------------------
  // LOAD ANALYSIS HISTORY
  // -------------------------------------------------------

  const refreshHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/analyses`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Unable to retrieve analysis history (HTTP ${response.status}).`
        );
      }

      const result = await response.json();

      setHistory(
        Array.isArray(result.analyses)
          ? result.analyses
          : []
      );
    } catch (error) {
      setHistoryError(
        error instanceof Error
          ? error.message
          : "Unable to retrieve analysis history."
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // -------------------------------------------------------
  // LOAD ONE SAVED ANALYSIS
  // Returns true only when retrieval succeeds.
  // -------------------------------------------------------

  const loadAnalysis = useCallback(
    async (analysisId: number): Promise<boolean> => {
      setHistoryError(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v1/analyses/${analysisId}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Unable to load analysis ${analysisId} (HTTP ${response.status}).`
          );
        }

        const result = await response.json();

        if (!result?.data?.predictions) {
          throw new Error(
            "The database returned an invalid analysis."
          );
        }

        setAnalysisState(
          result as PredictionResponse
        );

        return true;
      } catch (error) {
        setHistoryError(
          error instanceof Error
            ? error.message
            : "Unable to load the saved analysis."
        );

        return false;
      }
    },
    []
  );

  // -------------------------------------------------------
  // SET CURRENT ANALYSIS AFTER A NEW UPLOAD
  // -------------------------------------------------------

  const setAnalysis = useCallback(
    (result: PredictionResponse) => {
      setAnalysisState(result);
      void refreshHistory();
    },
    [refreshHistory]
  );

  // -------------------------------------------------------
  // CLEAR CURRENT ANALYSIS
  // Does not delete the saved database record.
  // -------------------------------------------------------

  const clearAnalysis = useCallback(() => {
    setAnalysisState(null);
  }, []);

  // -------------------------------------------------------
  // RESTORE THE MOST RECENT ANALYSIS ON PAGE LOAD
  // -------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function restoreSavedAnalysis() {
      setHistoryLoading(true);
      setHistoryError(null);

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v1/analyses`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Unable to restore saved analyses (HTTP ${response.status}).`
          );
        }

        const result = await response.json();

        const savedAnalyses: AnalysisSummary[] =
          Array.isArray(result.analyses)
            ? result.analyses
            : [];

        if (cancelled) return;

        setHistory(savedAnalyses);

        if (savedAnalyses.length > 0) {
          const latestAnalysis = savedAnalyses[0];

          const detailResponse = await fetch(
            `${API_BASE_URL}/api/v1/analyses/${latestAnalysis.id}`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

          if (!detailResponse.ok) {
            throw new Error(
              "The latest saved analysis could not be restored."
            );
          }

          const detail = await detailResponse.json();

          if (cancelled) return;

          setAnalysisState(
            detail as PredictionResponse
          );
        } else {
          setAnalysisState(null);
        }
      } catch (error) {
        if (!cancelled) {
          setHistoryError(
            error instanceof Error
              ? error.message
              : "Unable to restore saved analysis."
          );
        }
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    }

    void restoreSavedAnalysis();

    return () => {
      cancelled = true;
    };
  }, []);

  // -------------------------------------------------------
  // CONTEXT VALUE
  // -------------------------------------------------------

  const value = useMemo(
    () => ({
      analysis,
      history,
      historyLoading,
      historyError,
      setAnalysis,
      clearAnalysis,
      refreshHistory,
      loadAnalysis,
    }),
    [
      analysis,
      history,
      historyLoading,
      historyError,
      setAnalysis,
      clearAnalysis,
      refreshHistory,
      loadAnalysis,
    ]
  );

  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  );
}

// ---------------------------------------------------------
// CUSTOM HOOK
// ---------------------------------------------------------

export function useAnalysis() {
  const context = useContext(AnalysisContext);

  if (!context) {
    throw new Error(
      "useAnalysis must be used inside AnalysisProvider."
    );
  }

  return context;
}
