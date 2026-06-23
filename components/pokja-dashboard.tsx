"use client";

import Link from "next/link";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const PIE_COLORS = ["#0B5E54", "#0F7A6E", "#C9821B", "#2E7D5B", "#6B8E86", "#B4322B"];

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

const STATUS_ICON: Record<string, string> = {
  WK_USULAN_BARU:    "🗂",
  SEDANG_DILELANG:   "📋",
  EKSPLORASI:        "🔍",
  POD_I:             "📝",
  ONSTREAM:          "⛽",
  TIDAK_DILANJUTKAN: "⛔",
};

const SUBPOKJA_COLOR: Record<string, string> = {
  "DMEW-S": "bg-petroleum/10 text-petroleum-dark",
  "DMEW-T": "bg-petroleum/20 text-petroleum-dark",
  "DMEN-N": "bg-ok/10 text-ok",
  "DMEN-K": "bg-ok/20 text-ok",
  "DMEE-L": "bg-warn/10 text-warn",
  "DMEE-M": "bg-warn/20 text-warn",
  "DMED-T": "bg-danger/10 text-danger",
  "DMED-E": "bg-danger/20 text-danger",
  "DMEP-L": "bg-ink/10 text-ink",
  "DMEP-P": "bg-ink/20 text-ink",
};

