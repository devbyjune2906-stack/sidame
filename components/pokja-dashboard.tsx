"use client";

import Link from "next/link";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

// ── Color palette for dark dashboard ──────────────────────────────
const BG_MAIN    = "#091520";
const BG_HEADER  = "#0d2240";
const BG_TITLE   = "#0a1e38";
const BG_CARD    = "#0d1e30";
const BG_CARD2   = "#081420";
const BORDER     = "#1a3352";
const PIE_COLORS = ["#1EB8A8", "#0B9E8E", "#C9821B", "#2E7D5B", "#6B8E86", "#B4322B"];

const STATUS_ICON: Record<string, string> = {
  WK_USULAN_BARU:    "🗂",
  SEDANG_DILELANG:   "📋",
  EKSPLORASI:        "🔍",
  POD_I:             "📝",
  ONSTREAM:          "⛽",
  TIDAK_DILANJUTKAN: "⛔",
};

const STATUS_COLOR: Record<string, string> = {
  WK_USULAN_BARU:    "#1EB8A8",
  SEDANG_DILELANG:   "#0B9E8E",
  EKSPLORASI:        "#C9821B",
  POD_I:             "#2E7D5B",
  ONSTREAM:          "#4ade80",
  TIDAK_DILANJUTKAN: "#B4322B",
};

const SUBPOKJA_BG: Record<string, string> = {
  "DMEW-S": "#0B5E54",
  "DMEW-T": "#0F7A6E",
  "DMEN-N": "#2E7D5B",
  "DMEN-K": "#0B5E54",
  "DMEE-L": "#C9821B",
  "DMEE-M": "#0B5E54",
  "DMED-T": "#B4322B",
  "DMED-E": "#0B5E54",
  "DMEP-L": "#16211F",
  "DMEP-P": "#0B5E54",
};

const POKJA_LINKS: Record<string, { label: string; href: string; bg: string }[]> = {
  DMEW: [
    { label: "Sub Pokja DMEW-S",         href: "/wk/dmew-s",  bg: "#0B5E54" },
    { label: "Sub Pokja DMEW-T",         href: "/wk/dmew-t",  bg: "#0F7A6E" },
  ],
  DMEN: [
    { label: "Sub Pokja DMEN-N",         href: "/wk/dmen-n",  bg: "#2E7D5B" },
    { label: "Sub Pokja DMEN-K",         href: "/wk/dmen-k",  bg: "#0B5E54" },
  ],
  DMEE: [
    { label: "Sub Pokja DMEE-L",         href: "/wk/dmee-l",  bg: "#C9821B" },
    { label: "Sub Pokja DMEE-M",         href: "/wk/dmee-m",  bg: "#0B5E54" },
  ],
  DMED: [
    { label: "DMED-T — Pengajuan POD I", href: "/wk/dmed-t",  bg: "#B4322B" },
    { label: "DMED-E — Perpanjangan",    href: "/wk/dmed-e",  bg: "#0B5E54" },
  ],
  DMEP: [
    { label: "Sub Pokja DMEP-L",         href: "/wk/dmep-l",  bg: "#16211F" },
    { label: "Sub Pokja DMEP-P",         href: "/wk/dmep-p",  bg: "#0B5E54" },
  ],
};

// ── Types ──────────────────────────────────────────────────────────
type StatusItem = { name: string; value: number; key: string };
type DataItem   = { name: string; value: number };
type RankItem   = { nama: string; c: number };

export type StageInfo = { nama: string; status: string; urutan: number };
export type MilestoneRow = {
  wkId: string;
  wkNama: string;
  subpokja: string;
  statusWk: string;
  stages: StageInfo[];
  selesai: number;
  berjalan: number;
};

export type PokjaDashboardProps = {
  pokja: string;
  userName: string;
  total: number;
  statusItems: StatusItem[];
  contractData: DataItem[];
  perProvinsi: RankItem[];
  perOperator: RankItem[];
  milestoneData: MilestoneRow[];
  totalSelesai: number;
  totalBerjalan: number;
  totalBelumMulai: number;
  provinsiPi10?: string[];
};

