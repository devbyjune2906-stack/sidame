"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { isAdmin, isPokjaAdmin, isDmew, isDmee, isDmed, isDmep, isDmen, pokjaLabel } from "@/lib/rbac";
import { logout } from "@/app/(app)/actions";

type NavItem = { href: string; label: string };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/wk", label: "Wilayah Kerja" },
];

const POKJA_SECTIONS: {
  key: string;
  label: string;
  items: NavItem[];
  show: (role: string) => boolean;
}[] = [
  {
    key: "dmew",
    label: "Pokja DMEW",
    items: [
      { href: "/wk/dmew-s", label: "DMEW-S" },
      { href: "/wk/dmew-t", label: "DMEW-T" },
    ],
    show: (r) => isAdmin(r) || isDmew(r),
  },
  {
    key: "dmee",
    label: "Pokja DMEE",
    items: [
      { href: "/wk/dmee-l", label: "DMEE-L" },
      { href: "/wk/dmee-m", label: "DMEE-M" },
    ],
    show: (r) => isAdmin(r) || isDmee(r),
  },
  {
    key: "dmed",
    label: "Pokja DMED",
    items: [
      { href: "/wk/dmed-t", label: "DMED-T" },
      { href: "/wk/dmed-e", label: "DMED-E" },
    ],
    show: (r) => isAdmin(r) || isDmed(r),
  },
  {
    key: "dmep",
    label: "Pokja DMEP",
    items: [
      { href: "/wk/dmep-l", label: "DMEP-L" },
      { href: "/wk/dmep-p", label: "DMEP-P" },
    ],
    show: (r) => isAdmin(r) || isDmep(r),
  },
  {
    key: "dmen",
    label: "Pokja DMEN",
    items: [
      { href: "/wk/dmen-n", label: "DMEN-N" },
      { href: "/wk/dmen-k", label: "DMEN-K" },
    ],
    show: (r) => isAdmin(r) || isDmen(r),
  },
];

function PokjaSection({ label, items, pathname }: { label: string; items: NavItem[]; pathname: string }) {
  const hasActive = items.some((i) => pathname === i.href || pathname.startsWith(i.href + "/"));
  const [open, setOpen] = useState(hasActive);

  return (
    <div className="pt-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-ink transition hover:bg-line/50"
      >
        <span>{label}</span>
        <svg
          className={cn("h-4 w-4 text-muted transition-transform", open && "rotate-90")}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {open && (
        <div className="ml-3 mt-0.5 space-y-0.5 border-l border-line pl-3">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-lg px-3 py-1.5 text-sm font-medium transition",
                  active ? "bg-petroleum/10 text-petroleum" : "text-ink hover:bg-line/50"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Sidebar({
  user,
  collapsed,
  onToggle,
}: {
  user: { nama: string; role: string };
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const pathname = usePathname();
  const showAdminMenu = isAdmin(user.role) || isPokjaAdmin(user.role);
  const pokja = pokjaLabel(user.role);

  return (
    <aside
      className={cn(
        "relative flex shrink-0 flex-col border-r border-line bg-surface transition-all duration-300",
        collapsed ? "w-12" : "w-64"
      )}
    >
      {/* Toggle button */}
      <button
        type="button"
        onClick={onToggle}
        title={collapsed ? "Lebarkan sidebar" : "Ciutkan sidebar"}
        className="absolute -right-3 top-5 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-line bg-surface shadow-sm transition hover:bg-line/60"
      >
        <svg
          className={cn("h-3 w-3 text-muted transition-transform", collapsed && "rotate-180")}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Header */}
      <div className={cn("flex items-center gap-3 border-b border-line px-3 py-4", collapsed && "justify-center px-0")}>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white overflow-hidden">
          <img src="/logo-dme.png" alt="DME" className="h-full w-full object-contain" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-display text-base font-bold leading-none text-ink">SIDAME</p>
            <p className="mt-1 text-xs text-muted">{pokja ? `Pokja ${pokja}` : "WK Migas Nasional"}</p>
          </div>
        )}
      </div>

      {/* Nav — hidden when collapsed */}
      {!collapsed && (
        <nav className="flex-1 overflow-y-auto space-y-0.5 p-3">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm font-medium transition",
                  active ? "bg-petroleum/10 text-petroleum" : "text-ink hover:bg-line/50"
                )}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="pt-2">
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted">Pokja</p>
            {POKJA_SECTIONS.filter((s) => s.show(user.role)).map((section) => (
              <PokjaSection key={section.key} label={section.label} items={section.items} pathname={pathname} />
            ))}
          </div>

          {showAdminMenu && (
            <div className="pt-2">
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted">Admin</p>
              <Link
                href="/admin/users"
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm font-medium transition",
                  pathname.startsWith("/admin/users")
                    ? "bg-petroleum/10 text-petroleum"
                    : "text-ink hover:bg-line/50"
                )}
              >
                Manajemen User
              </Link>
            </div>
          )}
        </nav>
      )}

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-line p-3">
          <div className="mb-2 px-2">
            <p className="truncate text-sm font-medium text-ink">{user.nama}</p>
            <p className="text-xs text-muted">{user.role}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-danger transition hover:bg-danger/10"
            >
              Keluar
            </button>
          </form>
        </div>
      )}
    </aside>
  );
}
