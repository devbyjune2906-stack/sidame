"use client";

import { useState } from "react";

type ColDef = { key: string; label: string; group: string };

export const EXPORT_COLS: ColDef[] = [
  // WK Umum
  { key: "namaWk",         label: "Nama WK",                     group: "Wilayah Kerja" },
  { key: "lapangan",       label: "Lapangan",                    group: "Wilayah Kerja" },
  { key: "operatorK3s",    label: "Operator/K3S",                group: "Wilayah Kerja" },
  { key: "pemegangSaham",  label: "Pemegang Saham",              group: "Wilayah Kerja" },
  { key: "provinsi",       label: "Provinsi",                    group: "Wilayah Kerja" },
  { key: "kabupaten",      label: "Kabupaten/Kota",              group: "Wilayah Kerja" },
  { key: "typeContract",   label: "Type Contract",               group: "Wilayah Kerja" },
  { key: "jenisWk",        label: "Jenis WK",                    group: "Wilayah Kerja" },
  { key: "statusWk",       label: "Status WK",                   group: "Wilayah Kerja" },
  { key: "startPsc",       label: "Start PSC",                   group: "Wilayah Kerja" },
  { key: "endPsc",         label: "End PSC",                     group: "Wilayah Kerja" },
  // POD I
  { key: "jenisPod",          label: "Jenis POD",                group: "Detail POD I" },
  { key: "luasWilayahSisa",   label: "Luas Wilayah Sisa (Km2)", group: "Detail POD I" },
  { key: "persetujuanPodI",   label: "Persetujuan POD I",        group: "Detail POD I" },
  { key: "revisiPodI1",       label: "Revisi POD I ke 1",        group: "Detail POD I" },
  { key: "revisiPodI2",       label: "Revisi POD I ke 2",        group: "Detail POD I" },
  { key: "perkiraanOnstream", label: "Perkiraan Onstream",       group: "Detail POD I" },
  { key: "fluidaProduksi",    label: "Fluida Produksi",          group: "Detail POD I" },
  { key: "cadanganGas",       label: "Cadangan Gas",             group: "Detail POD I" },
  { key: "cadanganMinyak",    label: "Cadangan Minyak",          group: "Detail POD I" },
  { key: "asumsiHargaGas",    label: "Asumsi Harga Gas (USD/MMBTU)", group: "Detail POD I" },
  { key: "asumsiHargaMinyak", label: "Asumsi Harga Minyak (USD/BBL)", group: "Detail POD I" },
  { key: "grossRevenue",      label: "Gross Revenue (MM USD)",   group: "Detail POD I" },
  { key: "costRecovery",      label: "Cost Recovery (MM USD)",   group: "Detail POD I" },
  { key: "goiTake",           label: "GOI Take (MM USD)",        group: "Detail POD I" },
  { key: "contTake",          label: "Cont. Take (MM USD)",      group: "Detail POD I" },
  { key: "irr",               label: "IRR (%)",                  group: "Detail POD I" },
  { key: "npvGov",            label: "NPV Gov (MM USD)",         group: "Detail POD I" },
  { key: "npvKkks",           label: "NPV KKKS (MM USD)",        group: "Detail POD I" },
  { key: "capex",             label: "Capex (MM USD)",           group: "Detail POD I" },
  { key: "opex",              label: "Opex (MM USD)",            group: "Detail POD I" },
  { key: "asr",               label: "ASR (MM USD)",             group: "Detail POD I" },
  { key: "sunkCost",          label: "Sunk Cost (MM USD)",       group: "Detail POD I" },
  { key: "statusKesdmDjm",    label: "Status KESDM/DJM",         group: "Detail POD I" },
  { key: "statusSkkMigas",    label: "Status SKK Migas",         group: "Detail POD I" },
  { key: "statusKkks",        label: "Status KKKS",              group: "Detail POD I" },
  { key: "keterangan",        label: "Keterangan",               group: "Detail POD I" },
];

const GROUPS = [...new Set(EXPORT_COLS.map((c) => c.group))];

type ExportType = "excel" | "pdf";

export function ExportDialog({ baseQuery }: { baseQuery: string }) {
  const [open, setOpen] = useState<ExportType | null>(null);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(EXPORT_COLS.map((c) => c.key))
  );

  function toggle(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function toggleGroup(group: string) {
    const groupKeys = EXPORT_COLS.filter((c) => c.group === group).map((c) => c.key);
    const allSelected = groupKeys.every((k) => selected.has(k));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) groupKeys.forEach((k) => next.delete(k));
      else groupKeys.forEach((k) => next.add(k));
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
      <button
        onClick={() => openDialog("excel")}
        className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-sand"
      >
        Export Excel
      </button>
      <button
        onClick={() => openDialog("pdf")}
        className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-sand"
      >
        Export PDF
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(null); }}
        >
          <div className="flex w-[520px] max-h-[85vh] flex-col rounded-xl bg-white shadow-xl">
            {/* Header */}
            <div className="border-b border-line px-5 pt-5 pb-4">
              <h2 className="font-display text-base font-bold text-ink">
                Pilih Kolom &mdash; {open === "excel" ? "Excel" : "PDF"}
              </h2>
              <p className="mt-0.5 text-[11px] text-muted">
                Centang kolom yang ingin disertakan. {selected.size} dari {EXPORT_COLS.length} kolom dipilih.
              </p>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {GROUPS.map((group) => {
                const cols = EXPORT_COLS.filter((c) => c.group === group);
                const allChecked = cols.every((c) => selected.has(c.key));
                const someChecked = cols.some((c) => selected.has(c.key));
                return (
                  <div key={group}>
                    {/* Group header */}
                    <button
                      type="button"
                      onClick={() => toggleGroup(group)}
                      className="mb-2 flex w-full items-center gap-2 text-left"
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-white transition-colors ${
                          allChecked
                            ? "border-petroleum bg-petroleum"
                            : someChecked
                            ? "border-petroleum bg-petroleum/40"
                            : "border-line bg-white"
                        }`}
                      >
                        {(allChecked || someChecked) && (
                          <svg viewBox="0 0 12 12" fill="currentColor" className="h-2.5 w-2.5">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-petroleum">
                        {group}
                      </span>
                      <span className="text-[10px] text-muted">
                        ({cols.filter((c) => selected.has(c.key)).length}/{cols.length})
                      </span>
                    </button>

                    {/* Columns in 2-col grid */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pl-6">
                      {cols.map((c) => (
                        <label key={c.key} className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                          <input
                            type="checkbox"
                            checked={selected.has(c.key)}
                            onChange={() => toggle(c.key)}
                            className="h-3.5 w-3.5 accent-[#0B5E54]"
                          />
                          <span className="text-[12px] leading-tight">{c.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-line px-5 py-3">
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
                <button
                  onClick={() => setOpen(null)}
                  className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-sand"
                >
                  Batal
                </button>
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
