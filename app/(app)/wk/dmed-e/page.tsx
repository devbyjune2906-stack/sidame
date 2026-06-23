import Link from "next/link";
import { redirect } from "next/navigation";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  wilayahKerja,
  provinsi,
  kabupaten,
  wkProcess,
  processTemplate,
  stageTemplate,
  wkStageProgress,
  dmedEDetail,
  dmedEFieldDef,
} from "@/db/schema";
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

  const [rows, fieldDefs, milestoneProcs] = await Promise.all([
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
    db
      .select({
        processId: wkProcess.id,
        wkId: wilayahKerja.id,
        wkNama: wilayahKerja.namaWk,
      })
      .from(wkProcess)
      .innerJoin(processTemplate, eq(wkProcess.templateId, processTemplate.id))
      .innerJoin(wilayahKerja, eq(wkProcess.wkId, wilayahKerja.id))
      .where(eq(processTemplate.subpokja, "DMED-E"))
      .orderBy(asc(wilayahKerja.namaWk)),
  ]);

  // Ambil progress tahapan untuk DMED-E
  type StageInfo = { nama: string; status: string; urutan: number };
  let milestoneRows: { wkId: string; wkNama: string; stages: StageInfo[]; selesai: number; berjalan: number }[] = [];

  if (milestoneProcs.length > 0) {
    const processIds = milestoneProcs.map((p) => p.processId);
    const stageDetails = await db
      .select({
        processId: wkStageProgress.wkProcessId,
        nama: stageTemplate.nama,
        namaOverride: wkStageProgress.namaOverride,
        status: wkStageProgress.status,
        urutan: stageTemplate.urutan,
      })
      .from(wkStageProgress)
      .innerJoin(stageTemplate, eq(wkStageProgress.stageTemplateId, stageTemplate.id))
      .where(inArray(wkStageProgress.wkProcessId, processIds))
      .orderBy(asc(stageTemplate.urutan));

    const stagesByProcess = new Map<string, StageInfo[]>();
    for (const s of stageDetails) {
      if (!stagesByProcess.has(s.processId)) stagesByProcess.set(s.processId, []);
      stagesByProcess.get(s.processId)!.push({ nama: s.namaOverride ?? s.nama, status: s.status, urutan: s.urutan });
    }

    milestoneRows = milestoneProcs
      .map((p) => {
        const stages = stagesByProcess.get(p.processId) ?? [];
        const selesai = stages.filter((s) => s.status === "SELESAI").length;
        const berjalan = stages.filter((s) => s.status === "BERJALAN").length;
        return { wkId: p.wkId, wkNama: p.wkNama, stages, selesai, berjalan };
      })
      .filter((r) => {
        if (r.stages.length === 0) return true;
        return r.stages[r.stages.length - 1].status !== "SELESAI";
      });
  }

  const totalSelesai = milestoneRows.reduce((a, r) => a + r.selesai, 0);
  const totalBerjalan = milestoneRows.reduce((a, r) => a + r.berjalan, 0);
  const totalBelumMulai = milestoneRows.reduce((a, r) => a + (r.stages.length - r.selesai - r.berjalan), 0);

  const userCanEdit = canWrite(user.role);
  const userCanCreate = canCreateWk(user.role);

  // Hitung WK dengan sisa kontrak ≤ 10 tahun untuk summary
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

      {/* ── Milestone Progress ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink">Progress Milestone Tahapan</h2>
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-ok">
              <span className="inline-block h-2 w-2 rounded-full bg-ok" />
              Selesai: <strong>{totalSelesai}</strong>
            </span>
            <span className="flex items-center gap-1.5 text-warn">
              <span className="inline-block h-2 w-2 rounded-full bg-warn" />
              Berjalan: <strong>{totalBerjalan}</strong>
            </span>
            <span className="flex items-center gap-1.5 text-muted">
              <span className="inline-block h-2 w-2 rounded-full bg-line" />
              Belum Mulai: <strong>{totalBelumMulai}</strong>
            </span>
          </div>
        </div>
        <Card className="overflow-hidden p-0">
          {milestoneRows.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">
              Semua tahapan WK telah selesai atau belum ada data.
            </p>
          ) : (
            <div className="divide-y divide-line/60">
              {milestoneRows.map((r, i) => (
                <div key={`${r.wkId}-${i}`} className="px-4 py-4 hover:bg-sand/30">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex min-w-0 items-center gap-2">
                      <Link href={`/wk/${r.wkId}`} className="truncate font-semibold text-petroleum hover:underline">
                        {r.wkNama}
                      </Link>
                      <span className="shrink-0 rounded-full bg-danger/20 px-2 py-0.5 text-xs font-medium text-danger">
                        DMED-E
                      </span>
                    </div>
                    <div className="ml-3 shrink-0">
                      {r.berjalan > 0 ? (
                        <span className="rounded-full bg-petroleum/10 px-2 py-0.5 text-xs font-medium text-petroleum-dark">Berjalan</span>
                      ) : r.stages.length === 0 ? (
                        <span className="rounded-full bg-line/40 px-2 py-0.5 text-xs text-muted">Belum Ada Tahap</span>
                      ) : (
                        <span className="rounded-full bg-line/40 px-2 py-0.5 text-xs text-muted">Belum Mulai</span>
                      )}
                    </div>
                  </div>
                  {r.stages.length === 0 ? (
                    <p className="text-xs text-muted">Belum ada tahap terdaftar.</p>
                  ) : (
                    <MilestoneTimeline stages={r.stages} />
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}

function MilestoneTimeline({ stages }: { stages: { nama: string; status: string; urutan: number }[] }) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max items-start py-1">
        {stages.map((s, i) => {
          const isDone = s.status === "SELESAI";
          const isRunning = s.status === "BERJALAN";
          const prevDone = i > 0 && stages[i - 1].status === "SELESAI";
          return (
            <div key={i} className="flex items-start">
              {i > 0 && (
                <div className={`mt-[9px] h-0.5 w-10 shrink-0 ${prevDone ? "bg-ok" : "bg-line/40"}`} />
              )}
              <div className="flex w-[72px] flex-col items-center gap-1.5">
                <div
                  className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 ${
                    isDone
                      ? "border-ok bg-ok"
                      : isRunning
                      ? "border-petroleum bg-petroleum"
                      : "border-line bg-surface"
                  }`}
                >
                  {isDone && (
                    <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {isRunning && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>
                <span className="line-clamp-2 w-full px-1 text-center text-[10px] leading-tight text-muted">
                  {s.nama}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
