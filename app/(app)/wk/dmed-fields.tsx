"use client";

import { useState } from "react";
import { Badge, Input, Label, Select, Textarea } from "@/components/ui";
import { JENIS_POD_VALUES, JENIS_POD_LABEL } from "@/lib/constants";

export type PodiInitial = {
  jenisPod?: string | null;
  luasWilayahSisa?: number | null;
  persetujuanPodI?: string | null;
  revisiPodI1?: string | null;
  revisiPodI2?: string | null;
  perkiraanOnstream?: string | null;
  fluidaProduksi?: string | null;
  cadanganGas?: string | null;
  cadanganMinyak?: string | null;
  asumsiHargaGas?: number | null;
  asumsiHargaMinyak?: number | null;
  grossRevenue?: number | null;
  costRecovery?: number | null;
  goiTake?: number | null;
  contTake?: number | null;
  irr?: number | null;
  npvGov?: number | null;
  npvKkks?: number | null;
  capex?: number | null;
  opex?: number | null;
  asr?: number | null;
  sunkCost?: number | null;
  statusKesdmDjm?: string | null;
  statusSkkMigas?: string | null;
  statusKkks?: string | null;
  keterangan?: string | null;
};

export type Pi10Initial = {
  bumdPenerima?: string | null;
  bumdPengelola?: string | null;
  statusKesdmDjm?: string | null;
  statusSkkMigas?: string | null;
  statusProvBumd?: string | null;
  statusKkks?: string | null;
  tglEfekPi10?: string | null;
  tglPerstMesdm?: string | null;
};

export type DmedEInitial = {
  statusKesdmDjm?: string | null;
  statusSkkMigas?: string | null;
  statusProvBumd?: string | null;
  statusKkks?: string | null;
  tglEfekPi10?: string | null;
  tglPerstMesdm?: string | null;
};

export type DmedInitial = {
  subpokja?: string | null;
  jenis?: string | null;
  podi?: PodiInitial;
  pi10?: Pi10Initial;
  dmedE?: DmedEInitial;
};

function NumberField({ name, label, initial }: { name: string; label: string; initial?: number | null }) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type="number" step="any" defaultValue={initial?.toString() ?? ""} />
    </div>
  );
}

function TextField({ name, label, initial }: { name: string; label: string; initial?: string | null }) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} defaultValue={initial ?? ""} />
    </div>
  );
}

function DateField({ name, label, initial }: { name: string; label: string; initial?: string | null }) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type="date" defaultValue={initial ?? ""} />
    </div>
  );
}

function PodiFields({ initial }: { initial?: PodiInitial }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor="jenisPod">Jenis POD</Label>
        <Select id="jenisPod" name="jenisPod" defaultValue={initial?.jenisPod ?? ""}>
          <option value="">— Pilih jenis —</option>
          {JENIS_POD_VALUES.map((v) => (
            <option key={v} value={v}>
              {JENIS_POD_LABEL[v]}
            </option>
          ))}
        </Select>
      </div>
      <NumberField name="luasWilayahSisa" label="Luas Wilayah Sisa (Km2)" initial={initial?.luasWilayahSisa} />
      <DateField name="persetujuanPodI" label="Persetujuan POD I" initial={initial?.persetujuanPodI} />
      <DateField name="revisiPodI1" label="Revisi POD I ke 1" initial={initial?.revisiPodI1} />
      <DateField name="revisiPodI2" label="Revisi POD I ke 2" initial={initial?.revisiPodI2} />
      <DateField name="perkiraanOnstream" label="Perkiraan Onstream" initial={initial?.perkiraanOnstream} />
      <TextField name="fluidaProduksi" label="Fluida Produksi" initial={initial?.fluidaProduksi} />
      <TextField name="cadanganGas" label="Cadangan Gas" initial={initial?.cadanganGas} />
      <TextField name="cadanganMinyak" label="Cadangan Minyak" initial={initial?.cadanganMinyak} />
      <NumberField name="asumsiHargaGas" label="Asumsi Harga Gas (USD/MMBTU)" initial={initial?.asumsiHargaGas} />
      <NumberField name="asumsiHargaMinyak" label="Asumsi Harga Minyak (USD/BBL)" initial={initial?.asumsiHargaMinyak} />
      <NumberField name="grossRevenue" label="Gross Revenue (MM USD)" initial={initial?.grossRevenue} />
      <NumberField name="costRecovery" label="Cost Recovery (MM USD)" initial={initial?.costRecovery} />
      <NumberField name="goiTake" label="GOI Take (MM USD)" initial={initial?.goiTake} />
      <NumberField name="contTake" label="Cont. Take (MM USD)" initial={initial?.contTake} />
      <NumberField name="irr" label="IRR (%)" initial={initial?.irr} />
      <NumberField name="npvGov" label="NPV Gov (MM USD)" initial={initial?.npvGov} />
      <NumberField name="npvKkks" label="NPV KKKS (MM USD)" initial={initial?.npvKkks} />
      <NumberField name="capex" label="Capex (MM USD)" initial={initial?.capex} />
      <NumberField name="opex" label="Opex (MM USD)" initial={initial?.opex} />
      <NumberField name="asr" label="ASR (MM USD)" initial={initial?.asr} />
      <NumberField name="sunkCost" label="Sunk Cost (MM USD)" initial={initial?.sunkCost} />
      <TextField name="statusKesdmDjm" label="Status KESDM/DJM" initial={initial?.statusKesdmDjm} />
      <TextField name="statusSkkMigas" label="Status SKK Migas" initial={initial?.statusSkkMigas} />
      <TextField name="statusKkks" label="Status KKKS" initial={initial?.statusKkks} />
      <div className="sm:col-span-2">
        <Label htmlFor="keterangan">Keterangan</Label>
        <Textarea id="keterangan" name="keterangan" rows={3} defaultValue={initial?.keterangan ?? ""} />
      </div>
    </div>
  );
}

