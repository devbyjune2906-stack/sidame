"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, count, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { wkStageProgress, wkProcess, wilayahKerja, processTemplate } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { canManageStatus, canWrite } from "@/lib/rbac";
import { NEXT_STATUS_WK, NON_TRANSITION_SUBPOKJAS, type StatusWk } from "@/lib/constants";

type AuthResult = {
  wkId: string;
  wkProcessId: string;
  statusWk: string;
  subpokja: string | null;
} | null;

async function authorizeStage(stageProgressId: string): Promise<AuthResult> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [row] = await db
    .select({
      wkId: wkProcess.wkId,
      wkProcessId: wkProcess.id,
      statusWk: wilayahKerja.statusWk,
      subpokja: processTemplate.subpokja,
    })
    .from(wkStageProgress)
    .innerJoin(wkProcess, eq(wkStageProgress.wkProcessId, wkProcess.id))
    .innerJoin(wilayahKerja, eq(wkProcess.wkId, wilayahKerja.id))
    .innerJoin(processTemplate, eq(wkProcess.templateId, processTemplate.id))
    .where(eq(wkStageProgress.id, stageProgressId))
    .limit(1);

  if (!row) return null;
  if (!canWrite(user.role)) return null;
  if (!canManageStatus(user.role, row.statusWk as StatusWk)) return null;
  return { wkId: row.wkId, wkProcessId: row.wkProcessId, statusWk: row.statusWk, subpokja: row.subpokja };
}

export async function startStage(formData: FormData) {
  const stageProgressId = String(formData.get("stageProgressId") ?? "");
  if (!stageProgressId) return;
  const auth = await authorizeStage(stageProgressId);
  if (!auth) return;

  await db
    .update(wkStageProgress)
    .set({ status: "BERJALAN", startDate: new Date() })
    .where(eq(wkStageProgress.id, stageProgressId));

  revalidatePath(`/wk/${auth.wkId}`);
}

export async function completeStage(formData: FormData) {
  const stageProgressId = String(formData.get("stageProgressId") ?? "");
  if (!stageProgressId) return;
  const auth = await authorizeStage(stageProgressId);
  if (!auth) return;

  const { wkId, wkProcessId, statusWk, subpokja } = auth;
  const catatan = String(formData.get("catatan") ?? "").trim() || null;

  // Kumpulkan extra fields: checkbox → "true"/"false", text → nilai isian
  const values: Record<string, string> = {};
  for (const [key, val] of formData.entries()) {
    if (!key.startsWith("extra_") || typeof val !== "string") continue;
    const fieldKey = key.slice("extra_".length);
    // Checkbox yang dicentang mengirim "on"; yang tidak dicentang tidak muncul di formData
    values[fieldKey] = val === "on" ? "true" : val.trim();
  }
  // Checkbox yang tidak dicentang tidak muncul di formData — simpan sebagai "false"
  const checkboxKeys = String(formData.get("_checkboxKeys") ?? "")
    .split(",")
    .filter(Boolean);
  for (const k of checkboxKeys) {
    if (!(k in values)) values[k] = "false";
  }

  await db
    .update(wkStageProgress)
    .set({
      status: "SELESAI",
      completedDate: new Date(),
      catatan,
      values: Object.keys(values).length > 0 ? values : null,
    })
    .where(eq(wkStageProgress.id, stageProgressId));

  // Cek apakah semua tahap di proses ini sudah selesai
  const [{ remaining }] = await db
    .select({ remaining: count() })
    .from(wkStageProgress)
    .where(
      and(
        eq(wkStageProgress.wkProcessId, wkProcessId),
        ne(wkStageProgress.status, "SELESAI")
      )
    );

  // Auto-transition: DMEW-S dan DMEN-N menyerahkan ke sub-pokja berikutnya
  // dalam pokja yang sama -- statusWk tidak berubah
  if (remaining === 0 && (!subpokja || !NON_TRANSITION_SUBPOKJAS.has(subpokja))) {
    const nextStatus = NEXT_STATUS_WK[statusWk as StatusWk];
    if (nextStatus) {
      await db
        .update(wilayahKerja)
        .set({ statusWk: nextStatus, updatedAt: new Date() })
        .where(eq(wilayahKerja.id, wkId));
    }
  }

  revalidatePath(`/wk/${wkId}`);
}
