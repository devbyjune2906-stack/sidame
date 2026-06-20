import { inArray, sql, and, or, isNull, eq, type SQL } from "drizzle-orm";
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

/** True kalau role termasuk Pokja DMED (staf atau admin pokja). */
export function isDmed(role: string): boolean {
  return role === POKJA_ROLE_PAIRS.DMED.staf || role === POKJA_ROLE_PAIRS.DMED.admin;
}

/** True kalau role termasuk Pokja DMEW (staf atau admin pokja). */
export function isDmew(role: string): boolean {
  return role === POKJA_ROLE_PAIRS.DMEW.staf || role === POKJA_ROLE_PAIRS.DMEW.admin;
}

/** True kalau role termasuk Pokja DMEN (staf atau admin pokja). */
export function isDmen(role: string): boolean {
  return role === POKJA_ROLE_PAIRS.DMEN.staf || role === POKJA_ROLE_PAIRS.DMEN.admin;
}

/**
 * Boleh menulis (create/update/delete WK, input progres timeline)?
 * Hanya Admin global dan Admin Pokja — staf pokja READ-ONLY.
 */
export function canWrite(role: string): boolean {
  return isAdmin(role) || isPokjaAdmin(role);
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

  const statusFilter = inArray(wilayahKerja.statusWk, allowed);

  // DMEW hanya lihat WK konvensional; DMEN hanya lihat WK non-konvensional
  if (isDmew(role)) {
    return and(statusFilter, or(isNull(wilayahKerja.jenisWk), eq(wilayahKerja.jenisWk, "KONVENSIONAL")));
  }
  if (isDmen(role)) {
    return and(statusFilter, eq(wilayahKerja.jenisWk, "NON_KONVENSIONAL"));
  }

  return statusFilter;
}
