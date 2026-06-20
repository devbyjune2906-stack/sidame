import Link from "next/link";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { wilayahKerja, provinsi, kabupaten, wkProcess, processTemplate } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin, isDmep } from "@/lib/rbac";
import { STATUS_WK_LABEL, STATUS_BADGE, type StatusWk } from "@/lib/constants";
import { Badge } from "@/components/ui";

export default async function DmepPPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user.role) && !isDmep(user.role)) redirect("/wk");

  const rows = await db
    .select({
      id: wilayahKerja.id,
      namaWk: wilayahKerja.namaWk,
      lapangan: wilayahKerja.lapangan,
      operatorK3s: wilayahKerja.operatorK3s,
      provinsiNama: provinsi.nama,
      kabupatenNama: kabupaten.nama,
      statusWk: wilayahKerja.statusWk,
    })
    .from(wkProcess)
    .innerJoin(processTemplate, eq(wkProcess.templateId, processTemplate.id))
    .innerJoin(wilayahKerja, eq(wkProcess.wkId, wilayahKerja.id))
    .leftJoin(provinsi, eq(wilayahKerja.provinsiId, provinsi.id))
    .leftJoin(kabupaten, eq(wilayahKerja.kabupatenId, kabupaten.id))
    .where(eq(processTemplate.subpokja, "DMEP-P"))
    .orderBy(asc(wilayahKerja.namaWk));

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold text-ink">Sub Pokja DMEP-P</h1>
        <p className="mt-1 text-sm text-muted">{rows.length} data ditemukan</p>
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
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  Belum ada data DMEP-P.
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
                <td className="px-4 py-3">
                  <Badge className={STATUS_BADGE[r.statusWk as StatusWk]}>
                    {STATUS_WK_LABEL[r.statusWk as StatusWk]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/wk/${r.id}`} className="text-sm font-medium text-petroleum hover:underline">
                    Lihat
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
