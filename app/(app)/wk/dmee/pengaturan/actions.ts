"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { dmeeFieldDef } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";

function toKey(nama: string): string {
  return nama
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_");
}

export async function addDmeeField(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) return;

  const nama = String(formData.get("nama") ?? "").trim();
  const tipe = String(formData.get("tipe") ?? "text");
  const urutanRaw = formData.get("urutan");
  const urutan = urutanRaw ? parseInt(String(urutanRaw)) : 0;

  if (!nama) return;

  const key = toKey(nama);
  if (!key) return;

  // Jika key sudah ada, tambahkan suffix angka
  const existing = await db
    .select({ key: dmeeFieldDef.key })
    .from(dmeeFieldDef)
    .where(eq(dmeeFieldDef.key, key))
    .limit(1);

  const finalKey = existing.length > 0 ? `${key}_${Date.now()}` : key;

  await db.insert(dmeeFieldDef).values({ nama, key: finalKey, tipe, urutan });
  revalidatePath("/wk/dmee/pengaturan");
}

export async function deleteDmeeField(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) return;

  const id = parseInt(String(formData.get("id") ?? ""));
  if (!id) return;

  await db.delete(dmeeFieldDef).where(eq(dmeeFieldDef.id, id));
  revalidatePath("/wk/dmee/pengaturan");
}
