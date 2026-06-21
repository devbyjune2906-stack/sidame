"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, count, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import {
  processTemplate,
  stageTemplate,
  wkProcess,
  wkStageProgress,
  wilayahKerja,
  dmewLelangDetail,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { canManageStatus, canWrite, isAdmin, isDmew, isDmen, subpokjasForRole } from "@/lib/rbac";
import { type StatusWk } from "@/lib/constants";
import { createWkProcess } from "@/lib/process-engine";
import { dmewTemplateId, dmenTemplateId, type DmewJalur } from "@/lib/process-map";

type StageInput = {
  nama: string;
  slaValue?: number | null;
  slaUnit: "HARI_KALENDER" | "HARI_KERJA" | "BULAN" | "TANPA_SLA";
};

type ActionState = { error?: string } | null;

/**
 * Tambah proses manual untuk Sub Pokja (DMEE, DMED, DMEP) pada WK yang
 * sudah masuk ke antrian pokja tersebut via pipeline otomatis.
 */
export async function addManualProcess(
  wkId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!canWrite(user.role)) return { error: "Anda tidak berwenang melakukan tindakan ini." };

  const subpokja = String(formData.get("subpokja") ?? "").trim();
  const stagesJson = String(formData.get("stages") ?? "[]");

  // Validasi sub pokja ada dalam kewenangan role
  const allowed = subpokjasForRole(user.role);
  if (allowed.length > 0 && !allowed.includes(subpokja)) {
    return { error: "Sub pokja tidak valid untuk role Anda." };
  }

  let stages: StageInput[];
  try {
    stages = JSON.parse(stagesJson);
  } catch {
    return { error: "Data tahapan tidak valid." };
  }

  if (!Array.isArray(stages) || stages.length === 0) {
    return { error: "Minimal 1 tahap harus ditambahkan." };
  }
  if (stages.some((s) => !s.nama?.trim())) {
    return { error: "Nama tahap tidak boleh kosong." };
  }

  // Verifikasi WK ada dan user berwenang atas statusnya
  const [wk] = await db
    .select({ statusWk: wilayahKerja.statusWk })
    .from(wilayahKerja)
    .where(eq(wilayahKerja.id, wkId))
    .limit(1);
  if (!wk) return { error: "WK tidak ditemukan." };
  if (!canManageStatus(user.role, wk.statusWk as StatusWk)) {
    return { error: "WK ini bukan dalam kewenangan pokja Anda." };
  }

  // Pastikan proses untuk sub pokja ini belum ada
  const templateId = `MANUAL_${subpokja}_${wkId.slice(0, 8)}`;
  const existing = await db
    .select({ id: processTemplate.id })
    .from(processTemplate)
    .where(eq(processTemplate.id, templateId));
  if (existing.length > 0) {
    return { error: `Proses untuk sub pokja ${subpokja} sudah ada pada WK ini.` };
  }

  // Buat processTemplate dinamis khusus WK ini
  await db.insert(processTemplate).values({
    id: templateId,
    nama: `${subpokja}`,
    subpokja,
  });

  // Buat stage template + wk stage progress
  const [proc] = await db
    .insert(wkProcess)
    .values({ wkId, templateId })
    .returning({ id: wkProcess.id });

  for (let i = 0; i < stages.length; i++) {
    const s = stages[i];
    const [st] = await db
      .insert(stageTemplate)
      .values({
        templateId,
        urutan: i + 1,
        nama: s.nama.trim(),
        slaValue: s.slaValue ?? null,
        slaUnit: s.slaUnit ?? "TANPA_SLA",
      })
      .returning({ id: stageTemplate.id });

    await db.insert(wkStageProgress).values({
      wkProcessId: proc.id,
      stageTemplateId: st.id,
      status: "BELUM_MULAI",
    });
  }

  revalidatePath(`/wk/${wkId}`);
  return null;
}

/**
 * Mulai proses sub-pokja berikutnya dalam jalur lelang:
 * DMEW-S → DMEW-T, atau DMEN-N → DMEN-K.
 * Memperbarui dmewLelangDetail.subpokja dan membuat wkProcess baru dari template.
 */
export async function startNextLelangSubpokja(formData: FormData) {
  const wkId = String(formData.get("wkId") ?? "");
  if (!wkId) return;

  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canWrite(user.role)) return;
  if (!isAdmin(user.role) && !isDmew(user.role) && !isDmen(user.role)) return;

  // Ambil detail lelang: subpokja saat ini dan jalur
  const [detail] = await db
    .select({ subpokja: dmewLelangDetail.subpokja, jalur: dmewLelangDetail.jalur })
    .from(dmewLelangDetail)
    .where(eq(dmewLelangDetail.wkId, wkId))
    .limit(1);
  if (!detail) return;

  const currentSubpokja = detail.subpokja;
  const jalur = (detail.jalur ?? "REGULER") as DmewJalur;

  // Tentukan sub-pokja berikutnya dan template
  let nextSubpokja: string;
  let templateId: string;
  if (currentSubpokja === "DMEW-S") {
    nextSubpokja = "DMEW-T";
    templateId = dmewTemplateId("DMEW-T", jalur);
  } else if (currentSubpokja === "DMEN-N") {
    nextSubpokja = "DMEN-K";
    templateId = dmenTemplateId("DMEN-K", jalur);
  } else {
    return; // bukan sub-pokja yang bisa dipindah
  }

  // Pastikan semua tahap sub-pokja saat ini sudah selesai
  const [proc] = await db
    .select({ id: wkProcess.id })
    .from(wkProcess)
    .innerJoin(processTemplate, eq(wkProcess.templateId, processTemplate.id))
    .where(and(eq(wkProcess.wkId, wkId), eq(processTemplate.subpokja, currentSubpokja)))
    .limit(1);
  if (!proc) return;

  const [{ remaining }] = await db
    .select({ remaining: count() })
    .from(wkStageProgress)
    .where(and(eq(wkStageProgress.wkProcessId, proc.id), ne(wkStageProgress.status, "SELESAI")));
  if (remaining > 0) return;

  // Pastikan proses sub-pokja berikutnya belum ada
  const [existing] = await db
    .select({ id: wkProcess.id })
    .from(wkProcess)
    .innerJoin(processTemplate, eq(wkProcess.templateId, processTemplate.id))
    .where(and(eq(wkProcess.wkId, wkId), eq(processTemplate.subpokja, nextSubpokja)))
    .limit(1);
  if (existing) return;

  // Pindahkan subpokja di detail lelang dan buat proses baru
  await db.update(dmewLelangDetail).set({ subpokja: nextSubpokja }).where(eq(dmewLelangDetail.wkId, wkId));
  await createWkProcess(wkId, templateId);

  revalidatePath(`/wk/${wkId}`);
}
