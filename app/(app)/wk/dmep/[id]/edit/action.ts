"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { dmepDetail, dmepFieldDef } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { canWrite, isDmep, isAdmin } from "@/lib/rbac";

function toKey(nama: string): string {
  return nama
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

export async function saveDmepDetail(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canWrite(user.role) || (!isAdmin(user.role) && !isDmep(user.role))) return;

  const wkId = String(formData.get("wkId") ?? "");
  if (!wkId) return;

  const minyakRaw = formData.get("sisaCadanganMinyak");
  const gasRaw = formData.get("sisaCadanganGas");
  const sisaCadanganMinyak = minyakRaw && String(minyakRaw).trim() !== "" ? parseFloat(String(minyakRaw)) : null;
  const sisaCadanganGas = gasRaw && String(gasRaw).trim() !== "" ? parseFloat(String(gasRaw)) : null;

  const data: Record<string, string> = {};
  for (const [key, val] of formData.entries()) {
    if (!key.startsWith("field_")) continue;
    const fieldKey = key.slice(6);
    const v = String(val).trim();
    if (v) data[fieldKey] = v;
  }

  const [existing] = await db
    .select({ id: dmepDetail.id })
    .from(dmepDetail)
    .where(eq(dmepDetail.wkId, wkId))
    .limit(1);

  const payload = {
    sisaCadanganMinyak,
    sisaCadanganGas,
    data: Object.keys(data).length > 0 ? data : null,
  };

  if (existing) {
    await db.update(dmepDetail).set(payload).where(eq(dmepDetail.wkId, wkId));
  } else {
    await db.insert(dmepDetail).values({ wkId, ...payload });
  }

  const back = String(formData.get("back") ?? "").trim();
  const redirectTo = back && /^\/wk(\/|$)/.test(back) ? back : "/wk/dmep";
  redirect(redirectTo);
}

export async function addDmepFieldFromEdit(formData: FormData) {
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
    .select({ key: dmepFieldDef.key })
    .from(dmepFieldDef)
    .where(eq(dmepFieldDef.key, key))
    .limit(1);

  const finalKey = existing.length > 0 ? `${key}_${Date.now()}` : key;
  await db.insert(dmepFieldDef).values({ nama, key: finalKey, tipe, urutan });

  redirect(`/wk/dmep/${wkId}/edit`);
}
