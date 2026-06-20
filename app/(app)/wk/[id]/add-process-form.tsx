"use client";

import { useActionState, useState } from "react";
import { Button, Card, Input, Label, Select } from "@/components/ui";
import { addManualProcess } from "./process-actions";

type StageRow = {
  nama: string;
  slaValue: string;
  slaUnit: "HARI_KALENDER" | "HARI_KERJA" | "BULAN" | "TANPA_SLA";
};

const emptyStage = (): StageRow => ({ nama: "", slaValue: "", slaUnit: "TANPA_SLA" });

const SLA_UNIT_LABEL: Record<string, string> = {
  TANPA_SLA: "Tanpa SLA",
  HARI_KALENDER: "Hari Kalender",
  HARI_KERJA: "Hari Kerja",
  BULAN: "Bulan",
};

export default function AddProcessForm({
  wkId,
  subpokjaOptions,
}: {
  wkId: string;
  subpokjaOptions: string[];
}) {
  const boundAction = addManualProcess.bind(null, wkId);
  const [state, formAction, pending] = useActionState(boundAction, null);
  const [stages, setStages] = useState<StageRow[]>([emptyStage()]);
  const [subpokja, setSubpokja] = useState(subpokjaOptions[0] ?? "");

  function updateStage(idx: number, field: keyof StageRow, value: string) {
    setStages((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  }

  function addRow() {
    setStages((prev) => [...prev, emptyStage()]);
  }

  function removeRow(idx: number) {
    setStages((prev) => prev.filter((_, i) => i !== idx));
  }

  const stagesJson = JSON.stringify(
    stages.map((s) => ({
      nama: s.nama.trim(),
      slaValue: s.slaUnit !== "TANPA_SLA" && s.slaValue ? Number(s.slaValue) : null,
      slaUnit: s.slaUnit,
    }))
  );

  return (
    <Card className="space-y-4">
      <h3 className="font-display text-base font-semibold text-ink">Tambah Kegiatan Sub Pokja</h3>

      {state?.error && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>
      )}

      <form action={formAction} className="space-y-4">
        {/* Hidden serialized stages */}
        <input type="hidden" name="stages" value={stagesJson} />

        {/* Sub Pokja selector */}
        {subpokjaOptions.length > 1 ? (
          <div>
            <Label htmlFor="subpokja-select">Sub Pokja</Label>
            <Select
              id="subpokja-select"
              name="subpokja"
              value={subpokja}
              onChange={(e) => setSubpokja(e.target.value)}
            >
              {subpokjaOptions.map((sp) => (
                <option key={sp} value={sp}>
                  {sp}
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted">
              Sub Pokja: <span className="font-medium text-ink">{subpokja}</span>
            </p>
            <input type="hidden" name="subpokja" value={subpokja} />
          </>
        )}

        {/* Stage rows */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-ink">Tahapan Kegiatan</p>
          {stages.map((s, idx) => (
            <div key={idx} className="flex flex-wrap items-end gap-2 rounded-lg border border-line p-3">
              <div className="flex-1 min-w-[160px]">
                <Label htmlFor={`nama-${idx}`}>Nama Tahap</Label>
                <Input
                  id={`nama-${idx}`}
                  value={s.nama}
                  onChange={(e) => updateStage(idx, "nama", e.target.value)}
                  placeholder="cth. Verifikasi Dokumen"
                  required
                />
              </div>
              <div className="w-24">
                <Label htmlFor={`slaVal-${idx}`}>Nilai SLA</Label>
                <Input
                  id={`slaVal-${idx}`}
                  type="number"
                  min={1}
                  value={s.slaValue}
                  onChange={(e) => updateStage(idx, "slaValue", e.target.value)}
                  disabled={s.slaUnit === "TANPA_SLA"}
                  placeholder="—"
                />
              </div>
              <div className="w-36">
                <Label htmlFor={`slaUnit-${idx}`}>Satuan SLA</Label>
                <Select
                  id={`slaUnit-${idx}`}
                  value={s.slaUnit}
                  onChange={(e) =>
                    updateStage(idx, "slaUnit", e.target.value as StageRow["slaUnit"])
                  }
                >
                  {Object.entries(SLA_UNIT_LABEL).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
              {stages.length > 1 && (
                <Button
                  type="button"
                  variant="danger"
                  className="py-2 px-3"
                  onClick={() => removeRow(idx)}
                >
                  Hapus
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={addRow}>
            + Tambah Tahap
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Menyimpan..." : "Simpan Kegiatan"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
