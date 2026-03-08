// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import "react-quill-new/dist/quill.snow.css";
import "highlight.js/styles/github-dark.css";

import AppHeader from "@/components/layout/AppHeader";
import AppFooter from "@/components/layout/AppFooter";
import Providers from "@/lib/Providers";
import UIShellRootClient from "@/app/_ui/UIShellRootClient";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Workbench Notes", template: "%s — Workbench Notes" },
  description: "Workbench Notes — учебный проект для курса TypeScript (Next.js App Router).",
  icons: { icon: [{ url: "/favicon.ico" }] },
  keywords: [
    "notes",
    "workbench",
    "project memory",
    "Quill",
    "wysiwyg",
    "Next.js",
    "TypeScript",
    "App Router",
    "практика",
  ],
  openGraph: {
    title: "Workbench Notes",
    description:
      "Workbench Notes — учебный проект для курса TypeScript (Next.js App Router).",
    url: siteUrl,
    siteName: "Workbench Notes",
    images: [
      {
        url: "/og/workbench.png",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <Providers>
          <div className="min-h-dvh flex flex-col">
            <AppHeader />
            <main className="app-main flex-1 min-h-0 pb-0 flex flex-col">
              <UIShellRootClient>{children}</UIShellRootClient>
            </main>
            <AppFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
