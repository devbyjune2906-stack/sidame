"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  processTemplate,
  stageTemplate,
  wkProcess,
  wkStageProgress,
  wilayahKerja,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { canManageStatus, canWrite, subpokjasForRole } from "@/lib/rbac";
import { type StatusWk } from "@/lib/constants";

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
