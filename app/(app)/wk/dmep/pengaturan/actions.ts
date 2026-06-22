"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { dmepFieldDef } from "@/db/schema";
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

export async function addDmepField(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) return;

  const nama = String(formData.get("nama") ?? "").trim();
  const tipe = String(formData.get("tipe") ?? "text");
  const urutanRaw = formData.get("urutan");
  const urutan = urutanRaw ? parseInt(String(urutanRaw)) : 0;

  if (!nama) return;
  const key = toKey(nama);
  if (!key) return;

  const existing = await db
    .select({ key: dmepFieldDef.key })
    .from(dmepFieldDef)
    .where(eq(dmepFieldDef.key, key))
    .limit(1);

  const finalKey = existing.length > 0 ? `${key}_${Date.now()}` : key;
  await db.insert(dmepFieldDef).values({ nama, key: finalKey, tipe, urutan });
  revalidatePath("/wk/dmep/pengaturan");
}

export async function deleteDmepField(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) return;

  const id = parseInt(String(formData.get("id") ?? ""));
  if (!id) return;

  await db.delete(dmepFieldDef).where(eq(dmepFieldDef.id, id));
  revalidatePath("/wk/dmep/pengaturan");
}