// ── Indonesia Map constants ─────────────────────────────────────────
// Natural Earth GeoJSON (2012 dataset) nama provinsi → nama DB kami
// Dibutuhkan karena NE menggunakan nama lama / berbeda, dan 5 provinsi
// baru (Kalimantan Utara 2012, Papua split 2022) tidak ada dalam dataset.
const NE_TO_DB: Record<string, string[]> = {
  "Jakarta Raya":     ["DKI Jakarta"],
  "Yogyakarta":       ["DI Yogyakarta"],
  "Bangka-Belitung":  ["Kepulauan Bangka Belitung"],
  "Kalimantan Timur": ["Kalimantan Timur", "Kalimantan Utara"],
  "Papua":            ["Papua", "Papua Tengah", "Papua Pegunungan", "Papua Selatan"],
  "Papua Barat":      ["Papua Barat", "Papua Barat Daya"],
};

// 5 provinsi baru yang tidak ada poligonnya di dataset NE → tampil sebagai marker titik
// [nama DB, longitude, latitude]
const EXTRA_PROVINCE_MARKERS: [string, number, number][] = [
  ["Kalimantan Utara", 116.8,  3.5],
  ["Papua Barat Daya", 131.3, -0.9],
  ["Papua Tengah",     135.5, -4.0],
  ["Papua Pegunungan", 139.0, -4.0],
  ["Papua Selatan",    137.5, -7.0],
];

