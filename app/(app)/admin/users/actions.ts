"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";
import { hashPassword } from "@/lib/password";

const schema = z.object({
  nama: z.string().trim().min(1, "Nama wajib diisi"),
  email: z.string().trim().toLowerCase().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  roleId: z.coerce.number().int().positive("Role wajib dipilih"),
});

type State = { error?: string; ok?: boolean } | null;

export async function createUser(_prev: State, formData: FormData): Promise<State> {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) return { error: "Hanya Admin yang dapat menambah user." };

  const parsed = schema.safeParse({
    nama: formData.get("nama"),
    email: formData.get("email"),
    password: formData.get("password"),
    roleId: formData.get("roleId"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  const data = parsed.data;

  const dup = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
  if (dup.length > 0) return { error: "Email sudah terdaftar." };

  const hash = await hashPassword(data.password);
  await db.insert(users).values({
    nama: data.nama,
    email: data.email,
    password: hash,
    roleId: data.roleId,
  });

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function deleteUser(formData: FormData) {
  const current = await getCurrentUser();
  if (!current || !isAdmin(current.role)) return;

  const id = String(formData.get("id") ?? "");
  if (!id || id === current.id) return; // jangan hapus diri sendiri

  await db.delete(users).where(eq(users.id, id));
  revalidatePath("/admin/users");
}
