"use client";

import Link from "next/link";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const PIE_COLORS = ["#0B5E54", "#0F7A6E", "#C9821B", "#2E7D5B", "#6B8E86", "#B4322B"];
const BAR_COLOR = "#0F7A6E";

type StatusItem = { name: string; value: number; key: string };
type DataItem  = { name: string; value: number };
type RankItem  = { nama: string; c: number };

const QUICK_LINKS = [
  { label: "WK Pengembangan",     href: "/wk/dmew", color: "bg-petroleum text-white" },
  { label: "Subsidi Eksplorasi",  href: "/wk/dmen", color: "bg-petroleum-light text-white" },
  { label: "Data WK Eksplorasi",  href: "/wk/dmee", color: "bg-ok text-white" },
  { label: "Pengajuan POD I",     href: "/wk/dmed-t", color: "bg-warn text-white" },
  { label: "Perpanjangan Kontrak",href: "/wk/dmed-e", color: "bg-warn text-white" },
  { label: "WK Produksi (DMEP)", href: "/wk/dmep",  color: "bg-danger text-white" },
];

const STATUS_ACCENT: Record<string, string> = {
  WK_USULAN_BARU:    "#1EB8A8",
  SEDANG_DILELANG:   "#0B9E8E",
  EKSPLORASI:        "#C9821B",
  POD_I:             "#2E7D5B",
  ONSTREAM:          "#4ade80",
  TIDAK_DILANJUTKAN: "#B4322B",
};

const STATUS_SVG: Record<string, React.ReactNode> = {
  WK_USULAN_BARU:   <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4"><path d="M3 2h10v1H3zm-1 2h12v1H2zm1 2h10l1 8H2L3 6z"/></svg>,
  SEDANG_DILELANG:  <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4"><path d="M2 2h12v2H2zm0 3h12v9H2zm2 2v5h8V7H4z"/></svg>,
  EKSPLORASI:       <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398l3.85 3.85a1 1 0 0 0 1.415-1.415l-3.868-3.833zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg>,
  POD_I:            <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4"><path d="M14 1H2a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V2a1 1 0 00-1-1zM4 4h8v1H4zm0 3h8v1H4zm0 3h5v1H4z"/></svg>,
  ONSTREAM:         <svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4"><path d="M8 1C5 1 3 4 3 7c0 3 2 6 5 8 3-2 5-5 5-8 0-3-2-6-5-6z"/></svg>,
  TIDAK_DILANJUTKAN:<svg viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zM2 8a6 6 0 0110.33-4.14L3.86 12.33A5.96 5.96 0 012 8zm1.67 4.14L12.14 3.67A6 6 0 013.67 12.14z"/></svg>,
};

export type AdminDashboardProps = {
  total: number;
  statusItems: StatusItem[];
  contractData: DataItem[];
  perProvinsi: RankItem[];
  perOperator: RankItem[];
};

