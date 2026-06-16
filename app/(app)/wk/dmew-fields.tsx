"use client";

import { useState } from "react";
import { Badge, Label, Select } from "@/components/ui";

export type DmewInitial = {
  subpokja?: string | null;
  jalur?: string | null;
};

const JALUR_LABEL: Record<string, string> = { REGULER: "Reguler", JOINT_STUDY: "Joint Study" };

export function DmewFields({ initial, locked = false }: { initial?: DmewInitial; locked?: boolean }) {
  const [subpokja, setSubpokja] = useState(initial?.subpokja ?? "DMEW-S");

  if (locked) {
    return (
      <div className="space-y-2 rounded-lg border border-line p-4">
        <p className="text-sm font-semibold text-ink">Sub Pokja DMEW</p>
        <div className="flex gap-2">
          <Badge className="bg-petroleum/10 text-petroleum-dark">{initial?.subpokja ?? "—"}</Badge>
          <Badge className="bg-line/40 text-ink">{JALUR_LABEL[initial?.jalur ?? ""] ?? "—"}</Badge>
        </div>
        <p className="text-xs text-muted">Sub pokja & jalur tidak dapat diubah setelah WK dibuat.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg border border-line p-4">
      <p className="text-sm font-semibold text-ink">Sub Pokja DMEW</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="subpokjaDmew">Sub Pokja</Label>
          <Select
            id="subpokjaDmew"
            name="subpokjaDmew"
            value={subpokja}
            onChange={(e) => setSubpokja(e.target.value)}
          >
            <option value="DMEW-S">DMEW-S</option>
            <option value="DMEW-T">DMEW-T</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="jalurDmew">Jalur</Label>
          <Select id="jalurDmew" name="jalurDmew" defaultValue={initial?.jalur ?? "REGULER"}>
            <option value="REGULER">Reguler</option>
            <option value="JOINT_STUDY">Joint Study</option>
          </Select>
        </div>
      </div>
    </div>
  );
}
