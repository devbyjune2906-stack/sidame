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
  dmepDetail,
  dmepFieldDef,
  kegiatan,
  kegiatanBaris,
} from "@/db/schema";
import { TambahKegiatanButton } from "@/components/tambah-kegiatan-button";
import { KegiatanSection } from "@/components/kegiatan-section";
import { getCurrentUser } from "@/lib/auth";
import { canWrite, isAdmin, isDmep } from "@/lib/rbac";
import { STATUS_WK_LABEL, STATUS_BADGE, type StatusWk } from "@/lib/constants";
import { Badge } from "@/components/ui";
import { WkActionButtons } from "@/components/wk-action-buttons";

function fmtNum(n: number | null | undefined) {
  return n != null ? n.toLocaleString("id-ID") : "—";
}

export default async function DmepPPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user.role) && !isDmep(user.role)) redirect("/wk");

  const [rows, fieldDefs] = await Promise.all([
    db
      .select({
        id: wilayahKerja.id,
        namaWk: wilayahKerja.namaWk,
        lapangan: wilayahKerja.lapangan,
        operatorK3s: wilayahKerja.operatorK3s,
        provinsiNama: provinsi.nama,
        kabupatenNama: kabupaten.nama,
        statusWk: wilayahKerja.statusWk,
        sisaCadanganMinyak: dmepDetail.sisaCadanganMinyak,
        sisaCadanganGas: dmepDetail.sisaCadanganGas,
        data: dmepDetail.data,
      })
      .from(wkProcess)
      .innerJoin(processTemplate, eq(wkProcess.templateId, processTemplate.id))
      .innerJoin(wilayahKerja, eq(wkProcess.wkId, wilayahKerja.id))
      .leftJoin(provinsi, eq(wilayahKerja.provinsiId, provinsi.id))
      .leftJoin(kabupaten, eq(wilayahKerja.kabupatenId, kabupaten.id))
      .leftJoin(dmepDetail, eq(dmepDetail.wkId, wilayahKerja.id))
      .where(eq(processTemplate.subpokja, "DMEP-P"))
      .orderBy(asc(wilayahKerja.namaWk)),
    db
      .select()
      .from(dmepFieldDef)
      .orderBy(asc(dmepFieldDef.urutan), asc(dmepFieldDef.id)),
  ]);

  const userCanEdit = canWrite(user.role);

  const kegiatanRows = await db
    .select()
    .from(kegiatan)
    .where(eq(kegiatan.subpokja, "DMEP-P"))
    .orderBy(asc(kegiatan.createdAt));

  const kegiatanWithBaris = await Promise.all(
    kegiatanRows.map(async (kg) => {
      const baris = await db
        .select()
        .from(kegiatanBaris)
        .where(eq(kegiatanBaris.kegiatanId, kg.id))
        .orderBy(asc(kegiatanBaris.urutan));
      return { ...kg, baris };
    }),
  );

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Sub Pokja DMEP-P</h1>
          <p className="mt-1 text-sm text-muted">{rows.length} data ditemukan</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin(user.role) && (
            <Link
              href="/wk/dmep/pengaturan"
              className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-petroleum hover:bg-sand"
            >
              Kelola Kolom
            </Link>
          )}
          <TambahKegiatanButton subpokja="DMEP-P" />
        </div>
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
              <th className="px-4 py-3 font-semibold">Sisa Cadangan Minyak</th>
              <th className="px-4 py-3 font-semibold">Sisa Cadangan Gas</th>
              {fieldDefs.map((f) => (
                <th key={f.id} className="px-4 py-3 font-semibold">{f.nama}</th>
              ))}
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={9 + fieldDefs.length} className="px-4 py-10 text-center text-muted">
                  Belum ada data DMEP-P.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const dynData = (r.data ?? {}) as Record<string, string>;
              return (
                <tr key={r.id} className="border-b border-line/60 last:border-0 hover:bg-sand/60">
                  <td className="px-4 py-3 font-medium text-ink">{r.namaWk}</td>
                  <td className="px-4 py-3 text-ink">{r.lapangan ?? "—"}</td>
                  <td className="px-4 py-3 text-ink">{r.operatorK3s ?? "—"}</td>
                  <td className="px-4 py-3 text-ink">{r.provinsiNama ?? "—"}</td>
                  <td className="px-4 py-3 text-ink">{r.kabupatenNama ?? "—"}</td>
                  <td className="px-4 py-3 text-ink">{fmtNum(r.sisaCadanganMinyak)}</td>
                  <td className="px-4 py-3 text-ink">{fmtNum(r.sisaCadanganGas)}</td>
                  {fieldDefs.map((f) => (
                    <td key={f.id} className="px-4 py-3 text-ink">
                      {dynData[f.key] || "—"}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <Badge className={STATUS_BADGE[r.statusWk as StatusWk]}>
                      {STATUS_WK_LABEL[r.statusWk as StatusWk]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <WkActionButtons id={r.id} editHref={`/wk/dmep/${r.id}/edit`} canWrite={userCanEdit} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {kegiatanWithBaris.map((kg) => (
        <KegiatanSection
          key={kg.id}
          id={kg.id}
          judul={kg.judul}
          kolom={kg.kolom as string[]}
          baris={kg.baris.map((b) => ({
            id: b.id,
            data: b.data as Record<string, string>,
            urutan: b.urutan,
          }))}
          subpokja="DMEP-P"
          canEdit={userCanEdit}
        />
      ))}
    </div>
  );
}
