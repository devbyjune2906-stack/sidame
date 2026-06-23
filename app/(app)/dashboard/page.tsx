import Link from "next/link";
import { redirect } from "next/navigation";
import { and, asc, count, desc, eq, inArray, type SQL } from "drizzle-orm";
import { db } from "@/db";
import {
  wilayahKerja,
  provinsi,
  wkProcess,
  processTemplate,
  stageTemplate,
  wkStageProgress,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin, statusWhere, visibleSubpokjas, pokjaLabel } from "@/lib/rbac";
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
import { AdminDashboard } from "@/components/admin-dashboard";

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

type StageInfo = { nama: string; status: string; urutan: number };
type MilestoneRow = {
  wkId: string;
  wkNama: string;
  subpokja: string;
  statusWk: string;
  stages: StageInfo[];
  selesai: number;
  berjalan: number;
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const pokja = pokjaLabel(user.role);
  const where = isAdmin(user.role) ? undefined : statusWhere(user.role);
  const withWhere = (extra?: SQL) => {
    const parts = [where, extra].filter((p): p is SQL => p !== undefined);
    return parts.length ? and(...parts) : undefined;
  };

  // ── Stat cards ──────────────────────────────────────────────
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
  const statusItems = STATUS_WK_VALUES.map((s) => ({
    key: s,
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

  // ── Milestone progress ──────────────────────────────────────
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
      const stageDetails = await db
        .select({
          processId: wkStageProgress.wkProcessId,
          nama: stageTemplate.nama,
          namaOverride: wkStageProgress.namaOverride,
          status: wkStageProgress.status,
          urutan: stageTemplate.urutan,
        })
        .from(wkStageProgress)
        .innerJoin(stageTemplate, eq(wkStageProgress.stageTemplateId, stageTemplate.id))
        .where(inArray(wkStageProgress.wkProcessId, processIds))
        .orderBy(asc(stageTemplate.urutan));

      const stagesByProcess = new Map<string, StageInfo[]>();
      for (const s of stageDetails) {
        if (!stagesByProcess.has(s.processId)) stagesByProcess.set(s.processId, []);
        stagesByProcess.get(s.processId)!.push({ nama: s.namaOverride ?? s.nama, status: s.status, urutan: s.urutan });
      }

      milestoneData = procs
        .map((p) => {
          const stages = stagesByProcess.get(p.processId) ?? [];
          const selesai = stages.filter((s) => s.status === "SELESAI").length;
          const berjalan = stages.filter((s) => s.status === "BERJALAN").length;
          return { wkId: p.wkId, wkNama: p.wkNama, subpokja: p.subpokja ?? "", statusWk: p.statusWk, stages, selesai, berjalan };
        })
        .filter((r) => {
          if (r.stages.length === 0) return true;
          return r.stages[r.stages.length - 1].status !== "SELESAI";
        });

      totalSelesai = milestoneData.reduce((acc, r) => acc + r.selesai, 0);
      totalBerjalan = milestoneData.reduce((acc, r) => acc + r.berjalan, 0);
      const totalAll = milestoneData.reduce((acc, r) => acc + r.stages.length, 0);
      totalBelumMulai = totalAll - totalSelesai - totalBerjalan;
    }
  }

  // ── Admin: render operational dashboard ─────────────────────
  if (isAdmin(user.role)) {
    return (
      <>
        <AdminDashboard
          total={total}
          statusItems={statusItems}
          contractData={contractData}
          perProvinsi={perProvinsi.map((r) => ({ nama: r.nama ?? "—", c: r.c }))}
          perOperator={perOperator.map((r) => ({ nama: r.nama ?? "—", c: r.c }))}
        />

        {/* Milestone section tetap di bawah dashboard utama */}
        {progressSubpokjas.length > 0 && (
          <div className="mt-6 space-y-3 px-4 pb-6 sm:px-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink">
                Progress Milestone Tahapan
              </h2>
              <div className="flex gap-4 text-sm">
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
            <Card className="overflow-hidden p-0">
              {milestoneData.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted">
                  Semua tahapan WK telah selesai atau belum ada data.
                </p>
              ) : (
                <div className="divide-y divide-line/60">
                  {milestoneData.map((r, i) => (
                    <div key={`${r.wkId}-${r.subpokja}-${i}`} className="px-4 py-4 hover:bg-sand/30">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex min-w-0 items-center gap-2">
                          <Link
                            href={`/wk/${r.wkId}`}
                            className="truncate font-semibold text-petroleum hover:underline"
                          >
                            {r.wkNama}
                          </Link>
                          <Badge className={`shrink-0 ${SUBPOKJA_COLOR[r.subpokja] ?? "bg-line/40 text-ink"}`}>
                            {r.subpokja}
                          </Badge>
                        </div>
                        <div className="ml-3 shrink-0">
                          {r.berjalan > 0 ? (
                            <Badge className="bg-petroleum/10 text-petroleum-dark">Berjalan</Badge>
                          ) : r.stages.length === 0 ? (
                            <Badge className="bg-line/40 text-muted">Belum Ada Tahap</Badge>
                          ) : (
                            <Badge className="bg-line/40 text-muted">Belum Mulai</Badge>
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
              )}
            </Card>
          </div>
        )}
      </>
    );
  }

  // ── Pokja: render dashboard standar ─────────────────────────
  return (
    <div className="relative space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-ink">
          {`Selamat Datang, Pokja ${pokja}!`}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {`Ringkasan WK yang menjadi kewenangan Pokja ${pokja}.`}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total WK" value={total} highlight />
        {statusData.map((s) => (
          <Stat key={s.name} label={s.name} value={s.value} />
        ))}
      </div>

      {progressSubpokjas.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">
              Progress Milestone Tahapan
            </h2>
            <div className="flex gap-4 text-sm">
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
          <Card className="overflow-hidden p-0">
            {milestoneData.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">
                Semua tahapan WK telah selesai atau belum ada data.
              </p>
            ) : (
              <div className="divide-y divide-line/60">
                {milestoneData.map((r, i) => (
                  <div key={`${r.wkId}-${r.subpokja}-${i}`} className="px-4 py-4 hover:bg-sand/30">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex min-w-0 items-center gap-2">
                        <Link
                          href={`/wk/${r.wkId}`}
                          className="truncate font-semibold text-petroleum hover:underline"
                        >
                          {r.wkNama}
                        </Link>
                        <Badge className={`shrink-0 ${SUBPOKJA_COLOR[r.subpokja] ?? "bg-line/40 text-ink"}`}>
                          {r.subpokja}
                        </Badge>
                      </div>
                      <div className="ml-3 shrink-0">
                        {r.berjalan > 0 ? (
                          <Badge className="bg-petroleum/10 text-petroleum-dark">Berjalan</Badge>
                        ) : r.stages.length === 0 ? (
                          <Badge className="bg-line/40 text-muted">Belum Ada Tahap</Badge>
                        ) : (
                          <Badge className="bg-line/40 text-muted">Belum Mulai</Badge>
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
            )}
          </Card>
        </section>
      )}

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

function MilestoneTimeline({ stages }: { stages: StageInfo[] }) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max items-start py-1">
        {stages.map((s, i) => {
          const isDone = s.status === "SELESAI";
          const isRunning = s.status === "BERJALAN";
          const prevDone = i > 0 && stages[i - 1].status === "SELESAI";
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
