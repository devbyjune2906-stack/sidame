"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, Input, Label, Select, Card } from "@/components/ui";
import { STATUS_WK_LABEL, TYPE_CONTRACT_LABEL, TYPE_CONTRACT_VALUES, type StatusWk } from "@/lib/constants";

type Opsi = { id: number; nama: string };

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
};

export function WkForm({
  action,
  initial = {},
  selectableStatuses,
  provinsiList,
  submitLabel,
}: {
  action: (prev: { error?: string } | null, fd: FormData) => Promise<{ error?: string } | null>;
  initial?: WkInitial;
  selectableStatuses: StatusWk[];
  provinsiList: Opsi[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const statusLocked = selectableStatuses.length === 1;

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
            <Select id="provinsiId" name="provinsiId" defaultValue={initial.provinsiId?.toString() ?? ""}>
              <option value="">— Pilih provinsi —</option>
              {provinsiList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="kabupatenId">Kabupaten/Kota (ID)</Label>
            <Input
              id="kabupatenId"
              name="kabupatenId"
              type="number"
              defaultValue={initial.kabupatenId?.toString() ?? ""}
              placeholder="opsional"
            />
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
              defaultValue={initial.statusWk ?? selectableStatuses[0]}
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
