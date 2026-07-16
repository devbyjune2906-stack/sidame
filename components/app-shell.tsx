"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";

export function AppShell({
  user,
  children,
}: {
  user: { nama: string; role: string };
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <main className="flex-1 overflow-x-hidden transition-all duration-300 flex flex-col min-h-screen">
        <div className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</div>
        <footer className="mx-auto w-full max-w-7xl px-6 py-4 text-center text-[11px] text-muted border-t border-line">
          Copyright&copy;DME, 2026
        </footer>
      </main>
    </div>
  );
}
