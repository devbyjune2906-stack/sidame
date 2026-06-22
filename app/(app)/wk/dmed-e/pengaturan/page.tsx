import Link from "next/link";
import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { dmedEFieldDef } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/rbac";
import { Button, Card, Input, Label } from "@/components/ui";
import { addDmedEField, deleteDmedEField } from "./actions";

const TIPE_LABEL: Record<string, string> = { text: "Teks", number: "Angka", date: "Tanggal" };

export default async function DmedEPengaturanPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user.role)) redirect("/wk");

  const fields = await db
    .select()
    .from(dmedEFieldDef)
    .orderBy(asc(dmedEFieldDef.urutan), asc(dmedEFieldDef.id));

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Kelola Kolom DMED-E</h1>
          <p className="mt-1 text-sm text-muted">Kolom tambahan ini muncul di semua WK DMED-E</p>
        </div>
        <Link href="/wk/dmed-e" className="text-sm text-petroleum hover:underline">Kembali</Link>
      </header>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-ink">Tambah Kolom Baru</h2>
        <form action={addDmedEField} className="space-y-3">
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
          <div className="w-28">
            <Label htmlFor="urutan">Urutan</Label>
            <Input id="urutan" name="urutan" type="number" defaultValue="0" min="0" />
          </div>
          <Button type="submit">Tambah Kolom</Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-4 text-base font-semibold text-ink">Kolom Aktif ({fields.length})</h2>
        {fields.length === 0 ? (
          <p className="text-sm text-muted">Belum ada kolom tambahan.</p>
        ) : (
          <div className="divide-y divide-line">
            {fields.map((f) => (
              <div key={f.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium text-ink">{f.nama}</p>
                  <p className="text-xs text-muted">
                    Kunci: <code className="rounded bg-line/40 px-1">{f.key}</code>
                    {" · "}Tipe: {TIPE_LABEL[f.tipe] ?? f.tipe}
                    {" · "}Urutan: {f.urutan}
                  </p>
                </div>
                <form action={deleteDmedEField}>
                  <input type="hidden" name="id" value={f.id} />
                  <button
                    type="submit"
                    className="text-sm text-danger hover:underline"
                    onClick={(e) => {
                      if (!confirm(`Hapus kolom "${f.nama}"?`)) e.preventDefault();
                    }}
                  >
                    Hapus
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
