import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { provinsi, kabupaten } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { allowedStatuses, canWrite, isDmew, isDmen } from "@/lib/rbac";
import { STATUS_WK_VALUES, type StatusWk } from "@/lib/constants";
import { WkForm } from "../wk-form";
import { createWk } from "../actions";

export default async function NewWkPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canWrite(user.role)) redirect("/wk");

  const allowed = allowedStatuses(user.role);
  const selectable: StatusWk[] = allowed === "ALL" ? STATUS_WK_VALUES : allowed;

  const userPokja = isDmew(user.role) ? "DMEW" : isDmen(user.role) ? "DMEN" : undefined;

  const provinsiList = await db
    .select({ id: provinsi.id, nama: provinsi.nama })
    .from(provinsi)
    .orderBy(asc(provinsi.nama));

  const kabupatenList = await db
    .select({ id: kabupaten.id, nama: kabupaten.nama, provinsiId: kabupaten.provinsiId })
    .from(kabupaten)
    .orderBy(asc(kabupaten.nama));

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="font-display text-2xl font-bold text-ink">Tambah Wilayah Kerja</h1>
      <WkForm
        action={createWk}
        selectableStatuses={selectable}
        provinsiList={provinsiList}
        kabupatenList={kabupatenList}
        submitLabel="Simpan"
        userPokja={userPokja}
      />
    </div>
  );
}
