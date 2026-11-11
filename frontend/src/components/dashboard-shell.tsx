
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Bell,
  BarChart3,
  ChevronDown,
  Cloud,
  FileText,
  History,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  UploadCloud,
  Workflow,
  X,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const primaryNavigation: NavigationItem[] = [
  {
    label: "Overview",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Investigations",
    href: "/investigations",
    icon: ShieldAlert,
  },
  {
    label: "Data ingestion",
    href: "/data-ingestion",
    icon: UploadCloud,
  },
  {
    label: "Model performance",
    href: "/model-performance",
    icon: BarChart3,
  },
  {
    label: "Workflows",
    href: "/workflows",
    icon: Workflow,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: FileText,
  },
  {
    label: "Analysis History",
    href: "/analysis-history",
    icon: History,
  },
];

const secondaryNavigation: NavigationItem[] = [
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export default function DashboardShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentPage = [
    ...primaryNavigation,
    ...secondaryNavigation,
  ].find((item) => item.href === pathname);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const renderNavigationItem = (item: NavigationItem) => {
    const Icon = item.icon;
    const active = isActive(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileMenuOpen(false)}
        aria-current={active ? "page" : undefined}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm transition duration-200 ${
          active
            ? "bg-blue-600 font-medium text-white shadow-md shadow-blue-950/30"
            : "text-slate-400 hover:bg-white/5 hover:text-white"
        }`}
      >
        <Icon size={18} strokeWidth={1.8} />

        <span className="flex-1">
          {item.label}
        </span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">

      {/* MOBILE BACKDROP */}

      {mobileMenuOpen && (
        <button
          aria-label="Close navigation menu"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col border-r border-slate-800 bg-[#101a2b] text-slate-300 transition-transform duration-300 ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full"
        } lg:translate-x-0`}
      >

        {/* BRAND */}

        <div className="flex h-[76px] shrink-0 items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-950/30">
            <ShieldCheck size={23} strokeWidth={2} />
          </div>

          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white">
              CloudSentinel
            </h1>

            <p className="text-[10px] font-medium tracking-[0.17em] text-slate-400">
              CLOUD SECURITY
            </p>
          </div>
        </div>

        {/* WORKSPACE */}

        <div className="px-4 pt-6">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Workspace
          </p>

          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/15 text-blue-300">
              <Cloud size={19} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                Research workspace
              </p>

              <p className="text-[11px] text-slate-400">
                CloudAnoBench
              </p>
            </div>

            <ChevronDown size={15} className="text-slate-500" />
          </div>
        </div>

        {/* PRIMARY NAVIGATION */}

        <nav className="mt-8 flex-1 overflow-y-auto px-4">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Monitoring
          </p>

          <div className="space-y-1">
            {primaryNavigation.map(renderNavigationItem)}
          </div>

          {/* SECONDARY NAVIGATION */}

          <p className="mb-3 mt-9 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            Preferences
          </p>

          <div className="space-y-1">
            {secondaryNavigation.map(renderNavigationItem)}
          </div>
        </nav>

        {/* SIDEBAR FOOTER */}

        <div className="shrink-0 border-t border-white/10 p-4">
          <div className="rounded-xl border border-emerald-400/15 bg-emerald-400/5 p-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />

              <span className="text-xs font-medium text-emerald-300">
                Research model
              </span>
            </div>

            <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
              Saved CloudAnoBench model ready for API integration.
            </p>
          </div>

          <div className="mt-4 flex items-center gap-3 px-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">
              CS
            </div>

            <div>
              <p className="text-xs font-medium text-white">
                CloudSentinel Admin
              </p>

              <p className="text-[10px] text-slate-500">
                Research environment
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN AREA */}

      <div className="min-h-screen lg:pl-[252px]">

        {/* TOP HEADER */}

        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur-xl sm:px-8">

          {/* LEFT */}

          <div className="flex min-w-0 items-center gap-3">

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={
                mobileMenuOpen ? "Close menu" : "Open menu"
              }
              aria-expanded={mobileMenuOpen}
              className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
            >
              {mobileMenuOpen ? (
                <X size={21} />
              ) : (
                <Menu size={21} />
              )}
            </button>

            <div>
              <p className="text-xs text-slate-400">
                CloudSentinel /{" "}
                <span className="text-slate-600">
                  {currentPage?.label ?? "Workspace"}
                </span>
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                Security analytics workspace
              </p>
            </div>
          </div>

          {/* RIGHT */}

          <div className="flex shrink-0 items-center gap-3">

            <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
              <Search size={15} className="text-slate-400" />

              <span className="text-xs text-slate-400">
                Search workspace...
              </span>

              <span className="ml-4 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400">
                /
              </span>
            </div>

            <button
              aria-label="Notifications"
              title="Notifications"
              className="relative rounded-lg p-2.5 text-slate-500 transition hover:bg-slate-100"
            >
              <Bell size={19} />

              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-blue-500" />
            </button>

            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-xs font-semibold text-blue-700">
              CS
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}

        <div className="mx-auto max-w-[1600px]">
          {children}
        </div>

        {/* GLOBAL FOOTER */}

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-6 py-5 lg:px-10">
          <p className="text-[10px] text-slate-400">
            CloudSentinel · CloudAnoBench research project
          </p>

          <p className="text-[10px] text-slate-400">
            Development build · Research data only
          </p>
        </footer>
      </div>
    </div>
  );
}
