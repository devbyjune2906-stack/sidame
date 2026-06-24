"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { kegiatan, kegiatanBaris } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin, isDmed } from "@/lib/rbac";

async function requireDmed() {
  const user = await getCurrentUser();
  if (!user || (!isAdmin(user.role) && !isDmed(user.role))) redirect("/login");
}

export async function createKegiatan(formData: FormData) {
  await requireDmed();
  const judul = (formData.get("judul") as string)?.trim();
  const kolomJson = formData.get("kolom") as string;
  const kolom: string[] = JSON.parse(kolomJson);
  if (!judul || kolom.length === 0) throw new Error("Judul dan kolom wajib diisi");
  await db.insert(kegiatan).values({ subpokja: "DMED-T", judul, kolom });
  revalidatePath("/wk/dmed-t");
}

export async function addKegiatanBaris(
  kegiatanId: string,
  data: Record<string, string>,
  urutan: number,
) {
  await requireDmed();
  await db.insert(kegiatanBaris).values({ kegiatanId, data, urutan });
  revalidatePath("/wk/dmed-t");
}

export async function deleteKegiatan(id: string) {
  await requireDmed();
  await db.delete(kegiatan).where(eq(kegiatan.id, id));
  revalidatePath("/wk/dmed-t");
}

export async function deleteKegiatanBaris(id: string) {
  await requireDmed();
  await db.delete(kegiatanBaris).where(eq(kegiatanBaris.id, id));
  revalidatePath("/wk/dmed-t");
}
