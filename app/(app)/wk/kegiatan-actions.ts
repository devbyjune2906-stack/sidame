"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { kegiatan, kegiatanBaris } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";

async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function createKegiatan(subpokja: string, formData: FormData) {
  const user = await requireAuth();
  const judul = (formData.get("judul") as string)?.trim();
  const kolomJson = formData.get("kolom") as string;
  const kolom: string[] = JSON.parse(kolomJson);
  if (!judul || kolom.length === 0) throw new Error("Judul dan kolom wajib diisi");
  await db.insert(kegiatan).values({ subpokja, judul, kolom });
  const path = `/wk/${subpokja.toLowerCase().replace("-", "-")}`;
  revalidatePath(path);
}

export async function addKegiatanBaris(
  kegiatanId: string,
  subpokja: string,
  data: Record<string, string>,
  urutan: number,
) {
  await requireAuth();
  await db.insert(kegiatanBaris).values({ kegiatanId, data, urutan });
  const path = `/wk/${subpokja.toLowerCase()}`;
  revalidatePath(path);
}

export async function deleteKegiatan(id: string, subpokja: string) {
  await requireAuth();
  await db.delete(kegiatan).where(eq(kegiatan.id, id));
  const path = `/wk/${subpokja.toLowerCase()}`;
  revalidatePath(path);
}

export async function deleteKegiatanBaris(id: string, subpokja: string) {
  await requireAuth();
  await db.delete(kegiatanBaris).where(eq(kegiatanBaris.id, id));
  const path = `/wk/${subpokja.toLowerCase()}`;
  revalidatePath(path);
}
