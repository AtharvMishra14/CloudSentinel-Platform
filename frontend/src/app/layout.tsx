
import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import "./globals.css";

import DashboardShell from "@/components/dashboard-shell";
import { AnalysisProvider } from "@/components/analysis-provider";

export const metadata: Metadata = {
  title: "CloudSentinel | Cloud Anomaly Detection",
  description:
    "An intelligent cloud monitoring and anomaly detection platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] text-slate-500">
              Loading CloudSentinel...
            </div>
          }
        >
          <AnalysisProvider>
            <DashboardShell>{children}</DashboardShell>
          </AnalysisProvider>
        </Suspense>
      </body>
    </html>
  );
}
