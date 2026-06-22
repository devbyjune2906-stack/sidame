import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { wilayahKerja, dmedEDetail, dmedEFieldDef } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { canWrite, isDmed, isAdmin } from "@/lib/rbac";
import { Button, Card, Input, Label } from "@/components/ui";
import { saveDmedEDetail, addDmedEFieldFromEdit } from "./action";

export default async function DmedEDetailEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canWrite(user.role) || (!isAdmin(user.role) && !isDmed(user.role))) redirect("/wk");

  const { id } = await params;

  const [wk] = await db
    .select({ id: wilayahKerja.id, namaWk: wilayahKerja.namaWk })
    .from(wilayahKerja)
    .where(eq(wilayahKerja.id, id))
    .limit(1);
  if (!wk) notFound();

  const [detail, fieldDefs] = await Promise.all([
    db.select().from(dmedEDetail).where(eq(dmedEDetail.wkId, id)).limit(1).then((r) => r[0]),
    db.select().from(dmedEFieldDef).orderBy(asc(dmedEFieldDef.urutan), asc(dmedEFieldDef.id)),
  ]);

  const currentData = (detail?.data ?? {}) as Record<string, string>;

  function fmtDate(d: Date | null | undefined) {
    if (!d) return "";
    return new Date(d).toISOString().slice(0, 10);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Data DMED-E</h1>
          <p className="mt-1 text-sm text-muted">{wk.namaWk}</p>
        </div>
        {isAdmin(user.role) && (
          <Link href="/wk/dmed-e/pengaturan" className="text-sm text-petroleum hover:underline">
            Kelola Kolom
          </Link>
        )}
      </header>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-ink">Isi Data</h2>
        <form action={saveDmedEDetail} className="space-y-4">
          <input type="hidden" name="wkId" value={id} />

          {/* Field tetap */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="statusKesdmDjm">Status KESDM/DJM</Label>
              <Input id="statusKesdmDjm" name="statusKesdmDjm" defaultValue={detail?.statusKesdmDjm ?? ""} placeholder="—" />
            </div>
            <div>
              <Label htmlFor="statusSkkMigas">Status SKK Migas</Label>
              <Input id="statusSkkMigas" name="statusSkkMigas" defaultValue={detail?.statusSkkMigas ?? ""} placeholder="—" />
            </div>
            <div>
              <Label htmlFor="statusProvBumd">Status Prov/Kab/Kota/BUMD</Label>
              <Input id="statusProvBumd" name="statusProvBumd" defaultValue={detail?.statusProvBumd ?? ""} placeholder="—" />
            </div>
            <div>
              <Label htmlFor="statusKkks">Status KKKS</Label>
              <Input id="statusKkks" name="statusKkks" defaultValue={detail?.statusKkks ?? ""} placeholder="—" />
            </div>
            <div>
              <Label htmlFor="tglEfekPi10">Tgl Efek PI 10%</Label>
              <Input id="tglEfekPi10" name="tglEfekPi10" type="date" defaultValue={fmtDate(detail?.tglEfekPi10)} />
            </div>
            <div>
              <Label htmlFor="tglPerstMesdm">Tgl Perst MESDM</Label>
              <Input id="tglPerstMesdm" name="tglPerstMesdm" type="date" defaultValue={fmtDate(detail?.tglPerstMesdm)} />
            </div>
          </div>

          {/* Field dinamis */}
          {fieldDefs.map((f) => (
            <div key={f.id}>
              <Label htmlFor={`field_${f.key}`}>{f.nama}</Label>
              <Input
                id={`field_${f.key}`}
                name={`field_${f.key}`}
                type={f.tipe === "number" ? "number" : f.tipe === "date" ? "date" : "text"}
                defaultValue={currentData[f.key] ?? ""}
                placeholder={f.tipe === "number" ? "0" : f.tipe === "date" ? "YYYY-MM-DD" : "—"}
                step={f.tipe === "number" ? "any" : undefined}
              />
            </div>
          ))}

          {fieldDefs.length === 0 && (
            <p className="text-sm text-muted">Belum ada kolom tambahan. Tambahkan di bawah.</p>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit">Simpan</Button>
            <Link href="/wk/dmed-e">
              <Button type="button" variant="outline">Batal</Button>
            </Link>
          </div>
        </form>
      </Card>

      {isAdmin(user.role) && (
        <Card>
          <h2 className="mb-4 text-base font-semibold text-ink">Tambah Kolom Baru</h2>
          <form action={addDmedEFieldFromEdit} className="space-y-3">
            <input type="hidden" name="wkId" value={id} />
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <Label htmlFor="nama">Nama Kolom</Label>
                <Input id="nama" name="nama" placeholder="mis. Dokumen Legalitas" required />
              </div>
              <div>
                <Label htmlFor="tipe">Tipe Data</Label>
                <select
                  id="tipe"
                  name="tipe"
                  className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-petroleum/40"
                >
                  <option value="text">Teks</option>
                  <option value="number">Angka</option>
                  <option value="date">Tanggal</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-muted">Kolom baru akan muncul di semua WK DMED-E setelah ditambahkan.</p>
            <Button type="submit">+ Tambah Kolom</Button>
          </form>
        </Card>
      )}
    </div>
  );
}
