import { redirect } from "next/navigation";
import { and, count, desc, eq, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { wilayahKerja, provinsi } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { statusWhere, isAdmin } from "@/lib/rbac";
import {
  STATUS_WK_LABEL,
  STATUS_WK_VALUES,
  TYPE_CONTRACT_LABEL,
  TYPE_CONTRACT_VALUES,
  type StatusWk,
  type TypeContract,
} from "@/lib/constants";
import { Card } from "@/components/ui";
import { StatusPie, ContractBar } from "@/components/charts";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const where = statusWhere(user.role);
  const withWhere = (extra?: SQL) => {
    const parts = [where, extra].filter((p): p is SQL => p !== undefined);
    return parts.length ? and(...parts) : undefined;
  };

  // Total
  const [{ total }] = await db
    .select({ total: count() })
    .from(wilayahKerja)
    .where(withWhere());

  // Per status
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

  // Per type contract
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

  // Per provinsi (top 8)
  const perProvinsi = await db
    .select({ nama: provinsi.nama, c: count() })
    .from(wilayahKerja)
    .leftJoin(provinsi, eq(wilayahKerja.provinsiId, provinsi.id))
    .where(withWhere())
    .groupBy(provinsi.nama)
    .orderBy(desc(count()))
    .limit(8);

  // Per operator (top 8)
  const perOperator = await db
    .select({ nama: wilayahKerja.operatorK3s, c: count() })
    .from(wilayahKerja)
    .where(withWhere())
    .groupBy(wilayahKerja.operatorK3s)
    .orderBy(desc(count()))
    .limit(8);

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

      {/* Kartu ringkasan */}
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
            <div className="h-1.5 rounded-full bg-petroleum-light" style={{ width: `${(r.c / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
