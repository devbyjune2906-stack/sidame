"use client";

import Link from "next/link";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

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
const SHORT_NAME: Record<string, string> = {
  "Kepulauan Riau":            "Kep.Riau",
  "Kepulauan Bangka Belitung": "Bangka Blt",
  "DKI Jakarta":               "Jakarta",
  "DI Yogyakarta":             "Yogyakarta",
  "Nusa Tenggara Barat":       "NTB",
  "Nusa Tenggara Timur":       "NTT",
  "Kalimantan Barat":          "Kal-Bar",
  "Kalimantan Tengah":         "Kal-Teng",
  "Kalimantan Selatan":        "Kal-Sel",
  "Kalimantan Timur":          "Kal-Tim",
  "Kalimantan Utara":          "Kal-Ut",
  "Sulawesi Utara":            "Sul-Ut",
  "Sulawesi Tengah":           "Sul-Teng",
  "Sulawesi Barat":            "Sul-Bar",
  "Sulawesi Selatan":          "Sul-Sel",
  "Sulawesi Tenggara":         "Sul-Tgr",
  "Maluku Utara":              "Mal-Ut",
  "Sumatera Utara":            "Sum-Ut",
  "Sumatera Barat":            "Sum-Bar",
  "Sumatera Selatan":          "Sum-Sel",
  "Papua Barat Daya":          "P.Bar-Daya",
  "Papua Barat":               "P.Barat",
  "Papua Tengah":              "P.Tengah",
  "Papua Pegunungan":          "P.Peg",
  "Papua Selatan":             "P.Selatan",
};

