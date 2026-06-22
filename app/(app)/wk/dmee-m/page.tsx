import Link from "next/link";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  wilayahKerja,
  provinsi,
  kabupaten,
  wkProcess,
  processTemplate,
  dmeeDetail,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { canWrite, isAdmin, isDmee } from "@/lib/rbac";
import { STATUS_WK_LABEL, STATUS_BADGE, type StatusWk } from "@/lib/constants";
import { Badge } from "@/components/ui";

export default async function DmeeMPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user.role) && !isDmee(user.role)) redirect("/wk");

  const rows = await db
    .select({
      id: wilayahKerja.id,
      namaWk: wilayahKerja.namaWk,
      lapangan: wilayahKerja.lapangan,
      operatorK3s: wilayahKerja.operatorK3s,
      provinsiNama: provinsi.nama,
      kabupatenNama: kabupaten.nama,
      statusWk: wilayahKerja.statusWk,
      luasWilayahSisa: dmeeDetail.luasWilayahSisa,
    })
    .from(wkProcess)
    .innerJoin(processTemplate, eq(wkProcess.templateId, processTemplate.id))
    .innerJoin(wilayahKerja, eq(wkProcess.wkId, wilayahKerja.id))
    .leftJoin(provinsi, eq(wilayahKerja.provinsiId, provinsi.id))
    .leftJoin(kabupaten, eq(wilayahKerja.kabupatenId, kabupaten.id))
    .leftJoin(dmeeDetail, eq(dmeeDetail.wkId, wilayahKerja.id))
    .where(eq(processTemplate.subpokja, "DMEE-M"))
    .orderBy(asc(wilayahKerja.namaWk));

  const userCanEdit = canWrite(user.role);

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Sub Pokja DMEE-M</h1>
          <p className="mt-1 text-sm text-muted">{rows.length} data ditemukan</p>
        </div>
        {isAdmin(user.role) && (
          <Link
            href="/wk/dmee/pengaturan"
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-petroleum hover:bg-sand"
          >
            Kelola Kolom
          </Link>
        )}
      </header>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-semibold">Nama WK</th>
              <th className="px-4 py-3 font-semibold">Lapangan</th>
              <th className="px-4 py-3 font-semibold">Operator / K3S</th>
              <th className="px-4 py-3 font-semibold">Provinsi</th>
              <th className="px-4 py-3 font-semibold">Kabupaten/Kota</th>
              <th className="px-4 py-3 font-semibold">Luas Sisa (km²)</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted">
                  Belum ada data DMEE-M.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line/60 last:border-0 hover:bg-sand/60">
                <td className="px-4 py-3 font-medium text-ink">{r.namaWk}</td>
                <td className="px-4 py-3 text-ink">{r.lapangan ?? "—"}</td>
                <td className="px-4 py-3 text-ink">{r.operatorK3s ?? "—"}</td>
                <td className="px-4 py-3 text-ink">{r.provinsiNama ?? "—"}</td>
                <td className="px-4 py-3 text-ink">{r.kabupatenNama ?? "—"}</td>
                <td className="px-4 py-3 text-ink">
                  {r.luasWilayahSisa != null ? r.luasWilayahSisa.toLocaleString("id-ID") : "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge className={STATUS_BADGE[r.statusWk as StatusWk]}>
                    {STATUS_WK_LABEL[r.statusWk as StatusWk]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    {userCanEdit && (
                      <Link
                        href={`/wk/dmee/${r.id}/edit`}
                        className="text-sm font-medium text-petroleum hover:underline"
                      >
                        Edit
                      </Link>
                    )}
                    <Link
                      href={`/wk/${r.id}`}
                      className="text-sm font-medium text-petroleum hover:underline"
                    >
                      Lihat
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
