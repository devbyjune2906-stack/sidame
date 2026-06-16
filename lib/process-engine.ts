import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { wkProcess, wkStageProgress, stageTemplate } from "@/db/schema";

/** Buat wk_process + baris wk_stage_progress awal (BELUM_MULAI) dari sebuah template. */
export async function createWkProcess(wkId: string, templateId: string) {
  const [process] = await db.insert(wkProcess).values({ wkId, templateId }).returning();

  const stages = await db
    .select()
    .from(stageTemplate)
    .where(eq(stageTemplate.templateId, templateId))
    .orderBy(asc(stageTemplate.urutan));

  for (const stage of stages) {
    await db.insert(wkStageProgress).values({
      wkProcessId: process.id,
      stageTemplateId: stage.id,
      status: "BELUM_MULAI",
    });
  }

  return process;
}
