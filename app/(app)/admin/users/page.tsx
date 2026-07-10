import { redirect } from "next/navigation";
import { asc, eq, inArray, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { users, roles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin, isPokjaAdmin, isDmee, manageableRoleNames } from "@/lib/rbac";
import { UserForm } from "./user-form";
import { UserTable } from "./user-table";

export default async function UsersPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");

  const canManage = isAdmin(current.role) || isPokjaAdmin(current.role);
  const readOnly  = !canManage && isDmee(current.role);
  if (!canManage && !readOnly) redirect("/dashboard");

  const scoped = manageableRoleNames(current.role);
  // DMEE staf hanya lihat user DMEE (scoped by DMEE roles)
  const dmeeRoles = ["Pokja DMEE", "Pokja DMEE - Admin"];
  const roleFilter: SQL | undefined =
    readOnly
      ? inArray(roles.nama, dmeeRoles)
      : scoped === "ALL"
      ? undefined
      : inArray(roles.nama, scoped);

  const roleList = await db
    .select({ id: roles.id, nama: roles.nama })
    .from(roles)
    .where(roleFilter)
    .orderBy(asc(roles.id));

  const userList = await db
    .select({ id: users.id, nama: users.nama, email: users.email, role: roles.nama })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(roleFilter)
    .orderBy(asc(users.nama));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-ink">Manajemen User</h1>
        <p className="mt-1 text-sm text-muted">
          {readOnly ? "Daftar akun Pokja DMEE (hanya lihat)." : "Kelola akun dan kewenangan Pokja."}
        </p>
      </header>

      {!readOnly && <UserForm roleList={roleList} />}

      <UserTable
        userList={userList}
        currentUserId={current.id}
        roleList={roleList}
        canEdit={!readOnly}
      />
    </div>
  );
}
