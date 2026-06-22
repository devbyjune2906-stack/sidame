"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wkStageProgress, wkProcess } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { canWrite } from "@/lib/rbac";

export async function editStageValues(formData: FormData) {
  const stageProgressId = String(formData.get("stageProgressId") ?? "");
  const wkId = String(formData.get("wkId") ?? "");
  const checkboxKeys = String(formData.get("_checkboxKeys") ?? "").split(",").filter(Boolean);

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

  const values: Record<string, string> = {};
  for (const [key, val] of formData.entries()) {
    if (!key.startsWith("extra_") || typeof val !== "string") continue;
    values[key.slice(6)] = val === "on" ? "true" : val.trim();
  }
  for (const k of checkboxKeys) {
    if (!(k in values)) values[k] = "false";
  }

  await db
    .update(wkStageProgress)
    .set({ values: Object.keys(values).length > 0 ? values : null })
    .where(eq(wkStageProgress.id, stageProgressId));

  revalidatePath(`/wk/${wkId}`);
}

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
