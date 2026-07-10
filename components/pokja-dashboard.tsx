"use client";

import Link from "next/link";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

// ── Color palette — matches DME admin dashboard ────────────────────
const BG_MAIN    = "#F0F4F3";
const BG_HEADER  = "#0B5E54";
const BG_TITLE   = "#08443D";
const BG_CARD    = "#FFFFFF";
const BG_CARD2   = "#F6F8F7";
const BORDER     = "#E2E7E5";
const TEXT_MAIN  = "#16211F";
const TEXT_MUTED = "#64726F";
const PIE_COLORS = ["#0B5E54", "#0F7A6E", "#C9821B", "#2E7D5B", "#6B8E86", "#B4322B"];

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

export type PokjaStats = Record<string, number | null>;

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
  provinsiDilelang?: string[];
  pokjaStats?: PokjaStats;
  globalStatusItems?: StatusItem[];
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
  provinsiDilelang = [],
  pokjaStats = {},
  globalStatusItems = [],
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

      {/* ── Global status strip ────────────────────────────────── */}
      {globalStatusItems.length > 0 && (
        <GlobalStatusStrip items={globalStatusItems} />
      )}

      {/* ── Pokja-specific KPI strip ───────────────────────────── */}
      <PokjaKpiStrip pokja={pokja} stats={pokjaStats} />

      {/* ── Main body ──────────────────────────────────────────── */}
      <div className="flex min-h-[360px]" style={{ borderBottom: `1px solid ${BORDER}` }}>

        {/* Left: Quick Access */}
        <div
          className="flex w-52 shrink-0 flex-col gap-3 p-4"
          style={{ background: BG_CARD2, borderRight: `1px solid ${BORDER}` }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: TEXT_MUTED }}>
            Quick Access
          </p>

          {/* Filter placeholder */}
          <div
            className="rounded px-2 py-1.5 text-xs"
            style={{ background: BG_CARD, border: `1px solid ${BORDER}`, color: TEXT_MUTED }}
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
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: TEXT_MUTED }}>
              Contract Areas
            </p>
            <div className="space-y-1.5">
              {perProvinsi.slice(0, 6).map((p, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="flex-1 truncate" style={{ color: TEXT_MUTED }}>{p.nama}</span>
                  <span className="font-semibold" style={{ color: TEXT_MAIN }}>{p.c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Indonesia Map — semua pokja */}
        <div className="flex flex-1 flex-col p-5" style={{ background: BG_MAIN }}>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: TEXT_MUTED }}>
            {pokja === "DMED"
              ? "Peta Sebaran WK DMED — POD I & PI 10%"
              : pokja === "DMEW"
              ? "Peta Sebaran WK DMEW — Usulan Baru & Sedang Dilelang"
              : pokja === "DMEN"
              ? "Peta Sebaran WK DMEN — Non Konvensional"
              : pokja === "DMEE"
              ? "Peta Sebaran WK DMEE — Eksplorasi"
              : pokja === "DMEP"
              ? "Peta Sebaran WK DMEP — Perpanjangan"
              : `Peta Sebaran WK ${pokja}`}
          </p>
          <IndonesiaMap
            primaryProvinces={perProvinsi.map(r => r.nama)}
            highlightProvinces={
              pokja === "DMED" ? provinsiPi10 :
              pokja === "DMEW" ? provinsiDilelang : []
            }
            perProvinsi={perProvinsi}
            primaryLabel={
              pokja === "DMED" ? "POD I" :
              pokja === "DMEW" ? "WK Usulan Baru" :
              pokja === "DMEN" ? "WK Non Konvensional" :
              pokja === "DMEE" ? "WK Eksplorasi" :
              pokja === "DMEP" ? "WK Perpanjangan" :
              `WK ${pokja}`
            }
            highlightLabel={
              pokja === "DMED" ? "PI 10% aktif" :
              pokja === "DMEW" ? "Sedang Dilelang" : ""
            }
          />
        </div>

        {/* Right: Pie chart */}
        <div
          className="w-64 shrink-0 p-4"
          style={{ background: BG_CARD2, borderLeft: `1px solid ${BORDER}` }}
        >
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: TEXT_MUTED }}>
            Distribusi Status
          </p>
          <p className="mb-2 text-[11px]" style={{ color: TEXT_MUTED }}>Pipeline Pokja {pokja}</p>
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
                  background: BG_CARD,
                  border: `1px solid ${BORDER}`,
                  borderRadius: "8px",
                  color: TEXT_MAIN,
                  fontSize: 11,
                }}
              />
              <Legend
                iconSize={8}
                wrapperStyle={{ fontSize: 10, color: TEXT_MUTED }}
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
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: TEXT_MUTED }}>
            Tipe Kontrak
          </p>
          <p className="mb-3 text-[11px]" style={{ color: TEXT_MUTED }}>Cost Recovery vs Gross Split</p>
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
                tick={{ fontSize: 10, fill: TEXT_MUTED }}
              />
              <Tooltip
                contentStyle={{
                  background: BG_CARD,
                  border: `1px solid ${BORDER}`,
                  borderRadius: "6px",
                  color: TEXT_MAIN,
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
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: TEXT_MUTED }}>
            Top Operator / K3S
          </p>
          <p className="mb-3 text-[11px]" style={{ color: TEXT_MUTED }}>Berdasarkan jumlah WK</p>
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
                    <span className="truncate text-[11px]" style={{ color: TEXT_MUTED }}>{r.nama}</span>
                    <span className="ml-2 shrink-0 text-[11px] font-bold" style={{ color: TEXT_MAIN }}>{r.c}</span>
                  </div>
                  <div className="mt-0.5 h-0.5 rounded-full" style={{ background: BORDER }}>
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
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: TEXT_MUTED }}>
            Progress Milestone
          </p>
          <p className="mb-3 text-[11px]" style={{ color: TEXT_MUTED }}>Tahapan WK dalam proses</p>
          {milestoneData.length === 0 ? (
            <p className="text-[11px]" style={{ color: TEXT_MUTED }}>Belum ada data milestone.</p>
          ) : (
            <div className="space-y-4">
              {[
                { label: "Selesai",     value: totalSelesai,    color: "#2E7D5B" },
                { label: "Berjalan",    value: totalBerjalan,   color: "#C9821B" },
                { label: "Belum Mulai", value: totalBelumMulai, color: "#6B8E86" },
              ].map((item) => {
                const tot = totalSelesai + totalBerjalan + totalBelumMulai;
                const pct = tot > 0 ? (item.value / tot) * 100 : 0;
                return (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span style={{ color: TEXT_MUTED }}>{item.label}</span>
                      <span className="font-bold" style={{ color: TEXT_MAIN }}>{item.value}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: BORDER }}>
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
              <p className="text-[10px]" style={{ color: TEXT_MUTED }}>{milestoneData.length} WK terpantau</p>
            </div>
          )}
        </div>

        {/* Panel 4: Status recap table */}
        <div className="p-4" style={{ background: BG_CARD }}>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: TEXT_MUTED }}>
            Rekap Status WK
          </p>
          <p className="mb-3 text-[11px]" style={{ color: TEXT_MUTED }}>Seluruh WK Pokja {pokja}</p>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                <th className="pb-1.5 text-left text-[10px] font-semibold uppercase tracking-wide" style={{ color: TEXT_MUTED }}>
                  Status
                </th>
                <th className="pb-1.5 text-right text-[10px] font-semibold uppercase tracking-wide" style={{ color: TEXT_MUTED }}>
                  Jml
                </th>
                <th className="pb-1.5 text-right text-[10px] font-semibold uppercase tracking-wide" style={{ color: TEXT_MUTED }}>
                  %
                </th>
              </tr>
            </thead>
            <tbody>
              {statusItems.filter((s) => s.value > 0).map((s) => (
                <tr key={s.key} style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <td className="py-1.5">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: STATUS_COLOR[s.key] ?? "#6B8E86" }}
                      />
                      <span className="text-[11px]" style={{ color: TEXT_MUTED }}>{s.name}</span>
                    </div>
                  </td>
                  <td className="py-1.5 text-right text-[11px] font-bold" style={{ color: TEXT_MAIN }}>
                    {s.value}
                  </td>
                  <td className="py-1.5 text-right text-[10px]" style={{ color: TEXT_MUTED }}>
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
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest" style={{ color: TEXT_MUTED }}>
            Detail Milestone Tahapan
          </p>
          <p className="mb-4 text-[11px]" style={{ color: TEXT_MUTED }}>WK dalam proses — Pokja {pokja}</p>
          <div
            className="overflow-hidden rounded-lg"
            style={{ border: `1px solid ${BORDER}`, background: BG_CARD }}
          >
            {milestoneData.map((r, i) => (
              <div
                key={`${r.wkId}-${r.subpokja}-${i}`}
                className="px-4 py-4 transition-colors hover:bg-[#F6F8F7]"
                style={{
                  borderBottom: i < milestoneData.length - 1 ? `1px solid ${BORDER}` : "none",
                  background: i % 2 === 0 ? BG_CARD : BG_CARD2,
                }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex min-w-0 items-center gap-2">
                    <Link
                      href={`/wk/${r.wkId}`}
                      className="truncate text-sm font-semibold hover:underline"
                      style={{ color: "#0B5E54", textDecorationColor: "#0B5E54" }}
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
                        style={{ background: BORDER, color: TEXT_MUTED }}
                      >
                        Belum Ada Tahap
                      </span>
                    ) : (
                      <span
                        className="rounded px-2 py-0.5 text-[10px] font-bold"
                        style={{ background: BORDER, color: TEXT_MUTED }}
                      >
                        Belum Mulai
                      </span>
                    )}
                  </div>
                </div>
                {r.stages.length === 0 ? (
                  <p className="text-xs" style={{ color: TEXT_MUTED }}>Belum ada tahap terdaftar.</p>
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

const GLOBAL_STATUS_META: Record<string, { label: string; accent: string; icon: React.ReactNode }> = {
  WK_USULAN_BARU:  { label: "WK Usulan Baru",  accent: "#1EB8A8", icon: <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5"><path d="M3 2h10v1H3zm-1 2h12v1H2zm1 2h10l1 8H2L3 6z"/></svg> },
  SEDANG_DILELANG: { label: "Sedang Dilelang", accent: "#0B9E8E", icon: <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5"><path d="M2 2h12v2H2zm0 3h12v9H2zm2 2v5h8V7H4z"/></svg> },
  EKSPLORASI:      { label: "Eksplorasi",       accent: "#C9821B", icon: <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398l3.85 3.85a1 1 0 0 0 1.415-1.415l-3.868-3.833zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg> },
  POD_I:           { label: "POD I",            accent: "#2E7D5B", icon: <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5"><path d="M14 1H2a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V2a1 1 0 00-1-1zM4 4h8v1H4zm0 3h8v1H4zm0 3h5v1H4z"/></svg> },
  ONSTREAM:        { label: "Onstream / Produksi", accent: "#4ade80", icon: <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5"><path d="M8 1C5 1 3 4 3 7c0 3 2 6 5 8 3-2 5-5 5-8 0-3-2-6-5-6z"/></svg> },
};

function GlobalStatusStrip({ items }: { items: { key: string; name: string; value: number }[] }) {
  const totalGlobal = items.reduce((acc, i) => acc + i.value, 0);
  return (
    <div style={{ background: BG_CARD2, borderBottom: `1px solid ${BORDER}` }}>
      <div className="flex items-center gap-2 px-4 pt-2 pb-1">
        <div className="h-px flex-1" style={{ background: BORDER }} />
        <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: TEXT_MUTED }}>
          Ringkasan Status WK Nasional
        </p>
        <div className="h-px flex-1" style={{ background: BORDER }} />
      </div>
      <div
        className="grid gap-px"
        style={{
          gridTemplateColumns: `repeat(${items.length}, 1fr)`,
          background: BORDER,
        }}
      >
        {items.map((item) => {
          const meta = GLOBAL_STATUS_META[item.key];
          const pct = totalGlobal > 0 ? Math.round((item.value / totalGlobal) * 100) : 0;
          return (
            <div
              key={item.key}
              className="flex flex-col gap-1 px-3 py-2"
              style={{ background: BG_CARD, borderTop: `2px solid ${meta?.accent ?? BORDER}` }}
            >
              <div className="flex items-center gap-1.5">
                <span style={{ color: meta?.accent ?? TEXT_MUTED }}>{meta?.icon}</span>
                <p className="text-[9px] font-semibold uppercase tracking-wide leading-tight" style={{ color: TEXT_MUTED }}>
                  {meta?.label ?? item.name}
                </p>
              </div>
              <p className="font-display text-xl font-black leading-none" style={{ color: TEXT_MAIN }}>
                {item.value}
              </p>
              <p className="text-[9px]" style={{ color: meta?.accent ?? TEXT_MUTED }}>
                {pct}% dari total nasional
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KpiTile({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col gap-2 p-3"
      style={{ background: BG_CARD, borderLeft: `3px solid ${accent}` }}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded" style={{ background: `${accent}18` }}>
          {icon}
        </span>
        <p className="text-[10px] font-semibold uppercase tracking-wide leading-tight" style={{ color: TEXT_MUTED }}>
          {label}
        </p>
      </div>
      <p className="font-display text-2xl font-black leading-none" style={{ color: TEXT_MAIN }}>{value}</p>
      {sub && <p className="text-[10px]" style={{ color: accent }}>{sub}</p>}
    </div>
  );
}

function PokjaKpiStrip({ pokja, stats }: { pokja: string; stats: PokjaStats }) {
  const n = (key: string) => stats[key] ?? 0;
  const fmt = (v: number | null) =>
    v == null ? "—" : v >= 1_000_000
      ? `${(v / 1_000_000).toFixed(2)} jt`
      : v >= 1_000
      ? `${(v / 1_000).toFixed(1)} rb`
      : v.toLocaleString("id-ID", { maximumFractionDigits: 2 });

  let tiles: { label: string; value: string | number; sub?: string; accent: string; icon: React.ReactNode }[] = [];

  if (pokja === "DMEW") {
    tiles = [
      {
        label: "Sub Pokja DMEW-S",
        value: n("DMEW-S"),
        sub: "WK Sedang Dilelang",
        accent: "#0B5E54",
        icon: <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" style={{ color: "#0B5E54" }}><path d="M2 2h12v1H2zm0 4h12v1H2zm0 4h8v1H2z"/></svg>,
      },
      {
        label: "Sub Pokja DMEW-T",
        value: n("DMEW-T"),
        sub: "WK Usulan Baru",
        accent: "#0F7A6E",
        icon: <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" style={{ color: "#0F7A6E" }}><path d="M2 2h12v1H2zm0 4h12v1H2zm0 4h8v1H2z"/></svg>,
      },
      {
        label: "Jalur Reguler",
        value: n("jalur_REGULER"),
        sub: "WK via jalur reguler",
        accent: "#2E7D5B",
        icon: <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" style={{ color: "#2E7D5B" }}><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 12.5A5.5 5.5 0 118 2.5 5.5 5.5 0 018 13.5z"/></svg>,
      },
      {
        label: "Joint Study",
        value: n("jalur_JOINT_STUDY"),
        sub: "WK via joint study",
        accent: "#C9821B",
        icon: <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" style={{ color: "#C9821B" }}><path d="M5 4a3 3 0 106 0A3 3 0 005 4zm-3 9a6 6 0 0112 0H2z"/></svg>,
      },
      {
        label: "Diusulkan WK Baru",
        value: n("diusulkanWkBaru"),
        sub: "WK baru diusulkan",
        accent: "#6B8E86",
        icon: <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" style={{ color: "#6B8E86" }}><path d="M8 1v7H1a7 7 0 007-7zm1 0a7 7 0 017 7H9V1z"/></svg>,
      },
    ];
  } else if (pokja === "DMEN") {
    tiles = [
      {
        label: "Sub Pokja DMEN-N",
        value: n("DMEN-N"),
        sub: "WK Non-Konvensional Baru",
        accent: "#2E7D5B",
        icon: <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" style={{ color: "#2E7D5B" }}><path d="M2 2h12v1H2zm0 4h12v1H2zm0 4h8v1H2z"/></svg>,
      },
      {
        label: "Sub Pokja DMEN-K",
        value: n("DMEN-K"),
        sub: "WK Non-Konvensional Khusus",
        accent: "#0B5E54",
        icon: <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" style={{ color: "#0B5E54" }}><path d="M2 2h12v1H2zm0 4h12v1H2zm0 4h8v1H2z"/></svg>,
      },
      {
        label: "Jalur Reguler",
        value: n("jalur_REGULER"),
        sub: "via jalur reguler",
        accent: "#C9821B",
        icon: <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" style={{ color: "#C9821B" }}><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 12.5A5.5 5.5 0 118 2.5 5.5 5.5 0 018 13.5z"/></svg>,
      },
      {
        label: "Joint Study",
        value: n("jalur_JOINT_STUDY"),
        sub: "via joint study",
        accent: "#6B8E86",
        icon: <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" style={{ color: "#6B8E86" }}><path d="M5 4a3 3 0 106 0A3 3 0 005 4zm-3 9a6 6 0 0112 0H2z"/></svg>,
      },
    ];
  } else if (pokja === "DMEE") {
    tiles = [
      {
        label: "Sub Pokja DMEE-L",
        value: n("DMEE-L"),
        sub: "WK Eksplorasi (Lanjutan)",
        accent: "#C9821B",
        icon: <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" style={{ color: "#C9821B" }}><path d="M2 2h12v1H2zm0 4h12v1H2zm0 4h8v1H2z"/></svg>,
      },
      {
        label: "Sub Pokja DMEE-M",
        value: n("DMEE-M"),
        sub: "WK Eksplorasi (Mandatory)",
        accent: "#0B5E54",
        icon: <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" style={{ color: "#0B5E54" }}><path d="M2 2h12v1H2zm0 4h12v1H2zm0 4h8v1H2z"/></svg>,
      },
      {
        label: "Total Luas Wilayah Sisa",
        value: fmt(stats.totalLuasSisa ?? 0),
        sub: "km² (akumulasi)",
        accent: "#2E7D5B",
        icon: <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" style={{ color: "#2E7D5B" }}><path d="M1 1h14v14H1V1zm1 1v12h12V2H2zm2 2h8v8H4V4zm1 1v6h6V5H5z"/></svg>,
      },
    ];
  } else if (pokja === "DMED") {
    tiles = [
      {
        label: "DMED-T · POD I",
        value: n("DMED-T_PODI"),
        sub: "Pengajuan POD I",
        accent: "#B4322B",
        icon: <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" style={{ color: "#B4322B" }}><path d="M3 1h10l2 3v10H1V4L3 1zm1 1L2.5 4h11L12 2H4zm-2 3v8h12V5H2z"/></svg>,
      },
      {
        label: "DMED-T · PI 10%",
        value: n("DMED-T_PI10"),
        sub: "Participating Interest 10%",
        accent: "#0F7A6E",
        icon: <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" style={{ color: "#0F7A6E" }}><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-1 4h2v4H7V5zm0 5h2v2H7v-2z"/></svg>,
      },
      {
        label: "DMED-E · Perpanjangan",
        value: n("DMED-E"),
        sub: "Perpanjangan Kontrak",
        accent: "#0B5E54",
        icon: <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" style={{ color: "#0B5E54" }}><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.5 3.5h1V8l3 1.5-.5 1-3.5-1.75V4.5z"/></svg>,
      },
    ];
  } else if (pokja === "DMEP") {
    tiles = [
      {
        label: "Sub Pokja DMEP-L",
        value: n("DMEP-L"),
        sub: "WK Onstream (Lanjutan)",
        accent: "#16211F",
        icon: <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" style={{ color: "#16211F" }}><path d="M2 2h12v1H2zm0 4h12v1H2zm0 4h8v1H2z"/></svg>,
      },
      {
        label: "Sub Pokja DMEP-P",
        value: n("DMEP-P"),
        sub: "WK Onstream (Produksi)",
        accent: "#0B5E54",
        icon: <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" style={{ color: "#0B5E54" }}><path d="M2 2h12v1H2zm0 4h12v1H2zm0 4h8v1H2z"/></svg>,
      },
      {
        label: "Sisa Cadangan Minyak",
        value: fmt(stats.totalCadanganMinyak ?? 0),
        sub: "total akumulasi",
        accent: "#C9821B",
        icon: <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" style={{ color: "#C9821B" }}><path d="M8 1C5 1 3 4 3 7c0 3 2 6 5 8 3-2 5-5 5-8 0-3-2-6-5-6z"/></svg>,
      },
      {
        label: "Sisa Cadangan Gas",
        value: fmt(stats.totalCadanganGas ?? 0),
        sub: "total akumulasi",
        accent: "#0F7A6E",
        icon: <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" style={{ color: "#0F7A6E" }}><path d="M4 2h8v1l1 2v8H3V5l1-2V2zm1 1v1h6V3H5zm-1 2-1 1.5V12h10V6.5L12 5H4z"/></svg>,
      },
    ];
  }

  if (tiles.length === 0) return null;

  return (
    <div
      className="grid gap-px"
      style={{
        gridTemplateColumns: `repeat(${tiles.length}, 1fr)`,
        background: BORDER,
        borderBottom: `1px solid ${BORDER}`,
      }}
    >
      {tiles.map((t) => (
        <KpiTile key={t.label} {...t} />
      ))}
    </div>
  );
}

function StatCard({ stat, total }: { stat: StatusItem; total: number }) {
  const pct = total > 0 ? (stat.value / total) * 100 : 0;
  const color = STATUS_COLOR[stat.key] ?? "#0B5E54";
  return (
    <div className="flex flex-col gap-2 p-3" style={{ background: BG_CARD }}>
      <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: TEXT_MUTED }}>
        {stat.name}
      </p>
      <p className="font-display text-2xl font-black" style={{ color: TEXT_MAIN }}>{stat.value}</p>
      <div className="h-1 rounded-full" style={{ background: BORDER }}>
        <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="text-[10px]" style={{ color }}>
        {pct.toFixed(1)}% dari total
      </p>
    </div>
  );
}

function ProvinceGrid({ rows, total }: { rows: RankItem[]; total: number }) {
  if (rows.length === 0)
    return <p className="text-sm" style={{ color: TEXT_MUTED }}>Belum ada data provinsi.</p>;
  const max = Math.max(...rows.map((r) => r.c), 1);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {rows.map((r, i) => {
        const color  = PIE_COLORS[i % PIE_COLORS.length];
        const barPct = (r.c / max) * 100;
        const totPct = total > 0 ? ((r.c / total) * 100).toFixed(1) : "0";
        return (
          <div
            key={i}
            className="rounded-lg p-3"
            style={{ background: BG_CARD, border: `1px solid ${BORDER}`, boxShadow: "0 1px 2px rgba(16,33,31,0.04)" }}
          >
            <p className="truncate text-[11px] font-medium" style={{ color: TEXT_MUTED }}>{r.nama}</p>
            <p className="mt-1 font-display text-2xl font-bold" style={{ color: TEXT_MAIN }}>{r.c}</p>
            <div className="mt-2 h-1 rounded-full" style={{ background: BORDER }}>
              <div className="h-1 rounded-full" style={{ width: `${barPct}%`, background: color }} />
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
  primaryProvinces,
  highlightProvinces,
  perProvinsi,
  primaryLabel,
  highlightLabel,
}: {
  primaryProvinces: string[];
  highlightProvinces: string[];
  perProvinsi: RankItem[];
  primaryLabel: string;
  highlightLabel: string;
}) {
  const primarySet   = new Set(primaryProvinces);
  const highlightSet = new Set(highlightProvinces);
  const countMap     = new Map(perProvinsi.map(r => [r.nama, r.c]));

  function getDBNames(neName: string): string[] {
    return NE_TO_DB[neName] ?? [neName];
  }

  function getProvinceColor(neName: string): string {
    const dbs = getDBNames(neName);
    if (dbs.some(n => highlightSet.has(n))) return "#0B5E54";
    if (dbs.some(n => primarySet.has(n)))   return "#C9821B";
    return "#D8E4E2";
  }

  function getProvinceStroke(neName: string): string {
    const dbs = getDBNames(neName);
    return dbs.some(n => primarySet.has(n) || highlightSet.has(n))
      ? "rgba(255,255,255,0.5)"
      : "#FFFFFF";
  }

  return (
    <div className="flex flex-1 flex-col gap-2" style={{ minHeight: 220 }}>
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-5 rounded-sm" style={{ background: "#C9821B" }} />
          <span className="text-[10px]" style={{ color: TEXT_MUTED }}>
            {primaryLabel} ({primaryProvinces.length} prov)
          </span>
        </div>
        {highlightLabel && (
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-5 rounded-sm" style={{ background: "#0B5E54" }} />
            <span className="text-[10px]" style={{ color: TEXT_MUTED }}>
              {highlightLabel} ({highlightProvinces.length} prov)
            </span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <div
            className="h-3 w-5 rounded-sm"
            style={{ background: BORDER, border: `1px solid ${BORDER}` }}
          />
          <span className="text-[10px]" style={{ color: TEXT_MUTED }}>
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
            const isHighlight = highlightSet.has(name);
            const isPrimary   = primarySet.has(name);
            if (!isHighlight && !isPrimary) return null;
            const color = isHighlight ? "#1EB8A8" : "#C9821B";
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
          const dotColor  = isDone ? "#2E7D5B" : isRunning ? "#0B5E54" : BORDER;
          const lineColor = prevDone ? "#2E7D5B" : BORDER;
          return (
            <div key={i} className="flex items-start">
              {i > 0 && (
                <div className="mt-[9px] h-0.5 w-10 shrink-0" style={{ background: lineColor }} />
              )}
              <div className="flex w-[72px] flex-col items-center gap-1.5">
                <div
                  className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2"
                  style={{ borderColor: dotColor, background: isDone || isRunning ? dotColor : BG_CARD }}
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
                  {isRunning && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>
                <span className="line-clamp-2 w-full px-1 text-center text-[10px] leading-tight" style={{ color: TEXT_MUTED }}>
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
