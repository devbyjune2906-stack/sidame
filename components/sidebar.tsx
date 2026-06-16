"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { isAdmin, isPokjaAdmin, isDmed } from "@/lib/rbac";
import { logout } from "@/app/(app)/actions";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/wk", label: "Wilayah Kerja" },
];

const DMED_NAV = [
  { href: "/wk/dmed-t", label: "DMED-T" },
  { href: "/wk/dmed-e", label: "DMED-E" },
];

export function Sidebar({ user }: { user: { nama: string; role: string } }) {
  const pathname = usePathname();
  const showAdminMenu = isAdmin(user.role) || isPokjaAdmin(user.role);
  const showDmedMenu = isAdmin(user.role) || isDmed(user.role);

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-line bg-surface">
      <div className="flex items-center gap-3 border-b border-line px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-petroleum font-display text-sm font-extrabold text-white">
          SD
        </div>
        <div>
          <p className="font-display text-base font-bold leading-none text-ink">SIDAME</p>
          <p className="mt-1 text-xs text-muted">WK Migas Nasional</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
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

        {showDmedMenu && (
          <div className="pt-3">
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted">Sub Pokja DMED</p>
            {DMED_NAV.map((item) => {
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
          </div>
        )}

        {showAdminMenu && (
          <div className="pt-3">
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
    </aside>
  );
}
