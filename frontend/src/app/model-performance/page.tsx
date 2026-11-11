
"use client";

import { useState } from "react";
import {
  Activity,
  BarChart3,
  ShieldAlert,
  Target,
  Database,
  Info,
} from "lucide-react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

type ClassMetric = {
  name: string;
  support: number;
  precision: number;
  recall: number;
  f1: number;
};

type ModelResult = {
  id: string;
  name: string;
  description: string;
  fold: {
    accuracy: number;
    accuracySd: number;
    macroF1: number;
    macroF1Sd: number;
    weightedF1: number;
    weightedF1Sd: number;
    maliciousRecall: number;
    maliciousRecallSd: number | null;
  };
  pooled: {
    accuracy: number;
    macroF1: number;
    weightedF1: number;
  };
  confusionMatrix: number[][];
  classMetrics: ClassMetric[];
};

const models: ModelResult[] = [
  {
    id: "logs",
    name: "TF-IDF + LightGBM",
    description: "Log-text features only",
    fold: {
      accuracy: 0.8102,
      accuracySd: 0.0508,
      macroF1: 0.7518,
      macroF1Sd: 0.0897,
      weightedF1: 0.8009,
      weightedF1Sd: 0.0551,
      maliciousRecall: 0.4787,
      maliciousRecallSd: 0.2559,
    },
    pooled: {
      accuracy: 0.8122,
      macroF1: 0.7614,
      weightedF1: 0.8044,
    },
    confusionMatrix: [
      [506, 24, 28],
      [53, 393, 14],
      [42, 72, 109],
    ],
    classMetrics: [
      { name: "Normal", support: 558, precision: 0.8419, recall: 0.9068, f1: 0.8732 },
      { name: "System Anomaly", support: 460, precision: 0.8037, recall: 0.8543, f1: 0.8282 },
      { name: "Malicious Event", support: 223, precision: 0.7219, recall: 0.4888, f1: 0.5829 },
    ],
  },
  {
    id: "combined",
    name: "Metrics + TF-IDF + LightGBM",
    description: "Combined numerical metrics and log text",
    fold: {
      accuracy: 0.8290,
      accuracySd: 0.0386,
      macroF1: 0.7894,
      macroF1Sd: 0.0604,
      weightedF1: 0.8245,
      weightedF1Sd: 0.0407,
      maliciousRecall: 0.5904,
      maliciousRecallSd: 0.1963,
    },
    pooled: {
      accuracy: 0.8300,
      macroF1: 0.7900,
      weightedF1: 0.8257,
    },
    confusionMatrix: [
      [497, 24, 37],
      [41, 406, 13],
      [50, 46, 127],
    ],
    classMetrics: [
      { name: "Normal", support: 558, precision: 0.8452, recall: 0.8907, f1: 0.8674 },
      { name: "System Anomaly", support: 460, precision: 0.8529, recall: 0.8826, f1: 0.8675 },
      { name: "Malicious Event", support: 223, precision: 0.7175, recall: 0.5695, f1: 0.6350 },
    ],
  },
  {
    id: "pso",
    name: "Standard PSO + LightGBM",
    description: "Particle swarm optimization with combined features",
    fold: {
      accuracy: 0.8225,
      accuracySd: 0.0351,
      macroF1: 0.7794,
      macroF1Sd: 0.0482,
      weightedF1: 0.8177,
      weightedF1Sd: 0.0372,
      maliciousRecall: 0.5636,
      maliciousRecallSd: 0.1637,
    },
    pooled: {
      accuracy: 0.8235,
      macroF1: 0.7794,
      weightedF1: 0.8185,
    },
    confusionMatrix: [
      [499, 21, 38],
      [43, 402, 15],
      [55, 47, 121],
    ],
    classMetrics: [
      { name: "Normal", support: 558, precision: 0.8358, recall: 0.8943, f1: 0.8641 },
      { name: "System Anomaly", support: 460, precision: 0.8553, recall: 0.8739, f1: 0.8645 },
      { name: "Malicious Event", support: 223, precision: 0.6954, recall: 0.5426, f1: 0.6096 },
    ],
  },
  {
    id: "rf",
    name: "Random Forest",
    description: "Random Forest with numerical metrics and log text",
    fold: {
      accuracy: 0.8275,
      accuracySd: 0.0460,
      macroF1: 0.7455,
      macroF1Sd: 0.0660,
      weightedF1: 0.8078,
      weightedF1Sd: 0.0587,
      maliciousRecall: 0.3614,
      maliciousRecallSd: 0.1356,
    },
    pooled: {
      accuracy: 0.8284,
      macroF1: 0.7509,
      weightedF1: 0.8094,
    },
    confusionMatrix: [
      [521, 27, 10],
      [28, 427, 5],
      [61, 82, 80],
    ],
    classMetrics: [
      { name: "Normal", support: 558, precision: 0.8541, recall: 0.9337, f1: 0.8921 },
      { name: "System Anomaly", support: 460, precision: 0.7966, recall: 0.9283, f1: 0.8574 },
      { name: "Malicious Event", support: 223, precision: 0.8421, recall: 0.3587, f1: 0.5031 },
    ],
  },
  {
    id: "aisapso",
    name: "AISAPSO-inspired LightGBM",
    description: "Adapted optimization strategy with combined features",
    fold: {
      accuracy: 0.8313,
      accuracySd: 0.0336,
      macroF1: 0.7919,
      macroF1Sd: 0.0540,
      weightedF1: 0.8271,
      weightedF1Sd: 0.0354,
      maliciousRecall: 0.5885,
      maliciousRecallSd: null,
    },
    pooled: {
      accuracy: 0.8324,
      macroF1: 0.7927,
      weightedF1: 0.8279,
    },
    confusionMatrix: [
      [497, 24, 37],
      [40, 409, 11],
      [53, 43, 127],
    ],
    classMetrics: [
      { name: "Normal", support: 558, precision: 0.8424, recall: 0.8907, f1: 0.8659 },
      { name: "System Anomaly", support: 460, precision: 0.8592, recall: 0.8891, f1: 0.8739 },
      { name: "Malicious Event", support: 223, precision: 0.7257, recall: 0.5695, f1: 0.6382 },
    ],
  },
];

