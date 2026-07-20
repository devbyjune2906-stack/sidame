import Link from "next/link";
import { redirect } from "next/navigation";
import { asc, eq, or, isNull } from "drizzle-orm";
import { db } from "@/db";
import { wilayahKerja, provinsi, kabupaten, dmewLelangDetail } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin, isDmew, canWrite } from "@/lib/rbac";
import { WkActionButtons } from "@/components/wk-action-buttons";
import { STATUS_WK_LABEL, STATUS_BADGE, type StatusWk } from "@/lib/constants";
import { Badge } from "@/components/ui";

const JALUR_LABEL: Record<string, string> = { REGULER: "Reguler", JOINT_STUDY: "Joint Study" };

export default async function DmewPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user.role) && !isDmew(user.role)) redirect("/wk");
  const userCanWrite = canWrite(user.role);

  const rows = await db
    .select({
      id: wilayahKerja.id,
      namaWk: wilayahKerja.namaWk,
      lapangan: wilayahKerja.lapangan,
      operatorK3s: wilayahKerja.operatorK3s,
      provinsiNama: provinsi.nama,
      kabupatenNama: kabupaten.nama,
      statusWk: wilayahKerja.statusWk,
      subpokja: dmewLelangDetail.subpokja,
      jalur: dmewLelangDetail.jalur,
    })
    .from(wilayahKerja)
    .leftJoin(provinsi, eq(wilayahKerja.provinsiId, provinsi.id))
    .leftJoin(kabupaten, eq(wilayahKerja.kabupatenId, kabupaten.id))
    .leftJoin(dmewLelangDetail, eq(dmewLelangDetail.wkId, wilayahKerja.id))
    .where(
      eq(wilayahKerja.statusWk, "SEDANG_DILELANG") &&
        or(isNull(wilayahKerja.jenisWk), eq(wilayahKerja.jenisWk, "KONVENSIONAL"))
    )
    .orderBy(asc(wilayahKerja.namaWk));

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold text-ink">WK Konvensional (DMEW)</h1>
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
              <th className="px-4 py-3 font-semibold">Sub Pokja</th>
              <th className="px-4 py-3 font-semibold">Jalur</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-muted">
                  Belum ada data WK Konvensional.
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
                  {r.subpokja ? (
                    <Badge className="bg-petroleum/10 text-petroleum-dark">{r.subpokja}</Badge>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-ink">{JALUR_LABEL[r.jalur ?? ""] ?? "—"}</td>
                <td className="px-4 py-3">
                  <Badge className={STATUS_BADGE[r.statusWk as StatusWk]}>
                    {STATUS_WK_LABEL[r.statusWk as StatusWk]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <WkActionButtons id={r.id} editHref={`/wk/${r.id}/edit?back=/wk/dmew`} canWrite={userCanWrite} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
