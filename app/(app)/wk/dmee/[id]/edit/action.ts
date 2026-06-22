"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { dmeeDetail } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { canWrite, isDmee, isAdmin } from "@/lib/rbac";

export async function saveDmeeDetail(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canWrite(user.role) || (!isAdmin(user.role) && !isDmee(user.role))) return;

  const wkId = String(formData.get("wkId") ?? "");
  if (!wkId) return;

  const luasRaw = formData.get("luasWilayahSisa");
  const luasWilayahSisa = luasRaw && String(luasRaw).trim() !== ""
    ? parseFloat(String(luasRaw))
    : null;

  // Kumpulkan semua field dinamis (prefik "field_")
  const data: Record<string, string> = {};
  for (const [key, val] of formData.entries()) {
    if (!key.startsWith("field_")) continue;
    const fieldKey = key.slice(6);
    const v = String(val).trim();
    if (v) data[fieldKey] = v;
  }

  const [existing] = await db
    .select({ id: dmeeDetail.id })
    .from(dmeeDetail)
    .where(eq(dmeeDetail.wkId, wkId))
    .limit(1);

  if (existing) {
    await db
      .update(dmeeDetail)
      .set({ luasWilayahSisa, data: Object.keys(data).length > 0 ? data : null })
      .where(eq(dmeeDetail.wkId, wkId));
  } else {
    await db.insert(dmeeDetail).values({
      wkId,
      luasWilayahSisa,
      data: Object.keys(data).length > 0 ? data : null,
    });
  }

  redirect("/wk/dmee-l");
}