export function AdminDashboard({
  total,
  statusItems,
  contractData,
  perProvinsi,
  perOperator,
}: AdminDashboardProps) {
  const activeStatuses = statusItems.filter(
    (s) => s.key !== "TIDAK_DILANJUTKAN" && s.value > 0,
  );
  const tidakDilanjutkan = statusItems.find((s) => s.key === "TIDAK_DILANJUTKAN");

  return (
    <div className="relative -mx-6 -mt-8 min-h-screen bg-[#F0F4F3]">

      {/* ── Hero Header ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-petroleum px-6 py-5">
        {/* subtle bg pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 70% 50%, #ffffff 0%, transparent 60%)",
          }}
        />
        <div className="relative flex items-center gap-4">
          <img
            src="/logo-dme.png"
            alt="DME"
            className="h-14 w-14 rounded-xl bg-white object-contain p-1 shadow"
          />
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/60">
              DME UPSTREAM OIL &amp; GAS DATABASE
            </p>
            <h1 className="font-display text-2xl font-extrabold leading-tight text-white">
              OPERATIONAL DASHBOARD
            </h1>
            <p className="mt-0.5 text-xs text-white/50">
              Direktorat Pembinaan Usaha Hulu Migas
            </p>
          </div>
          <div className="hidden sm:block">
            <span className="font-display text-5xl font-black tracking-tight text-white/20">
              DME
            </span>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ────────────────────────────────────────────── */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {/* Total */}
          <div
            className="col-span-2 sm:col-span-1 lg:col-span-1 rounded-xl px-4 py-3 text-white shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-default"
            style={{ background: "#0B5E54", borderTop: "3px solid #1EB8A8" }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
              Total WK
            </p>
            <p className="mt-1 font-display text-4xl font-black">{total}</p>
            <p className="mt-0.5 text-[11px] text-white/60">Wilayah Kerja</p>
          </div>

          {statusItems
            .filter((s) => s.key !== "TIDAK_DILANJUTKAN")
            .map((s) => {
              const accent = STATUS_ACCENT[s.key] ?? "#6B8E86";
              const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
              return (
                <div
                  key={s.key}
                  className="rounded-xl bg-white px-4 py-3 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lg cursor-default"
                  style={{ borderTop: `3px solid ${accent}` }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span style={{ color: accent }}>{STATUS_SVG[s.key]}</span>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted leading-tight">
                      {s.name}
                    </p>
                  </div>
                  <p className="font-display text-3xl font-black text-ink">
                    {s.value}
                  </p>
                  <p className="mt-0.5 text-[10px]" style={{ color: accent }}>
                    {pct}% dari total
                  </p>
                </div>
              );
            })}
        </div>
        {tidakDilanjutkan && tidakDilanjutkan.value > 0 && (
          <p className="mt-2 text-right text-xs text-muted">
            ⛔ {tidakDilanjutkan.value} WK tidak dilanjutkan
          </p>
        )}
      </div>

      {/* ── Main Body ─────────────────────────────────────────────── */}
      <div className="grid gap-4 px-6 pb-6 lg:grid-cols-4">

        {/* Quick Access */}
        <div className="flex flex-col gap-3 lg:col-span-1">
          <div className="rounded-xl bg-white p-4 shadow-card">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted">
              Quick Access
            </p>
            <div className="flex flex-col gap-2">
              {QUICK_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-opacity hover:opacity-90 ${l.color}`}
                >
                  <span>{l.label}</span>
                  <svg className="h-4 w-4 opacity-70" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {/* Provinsi ranking */}
          <div className="rounded-xl bg-white p-4 shadow-card">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted">
              WK per Provinsi (Top 8)
            </p>
            <RankBar rows={perProvinsi} color="#0B5E54" />
          </div>
        </div>

        {/* Charts area */}
        <div className="grid gap-4 lg:col-span-3 lg:grid-cols-2">
          {/* Status Distribution Pie */}
          <div className="rounded-xl bg-white p-4 shadow-card">
            <p className="mb-1 text-sm font-semibold text-ink">
              Distribusi Status WK
            </p>
            <p className="mb-2 text-[11px] text-muted">Seluruh pipeline</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={activeStatuses}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {activeStatuses.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Contract Type Bar */}
          <div className="rounded-xl bg-white p-4 shadow-card">
            <p className="mb-1 text-sm font-semibold text-ink">
              Tipe Kontrak
            </p>
            <p className="mb-2 text-[11px] text-muted">Cost Recovery vs Gross Split</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={contractData.filter((d) => d.value > 0)}
                layout="vertical"
                margin={{ left: 8, right: 16 }}
              >
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {contractData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Operator ranking */}
          <div className="rounded-xl bg-white p-4 shadow-card">
            <p className="mb-1 text-sm font-semibold text-ink">
              Top Operator / K3S
            </p>
            <p className="mb-3 text-[11px] text-muted">Berdasarkan jumlah WK</p>
            <RankBar rows={perOperator} color="#0F7A6E" />
          </div>

          {/* Summary mini table */}
          <div className="rounded-xl bg-white p-4 shadow-card">
            <p className="mb-1 text-sm font-semibold text-ink">
              Rekap per Status
            </p>
            <p className="mb-3 text-[11px] text-muted">Seluruh WK aktif</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-muted">
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 text-right font-semibold">Jumlah</th>
                  <th className="pb-2 text-right font-semibold">%</th>
                </tr>
              </thead>
              <tbody>
                {statusItems.filter((s) => s.value > 0).map((s) => (
                  <tr key={s.key} className="border-b border-line/40 last:border-0">
                    <td className="py-1.5 text-ink">
                      <span className="mr-1" style={{ color: STATUS_ACCENT[s.key] }}>{STATUS_SVG[s.key]}</span>
                      {s.name}
                    </td>
                    <td className="py-1.5 text-right font-medium text-ink">
                      {s.value}
                    </td>
                    <td className="py-1.5 text-right text-muted">
                      {total > 0 ? ((s.value / total) * 100).toFixed(1) : "0"}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function RankBar({ rows, color }: { rows: RankItem[]; color: string }) {
  if (rows.length === 0)
    return <p className="text-xs text-muted">Belum ada data.</p>;
  const max = Math.max(...rows.map((r) => r.c), 1);
  return (
    <ul className="space-y-1.5">
      {rows.map((r, i) => (
        <li key={i} className="text-xs">
          <div className="flex items-center justify-between">
            <span className="truncate text-ink">{r.nama}</span>
            <span className="ml-2 shrink-0 font-semibold text-muted">{r.c}</span>
          </div>
          <div className="mt-0.5 h-1.5 rounded-full bg-line">
            <div
              className="h-1.5 rounded-full"
              style={{ width: `${(r.c / max) * 100}%`, backgroundColor: color }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
