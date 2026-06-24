"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addKegiatanBaris, deleteKegiatan, deleteKegiatanBaris } from "./actions";
import { Card } from "@/components/ui";

type Baris = { id: string; data: Record<string, string>; urutan: number };

type Props = {
  id: string;
  judul: string;
  kolom: string[];
  baris: Baris[];
  canEdit: boolean;
};

export function KegiatanSection({ id, judul, kolom, baris, canEdit }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [rowData, setRowData] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleTambahBaris() {
    startTransition(async () => {
      await addKegiatanBaris(id, rowData, baris.length);
      setRowData({});
      setShowForm(false);
      router.refresh();
    });
  }

  function handleHapusBaris(barisId: string) {
    startTransition(async () => {
      await deleteKegiatanBaris(barisId);
      router.refresh();
    });
  }

  function handleHapusKegiatan() {
    if (!confirm(`Hapus kegiatan "${judul}" beserta seluruh datanya?`)) return;
    startTransition(async () => {
      await deleteKegiatan(id);
      router.refresh();
    });
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">{judul}</h2>
        {canEdit && (
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => setShowForm(true)}
              disabled={showForm}
              className="rounded-lg bg-petroleum px-3 py-1.5 text-sm font-medium text-white hover:bg-petroleum-dark disabled:opacity-50"
            >
              + Tambah Baris
            </button>
            <button
              onClick={handleHapusKegiatan}
              disabled={isPending}
              className="rounded-lg border border-danger/40 px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
            >
              Hapus Kegiatan
            </button>
          </div>
        )}
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="w-full whitespace-nowrap text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              {kolom.map((k) => (
                <th key={k} className="px-3 py-3 font-semibold">{k}</th>
              ))}
              {canEdit && (
                <th className="px-3 py-3 text-right font-semibold">Aksi</th>
              )}
            </tr>
          </thead>
          <tbody>
            {baris.length === 0 && !showForm && (
              <tr>
                <td
                  colSpan={kolom.length + (canEdit ? 1 : 0)}
                  className="px-3 py-10 text-center text-muted"
                >
                  Belum ada data. Klik &ldquo;+ Tambah Baris&rdquo; untuk menambahkan.
                </td>
              </tr>
            )}

            {baris.map((b) => (
              <tr
                key={b.id}
                className="border-b border-line/60 last:border-0 hover:bg-sand/60"
              >
                {kolom.map((k) => (
                  <td key={k} className="px-3 py-3 text-ink">
                    {b.data[k] ?? "—"}
                  </td>
                ))}
                {canEdit && (
                  <td className="px-3 py-3 text-right">
                    <button
                      onClick={() => handleHapusBaris(b.id)}
                      disabled={isPending}
                      className="text-sm font-medium text-danger hover:underline disabled:opacity-50"
                    >
                      Hapus
                    </button>
                  </td>
                )}
              </tr>
            ))}

            {/* Form inline tambah baris */}
            {showForm && (
              <tr className="border-b border-petroleum/20 bg-petroleum/5">
                {kolom.map((k) => (
                  <td key={k} className="px-2 py-2">
                    <input
                      value={rowData[k] ?? ""}
                      onChange={(e) =>
                        setRowData((prev) => ({ ...prev, [k]: e.target.value }))
                      }
                      placeholder={k}
                      className="w-full min-w-[100px] rounded border border-line px-2 py-1.5 text-sm text-ink outline-none focus:border-petroleum"
                    />
                  </td>
                ))}
                {canEdit && (
                  <td className="px-2 py-2">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={handleTambahBaris}
                        disabled={isPending}
                        className="rounded bg-petroleum px-2.5 py-1 text-xs font-medium text-white hover:bg-petroleum-dark disabled:opacity-50"
                      >
                        {isPending ? "..." : "Simpan"}
                      </button>
                      <button
                        onClick={() => {
                          setShowForm(false);
                          setRowData({});
                        }}
                        className="rounded border border-line px-2.5 py-1 text-xs text-muted hover:bg-line/40"
                      >
                        Batal
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </section>
  );
}