const classNames = [
  "Normal",
  "System Anomaly",
  "Malicious Event",
];

function formatPercent(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

function formatMeanSd(mean: number, sd: number | null) {
  if (sd === null) {
    return `${(mean * 100).toFixed(2)}%`;
  }

  return `${(mean * 100).toFixed(2)}% ± ${(sd * 100).toFixed(2)}%`;
}

export default function ModelPerformancePage() {
  const [selectedModelId, setSelectedModelId] = useState("aisapso");

  const selectedModel =
    models.find((model) => model.id === selectedModelId) ?? models[4];

  const chartData = models.map((model) => ({
    name:
      model.id === "combined" ? "Combined" :
      model.id === "aisapso" ? "AISAPSO" :
      model.id === "logs" ? "Logs only" :
      model.id === "pso" ? "Standard PSO" :
      "Random Forest",
    macroF1: Number((model.fold.macroF1 * 100).toFixed(2)),
    maliciousRecall: Number((model.fold.maliciousRecall * 100).toFixed(2)),
  }));

  const maliciousRow = selectedModel.confusionMatrix[2];
  const maliciousTotal = maliciousRow.reduce((sum, value) => sum + value, 0);
  const maliciousDetected = maliciousRow[2];
  const maliciousMissed = maliciousTotal - maliciousDetected;

  return (
    <main className="min-h-screen space-y-7 px-5 py-7 sm:px-8 lg:px-10">

      {/* PAGE HEADING */}

      <section>
        <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700">
          <BarChart3 size={14} />
          Research analytics
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Model performance
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">
          Experimental evaluation of five machine-learning approaches
          using scenario-aware five-fold cross-validation on CloudAnoBench.
        </p>
      </section>

      {/* EXPERIMENT SUMMARY */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "Retained cases", value: "1,241", detail: "Evaluation dataset", icon: Database },
          { title: "Numerical features", value: "35", detail: "Cloud metric summaries", icon: Activity },
          { title: "Model approaches", value: "5", detail: "Compared experiments", icon: BarChart3 },
          { title: "Outer folds", value: "5", detail: "Scenario-aware evaluation", icon: Target },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.title} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Icon size={17} className="text-blue-600" />
                {item.title}
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

      {/* SELECTED MODEL */}

      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Selected model evaluation
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Pooled out-of-fold metrics and mean across outer folds.
            </p>
          </div>

          <select
            value={selectedModelId}
            onChange={(event) => setSelectedModelId(event.target.value)}
            className="min-w-64 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 outline-none focus:border-blue-400"
          >
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50/60 p-4">
          <p className="text-xs font-semibold text-blue-900">
            {selectedModel.name}
          </p>
          <p className="mt-1 text-xs text-blue-800/80">
            {selectedModel.description}
          </p>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "Pooled accuracy",
              pooled: selectedModel.pooled.accuracy,
              fold: selectedModel.fold.accuracy,
              sd: selectedModel.fold.accuracySd,
            },
            {
              title: "Pooled macro-F1",
              pooled: selectedModel.pooled.macroF1,
              fold: selectedModel.fold.macroF1,
              sd: selectedModel.fold.macroF1Sd,
            },
            {
              title: "Pooled weighted F1",
              pooled: selectedModel.pooled.weightedF1,
              fold: selectedModel.fold.weightedF1,
              sd: selectedModel.fold.weightedF1Sd,
            },
            {
              title: "Malicious-event recall",
              pooled: selectedModel.classMetrics[2].recall,
              fold: selectedModel.fold.maliciousRecall,
              sd: selectedModel.fold.maliciousRecallSd,
            },
          ].map((metric) => (
            <div key={metric.title} className="rounded-lg border border-slate-200 p-4">
              <p className="text-xs text-slate-500">{metric.title}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatPercent(metric.pooled)}
              </p>
              <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
                Fold mean: {formatMeanSd(metric.fold, metric.sd)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* MODEL COMPARISON */}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Five-model comparison
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Mean ± sample standard deviation across five outer folds.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left">
            <thead className="bg-slate-50">
              <tr>
                {["Model", "Accuracy", "Macro-F1", "Weighted F1", "Malicious recall"].map((heading) => (
                  <th key={heading} className="px-5 py-4 text-[10px] font-semibold uppercase text-slate-500">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {models.map((model) => (
                <tr
                  key={model.id}
                  onClick={() => setSelectedModelId(model.id)}
                  className={`cursor-pointer transition hover:bg-blue-50/50 ${
                    selectedModelId === model.id ? "bg-blue-50/60" : ""
                  }`}
                >
                  <td className="px-5 py-4">
                    <p className="text-xs font-semibold text-slate-800">
                      {model.name}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {model.description}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-xs text-slate-700">
                    {formatMeanSd(model.fold.accuracy, model.fold.accuracySd)}
                  </td>

                  <td className="px-5 py-4 text-xs font-semibold text-slate-800">
                    {formatMeanSd(model.fold.macroF1, model.fold.macroF1Sd)}
                  </td>

                  <td className="px-5 py-4 text-xs text-slate-700">
                    {formatMeanSd(model.fold.weightedF1, model.fold.weightedF1Sd)}
                  </td>

                  <td className="px-5 py-4 text-xs font-semibold text-red-700">
                    {formatMeanSd(model.fold.maliciousRecall, model.fold.maliciousRecallSd)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-100 px-5 py-3">
          <p className="text-[10px] text-slate-400">
            Select a model row to inspect its metrics and confusion matrix.
          </p>
        </div>
      </section>

      {/* COMPARISON CHARTS */}

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Macro-F1 comparison
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Mean macro-F1 across five outer folds.
          </p>

          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={55} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}%`, "Macro-F1"]} />
                <Bar dataKey="macroF1" fill="#3767e8" radius={[5, 5, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Malicious-event recall comparison
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Mean malicious-event recall across five outer folds.
          </p>

          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={55} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value) => [`${Number(value).toFixed(2)}%`, "Malicious recall"]} />
                <Bar dataKey="maliciousRecall" fill="#dc4545" radius={[5, 5, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* CLASS-WISE METRICS */}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-sm font-semibold text-slate-900">
            Class-wise pooled performance
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Pooled out-of-fold metrics for {selectedModel.name}.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead className="bg-slate-50">
              <tr>
                {["Actual class", "Support", "Precision", "Recall", "F1-score"].map((heading) => (
                  <th key={heading} className="px-5 py-4 text-[10px] font-semibold uppercase text-slate-500">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {selectedModel.classMetrics.map((metric) => (
                <tr key={metric.name}>
                  <td className="px-5 py-4 text-xs font-semibold text-slate-800">{metric.name}</td>
                  <td className="px-5 py-4 text-xs text-slate-600">{metric.support}</td>
                  <td className="px-5 py-4 text-xs text-slate-600">{formatPercent(metric.precision)}</td>
                  <td className="px-5 py-4 text-xs text-slate-600">{formatPercent(metric.recall)}</td>
                  <td className="px-5 py-4 text-xs font-semibold text-slate-800">{formatPercent(metric.f1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CONFUSION MATRIX */}

      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-slate-900">
          Confusion matrix
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Pooled out-of-fold prediction counts for {selectedModel.name}.
        </p>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-center">
            <thead>
              <tr>
                <th className="border border-slate-200 bg-slate-50 p-3 text-[10px] text-slate-500">
                  Actual ↓ / Predicted →
                </th>
                {classNames.map((name) => (
                  <th key={name} className="border border-slate-200 bg-slate-50 p-3 text-[10px] font-semibold text-slate-600">
                    {name}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {selectedModel.confusionMatrix.map((row, rowIndex) => (
                <tr key={classNames[rowIndex]}>
                  <th className="border border-slate-200 bg-slate-50 p-3 text-left text-xs font-semibold text-slate-700">
                    {classNames[rowIndex]}
                  </th>

                  {row.map((value, columnIndex) => (
                    <td
                      key={`${rowIndex}-${columnIndex}`}
                      className={`border border-slate-200 p-5 text-sm font-semibold ${
                        rowIndex === columnIndex
                          ? "bg-emerald-50 text-emerald-800"
                          : "bg-red-50/60 text-red-700"
                      }`}
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap gap-5 text-[10px] text-slate-500">
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-emerald-100" />
            Correct classifications
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-red-100" />
            Classification errors
          </span>
        </div>
      </section>

      {/* MALICIOUS EVENT ANALYSIS */}

      <section className="rounded-xl border border-red-200 bg-white p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-red-50 p-3 text-red-600">
            <ShieldAlert size={22} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Malicious-event detection analysis
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Evaluation of the selected model's ability to identify malicious cases.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="text-xs text-slate-500">Actual malicious cases</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{maliciousTotal}</p>
          </div>

          <div className="rounded-lg border border-emerald-200 p-4">
            <p className="text-xs text-slate-500">Correctly detected</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-700">{maliciousDetected}</p>
          </div>

          <div className="rounded-lg border border-red-200 p-4">
            <p className="text-xs text-slate-500">Missed malicious cases</p>
            <p className="mt-2 text-2xl font-semibold text-red-700">{maliciousMissed}</p>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-red-50 p-4">
          <p className="text-xs font-semibold text-red-900">
            Detection limitation
          </p>
          <p className="mt-1 text-xs leading-relaxed text-red-800">
            In this pooled evaluation, {maliciousMissed} of {maliciousTotal} malicious
            cases were classified as another class. Improving malicious-event
            detection remains an important research limitation.
          </p>
        </div>
      </section>

      {/* RESEARCH INTERPRETATION */}

      <section className="rounded-xl border border-blue-100 bg-blue-50/60 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <Info size={19} className="mt-0.5 shrink-0 text-blue-600" />

          <div>
            <h2 className="text-sm font-semibold text-blue-950">
              Research interpretation
            </h2>

            <div className="mt-3 space-y-2 text-xs leading-relaxed text-blue-900/80">
              <p>
                AISAPSO-inspired LightGBM achieved the highest pooled macro-F1
                of 79.27%, compared with 79.00% for the combined-feature
                LightGBM baseline.
              </p>

              <p>
                This is a modest improvement of 0.27 percentage points.
                It should not be interpreted as a statistically established improvement.
              </p>

              <p>
                The pooled malicious-event recall for both approaches was
                56.95%. Improving malicious-event detection remains important.
              </p>

              <p>
                The AISAPSO-inspired implementation is an adaptation inspired
                by the referenced approach, not an exact reproduction of
                the published algorithm.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* EVALUATION LIMITATIONS */}

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">
          Evaluation methodology and limitations
        </h2>

        <div className="mt-3 space-y-2 text-xs leading-relaxed text-slate-500">
          <p>
            All five approaches were evaluated using the same scenario-aware
            five outer folds. Mean and standard deviation values are calculated
            across the five folds.
          </p>

          <p>
            Pooled metrics and confusion matrices are calculated from pooled
            out-of-fold predictions. They are not the same calculation as
            the arithmetic mean of fold scores.
          </p>

          <p>
            The evaluation dataset contains 1,241 retained cases:
            558 Normal, 460 System Anomaly and 223 Malicious Event.
          </p>

          <p>
            Results are limited to the available benchmark dataset.
            Independent external validation and statistical significance
            testing have not been established.
          </p>

          <p>
            The deployment model was refitted on all retained cases.
            The cross-validation metrics displayed here describe the
            separate outer-fold evaluation, not a fresh test performed
            on this deployment model.
          </p>
        </div>
      </section>

    </main>
  );
}
