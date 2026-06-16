"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { wilayahKerja } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { canManageStatus } from "@/lib/rbac";
import { type StatusWk } from "@/lib/constants";

const schema = z.object({
  namaWk: z.string().trim().min(1, "Nama WK wajib diisi"),
  lapangan: z.string().trim().optional(),
  operatorK3s: z.string().trim().optional(),
  pemegangSaham: z.string().trim().optional(),
  provinsiId: z.coerce.number().int().positive().optional(),
  kabupatenId: z.coerce.number().int().positive().optional(),
  typeContract: z.enum(["COST_RECOVERY", "GROSS_SPLIT"]).optional(),
  statusWk: z.enum(["SEDANG_DILELANG", "EKSPLORASI", "POD_I", "ONSTREAM"]),
  startPsc: z.string().optional(),
  endPsc: z.string().optional(),
});

type ActionState = { error?: string } | null;

function parse(formData: FormData) {
  const raw = {
    namaWk: formData.get("namaWk"),
    lapangan: formData.get("lapangan") || undefined,
    operatorK3s: formData.get("operatorK3s") || undefined,
    pemegangSaham: formData.get("pemegangSaham") || undefined,
    provinsiId: formData.get("provinsiId") || undefined,
    kabupatenId: formData.get("kabupatenId") || undefined,
    typeContract: formData.get("typeContract") || undefined,
    statusWk: formData.get("statusWk"),
    startPsc: formData.get("startPsc") || undefined,
    endPsc: formData.get("endPsc") || undefined,
  };
  return schema.safeParse(raw);
}

function toDate(v?: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export async function createWk(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  const data = parsed.data;

  if (!canManageStatus(user.role, data.statusWk as StatusWk)) {
    return { error: "Anda tidak berwenang menambah data pada status WK ini." };
  }

  await db.insert(wilayahKerja).values({
    namaWk: data.namaWk,
    lapangan: data.lapangan ?? null,
    operatorK3s: data.operatorK3s ?? null,
    pemegangSaham: data.pemegangSaham ?? null,
    provinsiId: data.provinsiId ?? null,
    kabupatenId: data.kabupatenId ?? null,
    typeContract: data.typeContract ?? null,
    statusWk: data.statusWk,
    startPsc: toDate(data.startPsc),
    endPsc: toDate(data.endPsc),
  });

  revalidatePath("/wk");
  redirect("/wk");
}

export async function updateWk(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [existing] = await db.select().from(wilayahKerja).where(eq(wilayahKerja.id, id)).limit(1);
  if (!existing) return { error: "Data tidak ditemukan." };

  // harus berwenang atas status lama
  if (!canManageStatus(user.role, existing.statusWk as StatusWk)) {
    return { error: "Anda tidak berwenang mengubah data ini." };
  }

  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  const data = parsed.data;

  // dan berwenang atas status baru
  if (!canManageStatus(user.role, data.statusWk as StatusWk)) {
    return { error: "Anda tidak berwenang memindahkan data ke status WK tersebut." };
  }

  await db
    .update(wilayahKerja)
    .set({
      namaWk: data.namaWk,
      lapangan: data.lapangan ?? null,
      operatorK3s: data.operatorK3s ?? null,
      pemegangSaham: data.pemegangSaham ?? null,
      provinsiId: data.provinsiId ?? null,
      kabupatenId: data.kabupatenId ?? null,
      typeContract: data.typeContract ?? null,
      statusWk: data.statusWk,
      startPsc: toDate(data.startPsc),
      endPsc: toDate(data.endPsc),
      updatedAt: new Date(),
    })
    .where(eq(wilayahKerja.id, id));

  revalidatePath("/wk");
  redirect("/wk");
}

export async function deleteWk(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const [existing] = await db.select().from(wilayahKerja).where(eq(wilayahKerja.id, id)).limit(1);
  if (!existing) return;

  if (!canManageStatus(user.role, existing.statusWk as StatusWk)) {
    throw new Error("Tidak berwenang menghapus data ini.");
  }

  await db.delete(wilayahKerja).where(eq(wilayahKerja.id, id));
  revalidatePath("/wk");
}
