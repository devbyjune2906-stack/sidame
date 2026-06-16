"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wkStageProgress, wkProcess, wilayahKerja } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { canManageStatus } from "@/lib/rbac";
import { type StatusWk } from "@/lib/constants";

async function authorizeStage(stageProgressId: string): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [row] = await db
    .select({ wkId: wkProcess.wkId, statusWk: wilayahKerja.statusWk })
    .from(wkStageProgress)
    .innerJoin(wkProcess, eq(wkStageProgress.wkProcessId, wkProcess.id))
    .innerJoin(wilayahKerja, eq(wkProcess.wkId, wilayahKerja.id))
    .where(eq(wkStageProgress.id, stageProgressId))
    .limit(1);

  if (!row) return null;
  if (!canManageStatus(user.role, row.statusWk as StatusWk)) return null;
  return row.wkId;
}

export async function startStage(formData: FormData) {
  const stageProgressId = String(formData.get("stageProgressId") ?? "");
  if (!stageProgressId) return;
  const wkId = await authorizeStage(stageProgressId);
  if (!wkId) return;

  await db
    .update(wkStageProgress)
    .set({ status: "BERJALAN", startDate: new Date() })
    .where(eq(wkStageProgress.id, stageProgressId));

  revalidatePath(`/wk/${wkId}`);
}

export async function completeStage(formData: FormData) {
  const stageProgressId = String(formData.get("stageProgressId") ?? "");
  if (!stageProgressId) return;
  const wkId = await authorizeStage(stageProgressId);
  if (!wkId) return;

  const catatan = String(formData.get("catatan") ?? "").trim() || null;

  const values: Record<string, string> = {};
  for (const [key, val] of formData.entries()) {
    if (key.startsWith("extra_") && typeof val === "string" && val.trim()) {
      values[key.slice("extra_".length)] = val.trim();
    }
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

  revalidatePath(`/wk/${wkId}`);
}
