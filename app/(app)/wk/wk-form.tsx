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
  kabupatenId?: number | null;
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
}: {
  action: (prev: { error?: string } | null, fd: FormData) => Promise<{ error?: string } | null>;
  initial?: WkInitial;
  selectableStatuses: StatusWk[];
  provinsiList: Opsi[];
  kabupatenList: KabupatenOpsi[];
  submitLabel: string;
  /** true kalau WK ini sudah punya wk_process (sub-pokja/jalur terkunci, tidak bisa diganti) */
  hasProcess?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const statusLocked = selectableStatuses.length === 1;
  const [statusWk, setStatusWk] = useState(initial.statusWk ?? selectableStatuses[0]);

  const [provinsiId, setProvinsiId] = useState(initial.provinsiId?.toString() ?? "");
  const kabupatenOptions = useMemo(
    () =>
      kabupatenList.filter(
        (k) => k.provinsiId === null || (provinsiId !== "" && k.provinsiId === Number(provinsiId))
      ),
    [kabupatenList, provinsiId]
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="provinsiId">Provinsi</Label>
            <Select
              id="provinsiId"
              name="provinsiId"
              value={provinsiId}
              onChange={(e) => setProvinsiId(e.target.value)}
            >
              <option value="">— Pilih provinsi —</option>
              {provinsiList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="kabupatenId">Kabupaten/Kota</Label>
            <Select
              id="kabupatenId"
              name="kabupatenId"
              defaultValue={initial.kabupatenId?.toString() ?? ""}
            >
              <option value="">— Pilih kabupaten/kota —</option>
              {kabupatenOptions.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama}
                </option>
              ))}
            </Select>
          </div>
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
              name={statusLocked ? undefined : "statusWk"}
              value={statusWk}
              onChange={(e) => setStatusWk(e.target.value as StatusWk)}
              required={!statusLocked}
              disabled={statusLocked}
            >
              {selectableStatuses.map((s) => (
                <option key={s} value={s}>
                  {STATUS_WK_LABEL[s]}
                </option>
              ))}
            </Select>
            {statusLocked && (
              <>
                <input type="hidden" name="statusWk" value={selectableStatuses[0]} />
                <p className="mt-1 text-xs text-muted">
                  Status terkunci sesuai kewenangan Pokja Anda.
                </p>
              </>
            )}
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

        {statusWk === "SEDANG_DILELANG" && <DmewFields initial={initial.dmew} locked={hasProcess} />}
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
