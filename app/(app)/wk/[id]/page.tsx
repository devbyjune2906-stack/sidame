import { notFound, redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  wilayahKerja,
  provinsi,
  kabupaten,
  wkProcess,
  processTemplate,
  stageTemplate,
  wkStageProgress,
  hariLibur,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { canManageStatus, canWrite } from "@/lib/rbac";
import { STATUS_WK_LABEL, STATUS_BADGE, type StatusWk } from "@/lib/constants";
import { hitungDeadline, statusSla, type SlaUnit } from "@/lib/sla";
import { Badge, Button, Card, Input, Label } from "@/components/ui";
import { startStage, completeStage } from "./timeline-actions";

const SLA_LABEL: Record<string, string> = {
  HARI_KALENDER: "hari kalender",
  HARI_KERJA: "hari kerja",
  BULAN: "bulan",
  TANPA_SLA: "",
};

const SLA_BADGE: Record<string, string> = {
  ON_TRACK: "bg-ok/10 text-ok",
  MENDEKATI: "bg-warn/10 text-warn",
  LEWAT: "bg-danger/10 text-danger",
  TANPA_SLA: "bg-line/40 text-muted",
};

function fmtDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function WkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const [wk] = await db
    .select({
      id: wilayahKerja.id,
      namaWk: wilayahKerja.namaWk,
      statusWk: wilayahKerja.statusWk,
      provinsiNama: provinsi.nama,
      kabupatenNama: kabupaten.nama,
    })
    .from(wilayahKerja)
    .leftJoin(provinsi, eq(wilayahKerja.provinsiId, provinsi.id))
    .leftJoin(kabupaten, eq(wilayahKerja.kabupatenId, kabupaten.id))
    .where(eq(wilayahKerja.id, id))
    .limit(1);
  if (!wk) notFound();

  if (!canManageStatus(user.role, wk.statusWk as StatusWk)) redirect("/wk");

  const [proc] = await db
    .select({
      id: wkProcess.id,
      templateId: wkProcess.templateId,
      templateNama: processTemplate.nama,
      subpokja: processTemplate.subpokja,
    })
    .from(wkProcess)
    .innerJoin(processTemplate, eq(wkProcess.templateId, processTemplate.id))
    .where(eq(wkProcess.wkId, id))
    .limit(1);

  const stages = proc
    ? await db
        .select({
          id: wkStageProgress.id,
          status: wkStageProgress.status,
          startDate: wkStageProgress.startDate,
          completedDate: wkStageProgress.completedDate,
          catatan: wkStageProgress.catatan,
          values: wkStageProgress.values,
          urutan: stageTemplate.urutan,
          nama: stageTemplate.nama,
          slaValue: stageTemplate.slaValue,
          slaUnit: stageTemplate.slaUnit,
          extraFields: stageTemplate.extraFields,
        })
        .from(wkStageProgress)
        .innerJoin(stageTemplate, eq(wkStageProgress.stageTemplateId, stageTemplate.id))
        .where(eq(wkStageProgress.wkProcessId, proc.id))
        .orderBy(asc(stageTemplate.urutan))
    : [];

  const liburRows = await db.select({ tanggal: hariLibur.tanggal }).from(hariLibur);
  const liburList = liburRows.map((r) => r.tanggal);

  // Staf hanya bisa lihat -- tombol Mulai/Selesaikan hanya muncul untuk Admin dan Admin Pokja
  const canManage = canManageStatus(user.role, wk.statusWk as StatusWk) && canWrite(user.role);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold text-ink">{wk.namaWk}</h1>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
          <span>
            {wk.provinsiNama ?? "—"} / {wk.kabupatenNama ?? "—"}
          </span>
          <Badge className={STATUS_BADGE[wk.statusWk as StatusWk]}>{STATUS_WK_LABEL[wk.statusWk as StatusWk]}</Badge>
        </p>
      </header>

      {!proc && (
        <Card>
          <p className="text-sm text-muted">Belum ada proses/tahapan untuk WK ini.</p>
        </Card>
      )}

      {proc && (
        <Card className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted">{proc.subpokja}</p>
          <p className="font-display text-base font-semibold text-ink">{proc.templateNama}</p>
        </Card>
      )}

      <div className="space-y-3">
        {stages.map((s) => {
          const deadline =
            s.startDate && s.slaUnit !== "TANPA_SLA"
              ? hitungDeadline(s.startDate, s.slaValue, s.slaUnit as SlaUnit, liburList)
              : null;
          const sla = s.status === "SELESAI" ? "TANPA_SLA" : statusSla(deadline);
          const extra = (s.extraFields as { fields: { key: string; label: string }[] } | null)?.fields ?? [];

          return (
            <Card key={s.id} className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-muted">Tahap {s.urutan}</p>
                  <p className="font-medium text-ink">{s.nama}</p>
                  {s.slaUnit !== "TANPA_SLA" && (
                    <p className="text-xs text-muted">
                      SLA: {s.slaValue} {SLA_LABEL[s.slaUnit]}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={SLA_BADGE[sla]}>
                    {sla === "ON_TRACK" && "On Track"}
                    {sla === "MENDEKATI" && "Mendekati Deadline"}
                    {sla === "LEWAT" && "Lewat Deadline"}
                    {sla === "TANPA_SLA" && (s.status === "SELESAI" ? "Selesai" : "Tanpa SLA")}
                  </Badge>
                  <Badge className="bg-line/40 text-ink">
                    {s.status === "BELUM_MULAI" && "Belum Mulai"}
                    {s.status === "BERJALAN" && "Berjalan"}
                    {s.status === "SELESAI" && "Selesai"}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-3 text-xs text-muted sm:grid-cols-2">
                <p>Mulai: {fmtDate(s.startDate)}</p>
                <p>Selesai: {fmtDate(s.completedDate)}</p>
              </div>

              {s.catatan && <p className="text-sm text-ink">Catatan: {s.catatan}</p>}

              {canManage && s.status === "BELUM_MULAI" && (
                <form action={startStage}>
                  <input type="hidden" name="stageProgressId" value={s.id} />
                  <Button type="submit" variant="outline">
                    Mulai Tahap
                  </Button>
                </form>
              )}

              {canManage && s.status === "BERJALAN" && (
                <form action={completeStage} className="space-y-3">
                  <input type="hidden" name="stageProgressId" value={s.id} />
                  {extra.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-3">
                      {extra.map((f) => (
                        <div key={f.key}>
                          <Label htmlFor={`extra_${f.key}_${s.id}`}>{f.label}</Label>
                          <Input id={`extra_${f.key}_${s.id}`} name={`extra_${f.key}`} />
                        </div>
                      ))}
                    </div>
                  )}
                  <div>
                    <Label htmlFor={`catatan_${s.id}`}>Catatan</Label>
                    <Input id={`catatan_${s.id}`} name="catatan" />
                  </div>
                  <Button type="submit">Selesaikan Tahap</Button>
                </form>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
