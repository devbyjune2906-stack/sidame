"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createKegiatan } from "@/app/(app)/wk/kegiatan-actions";

export function TambahKegiatanButton({ subpokja }: { subpokja: string }) {
  const [open, setOpen] = useState(false);
  const [judul, setJudul] = useState("");
  const [kolom, setKolom] = useState<string[]>([]);
  const [inputKolom, setInputKolom] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function tambahKolom() {
    const k = inputKolom.trim();
    if (k && !kolom.includes(k)) {
      setKolom((prev) => [...prev, k]);
      setInputKolom("");
    }
  }

  function hapusKolom(k: string) {
    setKolom((prev) => prev.filter((c) => c !== k));
  }

  function handleSubmit() {
    if (!judul.trim() || kolom.length === 0) return;
    const fd = new FormData();
    fd.set("judul", judul.trim());
    fd.set("kolom", JSON.stringify(kolom));
    startTransition(async () => {
      await createKegiatan(subpokja, fd);
      setOpen(false);
      setJudul("");
      setKolom([]);
      router.refresh();
    });
  }

  function handleClose() {
    setOpen(false);
    setJudul("");
    setKolom([]);
    setInputKolom("");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-petroleum px-3 py-1.5 text-sm font-medium text-petroleum hover:bg-petroleum/10"
      >
        + Tambah Kegiatan
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-line bg-surface p-6 shadow-2xl">
            <h2 className="mb-5 font-display text-lg font-bold text-ink">
              Tambah Kegiatan — {subpokja}
            </h2>

            {/* Judul */}
            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-medium text-ink">
                Judul Kegiatan
              </label>
              <input
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                placeholder="Contoh: Rekapitulasi Evaluasi WK, Data Persetujuan..."
                className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink outline-none placeholder:text-muted focus:border-petroleum focus:ring-2 focus:ring-petroleum/20"
              />
            </div>

            {/* Kolom dinamis */}
            <div className="mb-5">
              <label className="mb-1.5 block text-sm font-medium text-ink">
                Kolom Tabel
                <span className="ml-1 text-xs font-normal text-muted">
                  (tekan Enter atau klik Tambah)
                </span>
              </label>

              {kolom.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {kolom.map((k, i) => (
                    <span
                      key={k}
                      className="flex items-center gap-1.5 rounded-full bg-petroleum/10 px-3 py-1 text-xs font-medium text-petroleum"
                    >
                      <span className="text-muted">{i + 1}.</span> {k}
                      <button
                        type="button"
                        onClick={() => hapusKolom(k)}
                        className="ml-0.5 text-petroleum/50 transition hover:text-danger"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  value={inputKolom}
                  onChange={(e) => setInputKolom(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      tambahKolom();
                    }
                  }}
                  placeholder="Nama kolom baru, mis. Nama WK, Status, Keterangan..."
                  className="flex-1 rounded-lg border border-line px-3 py-2 text-sm text-ink outline-none placeholder:text-muted focus:border-petroleum focus:ring-2 focus:ring-petroleum/20"
                />
                <button
                  type="button"
                  onClick={tambahKolom}
                  className="rounded-lg border border-petroleum px-3 py-2 text-sm font-medium text-petroleum hover:bg-petroleum/10"
                >
                  + Tambah
                </button>
              </div>
              {kolom.length === 0 && (
                <p className="mt-1.5 text-xs text-muted">Minimal 1 kolom harus ditambahkan.</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-line/40"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending || !judul.trim() || kolom.length === 0}
                className="rounded-lg bg-petroleum px-4 py-2 text-sm font-medium text-white hover:bg-petroleum-dark disabled:opacity-50"
              >
                {isPending ? "Menyimpan..." : "Simpan Kegiatan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
