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
  dmedPodiDetail,
  dmedPi10Detail,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin, isDmed, canCreateWk } from "@/lib/rbac";
import { STATUS_WK_LABEL, STATUS_BADGE, TYPE_CONTRACT_LABEL, JENIS_POD_LABEL, type StatusWk, type TypeContract, type JenisPod } from "@/lib/constants";
import { Badge, Card } from "@/components/ui";

function fmtDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtNum(n: number | null) {
  return n === null ? "—" : n.toLocaleString("id-ID");
}

export default async function DmedTPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user.role) && !isDmed(user.role)) redirect("/wk");

  const [podiRows, pi10Rows, milestoneProcs] = await Promise.all([
    db
      .select({
        id: wilayahKerja.id,
        namaWk: wilayahKerja.namaWk,
        lapangan: wilayahKerja.lapangan,
        operatorK3s: wilayahKerja.operatorK3s,
        pemegangSaham: wilayahKerja.pemegangSaham,
        provinsiNama: provinsi.nama,
        kabupatenNama: kabupaten.nama,
        typeContract: wilayahKerja.typeContract,
        statusWk: wilayahKerja.statusWk,
        startPsc: wilayahKerja.startPsc,
        endPsc: wilayahKerja.endPsc,
        luasWilayahSisa: dmedPodiDetail.luasWilayahSisa,
        jenisPod: dmedPodiDetail.jenisPod,
        persetujuanPodI: dmedPodiDetail.persetujuanPodI,
        revisiPodI1: dmedPodiDetail.revisiPodI1,
        revisiPodI2: dmedPodiDetail.revisiPodI2,
        perkiraanOnstream: dmedPodiDetail.perkiraanOnstream,
        fluidaProduksi: dmedPodiDetail.fluidaProduksi,
        cadanganGas: dmedPodiDetail.cadanganGas,
        cadanganMinyak: dmedPodiDetail.cadanganMinyak,
        asumsiHargaGas: dmedPodiDetail.asumsiHargaGas,
        asumsiHargaMinyak: dmedPodiDetail.asumsiHargaMinyak,
        grossRevenue: dmedPodiDetail.grossRevenue,
        costRecovery: dmedPodiDetail.costRecovery,
        goiTake: dmedPodiDetail.goiTake,
        contTake: dmedPodiDetail.contTake,
        irr: dmedPodiDetail.irr,
        npvGov: dmedPodiDetail.npvGov,
        npvKkks: dmedPodiDetail.npvKkks,
        capex: dmedPodiDetail.capex,
        opex: dmedPodiDetail.opex,
        asr: dmedPodiDetail.asr,
        sunkCost: dmedPodiDetail.sunkCost,
        statusKesdmDjm: dmedPodiDetail.statusKesdmDjm,
        statusSkkMigas: dmedPodiDetail.statusSkkMigas,
        statusKkks: dmedPodiDetail.statusKkks,
        keterangan: dmedPodiDetail.keterangan,
      })
      .from(wkProcess)
      .innerJoin(processTemplate, eq(wkProcess.templateId, processTemplate.id))
      .innerJoin(wilayahKerja, eq(wkProcess.wkId, wilayahKerja.id))
      .innerJoin(dmedPodiDetail, eq(dmedPodiDetail.wkId, wilayahKerja.id))
      .leftJoin(provinsi, eq(wilayahKerja.provinsiId, provinsi.id))
      .leftJoin(kabupaten, eq(wilayahKerja.kabupatenId, kabupaten.id))
      .where(eq(wkProcess.templateId, "DMED_PODI"))
      .orderBy(asc(wilayahKerja.namaWk)),
    db
      .select({
        id: wilayahKerja.id,
        namaWk: wilayahKerja.namaWk,
        lapangan: wilayahKerja.lapangan,
        operatorK3s: wilayahKerja.operatorK3s,
        provinsiNama: provinsi.nama,
        kabupatenNama: kabupaten.nama,
        statusWk: wilayahKerja.statusWk,
        bumdPenerima: dmedPi10Detail.bumdPenerima,
        bumdPengelola: dmedPi10Detail.bumdPengelola,
        statusKesdmDjm: dmedPi10Detail.statusKesdmDjm,
        statusSkkMigas: dmedPi10Detail.statusSkkMigas,
        statusProvBumd: dmedPi10Detail.statusProvBumd,
        statusKkks: dmedPi10Detail.statusKkks,
        tglEfekPi10: dmedPi10Detail.tglEfekPi10,
        tglPerstMesdm: dmedPi10Detail.tglPerstMesdm,
      })
      .from(wkProcess)
      .innerJoin(processTemplate, eq(wkProcess.templateId, processTemplate.id))
      .innerJoin(wilayahKerja, eq(wkProcess.wkId, wilayahKerja.id))
      .innerJoin(dmedPi10Detail, eq(dmedPi10Detail.wkId, wilayahKerja.id))
      .leftJoin(provinsi, eq(wilayahKerja.provinsiId, provinsi.id))
      .leftJoin(kabupaten, eq(wilayahKerja.kabupatenId, kabupaten.id))
      .where(eq(wkProcess.templateId, "DMED_PI10"))
      .orderBy(asc(wilayahKerja.namaWk)),
    db
      .select({
        processId: wkProcess.id,
        wkId: wilayahKerja.id,
        wkNama: wilayahKerja.namaWk,
        templateNama: processTemplate.nama,
        templateId: wkProcess.templateId,
      })
      .from(wkProcess)
      .innerJoin(processTemplate, eq(wkProcess.templateId, processTemplate.id))
      .innerJoin(wilayahKerja, eq(wkProcess.wkId, wilayahKerja.id))
      .where(inArray(wkProcess.templateId, ["DMED_PODI", "DMED_PI10"]))
      .orderBy(asc(wilayahKerja.namaWk)),
  ]);

  // Ambil progress tahapan untuk semua proses DMED-T
  type StageInfo = { nama: string; status: string; urutan: number };
  let milestoneRows: { wkId: string; wkNama: string; label: string; stages: StageInfo[]; selesai: number; berjalan: number }[] = [];

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
        return { wkId: p.wkId, wkNama: p.wkNama, label: p.templateNama, stages, selesai, berjalan };
      })
      .filter((r) => {
        if (r.stages.length === 0) return true;
        return r.stages[r.stages.length - 1].status !== "SELESAI";
      });
  }

  const totalSelesai = milestoneRows.reduce((a, r) => a + r.selesai, 0);
  const totalBerjalan = milestoneRows.reduce((a, r) => a + r.berjalan, 0);
  const totalBelumMulai = milestoneRows.reduce((a, r) => a + (r.stages.length - r.selesai - r.berjalan), 0);

  const userCanCreate = canCreateWk(user.role);

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Sub Pokja DMED-T</h1>
          <p className="mt-1 text-sm text-muted">
            {podiRows.length} data POD I &middot; {pi10Rows.length} data PI 10%
          </p>
        </div>
        {userCanCreate && (
          <Link
            href="/wk/new"
            className="rounded-lg bg-petroleum px-3 py-1.5 text-sm font-medium text-white hover:bg-petroleum/90"
          >
            + Tambah WK
          </Link>
        )}
      </header>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-ink">POD I</h2>
        <Card className="overflow-x-auto p-0">
          <table className="w-full whitespace-nowrap text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-3 py-3 font-semibold">Nama WK</th>
                <th className="px-3 py-3 font-semibold">Lapangan</th>
                <th className="px-3 py-3 font-semibold">Operator/K3S</th>
                <th className="px-3 py-3 font-semibold">Pemegang Saham</th>
                <th className="px-3 py-3 font-semibold">Provinsi</th>
                <th className="px-3 py-3 font-semibold">Kab/Kota</th>
                <th className="px-3 py-3 font-semibold">Type Contract</th>
                <th className="px-3 py-3 font-semibold">Status WK</th>
                <th className="px-3 py-3 font-semibold">Start PSC</th>
                <th className="px-3 py-3 font-semibold">End PSC</th>
                <th className="px-3 py-3 font-semibold">Luas Wilayah Sisa (Km2)</th>
                <th className="px-3 py-3 font-semibold">Jenis POD</th>
                <th className="px-3 py-3 font-semibold">Persetujuan POD I</th>
                <th className="px-3 py-3 font-semibold">Revisi POD I ke 1</th>
                <th className="px-3 py-3 font-semibold">Revisi POD I ke 2</th>
                <th className="px-3 py-3 font-semibold">Perkiraan Onstream</th>
                <th className="px-3 py-3 font-semibold">Fluida Produksi</th>
                <th className="px-3 py-3 font-semibold">Cadangan Gas</th>
                <th className="px-3 py-3 font-semibold">Cadangan Minyak</th>
                <th className="px-3 py-3 font-semibold">Asumsi Harga Gas (USD/MMBTU)</th>
                <th className="px-3 py-3 font-semibold">Asumsi Harga Minyak (USD/BBL)</th>
                <th className="px-3 py-3 font-semibold">Gross Revenue (MM USD)</th>
                <th className="px-3 py-3 font-semibold">Cost Recovery (MM USD)</th>
                <th className="px-3 py-3 font-semibold">GOI Take (MM USD)</th>
                <th className="px-3 py-3 font-semibold">Cont. Take (MM USD)</th>
                <th className="px-3 py-3 font-semibold">IRR (%)</th>
                <th className="px-3 py-3 font-semibold">NPV Gov (MM USD)</th>
                <th className="px-3 py-3 font-semibold">NPV KKKS (MM USD)</th>
                <th className="px-3 py-3 font-semibold">Capex (MM USD)</th>
                <th className="px-3 py-3 font-semibold">Opex (MM USD)</th>
                <th className="px-3 py-3 font-semibold">ASR (MM USD)</th>
                <th className="px-3 py-3 font-semibold">Sunk Cost (MM USD)</th>
                <th className="px-3 py-3 font-semibold">Status KESDM/DJM</th>
                <th className="px-3 py-3 font-semibold">Status SKK Migas</th>
                <th className="px-3 py-3 font-semibold">Status KKKS</th>
                <th className="px-3 py-3 font-semibold">Keterangan</th>
                <th className="px-3 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {podiRows.length === 0 && (
                <tr>
                  <td colSpan={35} className="px-3 py-10 text-center text-muted">
                    Belum ada data POD I.
                  </td>
                </tr>
              )}
              {podiRows.map((r) => (
                <tr key={r.id} className="border-b border-line/60 last:border-0 hover:bg-sand/60">
                  <td className="px-3 py-3 font-medium text-ink">{r.namaWk}</td>
                  <td className="px-3 py-3 text-ink">{r.lapangan ?? "—"}</td>
                  <td className="px-3 py-3 text-ink">{r.operatorK3s ?? "—"}</td>
                  <td className="px-3 py-3 text-ink">{r.pemegangSaham ?? "—"}</td>
                  <td className="px-3 py-3 text-ink">{r.provinsiNama ?? "—"}</td>
                  <td className="px-3 py-3 text-ink">{r.kabupatenNama ?? "—"}</td>
                  <td className="px-3 py-3 text-ink">
                    {r.typeContract ? TYPE_CONTRACT_LABEL[r.typeContract as TypeContract] : "—"}
                  </td>
                  <td className="px-3 py-3">
                    <Badge className={STATUS_BADGE[r.statusWk as StatusWk]}>
                      {STATUS_WK_LABEL[r.statusWk as StatusWk]}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-ink">{fmtDate(r.startPsc)}</td>
                  <td className="px-3 py-3 text-ink">{fmtDate(r.endPsc)}</td>
                  <td className="px-3 py-3 text-ink">{fmtNum(r.luasWilayahSisa)}</td>
                  <td className="px-3 py-3 text-ink">{r.jenisPod ? JENIS_POD_LABEL[r.jenisPod as JenisPod] : "—"}</td>
                  <td className="px-3 py-3 text-ink">{fmtDate(r.persetujuanPodI)}</td>
                  <td className="px-3 py-3 text-ink">{fmtDate(r.revisiPodI1)}</td>
                  <td className="px-3 py-3 text-ink">{fmtDate(r.revisiPodI2)}</td>
                  <td className="px-3 py-3 text-ink">{fmtDate(r.perkiraanOnstream)}</td>
                  <td className="px-3 py-3 text-ink">{r.fluidaProduksi ?? "—"}</td>
                  <td className="px-3 py-3 text-ink">{r.cadanganGas ?? "—"}</td>
                  <td className="px-3 py-3 text-ink">{r.cadanganMinyak ?? "—"}</td>
                  <td className="px-3 py-3 text-ink">{fmtNum(r.asumsiHargaGas)}</td>
                  <td className="px-3 py-3 text-ink">{fmtNum(r.asumsiHargaMinyak)}</td>
                  <td className="px-3 py-3 text-ink">{fmtNum(r.grossRevenue)}</td>
                  <td className="px-3 py-3 text-ink">{fmtNum(r.costRecovery)}</td>
                  <td className="px-3 py-3 text-ink">{fmtNum(r.goiTake)}</td>
                  <td className="px-3 py-3 text-ink">{fmtNum(r.contTake)}</td>
                  <td className="px-3 py-3 text-ink">{fmtNum(r.irr)}</td>
                  <td className="px-3 py-3 text-ink">{fmtNum(r.npvGov)}</td>
                  <td className="px-3 py-3 text-ink">{fmtNum(r.npvKkks)}</td>
                  <td className="px-3 py-3 text-ink">{fmtNum(r.capex)}</td>
                  <td className="px-3 py-3 text-ink">{fmtNum(r.opex)}</td>
                  <td className="px-3 py-3 text-ink">{fmtNum(r.asr)}</td>
                  <td className="px-3 py-3 text-ink">{fmtNum(r.sunkCost)}</td>
                  <td className="px-3 py-3 text-ink">{r.statusKesdmDjm ?? "—"}</td>
                  <td className="px-3 py-3 text-ink">{r.statusSkkMigas ?? "—"}</td>
                  <td className="px-3 py-3 text-ink">{r.statusKkks ?? "—"}</td>
                  <td className="px-3 py-3 text-ink">{r.keterangan ?? "—"}</td>
                  <td className="px-3 py-3 text-right">
                    <Link href={`/wk/${r.id}`} className="text-sm font-medium text-petroleum hover:underline">
                      Lihat
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-ink">PI 10%</h2>
        <Card className="overflow-x-auto p-0">
          <table className="w-full whitespace-nowrap text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-3 py-3 font-semibold">Nama WK</th>
                <th className="px-3 py-3 font-semibold">Lapangan</th>
                <th className="px-3 py-3 font-semibold">Operator/K3S</th>
                <th className="px-3 py-3 font-semibold">Provinsi</th>
                <th className="px-3 py-3 font-semibold">Kab/Kota</th>
                <th className="px-3 py-3 font-semibold">BUMD Penerima</th>
                <th className="px-3 py-3 font-semibold">BUMD Pengelola</th>
                <th className="px-3 py-3 font-semibold">Status KESDM/DJM</th>
                <th className="px-3 py-3 font-semibold">Status SKK Migas</th>
                <th className="px-3 py-3 font-semibold">Status Prov/Kab/Kota/BUMD</th>
                <th className="px-3 py-3 font-semibold">Status KKKS</th>
                <th className="px-3 py-3 font-semibold">Tgl Efek PI 10%</th>
                <th className="px-3 py-3 font-semibold">Tgl Perst MESDM</th>
                <th className="px-3 py-3 font-semibold">Status WK</th>
                <th className="px-3 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pi10Rows.length === 0 && (
                <tr>
                  <td colSpan={15} className="px-3 py-10 text-center text-muted">
                    Belum ada data PI 10%.
                  </td>
                </tr>
              )}
              {pi10Rows.map((r) => (
                <tr key={r.id} className="border-b border-line/60 last:border-0 hover:bg-sand/60">
                  <td className="px-3 py-3 font-medium text-ink">{r.namaWk}</td>
                  <td className="px-3 py-3 text-ink">{r.lapangan ?? "—"}</td>
                  <td className="px-3 py-3 text-ink">{r.operatorK3s ?? "—"}</td>
                  <td className="px-3 py-3 text-ink">{r.provinsiNama ?? "—"}</td>
                  <td className="px-3 py-3 text-ink">{r.kabupatenNama ?? "—"}</td>
                  <td className="px-3 py-3 text-ink">{r.bumdPenerima ?? "—"}</td>
                  <td className="px-3 py-3 text-ink">{r.bumdPengelola ?? "—"}</td>
                  <td className="px-3 py-3 text-ink">{r.statusKesdmDjm ?? "—"}</td>
                  <td className="px-3 py-3 text-ink">{r.statusSkkMigas ?? "—"}</td>
                  <td className="px-3 py-3 text-ink">{r.statusProvBumd ?? "—"}</td>
                  <td className="px-3 py-3 text-ink">{r.statusKkks ?? "—"}</td>
                  <td className="px-3 py-3 text-ink">{fmtDate(r.tglEfekPi10)}</td>
                  <td className="px-3 py-3 text-ink">{fmtDate(r.tglPerstMesdm)}</td>
                  <td className="px-3 py-3">
                    <Badge className={STATUS_BADGE[r.statusWk as StatusWk]}>
                      {STATUS_WK_LABEL[r.statusWk as StatusWk]}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <Link href={`/wk/${r.id}`} className="text-sm font-medium text-petroleum hover:underline">
                      Lihat
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

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
                      <span className="shrink-0 rounded-full bg-danger/10 px-2 py-0.5 text-xs font-medium text-danger">
                        {r.label}
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