// ── Main Component ─────────────────────────────────────────────────
export function PokjaDashboard({
  pokja,
  userName,
  total,
  statusItems,
  contractData,
  perProvinsi,
  perOperator,
  milestoneData,
  totalSelesai,
  totalBerjalan,
  totalBelumMulai,
  provinsiPi10 = [],
}: PokjaDashboardProps) {
  const activeStatuses = statusItems.filter(
    (s) => s.key !== "TIDAK_DILANJUTKAN" && s.value > 0,
  );
  const quickLinks = POKJA_LINKS[pokja] ?? [];

  return (
    <div className="-mx-6 -mt-8 min-h-screen" style={{ background: BG_MAIN }}>

      {/* ── Title bar ──────────────────────────────────────────── */}
      <div
        className="px-6 py-1.5 text-center"
        style={{ background: BG_TITLE, borderBottom: `1px solid ${BORDER}` }}
      >
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">
          DME UPSTREAM OIL &amp; GAS DATABASE: POKJA {pokja} — OPERATIONAL DASHBOARD
        </p>
      </div>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-6 px-6 py-4"
        style={{ background: BG_HEADER, borderBottom: `1px solid ${BORDER}` }}
      >
        {/* Logo + org name */}
        <div className="flex shrink-0 items-center gap-3">
          <img
            src="/logo-dme.png"
            alt="DME"
            className="h-16 w-16 rounded-xl bg-white/10 object-contain p-1 shadow-lg"
          />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">
              DIREKTORAT
            </p>
            <p className="text-sm font-bold text-white/80">PEMBINAAN USAHA</p>
            <p className="text-sm font-bold text-white/80">HULU MIGAS</p>
          </div>
        </div>

        {/* Big pokja watermark */}
        <div className="flex-1 text-center">
          <p
            className="font-display font-black leading-none"
            style={{ fontSize: "clamp(2rem, 6vw, 5rem)", color: "rgba(255,255,255,0.12)" }}
          >
            {pokja}
          </p>
        </div>

        {/* Right info */}
        <div className="shrink-0 text-right">
          <p className="text-[10px] uppercase tracking-widest text-white/40">
            Selamat datang
          </p>
          <p className="text-sm font-semibold text-white/80">{userName}</p>
          <p className="mt-1 text-[10px] text-white/40">Total WK Pokja</p>
          <p className="font-display text-3xl font-black text-white">{total}</p>
        </div>
      </div>

      {/* ── Stat cards row ─────────────────────────────────────── */}
      <div
        className="grid grid-cols-3 gap-px sm:grid-cols-6"
        style={{ background: BORDER, borderBottom: `1px solid ${BORDER}` }}
      >
        {statusItems
          .filter((s) => s.key !== "TIDAK_DILANJUTKAN")
          .map((s) => (
            <StatCard key={s.key} stat={s} total={total} />
          ))}
      </div>

      {/* ── Main body ──────────────────────────────────────────── */}
      <div className="flex min-h-[360px]" style={{ borderBottom: `1px solid ${BORDER}` }}>

        {/* Left: Quick Access */}
        <div
          className="flex w-52 shrink-0 flex-col gap-3 p-4"
          style={{ background: BG_CARD2, borderRight: `1px solid ${BORDER}` }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
            Quick Access
          </p>

          {/* Filter placeholder */}
          <div
            className="rounded px-2 py-1.5 text-xs text-white/30"
            style={{ background: BG_HEADER, border: `1px solid ${BORDER}` }}
          >
            Select Filter...
          </div>

          <div className="flex flex-col gap-1.5">
            {quickLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center justify-between rounded px-3 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-85"
                style={{ background: l.bg }}
              >
                <span>{l.label}</span>
                <svg
                  className="h-3 w-3 opacity-70"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>

          {/* Contract areas legend */}
          <div className="mt-2">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
              Contract Areas
            </p>
            <div className="space-y-1.5">
              {perProvinsi.slice(0, 6).map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="flex-1 truncate text-white/60">{p.nama}</span>
                  <span className="font-semibold text-white/80">{p.c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Indonesia Map (DMED) or Province Grid */}
        <div className="flex flex-1 flex-col p-5" style={{ background: BG_MAIN }}>
          {pokja === "DMED" ? (
            <>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/40">
                Peta Sebaran WK DMED — POD I &amp; PI 10%
              </p>
              <IndonesiaMap
                podIProvinces={perProvinsi.map(r => r.nama)}
                pi10Provinces={provinsiPi10}
                perProvinsi={perProvinsi}
              />
            </>
          ) : (
            <>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-white/40">
                Sebaran WK per Provinsi — Pokja {pokja}
              </p>
              <ProvinceGrid rows={perProvinsi} total={total} />
            </>
          )}
        </div>

        {/* Right: Pie chart */}
        <div
          className="w-64 shrink-0 p-4"
          style={{ background: BG_CARD2, borderLeft: `1px solid ${BORDER}` }}
        >
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/40">
            Distribusi Status
          </p>
          <p className="mb-2 text-[11px] text-white/40">Pipeline Pokja {pokja}</p>
          <ResponsiveContainer width="100%" height={190}>
            <PieChart>
              <Pie
                data={activeStatuses}
                dataKey="value"
                nameKey="name"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={2}
              >
                {activeStatuses.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: BG_HEADER,
                  border: `1px solid ${BORDER}`,
                  borderRadius: "8px",
                  color: "white",
                  fontSize: 11,
                }}
              />
              <Legend
                iconSize={8}
                wrapperStyle={{ fontSize: 10, color: "rgba(255,255,255,0.55)" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Bottom: 4 panels ───────────────────────────────────── */}
      <div
        className="grid grid-cols-2 gap-px lg:grid-cols-4"
        style={{ background: BORDER }}
      >

        {/* Panel 1: Contract type */}
        <div className="p-4" style={{ background: BG_CARD }}>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/40">
            Tipe Kontrak
          </p>
          <p className="mb-3 text-[11px] text-white/30">Cost Recovery vs Gross Split</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart
              data={contractData.filter((d) => d.value > 0)}
              layout="vertical"
              margin={{ left: 0, right: 10, top: 0, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={85}
                tick={{ fontSize: 10, fill: "rgba(255,255,255,0.55)" }}
              />
              <Tooltip
                contentStyle={{
                  background: BG_HEADER,
                  border: `1px solid ${BORDER}`,
                  borderRadius: "6px",
                  color: "white",
                  fontSize: 10,
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {contractData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Panel 2: Top operator */}
        <div className="p-4" style={{ background: BG_CARD }}>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/40">
            Top Operator / K3S
          </p>
          <p className="mb-3 text-[11px] text-white/30">Berdasarkan jumlah WK</p>
          <ul className="space-y-1.5">
            {perOperator.slice(0, 8).map((r, i) => (
              <li key={i} className="flex items-center gap-2">
                <span
                  className="w-4 shrink-0 text-right text-[10px] font-bold"
                  style={{ color: PIE_COLORS[i % PIE_COLORS.length] }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-[11px] text-white/70">{r.nama}</span>
                    <span className="ml-2 shrink-0 text-[11px] font-bold text-white">{r.c}</span>
                  </div>
                  <div
                    className="mt-0.5 h-0.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.08)" }}
                  >
                    <div
                      className="h-0.5 rounded-full"
                      style={{
                        width: `${(r.c / Math.max(...perOperator.map((x) => x.c), 1)) * 100}%`,
                        background: PIE_COLORS[i % PIE_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Panel 3: Milestone summary */}
        <div className="p-4" style={{ background: BG_CARD }}>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/40">
            Progress Milestone
          </p>
          <p className="mb-3 text-[11px] text-white/30">Tahapan WK dalam proses</p>
          {milestoneData.length === 0 ? (
            <p className="text-[11px] text-white/30">Belum ada data milestone.</p>
          ) : (
            <div className="space-y-4">
              {[
                { label: "Selesai",     value: totalSelesai,   color: "#4ade80" },
                { label: "Berjalan",    value: totalBerjalan,  color: "#C9821B" },
                { label: "Belum Mulai", value: totalBelumMulai,color: "#6B8E86" },
              ].map((item) => {
                const tot = totalSelesai + totalBerjalan + totalBelumMulai;
                const pct = tot > 0 ? (item.value / tot) * 100 : 0;
                return (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="text-white/60">{item.label}</span>
                      <span className="font-bold text-white">{item.value}</span>
                    </div>
                    <div
                      className="h-1.5 rounded-full"
                      style={{ background: "rgba(255,255,255,0.08)" }}
                    >
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: `${pct}%`, background: item.color }}
                      />
                    </div>
                    <p className="mt-0.5 text-right text-[10px]" style={{ color: item.color }}>
                      {pct.toFixed(0)}%
                    </p>
                  </div>
                );
              })}
              <p className="text-[10px] text-white/30">{milestoneData.length} WK terpantau</p>
            </div>
          )}
        </div>

        {/* Panel 4: Status recap table */}
        <div className="p-4" style={{ background: BG_CARD }}>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/40">
            Rekap Status WK
          </p>
          <p className="mb-3 text-[11px] text-white/30">Seluruh WK Pokja {pokja}</p>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                <th className="pb-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-white/40">
                  Status
                </th>
                <th className="pb-1.5 text-right text-[10px] font-semibold uppercase tracking-wide text-white/40">
                  Jml
                </th>
                <th className="pb-1.5 text-right text-[10px] font-semibold uppercase tracking-wide text-white/40">
                  %
                </th>
              </tr>
            </thead>
            <tbody>
              {statusItems.filter((s) => s.value > 0).map((s) => (
                <tr key={s.key} style={{ borderBottom: `1px solid ${BORDER}30` }}>
                  <td className="py-1.5">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: STATUS_COLOR[s.key] ?? "#6B8E86" }}
                      />
                      <span className="text-[11px] text-white/60">{s.name}</span>
                    </div>
                  </td>
                  <td className="py-1.5 text-right text-[11px] font-bold text-white">
                    {s.value}
                  </td>
                  <td className="py-1.5 text-right text-[10px] text-white/40">
                    {total > 0 ? ((s.value / total) * 100).toFixed(1) : "0"}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Milestone detail rows ────────────────────────────────── */}
      {milestoneData.length > 0 && (
        <div className="p-6" style={{ background: BG_MAIN }}>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-white/40">
            Detail Milestone Tahapan
          </p>
          <p className="mb-4 text-[11px] text-white/30">WK dalam proses — Pokja {pokja}</p>
          <div
            className="overflow-hidden rounded-lg"
            style={{ border: `1px solid ${BORDER}` }}
          >
            {milestoneData.map((r, i) => (
              <div
                key={`${r.wkId}-${r.subpokja}-${i}`}
                className="px-4 py-4 transition-colors"
                style={{
                  borderBottom: i < milestoneData.length - 1 ? `1px solid ${BORDER}` : "none",
                  background: i % 2 === 0 ? BG_CARD2 : BG_CARD,
                }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex min-w-0 items-center gap-2">
                    <Link
                      href={`/wk/${r.wkId}`}
                      className="truncate text-sm font-semibold text-white hover:underline"
                      style={{ textDecorationColor: "#1EB8A8" }}
                    >
                      {r.wkNama}
                    </Link>
                    <span
                      className="shrink-0 rounded px-2 py-0.5 text-[10px] font-bold text-white"
                      style={{ background: SUBPOKJA_BG[r.subpokja] ?? "#0B5E54" }}
                    >
                      {r.subpokja}
                    </span>
                  </div>
                  <div className="ml-3 shrink-0">
                    {r.berjalan > 0 ? (
                      <span
                        className="rounded px-2 py-0.5 text-[10px] font-bold text-white"
                        style={{ background: "#0B5E54" }}
                      >
                        Berjalan
                      </span>
                    ) : r.stages.length === 0 ? (
                      <span
                        className="rounded px-2 py-0.5 text-[10px] font-bold"
                        style={{ background: BORDER, color: "rgba(255,255,255,0.4)" }}
                      >
                        Belum Ada Tahap
                      </span>
                    ) : (
                      <span
                        className="rounded px-2 py-0.5 text-[10px] font-bold"
                        style={{ background: BORDER, color: "rgba(255,255,255,0.4)" }}
                      >
                        Belum Mulai
                      </span>
                    )}
                  </div>
                </div>
                {r.stages.length === 0 ? (
                  <p className="text-xs text-white/30">Belum ada tahap terdaftar.</p>
                ) : (
                  <MilestoneTimeline stages={r.stages} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

function StatCard({ stat, total }: { stat: StatusItem; total: number }) {
  const pct = total > 0 ? (stat.value / total) * 100 : 0;
  const color = STATUS_COLOR[stat.key] ?? "#1EB8A8";
  return (
    <div className="flex flex-col gap-2 p-3" style={{ background: BG_CARD2 }}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
        {stat.name}
      </p>
      <p className="font-display text-2xl font-black text-white">{stat.value}</p>
      {/* Mini progress bar */}
      <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div
          className="h-1 rounded-full"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <p className="text-[10px]" style={{ color }}>
        {pct.toFixed(1)}% dari total
      </p>
    </div>
  );
}

function ProvinceGrid({ rows, total }: { rows: RankItem[]; total: number }) {
  if (rows.length === 0)
    return <p className="text-sm text-white/30">Belum ada data provinsi.</p>;
  const max = Math.max(...rows.map((r) => r.c), 1);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {rows.map((r, i) => {
        const color   = PIE_COLORS[i % PIE_COLORS.length];
        const barPct  = (r.c / max) * 100;
        const totPct  = total > 0 ? ((r.c / total) * 100).toFixed(1) : "0";
        return (
          <div
            key={i}
            className="rounded-lg p-3"
            style={{
              background: `${color}18`,
              border: `1px solid ${color}35`,
            }}
          >
            <p className="truncate text-[11px] font-medium text-white/60">{r.nama}</p>
            <p className="mt-1 font-display text-2xl font-bold text-white">{r.c}</p>
            <div
              className="mt-2 h-1 rounded-full"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <div
                className="h-1 rounded-full"
                style={{ width: `${barPct}%`, background: color }}
              />
            </div>
            <p className="mt-1 text-[10px]" style={{ color }}>
              {totPct}% total WK
            </p>
          </div>
        );
      })}
    </div>
  );
}

function IndonesiaMap({
  podIProvinces,
  pi10Provinces,
  perProvinsi,
}: {
  podIProvinces: string[];
  pi10Provinces: string[];
  perProvinsi: RankItem[];
}) {
  const podISet  = new Set(podIProvinces);
  const pi10Set  = new Set(pi10Provinces);
  const countMap = new Map(perProvinsi.map(r => [r.nama, r.c]));

  function getDBNames(neName: string): string[] {
    return NE_TO_DB[neName] ?? [neName];
  }

  function getProvinceColor(neName: string): string {
    const dbs = getDBNames(neName);
    if (dbs.some(n => pi10Set.has(n))) return "#1EB8A8";
    if (dbs.some(n => podISet.has(n))) return "#C9821B";
    return "rgba(30,184,168,0.1)";
  }

  function getProvinceStroke(neName: string): string {
    const dbs = getDBNames(neName);
    return dbs.some(n => podISet.has(n) || pi10Set.has(n))
      ? "rgba(255,255,255,0.35)"
      : "rgba(30,184,168,0.22)";
  }

  return (
    <div className="flex flex-1 flex-col gap-2" style={{ minHeight: 220 }}>
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-5 rounded-sm" style={{ background: "#C9821B" }} />
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
            POD I ({podIProvinces.length} prov)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-5 rounded-sm" style={{ background: "#1EB8A8" }} />
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
            PI 10% aktif ({pi10Provinces.length} prov)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="h-3 w-5 rounded-sm"
            style={{ background: "rgba(30,184,168,0.15)", border: "1px solid rgba(30,184,168,0.3)" }}
          />
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            Tidak ada WK
          </span>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 rounded-lg overflow-hidden" style={{ minHeight: 200 }}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [118, -2], scale: 1050 }}
          style={{ width: "100%", height: "100%", background: "transparent" }}
        >
          <Geographies geography="/indonesia-provinces.geojson">
            {({ geographies }) =>
              geographies.map(geo => {
                const neName  = geo.properties.name as string;
                const dbs     = getDBNames(neName);
                const wkCount = dbs.reduce((s, n) => s + (countMap.get(n) ?? 0), 0);
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getProvinceColor(neName)}
                    stroke={getProvinceStroke(neName)}
                    strokeWidth={0.5}
                    tabIndex={-1}
                    aria-label={`${dbs.join(" / ")}${wkCount > 0 ? ` — ${wkCount} WK` : ""}`}
                    style={{
                      default: { outline: "none" },
                      hover:   { outline: "none", opacity: 0.78, cursor: "pointer" },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {/* Marker untuk provinsi baru yang belum ada poligon di dataset NE */}
          {EXTRA_PROVINCE_MARKERS.map(([name, lon, lat]) => {
            const isPi10 = pi10Set.has(name);
            const isPodI = podISet.has(name);
            if (!isPi10 && !isPodI) return null;
            const color = isPi10 ? "#1EB8A8" : "#C9821B";
            return (
              <Marker key={name} coordinates={[lon, lat]}>
                <circle r={5} fill={color} stroke="rgba(255,255,255,0.5)" strokeWidth={1} />
                <text
                  y={-8}
                  fontSize={7}
                  textAnchor="middle"
                  fill={color}
                  fontWeight="bold"
                  style={{ pointerEvents: "none" }}
                >
                  {name}
                </text>
              </Marker>
            );
          })}
        </ComposableMap>
      </div>
    </div>
  );
}

function MilestoneTimeline({ stages }: { stages: StageInfo[] }) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max items-start py-1">
        {stages.map((s, i) => {
          const isDone    = s.status === "SELESAI";
          const isRunning = s.status === "BERJALAN";
          const prevDone  = i > 0 && stages[i - 1].status === "SELESAI";
          const dotColor  = isDone ? "#4ade80" : isRunning ? "#1EB8A8" : "#1a3352";
          const lineColor = prevDone ? "#4ade80" : "#1a3352";
          return (
            <div key={i} className="flex items-start">
              {i > 0 && (
                <div
                  className="mt-[9px] h-0.5 w-10 shrink-0"
                  style={{ background: lineColor }}
                />
              )}
              <div className="flex w-[72px] flex-col items-center gap-1.5">
                <div
                  className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2"
                  style={{ borderColor: dotColor, background: isDone || isRunning ? dotColor : BG_CARD2 }}
                >
                  {isDone && (
                    <svg className="h-2.5 w-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  {isRunning && (
                    <div className="h-2 w-2 rounded-full bg-white" />
                  )}
                </div>
                <span className="line-clamp-2 w-full px-1 text-center text-[10px] leading-tight text-white/40">
                  {s.nama}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
