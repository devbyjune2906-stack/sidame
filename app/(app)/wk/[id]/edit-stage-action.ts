"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wkStageProgress, wkProcess } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { canWrite } from "@/lib/rbac";

export async function editStageCatatan(formData: FormData) {
  const stageProgressId = String(formData.get("stageProgressId") ?? "");
  const catatan = String(formData.get("catatan") ?? "").trim();
  const wkId = String(formData.get("wkId") ?? "");
  if (!stageProgressId || !wkId) return;

  const user = await getCurrentUser();
  if (!user || !canWrite(user.role)) return;

  const [sp] = await db
    .select({ id: wkStageProgress.id })
    .from(wkStageProgress)
    .innerJoin(wkProcess, eq(wkStageProgress.wkProcessId, wkProcess.id))
    .where(eq(wkStageProgress.id, stageProgressId))
    .limit(1);

  if (!sp) return;

  await db
    .update(wkStageProgress)
    .set({ catatan: catatan || null })
    .where(eq(wkStageProgress.id, stageProgressId));

  revalidatePath(`/wk/${wkId}`);
}

export async function editStageName(formData: FormData) {
  const stageProgressId = String(formData.get("stageProgressId") ?? "");
  const namaOverride = String(formData.get("namaOverride") ?? "").trim();
  const wkId = String(formData.get("wkId") ?? "");
  if (!stageProgressId || !wkId) return;

  const user = await getCurrentUser();
  if (!user || !canWrite(user.role)) return;

  // Verifikasi stage progress ini milik WK yang benar
  const [sp] = await db
    .select({ id: wkStageProgress.id })
    .from(wkStageProgress)
    .innerJoin(wkProcess, eq(wkStageProgress.wkProcessId, wkProcess.id))
    .where(eq(wkStageProgress.id, stageProgressId))
    .limit(1);

  if (!sp) return;

  await db
    .update(wkStageProgress)
    .set({ namaOverride: namaOverride || null })
    .where(eq(wkStageProgress.id, stageProgressId));

  revalidatePath(`/wk/${wkId}`);
}
