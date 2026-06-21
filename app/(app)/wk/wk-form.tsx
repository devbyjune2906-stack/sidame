"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { Button, Input, Label, Select, Card } from "@/components/ui";
import { STATUS_WK_LABEL, TYPE_CONTRACT_LABEL, TYPE_CONTRACT_VALUES, type StatusWk } from "@/lib/constants";
import { DmewFields, type DmewInitial } from "./dmew-fields";
import { DmedFields, type DmedInitial } from "./dmed-fields";

type Opsi = { id: number; nama: string };
type KabupatenOpsi = { id: number; nama: string; provinsiId: number | null };

export type WkInitial = {
  namaWk?: string;
  lapangan?: string | null;
  operatorK3s?: string | null;
  pemegangSaham?: string | null;
  provinsiId?: number | null;
  provinsiIds?: string | null;
  kabupatenId?: number | null;
  kabupatenIds?: string | null;
  typeContract?: string | null;
  statusWk?: string;
  startPsc?: string;
  endPsc?: string;
  dmew?: DmewInitial;
  dmed?: DmedInitial;
};

export function WkForm({
  action,
  initial = {},
  selectableStatuses,
  provinsiList,
  kabupatenList,
  submitLabel,
  hasProcess = false,
  userPokja,
}: {
  action: (prev: { error?: string } | null, fd: FormData) => Promise<{ error?: string } | null>;
  initial?: WkInitial;
  selectableStatuses: StatusWk[];
  provinsiList: Opsi[];
  kabupatenList: KabupatenOpsi[];
  submitLabel: string;
  /** true kalau WK ini sudah punya wk_process (sub-pokja/jalur terkunci, tidak bisa diganti) */
  hasProcess?: boolean;
  /** "DMEW" | "DMEN" untuk non-admin; undefined = Admin (bisa pilih) */
  userPokja?: "DMEW" | "DMEN";
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const [statusWk, setStatusWk] = useState(initial.statusWk ?? selectableStatuses[0]);

  // Inisialisasi dari provinsiIds (multi) atau provinsiId (single/lama)
  const initSelectedIds = useMemo<Set<number>>(() => {
    if (initial.provinsiIds) {
      return new Set(initial.provinsiIds.split(",").map(Number).filter(Boolean));
    }
    return initial.provinsiId ? new Set([initial.provinsiId]) : new Set();
  }, [initial.provinsiId, initial.provinsiIds]);

  const [selectedProvinsiIds, setSelectedProvinsiIds] = useState<Set<number>>(initSelectedIds);

  const firstProvinsiId = useMemo(() => [...selectedProvinsiIds][0] ?? null, [selectedProvinsiIds]);

  // Inisialisasi multi-select kabupaten
  const initSelectedKabupatenIds = useMemo<Set<number>>(() => {
    if (initial.kabupatenIds) {
      return new Set(initial.kabupatenIds.split(",").map(Number).filter(Boolean));
    }
    return initial.kabupatenId ? new Set([initial.kabupatenId]) : new Set();
  }, [initial.kabupatenId, initial.kabupatenIds]);

  const [selectedKabupatenIds, setSelectedKabupatenIds] = useState<Set<number>>(initSelectedKabupatenIds);

  const firstKabupatenId = useMemo(() => [...selectedKabupatenIds][0] ?? null, [selectedKabupatenIds]);

  function toggleProvinsi(id: number) {
    setSelectedProvinsiIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        // Saat provinsi di-deselect, hapus kabupaten dari provinsi tersebut
        next.delete(id);
        const kabupatenDiProvinsi = new Set(
          kabupatenList.filter((k) => k.provinsiId === id).map((k) => k.id)
        );
        setSelectedKabupatenIds((kPrev) => {
          const kNext = new Set(kPrev);
          kabupatenDiProvinsi.forEach((kId) => kNext.delete(kId));
          return kNext;
        });
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleKabupaten(id: number) {
    setSelectedKabupatenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const kabupatenOptions = useMemo(
    () =>
      kabupatenList.filter(
        (k) => k.provinsiId === null || (k.provinsiId !== null && selectedProvinsiIds.has(k.provinsiId))
      ),
    [kabupatenList, selectedProvinsiIds]
  );

  return (
    <form action={formAction}>
      <Card className="space-y-5">
        <div>
          <Label htmlFor="namaWk">Nama WK *</Label>
          <Input id="namaWk" name="namaWk" defaultValue={initial.namaWk ?? ""} required />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="lapangan">Lapangan</Label>
            <Input id="lapangan" name="lapangan" defaultValue={initial.lapangan ?? ""} />
          </div>
          <div>
            <Label htmlFor="operatorK3s">Operator / K3S</Label>
            <Input id="operatorK3s" name="operatorK3s" defaultValue={initial.operatorK3s ?? ""} />
          </div>
        </div>

        <div>
          <Label htmlFor="pemegangSaham">Pemegang Saham</Label>
          <Input id="pemegangSaham" name="pemegangSaham" defaultValue={initial.pemegangSaham ?? ""} />
        </div>

        <div>
          <Label>Provinsi</Label>
          <div className="mt-1 max-h-44 overflow-y-auto rounded-xl border border-line p-2">
            <div className="flex flex-wrap gap-1.5">
              {provinsiList.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleProvinsi(p.id)}
                  className={
                    selectedProvinsiIds.has(p.id)
                      ? "rounded-full bg-petroleum px-3 py-1 text-xs font-medium text-white"
                      : "rounded-full border border-line px-3 py-1 text-xs text-ink hover:bg-sand"
                  }
                >
                  {p.nama}
                </button>
              ))}
            </div>
          </div>
          {selectedProvinsiIds.size > 0 && (
            <p className="mt-1 text-xs text-muted">
              {selectedProvinsiIds.size} provinsi dipilih
            </p>
          )}
          <input type="hidden" name="provinsiId" value={firstProvinsiId?.toString() ?? ""} />
          <input type="hidden" name="provinsiIds" value={[...selectedProvinsiIds].join(",")} />
        </div>

        <div>
          <Label>Kabupaten/Kota</Label>
          {selectedProvinsiIds.size === 0 ? (
            <p className="mt-1 rounded-xl border border-line px-3 py-2 text-xs text-muted">
              Pilih provinsi terlebih dahulu.
            </p>
          ) : (
            <div className="mt-1 max-h-44 overflow-y-auto rounded-xl border border-line p-2">
              <div className="flex flex-wrap gap-1.5">
                {kabupatenOptions.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => toggleKabupaten(k.id)}
                    className={
                      selectedKabupatenIds.has(k.id)
                        ? "rounded-full bg-petroleum px-3 py-1 text-xs font-medium text-white"
                        : "rounded-full border border-line px-3 py-1 text-xs text-ink hover:bg-sand"
                    }
                  >
                    {k.nama}
                  </button>
                ))}
              </div>
            </div>
          )}
          {selectedKabupatenIds.size > 0 && (
            <p className="mt-1 text-xs text-muted">{selectedKabupatenIds.size} kabupaten/kota dipilih</p>
          )}
          <input type="hidden" name="kabupatenId" value={firstKabupatenId?.toString() ?? ""} />
          <input type="hidden" name="kabupatenIds" value={[...selectedKabupatenIds].join(",")} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="typeContract">Type Contract</Label>
            <Select id="typeContract" name="typeContract" defaultValue={initial.typeContract ?? ""}>
              <option value="">— Pilih —</option>
              {TYPE_CONTRACT_VALUES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_CONTRACT_LABEL[t]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="statusWk">Status WK *</Label>
            <Select
              id="statusWk"
              name="statusWk"
              value={statusWk}
              onChange={(e) => setStatusWk(e.target.value as StatusWk)}
              required
            >
              {selectableStatuses.map((s) => (
                <option key={s} value={s}>
                  {STATUS_WK_LABEL[s]}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="startPsc">Start PSC</Label>
            <Input id="startPsc" name="startPsc" type="date" defaultValue={initial.startPsc ?? ""} />
          </div>
          <div>
            <Label htmlFor="endPsc">End PSC</Label>
            <Input id="endPsc" name="endPsc" type="date" defaultValue={initial.endPsc ?? ""} />
          </div>
        </div>

        {(statusWk === "SEDANG_DILELANG" || statusWk === "WK_USULAN_BARU") && (
          <DmewFields initial={initial.dmew} locked={hasProcess} userPokja={userPokja} />
        )}
        {statusWk === "POD_I" && <DmedFields initial={initial.dmed} locked={hasProcess} />}

        {state?.error && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Menyimpan..." : submitLabel}
          </Button>
          <Link href="/wk">
            <Button type="button" variant="outline">
              Batal
            </Button>
          </Link>
        </div>
      </Card>
    </form>
  );
}
