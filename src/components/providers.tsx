"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      {/* Toast notification portal — will be replaced with a proper Toaster component later */}
      <div id="toast-portal" />
    </SessionProvider>
  );
}
