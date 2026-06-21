import Link from "next/link";
import { redirect } from "next/navigation";
import { asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { wilayahKerja, provinsi } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin, canWrite, canCreateWk } from "@/lib/rbac";
import { buildWkWhere, parseFilters } from "@/lib/wk-query";
import {
  STATUS_WK_LABEL,
  STATUS_BADGE,
  TYPE_CONTRACT_LABEL,
  type StatusWk,
  type TypeContract,
} from "@/lib/constants";
import { Badge, Button } from "@/components/ui";
import { WkFilters } from "@/components/wk-filters";
import { deleteWk } from "./actions";

const PAGE_SIZE = 15;

function fmtDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function WkListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const userCanWrite = canWrite(user.role);
  const userCanCreate = canCreateWk(user.role);
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const page = Math.max(1, Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1);
  const where = buildWkWhere(user.role, filters);

  const [{ total }] = await db.select({ total: count() }).from(wilayahKerja).where(where);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const rows = await db
    .select({
      id: wilayahKerja.id,
      namaWk: wilayahKerja.namaWk,
      operatorK3s: wilayahKerja.operatorK3s,
      provinsiNama: provinsi.nama,
      typeContract: wilayahKerja.typeContract,
      statusWk: wilayahKerja.statusWk,
      startPsc: wilayahKerja.startPsc,
      endPsc: wilayahKerja.endPsc,
    })
    .from(wilayahKerja)
    .leftJoin(provinsi, eq(wilayahKerja.provinsiId, provinsi.id))
    .where(where)
    .orderBy(asc(wilayahKerja.namaWk))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  const provinsiList = await db
    .select({ id: provinsi.id, nama: provinsi.nama })
    .from(provinsi)
    .orderBy(asc(provinsi.nama));

  const exportQuery = new URLSearchParams(
    Object.entries({ q: filters.q, status: filters.status, provinsi: filters.provinsiId?.toString() })
      .filter(([, v]) => v)
      .map(([k, v]) => [k, String(v)])
  ).toString();

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Wilayah Kerja</h1>
          <p className="mt-1 text-sm text-muted">{total} data ditemukan</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/api/export/excel?${exportQuery}`}>
            <Button variant="outline">Export Excel</Button>
          </Link>
          <Link href={`/api/export/pdf?${exportQuery}`}>
            <Button variant="outline">Export PDF</Button>
          </Link>
          {userCanCreate && (
            <Link href="/wk/new">
              <Button>+ Tambah WK</Button>
            </Link>
          )}
        </div>
      </header>

      <WkFilters provinsiList={provinsiList} showStatus={isAdmin(user.role)} />

      <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-semibold">Nama WK</th>
              <th className="px-4 py-3 font-semibold">Operator/K3S</th>
              <th className="px-4 py-3 font-semibold">Provinsi</th>
              <th className="px-4 py-3 font-semibold">Kontrak</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">PSC</th>
              <th className="px-4 py-3 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  Belum ada data.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line/60 last:border-0 hover:bg-sand/60">
                <td className="px-4 py-3 font-medium text-ink">{r.namaWk}</td>
                <td className="px-4 py-3 text-ink">{r.operatorK3s ?? "—"}</td>
                <td className="px-4 py-3 text-ink">{r.provinsiNama ?? "—"}</td>
                <td className="px-4 py-3 text-ink">
                  {r.typeContract ? TYPE_CONTRACT_LABEL[r.typeContract as TypeContract] : "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge className={STATUS_BADGE[r.statusWk as StatusWk]}>
                    {STATUS_WK_LABEL[r.statusWk as StatusWk]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  {fmtDate(r.startPsc)} {"–"} {fmtDate(r.endPsc)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/wk/${r.id}`} className="text-sm font-medium text-ink hover:underline">
                      Lihat
                    </Link>
                    {userCanWrite && (
                      <Link href={`/wk/${r.id}/edit`} className="text-sm font-medium text-petroleum hover:underline">
                        Edit
                      </Link>
                    )}
                    {userCanWrite && (
                      <form action={deleteWk}>
                        <input type="hidden" name="id" value={r.id} />
                        <button
                          type="submit"
                          className="text-sm font-medium text-danger hover:underline"
                        >
                          Hapus
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted">
            Halaman {page} dari {totalPages}
          </span>
          <div className="flex gap-2">
            <PageLink sp={sp} page={page - 1} disabled={page <= 1} label="Sebelumnya" />
            <PageLink sp={sp} page={page + 1} disabled={page >= totalPages} label="Berikutnya" />
          </div>
        </div>
      )}
    </div>
  );
}

function PageLink({
  sp,
  page,
  disabled,
  label,
}: {
  sp: Record<string, string | string[] | undefined>;
  page: number;
  disabled: boolean;
  label: string;
}) {
  if (disabled) {
    return <span className="rounded-lg border border-line px-3 py-1.5 text-muted opacity-50">{label}</span>;
  }
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (k === "page") continue;
    if (typeof v === "string" && v) params.set(k, v);
  }
  params.set("page", String(page));
  return (
    <Link href={`/wk?${params.toString()}`} className="rounded-lg border border-line px-3 py-1.5 text-ink hover:bg-line/40">
      {label}
    </Link>
  );
}
