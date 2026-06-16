import { redirect, notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { provinsi, kabupaten, wilayahKerja } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { allowedStatuses, canManageStatus } from "@/lib/rbac";
import { STATUS_WK_VALUES, type StatusWk } from "@/lib/constants";
import { WkForm } from "../../wk-form";
import { updateWk } from "../../actions";

function toInput(d: Date | null): string | undefined {
  if (!d) return undefined;
  return new Date(d).toISOString().slice(0, 10);
}

export default async function EditWkPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const [wk] = await db.select().from(wilayahKerja).where(eq(wilayahKerja.id, id)).limit(1);
  if (!wk) notFound();

  if (!canManageStatus(user.role, wk.statusWk as StatusWk)) {
    redirect("/wk");
  }

  const allowed = allowedStatuses(user.role);
  const selectable: StatusWk[] = allowed === "ALL" ? STATUS_WK_VALUES : allowed;

  const provinsiList = await db
    .select({ id: provinsi.id, nama: provinsi.nama })
    .from(provinsi)
    .orderBy(asc(provinsi.nama));

  const kabupatenList = await db
    .select({ id: kabupaten.id, nama: kabupaten.nama, provinsiId: kabupaten.provinsiId })
    .from(kabupaten)
    .orderBy(asc(kabupaten.nama));

  // bind id ke action update
  const action = updateWk.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="font-display text-2xl font-bold text-ink">Edit Wilayah Kerja</h1>
      <WkForm
        action={action}
        selectableStatuses={selectable}
        provinsiList={provinsiList}
        kabupatenList={kabupatenList}
        submitLabel="Simpan Perubahan"
        initial={{
          namaWk: wk.namaWk,
          lapangan: wk.lapangan,
          operatorK3s: wk.operatorK3s,
          pemegangSaham: wk.pemegangSaham,
          provinsiId: wk.provinsiId,
          kabupatenId: wk.kabupatenId,
          typeContract: wk.typeContract,
          statusWk: wk.statusWk,
          startPsc: toInput(wk.startPsc),
          endPsc: toInput(wk.endPsc),
        }}
      />
    </div>
  );
}
