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

        {/* ── Provinsi — dropdown akumulasi ── */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <Label>Provinsi</Label>
            {selectedProvinsiIds.size > 0 && (
              <span className="text-xs text-muted">{selectedProvinsiIds.size} provinsi dipilih</span>
            )}
          </div>
          <Select
            onChange={(e) => {
              const id = Number(e.target.value);
              if (id) toggleProvinsi(id);
              e.target.value = "";
            }}
          >
            <option value="">
              {provinsiList.every((p) => selectedProvinsiIds.has(p.id))
                ? "— Semua provinsi sudah dipilih —"
                : "— Tambah Provinsi —"}
            </option>
            {provinsiList
              .filter((p) => !selectedProvinsiIds.has(p.id))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama}
                </option>
              ))}
          </Select>
          <input type="hidden" name="provinsiId" value={firstProvinsiId?.toString() ?? ""} />
          <input type="hidden" name="provinsiIds" value={[...selectedProvinsiIds].join(",")} />
        </div>

        {/* ── Kabupaten/Kota — hierarki per-provinsi ── */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <Label>Kabupaten/Kota</Label>
            {selectedKabupatenIds.size > 0 && (
              <span className="text-xs text-muted">{selectedKabupatenIds.size} dipilih</span>
            )}
          </div>

          {selectedProvinsiIds.size === 0 && kabupatenList.filter((k) => k.provinsiId === null).length === 0 ? (
            <p className="rounded-xl border border-dashed border-line px-4 py-3 text-xs text-muted">
              Pilih provinsi terlebih dahulu untuk menampilkan kabupaten/kota.
            </p>
          ) : (
            <div className="space-y-2">
              {/* Non-Administratif (Di Atas 12 Mil Laut) — selalu tampil */}
              {kabupatenList.filter((k) => k.provinsiId === null).map((k) => (
                <div key={k.id} className="flex items-center justify-between rounded-xl border border-line px-3 py-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                    Non-Administratif
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleKabupaten(k.id)}
                    className={
                      selectedKabupatenIds.has(k.id)
                        ? "inline-flex items-center gap-1 rounded-full bg-petroleum px-3 py-1 text-xs font-medium text-white"
                        : "rounded-full border border-line px-3 py-1 text-xs text-ink hover:bg-sand"
                    }
                  >
                    {k.nama}
                    {selectedKabupatenIds.has(k.id) && (
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 opacity-70">
                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                      </svg>
                    )}
                  </button>
                </div>
              ))}

              {/* Satu card per provinsi yang dipilih */}
              {provinsiList
                .filter((p) => selectedProvinsiIds.has(p.id))
                .map((prov) => {
                  const allKab = kabupatenList.filter((k) => k.provinsiId === prov.id);
                  const selectedKab = allKab.filter((k) => selectedKabupatenIds.has(k.id));
                  const availableKab = allKab.filter((k) => !selectedKabupatenIds.has(k.id));
                  return (
                    <div key={prov.id} className="overflow-hidden rounded-xl border border-line">
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-line bg-petroleum/5 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 shrink-0 rounded-full bg-petroleum" />
                          <span className="text-sm font-semibold text-petroleum">{prov.nama}</span>
                          {selectedKab.length > 0 && (
                            <span className="rounded-full bg-petroleum/10 px-2 py-0.5 text-[10px] font-bold text-petroleum">
                              {selectedKab.length} dipilih
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          title={`Hapus ${prov.nama}`}
                          onClick={() => toggleProvinsi(prov.id)}
                          className="flex h-5 w-5 items-center justify-center rounded-full text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                        >
                          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                          </svg>
                        </button>
                      </div>

                      {/* Body: dropdown tambah + chips terpilih */}
                      <div className="space-y-2 p-3">
                        {availableKab.length > 0 && (
                          <Select
                            onChange={(e) => {
                              const id = Number(e.target.value);
                              if (id) toggleKabupaten(id);
                              e.target.value = "";
                            }}
                          >
                            <option value="">— Tambah Kabupaten/Kota —</option>
                            {availableKab.map((k) => (
                              <option key={k.id} value={k.id}>
                                {k.nama}
                              </option>
                            ))}
                          </Select>
                        )}

                        {selectedKab.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {selectedKab.map((k) => (
                              <button
                                key={k.id}
                                type="button"
                                onClick={() => toggleKabupaten(k.id)}
                                className="inline-flex items-center gap-1 rounded-full bg-petroleum px-3 py-1 text-xs font-medium text-white"
                              >
                                {k.nama}
                                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 opacity-70">
                                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                </svg>
                              </button>
                            ))}
                          </div>
                        )}

                        {availableKab.length === 0 && selectedKab.length === 0 && (
                          <p className="text-xs italic text-muted">Tidak ada kabupaten/kota tersedia.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
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
