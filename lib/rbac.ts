import { inArray, sql, type SQL } from "drizzle-orm";
import { wilayahKerja } from "@/db/schema";
import { STATUS_BY_ROLE, POKJA_ROLE_PAIRS, type StatusWk } from "./constants";

/** Status WK yang boleh diakses role. "ALL" untuk Admin. */
export function allowedStatuses(role: string): StatusWk[] | "ALL" {
  return STATUS_BY_ROLE[role] ?? [];
}

export function isAdmin(role: string): boolean {
  return allowedStatuses(role) === "ALL";
}

/** True kalau role adalah salah satu dari 4 role "Pokja X - Admin". */
export function isPokjaAdmin(role: string): boolean {
  return Object.values(POKJA_ROLE_PAIRS).some((p) => p.admin === role);
}

/**
 * Daftar nama role yang boleh dikelola (lihat/tambah/hapus user) oleh role ini.
 * "ALL" untuk Admin global, [staf, admin] pokjanya untuk Admin Pokja, [] untuk staf biasa.
 */
export function manageableRoleNames(role: string): string[] | "ALL" {
  if (isAdmin(role)) return "ALL";
  const pair = Object.values(POKJA_ROLE_PAIRS).find((p) => p.admin === role);
  return pair ? [pair.staf, pair.admin] : [];
}

/** Boleh kelola (create/update/delete) data dengan status tertentu? */
export function canManageStatus(role: string, status: StatusWk): boolean {
  const allowed = allowedStatuses(role);
  if (allowed === "ALL") return true;
  return allowed.includes(status);
}

/** Klausa WHERE untuk membatasi query berdasarkan role. undefined = tanpa batas (Admin). */
export function statusWhere(role: string): SQL | undefined {
  const allowed = allowedStatuses(role);
  if (allowed === "ALL") return undefined;
  if (allowed.length === 0) return sql`false`;
  return inArray(wilayahKerja.statusWk, allowed);
}
