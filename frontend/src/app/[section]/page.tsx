
import {
  Activity,
  ArrowRight,
  BarChart3,
  Database,
  FileText,
  Search,
  Settings,
  ShieldAlert,
  UploadCloud,
  Workflow,
  Clock3,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";
import { notFound } from "next/navigation";

// Allow this route to render on demand because it reads URL parameters.
export const instant = false;

type ModuleInfo = {
  title: string;
  description: string;
  icon: LucideIcon;
  status: string;
  intro: string;
  features: {
    title: string;
    description: string;
    icon: LucideIcon;
  }[];
};

const modules: Record<string, ModuleInfo> = {
  investigations: {
    title: "Investigations",
    description: "Cloud anomaly investigation workspace",
    icon: ShieldAlert,
    status: "Backend integration pending",
    intro:
      "Review individual cloud cases, inspect model classifications, and examine prediction probabilities.",
    features: [
      {
        title: "Case exploration",
        description:
          "Search and inspect cases from uploaded cloud analysis datasets.",
        icon: Search,
      },
      {
        title: "Prediction analysis",
        description:
          "Examine Normal, System Anomaly and Malicious Event classifications.",
        icon: Activity,
      },
      {
        title: "Investigation records",
        description:
          "Review case-level evidence and export investigation results.",
        icon: FileText,
      },
    ],
  },

  "data-ingestion": {
    title: "Data ingestion",
    description: "Upload and prepare cloud monitoring data",
    icon: UploadCloud,
    status: "Backend integration pending",
    intro:
      "Prepare numerical cloud-metric summaries and associated log text for the CloudSentinel prediction engine.",
    features: [
      {
        title: "CSV uploads",
        description:
          "Upload a CSV containing one row per case and the required model features.",
        icon: UploadCloud,
      },
      {
        title: "Input validation",
        description:
          "Check required numerical columns, missing values, and log-text fields.",
        icon: Database,
      },
      {
        title: "Feature processing",
        description:
          "Prepare metric summaries and log text in the model's expected format.",
        icon: Workflow,
      },
    ],
  },

  "model-performance": {
    title: "Model performance",
    description: "Machine-learning evaluation and diagnostics",
    icon: BarChart3,
    status: "Research evaluation data",
    intro:
      "Explore the CloudAnoBench experiment results and compare the five evaluated classification approaches.",
    features: [
      {
        title: "Model comparison",
        description:
          "Compare pooled accuracy, macro-F1, weighted F1 and class-level metrics.",
        icon: BarChart3,
      },
      {
        title: "Cross-validation results",
        description:
          "Review five-fold scenario-aware evaluation and result variability.",
        icon: Activity,
      },
      {
        title: "Detection limitations",
        description:
          "Inspect malicious-event recall and classification error patterns.",
        icon: ShieldAlert,
      },
    ],
  },

  workflows: {
    title: "Workflows",
    description: "Analysis processing and operational workflows",
    icon: Workflow,
    status: "Planned",
    intro:
      "A future workspace for organising data preparation, model execution and investigation steps.",
    features: [
      {
        title: "Analysis pipelines",
        description:
          "Organise data ingestion, validation and prediction stages.",
        icon: Workflow,
      },
      {
        title: "Processing status",
        description:
          "Track the progress and outcome of submitted analyses.",
        icon: Activity,
      },
      {
        title: "Reusable configurations",
        description:
          "Prepare repeatable analysis configurations for future runs.",
        icon: Settings,
      },
    ],
  },

  reports: {
    title: "Reports",
    description: "Analysis results and report generation",
    icon: FileText,
    status: "Planned",
    intro:
      "A future reporting workspace for downloading predictions and summarising experimental findings.",
    features: [
      {
        title: "Prediction exports",
        description:
          "Export case-level classifications and estimated class probabilities.",
        icon: Database,
      },
      {
        title: "Analysis summaries",
        description:
          "Prepare summaries of the uploaded dataset and its prediction distribution.",
        icon: BarChart3,
      },
      {
        title: "Report downloads",
        description:
          "Generate downloadable analysis reports for completed runs.",
        icon: FileText,
      },
    ],
  },

  settings: {
    title: "Settings",
    description: "CloudSentinel workspace configuration",
    icon: Settings,
    status: "Planned",
    intro:
      "Workspace settings for future application preferences, model configuration and access management.",
    features: [
      {
        title: "Workspace preferences",
        description:
          "Manage application appearance and general preferences.",
        icon: Settings,
      },
      {
        title: "Model configuration",
        description:
          "Review the active model and its configuration details.",
        icon: Activity,
      },
      {
        title: "Application status",
        description:
          "View backend connectivity and service health information.",
        icon: Clock3,
      },
    ],
  },
};

export default async function ModulePage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;

  const moduleInfo = modules[section];

  if (!moduleInfo) {
    notFound();
  }

  const PageIcon = moduleInfo.icon;

  return (
    <main className="space-y-7 px-5 py-7 sm:px-8 lg:px-10">
      {/* PAGE HEADING */}
      <section>
        <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700">
          <PageIcon size={13} />
          CloudSentinel workspace
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              {moduleInfo.title}
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
              {moduleInfo.description}
            </p>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {moduleInfo.status}
          </span>
        </div>
      </section>

      {/* INTRODUCTION */}
      <section className="rounded-xl border border-blue-100 bg-blue-50/70 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-white p-3 text-blue-600 shadow-sm">
            <PageIcon size={22} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-blue-950">
              Workspace overview
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-blue-900/80">
              {moduleInfo.intro}
            </p>
          </div>
        </div>
      </section>

      {/* FEATURE CARDS */}
      <section>
        <div className="mb-5">
          <h2 className="text-base font-semibold text-slate-900">
            Available module capabilities
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Planned functionality and integration scope
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {moduleInfo.features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Icon size={20} />
                </div>

                <h3 className="text-sm font-semibold text-slate-900">
                  {feature.title}
                </h3>

                <p className="mt-2 text-xs leading-relaxed text-slate-500">
                  {feature.description}
                </p>

                <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-[10px] font-medium text-slate-400">
                  <Clock3 size={13} />
                  Integration in progress
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* DEVELOPMENT STATUS */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-slate-100 p-2.5 text-slate-600">
            <Activity size={19} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Module development status
            </h2>

            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              The navigation and page layout are implemented. Functional
              data processing and backend integration will be added
              during the next development stages.
            </p>

            <div className="mt-3 flex items-center gap-2 text-xs font-medium text-blue-600">
              <span>CloudSentinel development</span>
              <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