function Pi10Fields({ initial }: { initial?: Pi10Initial }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField name="bumdPenerima" label="BUMD Penerima" initial={initial?.bumdPenerima} />
      <TextField name="bumdPengelola" label="BUMD Pengelola" initial={initial?.bumdPengelola} />
      <TextField name="statusKesdmDjm" label="Status KESDM/DJM" initial={initial?.statusKesdmDjm} />
      <TextField name="statusSkkMigas" label="Status SKK Migas" initial={initial?.statusSkkMigas} />
      <TextField name="statusProvBumd" label="Status Prov/Kab/Kota/BUMD" initial={initial?.statusProvBumd} />
      <TextField name="statusKkks" label="Status KKKS" initial={initial?.statusKkks} />
      <DateField name="tglEfekPi10" label="Tgl Efek PI 10%" initial={initial?.tglEfekPi10} />
      <DateField name="tglPerstMesdm" label="Tgl Perst MESDM" initial={initial?.tglPerstMesdm} />
    </div>
  );
}

function DmedEFields({ initial }: { initial?: DmedEInitial }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField name="statusKesdmDjm" label="Status KESDM/DJM" initial={initial?.statusKesdmDjm} />
      <TextField name="statusSkkMigas" label="Status SKK Migas" initial={initial?.statusSkkMigas} />
      <TextField name="statusProvBumd" label="Status Prov/Kab/Kota/BUMD" initial={initial?.statusProvBumd} />
      <TextField name="statusKkks" label="Status KKKS" initial={initial?.statusKkks} />
      <DateField name="tglEfekPi10" label="Tgl Efek PI 10%" initial={initial?.tglEfekPi10} />
      <DateField name="tglPerstMesdm" label="Tgl Perst MESDM" initial={initial?.tglPerstMesdm} />
    </div>
  );
}

const JENIS_LABEL: Record<string, string> = { POD_I: "POD I", PI10: "PI 10%" };

export function DmedFields({ initial, locked = false }: { initial?: DmedInitial; locked?: boolean }) {
  const [subpokja, setSubpokja] = useState(initial?.subpokja ?? "DMED-T");
  const [jenis, setJenis] = useState(initial?.jenis ?? "POD_I");

  const effectiveSubpokja = locked ? initial?.subpokja ?? "DMED-T" : subpokja;
  const effectiveJenis = locked ? initial?.jenis ?? "POD_I" : jenis;

  return (
    <div className="space-y-4 rounded-lg border border-line p-4">
      <p className="text-sm font-semibold text-ink">Sub Pokja DMED</p>
      {locked ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Badge className="bg-petroleum/10 text-petroleum-dark">{effectiveSubpokja}</Badge>
            {effectiveSubpokja === "DMED-T" && (
              <Badge className="bg-line/40 text-ink">{JENIS_LABEL[effectiveJenis] ?? "—"}</Badge>
            )}
          </div>
          <p className="text-xs text-muted">Sub pokja & jenis proses tidak dapat diubah setelah WK dibuat.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="subpokjaDmed">Sub Pokja</Label>
            <Select
              id="subpokjaDmed"
              name="subpokjaDmed"
              value={subpokja}
              onChange={(e) => setSubpokja(e.target.value)}
            >
              <option value="DMED-T">DMED-T</option>
              <option value="DMED-E">DMED-E</option>
            </Select>
          </div>
          {subpokja === "DMED-T" && (
            <div>
              <Label htmlFor="jenisDmed">Jenis Proses</Label>
              <Select id="jenisDmed" name="jenisDmed" value={jenis} onChange={(e) => setJenis(e.target.value)}>
                <option value="POD_I">POD I</option>
                <option value="PI10">PI 10%</option>
              </Select>
            </div>
          )}
        </div>
      )}

      {effectiveSubpokja === "DMED-T" && effectiveJenis === "POD_I" && <PodiFields initial={initial?.podi} />}
      {effectiveSubpokja === "DMED-T" && effectiveJenis === "PI10" && <Pi10Fields initial={initial?.pi10} />}
      {effectiveSubpokja === "DMED-E" && <DmedEFields initial={initial?.dmedE} />}
    </div>
  );
}
