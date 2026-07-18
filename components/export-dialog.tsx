"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export const EXPORT_COLS = [
  { key: "namaWk",        label: "Nama WK" },
  { key: "lapangan",      label: "Lapangan" },
  { key: "operatorK3s",   label: "Operator/K3S" },
  { key: "pemegangSaham", label: "Pemegang Saham" },
  { key: "provinsi",      label: "Provinsi" },
  { key: "kabupaten",     label: "Kabupaten/Kota" },
  { key: "typeContract",  label: "Type Contract" },
  { key: "jenisWk",       label: "Jenis WK" },
  { key: "statusWk",      label: "Status WK" },
  { key: "startPsc",      label: "Start PSC" },
  { key: "endPsc",        label: "End PSC" },
] as const;

type ExportType = "excel" | "pdf";

export function ExportDialog({ baseQuery }: { baseQuery: string }) {
  const [open, setOpen] = useState<ExportType | null>(null);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(EXPORT_COLS.map((c) => c.key))
  );

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function openDialog(type: ExportType) {
    setSelected(new Set(EXPORT_COLS.map((c) => c.key)));
    setOpen(type);
  }

  function download() {
    if (!open || selected.size === 0) return;
    const params = new URLSearchParams(baseQuery);
    params.set("cols", [...selected].join(","));
    window.location.href = `/api/export/${open}?${params.toString()}`;
    setOpen(null);
  }

  return (
    <>
      <Button variant="outline" onClick={() => openDialog("excel")}>Export Excel</Button>
      <Button variant="outline" onClick={() => openDialog("pdf")}>Export PDF</Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(null); }}
        >
          <div className="w-80 rounded-xl bg-white p-5 shadow-xl">
            <h2 className="mb-1 font-display text-base font-bold text-ink">
              Pilih Kolom &mdash; {open === "excel" ? "Excel" : "PDF"}
            </h2>
            <p className="mb-3 text-[11px] text-muted">
              Centang kolom yang ingin disertakan dalam ekspor.
            </p>

            <div className="space-y-2">
              {EXPORT_COLS.map((c) => (
                <label
                  key={c.key}
                  className="flex cursor-pointer items-center gap-2.5 text-sm text-ink"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(c.key)}
                    onChange={() => toggle(c.key)}
                    className="h-4 w-4 accent-[#0B5E54]"
                  />
                  {c.label}
                </label>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <div className="flex gap-3">
                <button
                  onClick={() => setSelected(new Set(EXPORT_COLS.map((c) => c.key)))}
                  className="text-[11px] text-petroleum underline hover:no-underline"
                >
                  Semua
                </button>
                <button
                  onClick={() => setSelected(new Set())}
                  className="text-[11px] text-muted underline hover:no-underline"
                >
                  Kosongkan
                </button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setOpen(null)}>Batal</Button>
                <button
                  onClick={download}
                  disabled={selected.size === 0}
                  className="rounded-lg bg-petroleum px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
