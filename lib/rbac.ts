import { inArray, ne, sql, and, or, isNull, eq, type SQL } from "drizzle-orm";
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

/** True kalau role termasuk Pokja DMEE (staf atau admin pokja). */
export function isDmee(role: string): boolean {
  return role === POKJA_ROLE_PAIRS.DMEE.staf || role === POKJA_ROLE_PAIRS.DMEE.admin;
}

/** True kalau role termasuk Pokja DMEP (staf atau admin pokja). */
export function isDmep(role: string): boolean {
  return role === POKJA_ROLE_PAIRS.DMEP.staf || role === POKJA_ROLE_PAIRS.DMEP.admin;
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

/**
 * Boleh membuat WK baru?
 * Hanya Admin, DMEW, dan DMEN — pokja lain (DMEE, DMED, DMEP) menerima WK dari pipeline otomatis.
 */
export function canCreateWk(role: string): boolean {
  return isAdmin(role) || isDmew(role) || isDmen(role);
}

/** Boleh kelola (create/update/delete) data dengan status tertentu? */
export function canManageStatus(role: string, status: StatusWk): boolean {
  const allowed = allowedStatuses(role);
  if (allowed === "ALL") return true;
  return allowed.includes(status);
}

/**
 * Sub Pokja yang bisa di-assign oleh Admin Pokja untuk proses manual.
 * DMEW/DMEN menggunakan template-based (tidak perlu fungsi ini).
 */
export function subpokjasForRole(role: string): string[] {
  if (role === POKJA_ROLE_PAIRS.DMEE.admin) return ["DMEE-L", "DMEE-M"];
  if (role === POKJA_ROLE_PAIRS.DMED.admin) return ["DMED-T", "DMED-E"];
  if (role === POKJA_ROLE_PAIRS.DMEP.admin) return ["DMEP-L", "DMEP-P"];
  return [];
}

/** Apakah user bisa mengelola tahapan untuk sub pokja tertentu? */
export function canManageSubpokja(role: string, subpokja: string | null): boolean {
  if (!canWrite(role)) return false;
  if (isAdmin(role)) return true;
  const sp = subpokja ?? "";
  if (role === POKJA_ROLE_PAIRS.DMEW.admin) return sp === "DMEW-S" || sp === "DMEW-T";
  if (role === POKJA_ROLE_PAIRS.DMEN.admin) return sp === "DMEN-N" || sp === "DMEN-K";
  return subpokjasForRole(role).includes(sp);
}

/** Klausa WHERE untuk membatasi query berdasarkan role. TIDAK_DILANJUTKAN selalu dikecualikan dari list. */
export function statusWhere(role: string): SQL | undefined {
  const excludeStopped = ne(wilayahKerja.statusWk, "TIDAK_DILANJUTKAN");
  const allowed = allowedStatuses(role);
  if (allowed === "ALL") return excludeStopped;
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