const POKJA_LINKS: Record<string, { label: string; href: string; color: string }[]> = {
  DMEW: [
    { label: "Sub Pokja DMEW-S",          href: "/wk/dmew-s",  color: "bg-petroleum text-white" },
    { label: "Sub Pokja DMEW-T",          href: "/wk/dmew-t",  color: "bg-petroleum-light text-white" },
  ],
  DMEN: [
    { label: "Sub Pokja DMEN-N",          href: "/wk/dmen-n",  color: "bg-ok text-white" },
    { label: "Sub Pokja DMEN-K",          href: "/wk/dmen-k",  color: "bg-petroleum text-white" },
  ],
  DMEE: [
    { label: "Sub Pokja DMEE-L",          href: "/wk/dmee-l",  color: "bg-warn text-white" },
    { label: "Sub Pokja DMEE-M",          href: "/wk/dmee-m",  color: "bg-petroleum text-white" },
  ],
  DMED: [
    { label: "DMED-T — Pengajuan POD I",  href: "/wk/dmed-t",  color: "bg-danger text-white" },
    { label: "DMED-E — Perpanjangan",     href: "/wk/dmed-e",  color: "bg-petroleum text-white" },
  ],
  DMEP: [
    { label: "Sub Pokja DMEP-L",          href: "/wk/dmep-l",  color: "bg-ink text-white" },
    { label: "Sub Pokja DMEP-P",          href: "/wk/dmep-p",  color: "bg-petroleum text-white" },
  ],
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
};

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
}: PokjaDashboardProps) {
  const activeStatuses = statusItems.filter(
    (s) => s.key !== "TIDAK_DILANJUTKAN" && s.value > 0,
  );
  const tidakDilanjutkan = statusItems.find((s) => s.key === "TIDAK_DILANJUTKAN");
  const quickLinks = POKJA_LINKS[pokja] ?? [];

  return (
    <div className="relative -mx-6 -mt-8 min-h-screen bg-[#F0F4F3]">

      {/* ── Hero Header ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-petroleum px-6 py-5">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #ffffff 0%, transparent 60%)" }}
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
              POKJA {pokja} — OPERATIONAL DASHBOARD
            </h1>
            <p className="mt-0.5 text-xs text-white/50">Selamat datang, {userName}</p>
          </div>
          <div className="hidden sm:block">
            <span className="font-display text-5xl font-black tracking-tight text-white/20">
              {pokja}
            </span>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ────────────────────────────────────────────── */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 sm:col-span-1 rounded-xl bg-petroleum px-4 py-3 text-white shadow-card lg:col-span-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">Total WK</p>
            <p className="mt-1 font-display text-4xl font-black">{total}</p>
            <p className="mt-0.5 text-[11px] text-white/60">Wilayah Kerja</p>
          </div>
          {statusItems
            .filter((s) => s.key !== "TIDAK_DILANJUTKAN")
            .map((s) => (
              <div key={s.key} className="rounded-xl bg-white px-4 py-3 shadow-card">
                <p className="text-lg">{STATUS_ICON[s.key] ?? "📊"}</p>
                <p className="mt-1 font-display text-3xl font-bold text-ink">{s.value}</p>
                <p className="mt-0.5 text-[11px] leading-tight text-muted">{s.name}</p>
              </div>
            ))}
        </div>
        {tidakDilanjutkan && tidakDilanjutkan.value > 0 && (
          <p className="mt-2 text-right text-xs text-muted">
            ⛔ {tidakDilanjutkan.value} WK tidak dilanjutkan
          </p>
        )}
      </div>

      {/* ── Main Body ─────────────────────────────────────────────── */}
      <div className="grid gap-4 px-6 pb-6 lg:grid-cols-4">

        {/* Left: Sub Pokja links + Provinsi */}
        <div className="flex flex-col gap-3 lg:col-span-1">
          {quickLinks.length > 0 && (
            <div className="rounded-xl bg-white p-4 shadow-card">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted">
                Sub Pokja
              </p>
              <div className="flex flex-col gap-2">
                {quickLinks.map((l) => (
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
          )}

          <div className="rounded-xl bg-white p-4 shadow-card">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted">
              WK per Provinsi (Top 8)
            </p>
            <RankBar rows={perProvinsi} color="#0B5E54" />
          </div>
        </div>

        {/* Right: Charts */}
        <div className="grid gap-4 lg:col-span-3 lg:grid-cols-2">

          {/* Status Pie */}
          <div className="rounded-xl bg-white p-4 shadow-card">
            <p className="mb-1 text-sm font-semibold text-ink">Distribusi Status WK</p>
            <p className="mb-2 text-[11px] text-muted">Pipeline Pokja {pokja}</p>
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
            <p className="mb-1 text-sm font-semibold text-ink">Tipe Kontrak</p>
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

          {/* Operator Ranking */}
          <div className="rounded-xl bg-white p-4 shadow-card">
            <p className="mb-1 text-sm font-semibold text-ink">Top Operator / K3S</p>
            <p className="mb-3 text-[11px] text-muted">Berdasarkan jumlah WK</p>
            <RankBar rows={perOperator} color="#0F7A6E" />
          </div>

          {/* Rekap Table */}
          <div className="rounded-xl bg-white p-4 shadow-card">
            <p className="mb-1 text-sm font-semibold text-ink">Rekap per Status</p>
            <p className="mb-3 text-[11px] text-muted">Seluruh WK Pokja {pokja}</p>
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
                      <span className="mr-1">{STATUS_ICON[s.key]}</span>
                      {s.name}
                    </td>
                    <td className="py-1.5 text-right font-medium text-ink">{s.value}</td>
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

      {/* ── Milestone Section ─────────────────────────────────────── */}
      {milestoneData.length > 0 && (
        <div className="px-6 pb-8">
          <div className="rounded-xl bg-white p-4 shadow-card">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-ink">Progress Milestone Tahapan</p>
                <p className="text-[11px] text-muted">WK dalam proses — Pokja {pokja}</p>
              </div>
              <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-ok">
                  <span className="inline-block h-2 w-2 rounded-full bg-ok" />
                  Selesai: <strong>{totalSelesai}</strong>
                </span>
                <span className="flex items-center gap-1.5 text-warn">
                  <span className="inline-block h-2 w-2 rounded-full bg-warn" />
                  Berjalan: <strong>{totalBerjalan}</strong>
                </span>
                <span className="flex items-center gap-1.5 text-muted">
                  <span className="inline-block h-2 w-2 rounded-full bg-line" />
                  Belum Mulai: <strong>{totalBelumMulai}</strong>
                </span>
              </div>
            </div>
            <div className="divide-y divide-line/60">
              {milestoneData.map((r, i) => (
                <div key={`${r.wkId}-${r.subpokja}-${i}`} className="py-4 first:pt-0 hover:bg-sand/30">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex min-w-0 items-center gap-2">
                      <Link
                        href={`/wk/${r.wkId}`}
                        className="truncate font-semibold text-petroleum hover:underline"
                      >
                        {r.wkNama}
                      </Link>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${SUBPOKJA_COLOR[r.subpokja] ?? "bg-line/40 text-ink"}`}>
                        {r.subpokja}
                      </span>
                    </div>
                    <div className="ml-3 shrink-0">
                      {r.berjalan > 0 ? (
                        <span className="rounded-full bg-petroleum/10 px-2 py-0.5 text-[10px] font-semibold text-petroleum-dark">
                          Berjalan
                        </span>
                      ) : r.stages.length === 0 ? (
                        <span className="rounded-full bg-line/40 px-2 py-0.5 text-[10px] font-semibold text-muted">
                          Belum Ada Tahap
                        </span>
                      ) : (
                        <span className="rounded-full bg-line/40 px-2 py-0.5 text-[10px] font-semibold text-muted">
                          Belum Mulai
                        </span>
                      )}
                    </div>
                  </div>
                  {r.stages.length === 0 ? (
                    <p className="text-xs text-muted">Belum ada tahap terdaftar.</p>
                  ) : (
                    <MilestoneTimeline stages={r.stages} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RankBar({ rows, color }: { rows: RankItem[]; color: string }) {
  if (rows.length === 0) return <p className="text-xs text-muted">Belum ada data.</p>;
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

function MilestoneTimeline({ stages }: { stages: StageInfo[] }) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max items-start py-1">
        {stages.map((s, i) => {
          const isDone    = s.status === "SELESAI";
          const isRunning = s.status === "BERJALAN";
          const prevDone  = i > 0 && stages[i - 1].status === "SELESAI";
          return (
            <div key={i} className="flex items-start">
              {i > 0 && (
                <div className={`mt-[9px] h-0.5 w-10 shrink-0 ${prevDone ? "bg-ok" : "bg-line/40"}`} />
              )}
              <div className="flex w-[72px] flex-col items-center gap-1.5">
                <div
                  className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 ${
                    isDone
                      ? "border-ok bg-ok"
                      : isRunning
                      ? "border-petroleum bg-petroleum"
                      : "border-line bg-surface"
                  }`}
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
                <span className="line-clamp-2 w-full px-1 text-center text-[10px] leading-tight text-muted">
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
