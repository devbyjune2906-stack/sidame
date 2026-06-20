"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { isAdmin, isPokjaAdmin, isDmew, isDmee, isDmed, isDmep, isDmen } from "@/lib/rbac";
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
    items: [{ href: "/wk/dmew", label: "WK Konvensional" }],
    show: (r) => isAdmin(r) || isDmew(r),
  },
  {
    key: "dmee",
    label: "Pokja DMEE",
    items: [{ href: "/wk/dmee", label: "WK Eksplorasi" }],
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
    items: [{ href: "/wk/dmep", label: "WK Onstream" }],
    show: (r) => isAdmin(r) || isDmep(r),
  },
  {
    key: "dmen",
    label: "Pokja DMEN",
    items: [{ href: "/wk/dmen", label: "WK Non Konvensional" }],
    show: (r) => isAdmin(r) || isDmen(r),
  },
];

export function Sidebar({ user }: { user: { nama: string; role: string } }) {
  const pathname = usePathname();
  const showAdminMenu = isAdmin(user.role) || isPokjaAdmin(user.role);

  function navLink(item: NavItem) {
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
  }

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

      <nav className="flex-1 overflow-y-auto space-y-1 p-3">
        {NAV.map(navLink)}

        {POKJA_SECTIONS.filter((s) => s.show(user.role)).map((section) => (
          <div key={section.key} className="pt-3">
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted">
              {section.label}
            </p>
            {section.items.map(navLink)}
          </div>
        ))}

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
