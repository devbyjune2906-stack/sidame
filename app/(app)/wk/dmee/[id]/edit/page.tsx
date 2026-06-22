import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { wilayahKerja, dmeeDetail, dmeeFieldDef } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { canWrite, isDmee, isAdmin } from "@/lib/rbac";
import { Button, Card, Input, Label } from "@/components/ui";
import { saveDmeeDetail } from "./action";

export default async function DmeeDetailEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canWrite(user.role) || (!isAdmin(user.role) && !isDmee(user.role))) redirect("/wk");

  const { id } = await params;

  const [wk] = await db
    .select({ id: wilayahKerja.id, namaWk: wilayahKerja.namaWk })
    .from(wilayahKerja)
    .where(eq(wilayahKerja.id, id))
    .limit(1);
  if (!wk) notFound();

  const [detail] = await db
    .select()
    .from(dmeeDetail)
    .where(eq(dmeeDetail.wkId, id))
    .limit(1);

  const fieldDefs = await db
    .select()
    .from(dmeeFieldDef)
    .orderBy(asc(dmeeFieldDef.urutan), asc(dmeeFieldDef.id));

  const currentData = (detail?.data ?? {}) as Record<string, string>;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Data DMEE</h1>
          <p className="mt-1 text-sm text-muted">{wk.namaWk}</p>
        </div>
        {isAdmin(user.role) && (
          <Link
            href="/wk/dmee/pengaturan"
            className="text-sm text-petroleum hover:underline"
          >
            Kelola Kolom
          </Link>
        )}
      </header>

      <Card>
        <form action={saveDmeeDetail} className="space-y-4">
          <input type="hidden" name="wkId" value={id} />

          {/* Field tetap */}
          <div>
            <Label htmlFor="luasWilayahSisa">Luas Wilayah Sisa (km²)</Label>
            <Input
              id="luasWilayahSisa"
              name="luasWilayahSisa"
              type="number"
              step="0.01"
              defaultValue={detail?.luasWilayahSisa ?? ""}
              placeholder="0.00"
            />
          </div>

          {/* Field dinamis dari dmeeFieldDef */}
          {fieldDefs.map((f) => (
            <div key={f.id}>
              <Label htmlFor={`field_${f.key}`}>{f.nama}</Label>
              <Input
                id={`field_${f.key}`}
                name={`field_${f.key}`}
                type={f.tipe === "number" ? "number" : f.tipe === "date" ? "date" : "text"}
                defaultValue={currentData[f.key] ?? ""}
                step={f.tipe === "number" ? "any" : undefined}
              />
            </div>
          ))}

          {fieldDefs.length === 0 && (
            <p className="text-sm text-muted">
              Belum ada kolom tambahan.{" "}
              {isAdmin(user.role) && (
                <Link href="/wk/dmee/pengaturan" className="text-petroleum hover:underline">
                  Tambah kolom
                </Link>
              )}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit">Simpan</Button>
            <Link href="/wk/dmee-l">
              <Button type="button" variant="outline">
                Batal
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
