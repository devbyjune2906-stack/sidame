"use client";

import { useState } from "react";
import { Badge, Label, Select } from "@/components/ui";

export type DmewInitial = {
  pokja?: string | null; // "DMEW" | "DMEN"
  subpokja?: string | null;
  jalur?: string | null;
};

const JALUR_LABEL: Record<string, string> = { REGULER: "Reguler", JOINT_STUDY: "Joint Study" };

const SUBPOKJA_OPTIONS: Record<string, { value: string; label: string }[]> = {
  DMEW: [
    { value: "DMEW-S", label: "DMEW-S" },
    { value: "DMEW-T", label: "DMEW-T" },
  ],
  DMEN: [
    { value: "DMEN-N", label: "DMEN-N" },
    { value: "DMEN-K", label: "DMEN-K" },
  ],
};

const DEFAULT_SUBPOKJA: Record<string, string> = { DMEW: "DMEW-S", DMEN: "DMEN-N" };

/**
 * userPokja: "DMEW" | "DMEN" -- ditentukan dari role user.
 * undefined  = Admin (bisa pilih pokja sendiri).
 */
export function DmewFields({
  initial,
  locked = false,
  userPokja,
}: {
  initial?: DmewInitial;
  locked?: boolean;
  userPokja?: "DMEW" | "DMEN";
}) {
  const initPokja = (userPokja ?? initial?.pokja ?? "DMEW") as "DMEW" | "DMEN";
  const [pokjaKode, setPokjaKode] = useState<"DMEW" | "DMEN">(initPokja);
  const [subpokja, setSubpokja] = useState(initial?.subpokja ?? DEFAULT_SUBPOKJA[initPokja]);

  const isAdminMode = !userPokja; // admin bisa pilih pokja sendiri

  function handlePokjaChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newPokja = e.target.value as "DMEW" | "DMEN";
    setPokjaKode(newPokja);
    setSubpokja(DEFAULT_SUBPOKJA[newPokja]);
  }

  if (locked) {
    return (
      <div className="space-y-2 rounded-lg border border-line p-4">
        <p className="text-sm font-semibold text-ink">Sub Pokja {pokjaKode}</p>
        <div className="flex gap-2">
          <Badge className="bg-petroleum/10 text-petroleum-dark">{initial?.subpokja ?? "—"}</Badge>
          <Badge className="bg-line/40 text-ink">{JALUR_LABEL[initial?.jalur ?? ""] ?? "—"}</Badge>
        </div>
        <p className="text-xs text-muted">Sub pokja & jalur tidak dapat diubah setelah WK dibuat.</p>
      </div>
    );
  }

  const options = SUBPOKJA_OPTIONS[pokjaKode];

  return (
    <div className="space-y-4 rounded-lg border border-line p-4">
      <p className="text-sm font-semibold text-ink">
        Sub Pokja {isAdminMode ? "DMEW / DMEN" : pokjaKode}
      </p>

      {/* Hidden input untuk non-admin agar pokjaKode ikut tersubmit */}
      {!isAdminMode && <input type="hidden" name="pokjaDmew" value={pokjaKode} />}

      <div className="grid gap-4 sm:grid-cols-2">
        {isAdminMode && (
          <div className="sm:col-span-2">
            <Label htmlFor="pokjaDmew">Pokja</Label>
            <Select
              id="pokjaDmew"
              name="pokjaDmew"
              value={pokjaKode}
              onChange={handlePokjaChange}
            >
              <option value="DMEW">DMEW (Konvensional)</option>
              <option value="DMEN">DMEN (Non Konvensional)</option>
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="subpokjaDmew">Sub Pokja</Label>
          <Select
            id="subpokjaDmew"
            name="subpokjaDmew"
            value={subpokja}
            onChange={(e) => setSubpokja(e.target.value)}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
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
