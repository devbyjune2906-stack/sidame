"use server";

import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users, roles } from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/auth";

export async function login(_prev: unknown, formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Username dan password wajib diisi." };
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
    .where(sql`lower(${users.email}) = lower(${username})`)
    .limit(1);

  const user = rows[0];
  if (!user || !(await verifyPassword(password, user.password))) {
    return { error: "Username atau password salah." };
  }

  await createSession({ id: user.id, nama: user.nama, email: user.email, role: user.role });
  redirect("/dashboard");
}
