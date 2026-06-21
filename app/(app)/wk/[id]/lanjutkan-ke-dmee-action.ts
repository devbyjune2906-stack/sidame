"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wilayahKerja } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { canWrite, isAdmin, isDmew, isDmen } from "@/lib/rbac";
import { ensureManualProcess } from "@/lib/process-engine";

export async function lanjutkanKeDmee(formData: FormData) {
  const wkId = String(formData.get("wkId") ?? "");
  if (!wkId) return;

  const user = await getCurrentUser();
  if (!user || !canWrite(user.role)) return;
  if (!isAdmin(user.role) && !isDmew(user.role) && !isDmen(user.role)) return;

  const [wk] = await db
    .select({ statusWk: wilayahKerja.statusWk })
    .from(wilayahKerja)
    .where(eq(wilayahKerja.id, wkId))
    .limit(1);

  if (!wk || !["SEDANG_DILELANG", "WK_USULAN_BARU"].includes(wk.statusWk)) return;

  await db
    .update(wilayahKerja)
    .set({ statusWk: "EKSPLORASI", updatedAt: new Date() })
    .where(eq(wilayahKerja.id, wkId));

  await ensureManualProcess(wkId, "DMEE-L");

  redirect("/wk");
}
