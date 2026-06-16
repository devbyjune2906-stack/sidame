import { redirect } from "next/navigation";
import { asc, eq, inArray, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { users, roles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin, isPokjaAdmin, manageableRoleNames } from "@/lib/rbac";
import { Card } from "@/components/ui";
import { UserForm } from "./user-form";
import { deleteUser } from "./actions";

export default async function UsersPage() {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (!isAdmin(current.role) && !isPokjaAdmin(current.role)) redirect("/dashboard");

  const scoped = manageableRoleNames(current.role);
  const roleFilter: SQL | undefined = scoped === "ALL" ? undefined : inArray(roles.nama, scoped);

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
        <p className="mt-1 text-sm text-muted">Kelola akun dan kewenangan Pokja.</p>
      </header>

      <UserForm roleList={roleList} />

      <Card className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-semibold">Nama</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {userList.map((u) => (
              <tr key={u.id} className="border-b border-line/60 last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{u.nama}</td>
                <td className="px-4 py-3 text-ink">{u.email}</td>
                <td className="px-4 py-3 text-ink">{u.role}</td>
                <td className="px-4 py-3 text-right">
                  {u.id === current.id ? (
                    <span className="text-xs text-muted">Akun Anda</span>
                  ) : (
                    <form action={deleteUser} className="inline">
                      <input type="hidden" name="id" value={u.id} />
                      <button type="submit" className="text-sm font-medium text-danger hover:underline">
                        Hapus
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