// [name, cx, cy] — koordinat titik tengah provinsi dalam viewBox 810×285
// Dipetakan dari koordinat geografis: x=(lon-95)/46*810, y=(6-lat)/17*285
const PROVINCE_COORDS: [string, number, number][] = [
  ["Aceh",                         30,  22],
  ["Sumatera Utara",               71,  58],
  ["Sumatera Barat",               99, 115],
  ["Riau",                        123,  92],
  ["Kepulauan Riau",              167,  85],
  ["Jambi",                       132, 131],
  ["Bengkulu",                    128, 163],
  ["Sumatera Selatan",            158, 154],
  ["Kepulauan Bangka Belitung",   202, 144],
  ["Lampung",                     176, 177],
  ["Banten",                      197, 208],
  ["DKI Jakarta",                 208, 208],
  ["Jawa Barat",                  224, 218],
  ["Jawa Tengah",                 267, 224],
  ["DI Yogyakarta",               272, 232],
  ["Jawa Timur",                  308, 228],
  ["Bali",                        350, 242],
  ["Nusa Tenggara Barat",         376, 248],
  ["Nusa Tenggara Timur",         445, 253],
  ["Kalimantan Barat",            263,  92],
  ["Kalimantan Tengah",           331, 131],
  ["Kalimantan Selatan",          358, 145],
  ["Kalimantan Timur",            375,  92],
  ["Kalimantan Utara",            382,  42],
  ["Sulawesi Utara",              523,  76],
  ["Gorontalo",                   482,  91],
  ["Sulawesi Tengah",             464, 128],
  ["Sulawesi Barat",              426, 145],
  ["Sulawesi Selatan",            442, 170],
  ["Sulawesi Tenggara",           474, 175],
  ["Maluku",                      590, 155],
  ["Maluku Utara",                578,  76],
  ["Papua Barat Daya",            641, 117],
  ["Papua Barat",                 687, 121],
  ["Papua Tengah",                714, 170],
  ["Papua Pegunungan",            775, 168],
  ["Papua Selatan",               748, 220],
  ["Papua",                       756, 178],
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

  return (
    <div className="flex flex-1 flex-col gap-2" style={{ minHeight: 220 }}>
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#C9821B" }} />
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
            POD I ({podIProvinces.length} prov)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: "#1EB8A8" }} />
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
            PI 10% aktif ({pi10Provinces.length} prov)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full" style={{ background: "rgba(255,255,255,0.13)" }} />
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
            Tidak ada WK
          </span>
        </div>
      </div>

      {/* SVG Map */}
      <div className="flex-1">
        <svg
          viewBox="0 0 810 285"
          className="h-full w-full"
          preserveAspectRatio="xMidYMid meet"
          style={{ overflow: "visible" }}
        >
          {/* ── Island silhouettes ── */}
          <g fill="rgba(30,184,168,0.07)" stroke="rgba(30,184,168,0.2)" strokeWidth="0.6">
            {/* Sumatra */}
            <path d="M 14,14 L 42,8 L 70,22 L 95,58 L 110,90 L 128,128 L 148,162 L 170,198 L 192,218 L 180,228 L 155,212 L 132,178 L 110,148 L 88,110 L 70,72 L 46,32 Z" />
            {/* Kalimantan */}
            <path d="M 232,84 L 286,76 L 345,76 L 390,92 L 400,124 L 395,165 L 380,200 L 353,220 L 316,222 L 280,218 L 250,198 L 234,170 L 228,138 L 230,108 Z" />
            {/* Java */}
            <path d="M 192,222 L 250,228 L 308,236 L 358,252 L 365,266 L 350,274 L 295,260 L 238,248 L 192,236 Z" />
            {/* Sulawesi */}
            <path d="M 408,164 L 416,142 L 425,120 L 440,104 L 456,90 L 474,82 L 492,78 L 510,80 L 527,78 L 530,92 L 510,102 L 491,112 L 480,126 L 473,144 L 470,164 L 478,184 L 475,204 L 460,216 L 446,220 L 435,208 L 428,192 L 418,178 Z" />
            {/* Papua */}
            <path d="M 590,130 L 640,116 L 672,118 L 703,128 L 733,138 L 765,148 L 793,163 L 810,180 L 810,244 L 790,258 L 758,260 L 728,254 L 698,242 L 668,224 L 640,207 L 614,188 L 596,164 Z" />
            {/* Kepulauan Riau */}
            <ellipse cx="170" cy="88"  rx="12" ry="7"  />
            {/* Bangka Belitung */}
            <ellipse cx="202" cy="148" rx="14" ry="8"  />
            {/* Bali */}
            <ellipse cx="350" cy="262" rx="12" ry="7"  />
            {/* NTB */}
            <ellipse cx="376" cy="267" rx="14" ry="7"  />
            {/* NTT Flores */}
            <ellipse cx="416" cy="271" rx="18" ry="7"  />
            {/* NTT Timor */}
            <ellipse cx="455" cy="273" rx="13" ry="6"  />
            {/* Maluku Utara */}
            <ellipse cx="548" cy="110" rx="12" ry="18" />
            <ellipse cx="572" cy="128" rx="8"  ry="14" />
            {/* Maluku */}
            <ellipse cx="562" cy="168" rx="10" ry="18" />
            <ellipse cx="580" cy="188" rx="10" ry="14" />
          </g>

          {/* ── Province markers ── */}
          {PROVINCE_COORDS.map(([name, cx, cy]) => {
            const isPodI  = podISet.has(name);
            const isPi10  = pi10Set.has(name);
            const wkCount = countMap.get(name) ?? 0;
            const active  = isPodI || isPi10;
            const color   = isPi10
              ? "#1EB8A8"
              : isPodI
              ? "#C9821B"
              : "rgba(255,255,255,0.12)";
            const r = active ? 5 : 2.5;

            return (
              <g key={name}>
                <title>
                  {name}
                  {wkCount > 0 ? ` — ${wkCount} WK POD I` : ""}
                  {isPi10 ? " · PI 10% aktif" : ""}
                </title>

                {/* Pulse animation for PI 10% */}
                {isPi10 && (
                  <circle cx={cx} cy={cy} r={r} fill="#1EB8A8" opacity="0">
                    <animate attributeName="r"       values={`${r};${r + 9};${r}`}   dur="2.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.3;0;0.3"               dur="2.5s" repeatCount="indefinite" />
                  </circle>
                )}
                {/* Soft glow for POD I (non PI10) */}
                {isPodI && !isPi10 && (
                  <circle cx={cx} cy={cy} r={r + 4} fill="#C9821B" opacity="0.14" />
                )}
                {/* Orange outer ring when province has both */}
                {isPodI && isPi10 && (
                  <circle cx={cx} cy={cy} r={r + 3} fill="none" stroke="#C9821B" strokeWidth="1.2" opacity="0.55" />
                )}
                {/* Main dot */}
                <circle cx={cx} cy={cy} r={r} fill={color} />

                {/* Label only for PI 10% provinces */}
                {isPi10 && (
                  <text
                    x={cx}
                    y={cy - r - 2}
                    fontSize="6.5"
                    fill="#1EB8A8"
                    textAnchor="middle"
                    fontWeight="600"
                  >
                    {SHORT_NAME[name] ?? name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
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
