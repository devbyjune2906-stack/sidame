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
      <main className="flex-1 overflow-x-hidden transition-all duration-300">
        <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
