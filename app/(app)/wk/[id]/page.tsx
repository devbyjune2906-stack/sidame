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
import { canManageStatus, canManageSubpokja, canWrite, isAdmin, isDmee, isDmew, isDmen, subpokjasForRole, visibleSubpokjas } from "@/lib/rbac";
import { STATUS_WK_LABEL, STATUS_BADGE, type StatusWk } from "@/lib/constants";
import { hitungDeadline, statusSla, type SlaUnit } from "@/lib/sla";
import { Badge, Button, Card, Input, Label } from "@/components/ui";
import { startStage, completeStage } from "./timeline-actions";
import { startNextLelangSubpokja } from "./process-actions";
import AddProcessForm from "./add-process-form";
import TidakDilanjutkanButton from "./tidak-dilanjutkan-button";
import LanjutkanKeDmeeButton from "./lanjutkan-ke-dmee-button";
import LanjutkanKeDmedButton from "./lanjutkan-ke-dmed-button";
import { EditStageNameButton, EditCatatanButton } from "./edit-stage-form";

type ExtraFieldDef = { key: string; label: string; type?: "text" | "checkbox" };

function StageValues({ vals, fields }: { vals: Record<string, string>; fields: ExtraFieldDef[] }) {
  const entries = fields
    .map((f) => ({ label: f.label, value: vals[f.key], type: f.type }))
    .filter((e) => e.value !== undefined);
  if (entries.length === 0) return null;
  return (
    <div className="grid gap-2 rounded-lg bg-line/20 p-3 text-xs sm:grid-cols-2">
      {entries.map((e) => (
        <p key={e.label}>
          <span className="text-muted">{e.label}: </span>
          <span className="font-medium text-ink">
            {e.type === "checkbox" ? (e.value === "true" ? "✓ Ya" : "✗ Tidak") : e.value}
          </span>
        </p>
      ))}
    </div>
  );
}

