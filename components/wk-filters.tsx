"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, Input, Select } from "@/components/ui";
import { STATUS_WK_LABEL, STATUS_WK_VALUES } from "@/lib/constants";

type Opsi = { id: number; nama: string };

export function WkFilters({
  provinsiList,
  showStatus,
}: {
  provinsiList: Opsi[];
  showStatus: boolean;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [status, setStatus] = useState(sp.get("status") ?? "");
  const [provinsi, setProvinsi] = useState(sp.get("provinsi") ?? "");

  function apply() {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (status) params.set("status", status);
    if (provinsi) params.set("provinsi", provinsi);
    router.push(`/wk?${params.toString()}`);
  }

  function reset() {
    setQ("");
    setStatus("");
    setProvinsi("");
    router.push("/wk");
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface p-4 shadow-card">
      <div className="min-w-[200px] flex-1">
        <label className="mb-1 block text-xs font-medium text-muted">Cari</label>
        <Input
          placeholder="Nama WK, operator, lapangan..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
        />
      </div>

      {showStatus && (
        <div className="w-44">
          <label className="mb-1 block text-xs font-medium text-muted">Status WK</label>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Semua status</option>
            {STATUS_WK_VALUES.map((s) => (
              <option key={s} value={s}>
                {STATUS_WK_LABEL[s]}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div className="w-48">
        <label className="mb-1 block text-xs font-medium text-muted">Provinsi</label>
        <Select value={provinsi} onChange={(e) => setProvinsi(e.target.value)}>
          <option value="">Semua provinsi</option>
          {provinsiList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex gap-2">
        <Button onClick={apply}>Terapkan</Button>
        <Button variant="outline" onClick={reset}>
          Reset
        </Button>
      </div>
    </div>
  );
}
