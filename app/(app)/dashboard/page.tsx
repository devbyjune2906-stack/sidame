import Link from "next/link";
import { redirect } from "next/navigation";
import { and, asc, count, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import {
  wilayahKerja,
  provinsi,
  wkProcess,
  processTemplate,
  wkStageProgress,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin, statusWhere, visibleSubpokjas } from "@/lib/rbac";
import {
  STATUS_WK_LABEL,
  STATUS_WK_VALUES,
  TYPE_CONTRACT_LABEL,
  TYPE_CONTRACT_VALUES,
  type StatusWk,
  type TypeContract,
} from "@/lib/constants";
import { Badge, Card } from "@/components/ui";
import { StatusPie, ContractBar } from "@/components/charts";

// Sub-pokja yang termasuk dalam "pipeline lelang" — ditampilkan di bagian milestone
const ALL_SUBPOKJAS = [
  "DMEW-S", "DMEW-T",
  "DMEN-N", "DMEN-K",
  "DMEE-L", "DMEE-M",
  "DMED-T", "DMED-E",
  "DMEP-L", "DMEP-P",
] as const;

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

type MilestoneRow = {
  wkId: string;
  wkNama: string;
  subpokja: string;
  statusWk: string;
  total: number;
  selesai: number;
  berjalan: number;
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const where = isAdmin(user.role) ? undefined : statusWhere(user.role);
  const withWhere = (extra?: SQL) => {
    const parts = [where, extra].filter((p): p is SQL => p !== undefined);
    return parts.length ? and(...parts) : undefined;
  };

  // ── Stat cards ────────────────────────────────────────────────
  const [{ total }] = await db
    .select({ total: count() })
    .from(wilayahKerja)
    .where(withWhere());

  const perStatusRows = await db
    .select({ status: wilayahKerja.statusWk, c: count() })
    .from(wilayahKerja)
    .where(withWhere())
    .groupBy(wilayahKerja.statusWk);
  const perStatusMap = new Map(perStatusRows.map((r) => [r.status, r.c]));
  const statusData = STATUS_WK_VALUES.map((s) => ({
    name: STATUS_WK_LABEL[s],
    value: perStatusMap.get(s) ?? 0,
  }));

  const perContractRows = await db
    .select({ tc: wilayahKerja.typeContract, c: count() })
    .from(wilayahKerja)
    .where(withWhere())
    .groupBy(wilayahKerja.typeContract);
  const perContractMap = new Map(perContractRows.map((r) => [r.tc, r.c]));
  const contractData = TYPE_CONTRACT_VALUES.map((t) => ({
    name: TYPE_CONTRACT_LABEL[t],
    value: perContractMap.get(t) ?? 0,
  }));

  const perProvinsi = await db
    .select({ nama: provinsi.nama, c: count() })
    .from(wilayahKerja)
    .leftJoin(provinsi, eq(wilayahKerja.provinsiId, provinsi.id))
    .where(withWhere())
    .groupBy(provinsi.nama)
    .orderBy(desc(count()))
    .limit(8);

  const perOperator = await db
    .select({ nama: wilayahKerja.operatorK3s, c: count() })
    .from(wilayahKerja)
    .where(withWhere())
    .groupBy(wilayahKerja.operatorK3s)
    .orderBy(desc(count()))
    .limit(8);

  // ── Milestone progress (per sub-pokja) ────────────────────────
  const visible = visibleSubpokjas(user.role);
  const progressSubpokjas: string[] =
    visible === "ALL"
      ? [...ALL_SUBPOKJAS]
      : visible.filter((sp) => (ALL_SUBPOKJAS as readonly string[]).includes(sp));

  let milestoneData: MilestoneRow[] = [];
  let totalSelesai = 0;
  let totalBerjalan = 0;
  let totalBelumMulai = 0;

  if (progressSubpokjas.length > 0) {
    const procs = await db
      .select({
        processId: wkProcess.id,
        wkId: wilayahKerja.id,
        wkNama: wilayahKerja.namaWk,
        subpokja: processTemplate.subpokja,
        statusWk: wilayahKerja.statusWk,
      })
      .from(wkProcess)
      .innerJoin(processTemplate, eq(wkProcess.templateId, processTemplate.id))
      .innerJoin(wilayahKerja, eq(wkProcess.wkId, wilayahKerja.id))
      .where(inArray(processTemplate.subpokja, progressSubpokjas))
      .orderBy(asc(wilayahKerja.namaWk), asc(processTemplate.subpokja));

    if (procs.length > 0) {
      const processIds = procs.map((p) => p.processId);

      const stageCounts = await db
        .select({
          processId: wkStageProgress.wkProcessId,
          total: count(),
          selesai: sql<number>`SUM(CASE WHEN ${wkStageProgress.status} = 'SELESAI' THEN 1 ELSE 0 END)`,
          berjalan: sql<number>`SUM(CASE WHEN ${wkStageProgress.status} = 'BERJALAN' THEN 1 ELSE 0 END)`,
        })
        .from(wkStageProgress)
        .where(inArray(wkStageProgress.wkProcessId, processIds))
        .groupBy(wkStageProgress.wkProcessId);

      const stageMap = new Map(stageCounts.map((s) => [s.processId, s]));

      milestoneData = procs.map((p) => {
        const s = stageMap.get(p.processId);
        const total = s?.total ?? 0;
        const selesai = Number(s?.selesai ?? 0);
        const berjalan = Number(s?.berjalan ?? 0);
        return {
          wkId: p.wkId,
          wkNama: p.wkNama,
          subpokja: p.subpokja ?? "",
          statusWk: p.statusWk,
          total,
          selesai,
          berjalan,
        };
      });

      totalSelesai = milestoneData.reduce((acc, r) => acc + r.selesai, 0);
      totalBerjalan = milestoneData.reduce((acc, r) => acc + r.berjalan, 0);
      const totalAll = milestoneData.reduce((acc, r) => acc + r.total, 0);
      totalBelumMulai = totalAll - totalSelesai - totalBerjalan;
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          {isAdmin(user.role)
            ? "Ringkasan seluruh Wilayah Kerja Migas."
            : `Ringkasan WK yang menjadi kewenangan ${user.role}.`}
        </p>
      </header>

      {/* Kartu ringkasan status WK */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total WK" value={total} highlight />
        {statusData.map((s) => (
          <Stat key={s.name} label={s.name} value={s.value} />
        ))}
      </div>

      {/* Grafik */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 font-display text-base font-semibold text-ink">Distribusi per Status</h2>
          <StatusPie data={statusData} />
        </Card>
        <Card>
          <h2 className="mb-2 font-display text-base font-semibold text-ink">Distribusi per Kontrak</h2>
          <ContractBar data={contractData} />
        </Card>
      </div>

      {/* Tabel ringkas */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-display text-base font-semibold text-ink">WK per Provinsi (Top 8)</h2>
          <RankList rows={perProvinsi.map((r) => ({ nama: r.nama ?? "—", c: r.c }))} />
        </Card>
        <Card>
          <h2 className="mb-3 font-display text-base font-semibold text-ink">WK per Operator/K3S (Top 8)</h2>
          <RankList rows={perOperator.map((r) => ({ nama: r.nama ?? "—", c: r.c }))} />
        </Card>
      </div>

      {/* Progress Milestone Tahapan */}
      {progressSubpokjas.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-ink">
            Progress Milestone Tahapan
          </h2>

          {/* Ringkasan tahap */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="text-center">
              <p className="text-xs text-ok">Tahap Selesai</p>
              <p className="mt-1 font-display text-2xl font-bold text-ink">{totalSelesai}</p>
            </Card>
            <Card className="text-center">
              <p className="text-xs text-warn">Sedang Berjalan</p>
              <p className="mt-1 font-display text-2xl font-bold text-ink">{totalBerjalan}</p>
            </Card>
            <Card className="text-center">
              <p className="text-xs text-muted">Belum Mulai</p>
              <p className="mt-1 font-display text-2xl font-bold text-ink">{totalBelumMulai}</p>
            </Card>
          </div>

          {/* Tabel per WK */}
          <Card className="overflow-hidden p-0">
            {milestoneData.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">
                Belum ada data tahapan.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line bg-sand/40 text-left text-xs uppercase tracking-wide text-muted">
                      <th className="px-4 py-3 font-semibold">Nama WK</th>
                      <th className="px-4 py-3 font-semibold">Sub Pokja</th>
                      <th className="px-4 py-3 font-semibold">Progress Tahap</th>
                      <th className="px-4 py-3 text-right font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {milestoneData.map((r, i) => {
                      const pct = r.total > 0 ? Math.round((r.selesai / r.total) * 100) : 0;
                      const allDone = r.total > 0 && r.selesai === r.total;
                      const hasRunning = r.berjalan > 0;

                      return (
                        <tr
                          key={`${r.wkId}-${r.subpokja}-${i}`}
                          className="border-b border-line/60 last:border-0 hover:bg-sand/40"
                        >
                          <td className="px-4 py-3">
                            <Link
                              href={`/wk/${r.wkId}`}
                              className="font-medium text-petroleum hover:underline"
                            >
                              {r.wkNama}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={SUBPOKJA_COLOR[r.subpokja] ?? "bg-line/40 text-ink"}>
                              {r.subpokja}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {r.total === 0 ? (
                              <span className="text-xs text-muted">Belum ada tahap</span>
                            ) : (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted">
                                    {r.selesai} / {r.total} tahap selesai
                                  </span>
                                  <span className="font-medium text-ink">{pct}%</span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-line/40">
                                  <div
                                    className={`h-2 rounded-full transition-all ${
                                      allDone ? "bg-ok" : hasRunning ? "bg-petroleum" : "bg-line"
                                    }`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {allDone ? (
                              <Badge className="bg-ok/10 text-ok">Semua Selesai</Badge>
                            ) : hasRunning ? (
                              <Badge className="bg-petroleum/10 text-petroleum-dark">Berjalan</Badge>
                            ) : r.total === 0 ? (
                              <Badge className="bg-line/40 text-muted">Belum Ada Tahap</Badge>
                            ) : (
                              <Badge className="bg-line/40 text-muted">Belum Mulai</Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <Card className={highlight ? "bg-petroleum text-white" : ""}>
      <p className={`text-sm ${highlight ? "text-white/80" : "text-muted"}`}>{label}</p>
      <p className="mt-2 font-display text-3xl font-bold">{value}</p>
    </Card>
  );
}

function RankList({ rows }: { rows: { nama: string; c: number }[] }) {
  if (rows.length === 0) return <p className="text-sm text-muted">Belum ada data.</p>;
  const max = Math.max(...rows.map((r) => r.c), 1);
  return (
    <ul className="space-y-2">
      {rows.map((r, i) => (
        <li key={i} className="text-sm">
          <div className="flex items-center justify-between">
            <span className="truncate text-ink">{r.nama}</span>
            <span className="ml-2 shrink-0 font-medium text-muted">{r.c}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-line">
            <div
              className="h-1.5 rounded-full bg-petroleum-light"
              style={{ width: `${(r.c / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
