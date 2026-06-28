"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { users, roles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin, isPokjaAdmin, manageableRoleNames } from "@/lib/rbac";
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
  if (!user || !(isAdmin(user.role) || isPokjaAdmin(user.role))) {
    return { error: "Anda tidak berwenang menambah user." };
  }

  const parsed = schema.safeParse({
    nama: formData.get("nama"),
    email: formData.get("email"),
    password: formData.get("password"),
    roleId: formData.get("roleId"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  const data = parsed.data;

  const scoped = manageableRoleNames(user.role);
  if (scoped !== "ALL") {
    const [targetRole] = await db.select({ nama: roles.nama }).from(roles).where(eq(roles.id, data.roleId)).limit(1);
    if (!targetRole || !scoped.includes(targetRole.nama)) {
      return { error: "Role di luar kewenangan Anda." };
    }
  }

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
  if (!current || !(isAdmin(current.role) || isPokjaAdmin(current.role))) return;

  const id = String(formData.get("id") ?? "");
  if (!id || id === current.id) return;

  const scoped = manageableRoleNames(current.role);
  if (scoped !== "ALL") {
    const [target] = await db
      .select({ roleNama: roles.nama })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, id))
      .limit(1);
    if (!target || !scoped.includes(target.roleNama)) return;
  }

  await db.delete(users).where(eq(users.id, id));
  revalidatePath("/admin/users");
}

export async function editUser(_prev: State, formData: FormData): Promise<State> {
  const current = await getCurrentUser();
  if (!current || !(isAdmin(current.role) || isPokjaAdmin(current.role))) {
    return { error: "Tidak berwenang." };
  }

  const id = String(formData.get("id") ?? "").trim();
  const nama = String(formData.get("nama") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();
  const roleId = Number(formData.get("roleId"));

  if (!id || !nama || !email || !roleId) {
    return { error: "Nama, email, dan role wajib diisi." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Format email tidak valid." };
  }
  if (password && password.length < 8) {
    return { error: "Password minimal 8 karakter." };
  }

  const scoped = manageableRoleNames(current.role);
  if (scoped !== "ALL") {
    const [targetRole] = await db.select({ nama: roles.nama }).from(roles).where(eq(roles.id, roleId)).limit(1);
    if (!targetRole || !scoped.includes(targetRole.nama)) {
      return { error: "Role di luar kewenangan Anda." };
    }
  }

  const dup = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (dup.length > 0 && dup[0].id !== id) {
    return { error: "Email sudah digunakan user lain." };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = { nama, email, roleId };
  if (password) updateData.password = await hashPassword(password);

  await db.update(users).set(updateData).where(eq(users.id, id));
  revalidatePath("/admin/users");
  return { ok: true };
}
