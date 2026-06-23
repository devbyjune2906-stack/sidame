import Link from "next/link";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  wilayahKerja,
  provinsi,
  kabupaten,
  wkProcess,
  processTemplate,
  dmedEDetail,
  dmedEFieldDef,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { canWrite, isAdmin, isDmed, canCreateWk } from "@/lib/rbac";
import { STATUS_WK_LABEL, STATUS_BADGE, type StatusWk } from "@/lib/constants";
import { Badge } from "@/components/ui";

export default async function DmedEPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user.role) && !isDmed(user.role)) redirect("/wk");

  const [rows, fieldDefs] = await Promise.all([
    db
      .select({
        id: wilayahKerja.id,
        namaWk: wilayahKerja.namaWk,
        provinsiNama: provinsi.nama,
        kabupatenNama: kabupaten.nama,
        statusWk: wilayahKerja.statusWk,
        statusKesdmDjm: dmedEDetail.statusKesdmDjm,
        statusSkkMigas: dmedEDetail.statusSkkMigas,
        statusProvBumd: dmedEDetail.statusProvBumd,
        statusKkks: dmedEDetail.statusKkks,
        data: dmedEDetail.data,
      })
      .from(wkProcess)
      .innerJoin(processTemplate, eq(wkProcess.templateId, processTemplate.id))
      .innerJoin(wilayahKerja, eq(wkProcess.wkId, wilayahKerja.id))
      .leftJoin(provinsi, eq(wilayahKerja.provinsiId, provinsi.id))
      .leftJoin(kabupaten, eq(wilayahKerja.kabupatenId, kabupaten.id))
      .leftJoin(dmedEDetail, eq(dmedEDetail.wkId, wilayahKerja.id))
      .where(eq(processTemplate.subpokja, "DMED-E"))
      .orderBy(asc(wilayahKerja.namaWk)),
    db
      .select()
      .from(dmedEFieldDef)
      .orderBy(asc(dmedEFieldDef.urutan), asc(dmedEFieldDef.id)),
  ]);

  const userCanEdit = canWrite(user.role);
  const userCanCreate = canCreateWk(user.role);

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Sub Pokja DMED-E</h1>
          <p className="mt-1 text-sm text-muted">{rows.length} data ditemukan</p>
        </div>
        <div className="flex gap-2">
          {userCanCreate && (
            <Link
              href="/wk/new"
              className="rounded-lg bg-petroleum px-3 py-1.5 text-sm font-medium text-white hover:bg-petroleum/90"
            >
              + Tambah WK
            </Link>
          )}
          {isAdmin(user.role) && (
            <Link
              href="/wk/dmed-e/pengaturan"
              className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-petroleum hover:bg-sand"
            >
              Kelola Kolom
            </Link>
          )}
        </div>
      </header>

      <div className="overflow-x-auto rounded-xl border border-line bg-surface shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-semibold">Nama WK</th>
              <th className="px-4 py-3 font-semibold">Provinsi</th>
              <th className="px-4 py-3 font-semibold">Kabupaten/Kota</th>
              <th className="px-4 py-3 font-semibold">Status KESDM/DJM</th>
              <th className="px-4 py-3 font-semibold">Status SKK Migas</th>
              <th className="px-4 py-3 font-semibold">Status Prov/BUMD</th>
              <th className="px-4 py-3 font-semibold">Status KKKS</th>
              {fieldDefs.map((f) => (
                <th key={f.id} className="px-4 py-3 font-semibold">{f.nama}</th>
              ))}
              <th className="px-4 py-3 font-semibold">Status WK</th>
              <th className="px-4 py-3 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={9 + fieldDefs.length} className="px-4 py-10 text-center text-muted">
                  Belum ada data DMED-E.
                </td>
              </tr>
            )}
            {rows.map((r) => {
              const dynData = (r.data ?? {}) as Record<string, string>;
              return (
                <tr key={r.id} className="border-b border-line/60 last:border-0 hover:bg-sand/60">
                  <td className="px-4 py-3 font-medium text-ink">{r.namaWk}</td>
                  <td className="px-4 py-3 text-ink">{r.provinsiNama ?? "—"}</td>
                  <td className="px-4 py-3 text-ink">{r.kabupatenNama ?? "—"}</td>
                  <td className="px-4 py-3 text-ink">{r.statusKesdmDjm ?? "—"}</td>
                  <td className="px-4 py-3 text-ink">{r.statusSkkMigas ?? "—"}</td>
                  <td className="px-4 py-3 text-ink">{r.statusProvBumd ?? "—"}</td>
                  <td className="px-4 py-3 text-ink">{r.statusKkks ?? "—"}</td>
                  {fieldDefs.map((f) => (
                    <td key={f.id} className="px-4 py-3 text-ink">
                      {dynData[f.key] || "—"}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <Badge className={STATUS_BADGE[r.statusWk as StatusWk]}>
                      {STATUS_WK_LABEL[r.statusWk as StatusWk]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {userCanEdit && (
                        <Link
                          href={`/wk/dmed-e/${r.id}/edit`}
                          className="text-sm font-medium text-petroleum hover:underline"
                        >
                          Edit
                        </Link>
                      )}
                      <Link
                        href={`/wk/${r.id}`}
                        className="text-sm font-medium text-petroleum hover:underline"
                      >
                        Lihat
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
