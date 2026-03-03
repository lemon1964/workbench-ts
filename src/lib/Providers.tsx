// src/lib/Providers.tsx
"use client";

import { WorkbenchStoreProvider } from "@/lib/workbenchStore";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <WorkbenchStoreProvider>{children}</WorkbenchStoreProvider>;
}