function CompleteStageForm({
  stageProgressId,
  extra,
  action,
  currentCatatan,
}: {
  stageProgressId: string;
  extra: ExtraFieldDef[];
  action: (formData: FormData) => Promise<void>;
  currentCatatan?: string | null;
}) {
  const checkboxKeys = extra.filter((f) => f.type === "checkbox").map((f) => f.key).join(",");
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="stageProgressId" value={stageProgressId} />
      <input type="hidden" name="_checkboxKeys" value={checkboxKeys} />
      {extra.length > 0 && (
        <div className="space-y-2">
          {extra.map((f) =>
            f.type === "checkbox" ? (
              <label key={f.key} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  name={`extra_${f.key}`}
                  className="h-4 w-4 rounded border-line accent-petroleum"
                />
                <span className="text-sm text-ink">{f.label}</span>
              </label>
            ) : (
              <div key={f.key}>
                <Label htmlFor={`extra_${f.key}_${stageProgressId}`}>{f.label}</Label>
                <Input id={`extra_${f.key}_${stageProgressId}`} name={`extra_${f.key}`} />
              </div>
            )
          )}
        </div>
      )}
      <div>
        <Label htmlFor={`catatan_${stageProgressId}`}>Catatan</Label>
        <Input id={`catatan_${stageProgressId}`} name="catatan" defaultValue={currentCatatan ?? ""} />
      </div>
      <Button type="submit">Selesaikan Tahap</Button>
    </form>
  );
}

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

  // Fetch ALL processes for this WK (all pokjas that have worked on it)
  const allProcs = await db
    .select({
      id: wkProcess.id,
      templateId: wkProcess.templateId,
      templateNama: processTemplate.nama,
      subpokja: processTemplate.subpokja,
      createdAt: wkProcess.createdAt,
    })
    .from(wkProcess)
    .innerJoin(processTemplate, eq(wkProcess.templateId, processTemplate.id))
    .where(eq(wkProcess.wkId, id))
    .orderBy(asc(wkProcess.createdAt));

  // Fetch stages for each process
  const procWithStages = await Promise.all(
    allProcs.map(async (proc) => {
      const stages = await db
        .select({
          id: wkStageProgress.id,
          status: wkStageProgress.status,
          startDate: wkStageProgress.startDate,
          completedDate: wkStageProgress.completedDate,
          catatan: wkStageProgress.catatan,
          values: wkStageProgress.values,
          namaOverride: wkStageProgress.namaOverride,
          urutan: stageTemplate.urutan,
          nama: stageTemplate.nama,
          slaValue: stageTemplate.slaValue,
          slaUnit: stageTemplate.slaUnit,
          extraFields: stageTemplate.extraFields,
        })
        .from(wkStageProgress)
        .innerJoin(stageTemplate, eq(wkStageProgress.stageTemplateId, stageTemplate.id))
        .where(eq(wkStageProgress.wkProcessId, proc.id))
        .orderBy(asc(stageTemplate.urutan));
      return { ...proc, stages };
    })
  );

  const liburRows = await db.select({ tanggal: hariLibur.tanggal }).from(hariLibur);
  const liburList = liburRows.map((r) => r.tanggal);

  // Filter proses yang terlihat berdasarkan role (setiap pokja hanya lihat proses miliknya)
  const visible = visibleSubpokjas(user.role);
  const visibleProcs = visible === "ALL"
    ? procWithStages
    : procWithStages.filter((p) => visible.includes(p.subpokja ?? ""));

  const canPushToDmee =
    canWrite(user.role) && (isAdmin(user.role) || isDmew(user.role) || isDmen(user.role));

  const showTidakDilanjutkan =
    (wk.statusWk === "SEDANG_DILELANG" || wk.statusWk === "WK_USULAN_BARU") &&
    canPushToDmee;

  const showLanjutkanKeDmee =
    (wk.statusWk === "SEDANG_DILELANG" || wk.statusWk === "WK_USULAN_BARU") &&
    canPushToDmee;

  const dmeeMDone = procWithStages.some(
    (p) => p.subpokja === "DMEE-M" && p.stages.length > 0 && p.stages.every((s) => s.status === "SELESAI")
  );
  const showLanjutkanKeDmed =
    wk.statusWk === "EKSPLORASI" &&
    canWrite(user.role) &&
    (isAdmin(user.role) || isDmee(user.role)) &&
    dmeeMDone;

  // Tombol "Mulai DMEW-T" atau "Mulai DMEN-K" — muncul saat sub-pokja awal selesai semua
  // dan belum ada proses sub-pokja berikutnya
  const canStartNext = canWrite(user.role) && (isAdmin(user.role) || isDmew(user.role) || isDmen(user.role));
  const dmewSDone = procWithStages.some(
    (p) => p.subpokja === "DMEW-S" && p.stages.length > 0 && p.stages.every((s) => s.status === "SELESAI")
  );
  const hasDmewT = procWithStages.some((p) => p.subpokja === "DMEW-T");
  const dmenNDone = procWithStages.some(
    (p) => p.subpokja === "DMEN-N" && p.stages.length > 0 && p.stages.every((s) => s.status === "SELESAI")
  );
  const hasDmenK = procWithStages.some((p) => p.subpokja === "DMEN-K");

  const showStartDmewT = canStartNext && dmewSDone && !hasDmewT;
  const showStartDmenK = canStartNext && dmenNDone && !hasDmenK;

  // Determine which sub-pokjas this user can manage & which already have a process
  const allowedSubpokjas = subpokjasForRole(user.role);
  const existingSubpokjas = new Set(allProcs.map((p) => p.subpokja ?? ""));
  const availableSubpokjas = allowedSubpokjas.filter((sp) => !existingSubpokjas.has(sp));

  // Show the add-process form only when user can write, has allowed sub-pokjas, and there are
  // still sub-pokjas without a process for this WK at its current status
  const showAddForm =
    canWrite(user.role) &&
    canManageStatus(user.role, wk.statusWk as StatusWk) &&
    availableSubpokjas.length > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{wk.namaWk}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span>
              {wk.provinsiNama ?? "—"} / {wk.kabupatenNama ?? "—"}
            </span>
            <Badge className={STATUS_BADGE[wk.statusWk as StatusWk]}>
              {STATUS_WK_LABEL[wk.statusWk as StatusWk]}
            </Badge>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {showLanjutkanKeDmee && <LanjutkanKeDmeeButton wkId={wk.id} />}
          {showLanjutkanKeDmed && <LanjutkanKeDmedButton wkId={wk.id} />}
          {showTidakDilanjutkan && <TidakDilanjutkanButton wkId={wk.id} />}
        </div>
      </header>

      {/* History: processes visible to this role */}
      {visibleProcs.length === 0 && (
        <Card>
          <p className="text-sm text-muted">Belum ada proses/tahapan untuk WK ini.</p>
        </Card>
      )}

      {visibleProcs.map((proc) => {
        const userCanManageThisProc =
          canWrite(user.role) &&
          canManageStatus(user.role, wk.statusWk as StatusWk) &&
          canManageSubpokja(user.role, proc.subpokja ?? null);

        const allDone = proc.stages.length > 0 && proc.stages.every((s) => s.status === "SELESAI");

        return (
          <section key={proc.id} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wide text-muted">{proc.subpokja}</p>
                <p className="font-display text-base font-semibold text-ink">{proc.templateNama}</p>
              </div>
              {allDone && (
                <Badge className="bg-ok/10 text-ok">Semua Tahap Selesai</Badge>
              )}
            </div>

            {proc.stages.map((s) => {
              const deadline =
                s.startDate && s.slaUnit !== "TANPA_SLA"
                  ? hitungDeadline(s.startDate, s.slaValue, s.slaUnit as SlaUnit, liburList)
                  : null;
              const sla = s.status === "SELESAI" ? "TANPA_SLA" : statusSla(deadline);
              const extra =
                (s.extraFields as { fields: { key: string; label: string; type?: "text" | "checkbox" }[] } | null)?.fields ?? [];

              return (
                <Card key={s.id} className="space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted">Tahap {s.urutan}</p>
                        {userCanManageThisProc && (
                          <EditStageNameButton
                            stageProgressId={s.id}
                            wkId={id}
                            currentNama={s.namaOverride ?? s.nama}
                          />
                        )}
                      </div>
                      <p className="font-medium text-ink">{s.namaOverride ?? s.nama}</p>
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

                  {/* Catatan: tampilkan jika ada, dan tombol edit untuk user yang bisa manage */}
                  {(s.catatan || userCanManageThisProc) && (
                    <div className="space-y-1">
                      {s.catatan && <p className="text-sm text-ink">Catatan: {s.catatan}</p>}
                      {userCanManageThisProc && (
                        <EditCatatanButton
                          stageProgressId={s.id}
                          wkId={id}
                          currentCatatan={s.catatan}
                        />
                      )}
                    </div>
                  )}

                  {userCanManageThisProc && s.status === "BELUM_MULAI" && (
                    <form action={startStage}>
                      <input type="hidden" name="stageProgressId" value={s.id} />
                      <Button type="submit" variant="outline">
                        Mulai Tahap
                      </Button>
                    </form>
                  )}

                  {/* Nilai extra fields untuk tahap yang sudah selesai */}
                  {s.status === "SELESAI" && s.values != null && extra.length > 0
                    ? <StageValues vals={s.values as Record<string, string>} fields={extra} />
                    : null}

                  {userCanManageThisProc && s.status === "BERJALAN" && (
                    <CompleteStageForm stageProgressId={s.id} extra={extra} action={completeStage} currentCatatan={s.catatan} />
                  )}
                </Card>
              );
            })}
          </section>
        );
      })}

      {/* Form tambah proses manual untuk Admin Pokja */}
      {showAddForm && (
        <AddProcessForm wkId={id} subpokjaOptions={availableSubpokjas} />
      )}

      {/* Mulai proses DMEW-T setelah DMEW-S selesai */}
      {showStartDmewT && (
        <Card className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-ink">DMEW-S selesai</p>
            <p className="text-sm text-muted">Semua tahap DMEW-S sudah diselesaikan. Lanjutkan ke DMEW-T.</p>
          </div>
          <form action={startNextLelangSubpokja}>
            <input type="hidden" name="wkId" value={id} />
            <Button type="submit">Mulai DMEW-T</Button>
          </form>
        </Card>
      )}

      {/* Mulai proses DMEN-K setelah DMEN-N selesai */}
      {showStartDmenK && (
        <Card className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-ink">DMEN-N selesai</p>
            <p className="text-sm text-muted">Semua tahap DMEN-N sudah diselesaikan. Lanjutkan ke DMEN-K.</p>
          </div>
          <form action={startNextLelangSubpokja}>
            <input type="hidden" name="wkId" value={id} />
            <Button type="submit">Mulai DMEN-K</Button>
          </form>
        </Card>
      )}
    </div>
  );
}
