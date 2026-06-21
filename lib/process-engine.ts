import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { processTemplate, wkProcess, wkStageProgress, stageTemplate } from "@/db/schema";

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

/**
 * Pastikan proses manual untuk sub-pokja tertentu sudah ada untuk WK ini.
 * Idempotent — aman dipanggil berkali-kali; tidak akan duplikat.
 * Dipakai untuk auto-handoff antar pokja (mis. DMEW-T selesai → DMEE-L).
 */
export async function ensureManualProcess(wkId: string, subpokja: string) {
  const templateId = `MANUAL_${subpokja}_${wkId.slice(0, 8)}`;

  // Buat processTemplate jika belum ada
  const [existingTpl] = await db
    .select({ id: processTemplate.id })
    .from(processTemplate)
    .where(eq(processTemplate.id, templateId))
    .limit(1);
  if (!existingTpl) {
    await db.insert(processTemplate).values({ id: templateId, nama: subpokja, subpokja });
  }

  // Buat wkProcess jika belum ada (tanpa stages — Admin Pokja akan isi via form)
  const [existingProc] = await db
    .select({ id: wkProcess.id })
    .from(wkProcess)
    .where(and(eq(wkProcess.wkId, wkId), eq(wkProcess.templateId, templateId)))
    .limit(1);
  if (!existingProc) {
    await db.insert(wkProcess).values({ wkId, templateId });
  }
}
