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
  dmedEDetail,
  dmedEFieldDef,
  kegiatan,
  kegiatanBaris,
} from "@/db/schema";
import { TambahKegiatanButton } from "@/components/tambah-kegiatan-button";
import { KegiatanSection } from "@/components/kegiatan-section";
import { getCurrentUser } from "@/lib/auth";
import { canWrite, isAdmin, isDmed, canCreateWk } from "@/lib/rbac";
import { STATUS_WK_LABEL, STATUS_BADGE, type StatusWk } from "@/lib/constants";
import { Badge, Card } from "@/components/ui";

function fmtDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function sisaKontrakTahun(endPsc: Date | null | undefined): number | null {
  if (!endPsc) return null;
  const ms = new Date(endPsc).getTime() - Date.now();
  return Math.floor(ms / (365.25 * 24 * 3600 * 1000));
}

export default async function DmedEPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user.role) && !isDmed(user.role)) redirect("/wk");

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
        endPsc: wilayahKerja.endPsc,
        dynData: dmedEDetail.data,
      })
      .from(wkProcess)
      .innerJoin(processTemplate, eq(wkProcess.templateId, processTemplate.id))
      .innerJoin(wilayahKerja, eq(wkProcess.wkId, wilayahKerja.id))
      .leftJoin(provinsi, eq(wilayahKerja.provinsiId, provinsi.id))
      .leftJoin(kabupaten, eq(wilayahKerja.kabupatenId, kabupaten.id))
      .leftJoin(dmedEDetail, eq(dmedEDetail.wkId, wilayahKerja.id))
      .where(eq(processTemplate.subpokja, "DMED-E"))
      .orderBy(asc(wilayahKerja.namaWk)),
    db
      .select()
      .from(dmedEFieldDef)
      .orderBy(asc(dmedEFieldDef.urutan), asc(dmedEFieldDef.id)),
  ]);

  const userCanEdit = canWrite(user.role);
  const userCanCreate = canCreateWk(user.role);

  const kegiatanRows = await db
    .select()
    .from(kegiatan)
    .where(eq(kegiatan.subpokja, "DMED-E"))
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

  const warnCount = rows.filter((r) => {
    const sisa = sisaKontrakTahun(r.endPsc);
    return sisa !== null && sisa <= 10;
  }).length;

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Sub Pokja DMED-E</h1>
          <p className="mt-1 text-sm text-muted">
            {rows.length} data ditemukan
            {warnCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-warn/15 px-2 py-0.5 text-xs font-medium text-warn">
                ⚠ {warnCount} WK sisa kontrak ≤ 10 tahun
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {userCanCreate && (
            <Link
              href="/wk/new"
              className="rounded-lg bg-petroleum px-3 py-1.5 text-sm font-medium text-white hover:bg-petroleum/90"
            >
              + Tambah WK
            </Link>
          )}
          {isAdmin(user.role) && (
            <Link
              href="/wk/dmed-e/pengaturan"
              className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-petroleum hover:bg-sand"
            >
              Kelola Kolom
            </Link>
          )}
          <TambahKegiatanButton subpokja="DMED-E" />
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
              <th className="px-4 py-3 font-semibold">Akhir Kontrak</th>
              <th className="px-4 py-3 font-semibold">Sisa Kontrak</th>
              {fieldDefs.map((f) => (
                <th key={f.id} className="px-4 py-3 font-semibold">{f.nama}</th>
              ))}
              <th className="px-4 py-3 font-semibold">Status WK</th>
              <th className="px-4 py-3 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={8 + fieldDefs.length} className="px-4 py-10 text-center text-muted">
                  Belum ada data DMED-E.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const sisa = sisaKontrakTahun(r.endPsc);
              const isWarning = sisa !== null && sisa <= 10;
              const isExpired = sisa !== null && sisa < 0;
              return (
                <tr
                  key={r.id}
                  className={`border-b border-line/60 last:border-0 ${isWarning ? "bg-warn/5 hover:bg-warn/10" : "hover:bg-sand/60"}`}
                >
                  <td className="px-4 py-3 font-medium text-ink">
                    <div className="flex items-center gap-2">
                      <span>{r.namaWk}</span>
                      {isExpired && (
                        <span className="shrink-0 rounded-full bg-danger/15 px-1.5 py-0.5 text-[10px] font-semibold text-danger">
                          BERAKHIR
                        </span>
                      )}
                      {!isExpired && isWarning && (
                        <span className="shrink-0 rounded-full bg-warn/20 px-1.5 py-0.5 text-[10px] font-semibold text-warn">
                          ⚠ &lt;10 thn
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink">{r.lapangan ?? "—"}</td>
                  <td className="px-4 py-3 text-ink">{r.operatorK3s ?? "—"}</td>
                  <td className="px-4 py-3 text-ink">{r.provinsiNama ?? "—"}</td>
                  <td className="px-4 py-3 text-ink">{r.kabupatenNama ?? "—"}</td>
                  <td className="px-4 py-3 text-ink">{fmtDate(r.endPsc)}</td>
                  <td className="px-4 py-3">
                    {sisa === null ? (
                      <span className="text-muted">—</span>
                    ) : isExpired ? (
                      <span className="font-semibold text-danger">{Math.abs(sisa)} thn lalu</span>
                    ) : (
                      <span className={`font-medium ${isWarning ? "text-warn" : "text-ink"}`}>
                        {sisa} tahun
                      </span>
                    )}
                  </td>
                  {fieldDefs.map((f) => {
                    const dynData = (r.dynData ?? {}) as Record<string, string>;
                    return (
                      <td key={f.id} className="px-4 py-3 text-ink">
                        {dynData[f.key] || "—"}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3">
                    <Badge className={STATUS_BADGE[r.statusWk as StatusWk]}>
                      {STATUS_WK_LABEL[r.statusWk as StatusWk]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {userCanEdit && (
                        <Link
                          href={`/wk/dmed-e/${r.id}/edit`}
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
          subpokja="DMED-E"
          canEdit={userCanEdit}
        />
      ))}
    </div>
  );
}
