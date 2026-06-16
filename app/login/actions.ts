"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, roles } from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/auth";

export async function login(_prev: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  const rows = await db
    .select({
      id: users.id,
      nama: users.nama,
      email: users.email,
      password: users.password,
      role: roles.nama,
    })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(eq(users.email, email))
    .limit(1);

  const user = rows[0];
  if (!user || !(await verifyPassword(password, user.password))) {
    return { error: "Email atau password salah." };
  }

  await createSession({ id: user.id, nama: user.nama, email: user.email, role: user.role });
  redirect("/dashboard");
}
