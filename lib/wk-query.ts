import { and, or, ilike, eq, type SQL } from "drizzle-orm";
import { wilayahKerja } from "@/db/schema";
import { statusWhere } from "./rbac";
import { STATUS_WK_VALUES, type StatusWk } from "./constants";

export type WkFilters = {
  q?: string;
  status?: string;
  provinsiId?: number;
};

/** Gabungkan filter pengguna + batasan RBAC jadi satu klausa WHERE. */
export function buildWkWhere(role: string, filters: WkFilters): SQL | undefined {
  const parts: (SQL | undefined)[] = [];

  // batasan RBAC (status sesuai kewenangan)
  parts.push(statusWhere(role));

  // pencarian teks
  if (filters.q && filters.q.trim()) {
    const term = `%${filters.q.trim()}%`;
    parts.push(
      or(
        ilike(wilayahKerja.namaWk, term),
        ilike(wilayahKerja.operatorK3s, term),
        ilike(wilayahKerja.lapangan, term),
        ilike(wilayahKerja.pemegangSaham, term)
      )
    );
  }

  // filter status (hanya jika valid)
  if (filters.status && STATUS_WK_VALUES.includes(filters.status as StatusWk)) {
    parts.push(eq(wilayahKerja.statusWk, filters.status as StatusWk));
  }

  // filter provinsi
  if (filters.provinsiId) {
    parts.push(eq(wilayahKerja.provinsiId, filters.provinsiId));
  }

  const defined = parts.filter((p): p is SQL => p !== undefined);
  if (defined.length === 0) return undefined;
  return and(...defined);
}

export function parseFilters(sp: Record<string, string | string[] | undefined>): WkFilters {
  const get = (k: string) => (Array.isArray(sp[k]) ? sp[k]?.[0] : (sp[k] as string | undefined));
  const provinsiRaw = get("provinsi");
  return {
    q: get("q"),
    status: get("status"),
    provinsiId: provinsiRaw ? Number(provinsiRaw) || undefined : undefined,
  };
}
