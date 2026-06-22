"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { dmedEDetail, dmedEFieldDef } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { canWrite, isDmed, isAdmin } from "@/lib/rbac";

function toKey(nama: string): string {
  return nama
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

export async function saveDmedEDetail(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canWrite(user.role) || (!isAdmin(user.role) && !isDmed(user.role))) return;

  const wkId = String(formData.get("wkId") ?? "");
  if (!wkId) return;

  const statusKesdmDjm = String(formData.get("statusKesdmDjm") ?? "").trim() || null;
  const statusSkkMigas = String(formData.get("statusSkkMigas") ?? "").trim() || null;
  const statusProvBumd = String(formData.get("statusProvBumd") ?? "").trim() || null;
  const statusKkks = String(formData.get("statusKkks") ?? "").trim() || null;
  const tglEfekRaw = formData.get("tglEfekPi10");
  const tglPerstRaw = formData.get("tglPerstMesdm");
  const tglEfekPi10 = tglEfekRaw && String(tglEfekRaw).trim() ? new Date(String(tglEfekRaw)) : null;
  const tglPerstMesdm = tglPerstRaw && String(tglPerstRaw).trim() ? new Date(String(tglPerstRaw)) : null;

  const data: Record<string, string> = {};
  for (const [key, val] of formData.entries()) {
    if (!key.startsWith("field_")) continue;
    const fieldKey = key.slice(6);
    const v = String(val).trim();
    if (v) data[fieldKey] = v;
  }

  const [existing] = await db
    .select({ id: dmedEDetail.id })
    .from(dmedEDetail)
    .where(eq(dmedEDetail.wkId, wkId))
    .limit(1);

  const payload = {
    statusKesdmDjm, statusSkkMigas, statusProvBumd, statusKkks,
    tglEfekPi10, tglPerstMesdm,
    data: Object.keys(data).length > 0 ? data : null,
  };

  if (existing) {
    await db.update(dmedEDetail).set(payload).where(eq(dmedEDetail.wkId, wkId));
  } else {
    await db.insert(dmedEDetail).values({ wkId, ...payload });
  }

  redirect("/wk/dmed-e");
}

export async function addDmedEFieldFromEdit(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) return;

  const wkId = String(formData.get("wkId") ?? "");
  const nama = String(formData.get("nama") ?? "").trim();
  const tipe = String(formData.get("tipe") ?? "text");
  const urutanRaw = formData.get("urutan");
  const urutan = urutanRaw ? parseInt(String(urutanRaw)) : 0;

  if (!nama || !wkId) return;
  const key = toKey(nama);
  if (!key) return;

  const existing = await db
    .select({ key: dmedEFieldDef.key })
    .from(dmedEFieldDef)
    .where(eq(dmedEFieldDef.key, key))
    .limit(1);

  const finalKey = existing.length > 0 ? `${key}_${Date.now()}` : key;
  await db.insert(dmedEFieldDef).values({ nama, key: finalKey, tipe, urutan });

  redirect(`/wk/dmed-e/${wkId}/edit`);
}
