/* Nilai enum & label tampilan (Bahasa Indonesia) */

export const ROLE = {
  ADMIN: "Admin",
  DMEW: "Pokja DMEW",
  DMEE: "Pokja DMEE",
  DMED: "Pokja DMED",
  DMEP: "Pokja DMEP",
  DMEN: "Pokja DMEN",
  DMEW_ADMIN: "Pokja DMEW - Admin",
  DMEE_ADMIN: "Pokja DMEE - Admin",
  DMED_ADMIN: "Pokja DMED - Admin",
  DMEP_ADMIN: "Pokja DMEP - Admin",
  DMEN_ADMIN: "Pokja DMEN - Admin",
} as const;

export const ROLE_LIST = [
  ROLE.ADMIN,
  ROLE.DMEW,
  ROLE.DMEE,
  ROLE.DMED,
  ROLE.DMEP,
  ROLE.DMEN,
  ROLE.DMEW_ADMIN,
  ROLE.DMEE_ADMIN,
  ROLE.DMED_ADMIN,
  ROLE.DMEP_ADMIN,
  ROLE.DMEN_ADMIN,
];

/** Pasangan role (staf, admin) per Pokja -- dipakai untuk scoping Manajemen User. */
export const POKJA_ROLE_PAIRS: Record<"DMEW" | "DMEE" | "DMED" | "DMEP" | "DMEN", { staf: string; admin: string }> = {
  DMEW: { staf: ROLE.DMEW, admin: ROLE.DMEW_ADMIN },
  DMEE: { staf: ROLE.DMEE, admin: ROLE.DMEE_ADMIN },
  DMED: { staf: ROLE.DMED, admin: ROLE.DMED_ADMIN },
  DMEP: { staf: ROLE.DMEP, admin: ROLE.DMEP_ADMIN },
  DMEN: { staf: ROLE.DMEN, admin: ROLE.DMEN_ADMIN },
};

export type StatusWk = "SEDANG_DILELANG" | "EKSPLORASI" | "POD_I" | "ONSTREAM";
export type TypeContract = "COST_RECOVERY" | "GROSS_SPLIT";

export const STATUS_WK_VALUES: StatusWk[] = ["SEDANG_DILELANG", "EKSPLORASI", "POD_I", "ONSTREAM"];

export const STATUS_WK_LABEL: Record<StatusWk, string> = {
  SEDANG_DILELANG: "Sedang Dilelang",
  EKSPLORASI: "Eksplorasi",
  POD_I: "POD I",
  ONSTREAM: "Onstream",
};

export const TYPE_CONTRACT_VALUES: TypeContract[] = ["COST_RECOVERY", "GROSS_SPLIT"];

export const TYPE_CONTRACT_LABEL: Record<TypeContract, string> = {
  COST_RECOVERY: "Cost Recovery",
  GROSS_SPLIT: "Gross Split",
};

/* Pemetaan Pokja -> status WK yang menjadi kewenangannya */
export const STATUS_BY_ROLE: Record<string, StatusWk[] | "ALL"> = {
  [ROLE.ADMIN]: "ALL",
  [ROLE.DMEW]: ["SEDANG_DILELANG"],
  [ROLE.DMEE]: ["EKSPLORASI"],
  [ROLE.DMED]: ["POD_I"],
  [ROLE.DMEP]: ["ONSTREAM"],
  [ROLE.DMEN]: ["SEDANG_DILELANG"],
  // Admin Pokja punya hak data WK yang sama dengan staf di pokjanya
  [ROLE.DMEW_ADMIN]: ["SEDANG_DILELANG"],
  [ROLE.DMEE_ADMIN]: ["EKSPLORASI"],
  [ROLE.DMED_ADMIN]: ["POD_I"],
  [ROLE.DMEP_ADMIN]: ["ONSTREAM"],
  [ROLE.DMEN_ADMIN]: ["SEDANG_DILELANG"],
};

export type JenisWk = "KONVENSIONAL" | "NON_KONVENSIONAL";
export const JENIS_WK_VALUES: JenisWk[] = ["KONVENSIONAL", "NON_KONVENSIONAL"];
export const JENIS_WK_LABEL: Record<JenisWk, string> = {
  KONVENSIONAL: "Konvensional",
  NON_KONVENSIONAL: "Non Konvensional",
};

/* Warna badge per status (kelas Tailwind) */
export const STATUS_BADGE: Record<StatusWk, string> = {
  SEDANG_DILELANG: "bg-warn/10 text-warn",
  EKSPLORASI: "bg-petroleum-light/10 text-petroleum",
  POD_I: "bg-petroleum/10 text-petroleum-dark",
  ONSTREAM: "bg-ok/10 text-ok",
};

export type JenisPod =
  | "POD_I"
  | "REVISI_PODI_1"
  | "REVISI_PODI_2_PERPANJANGAN"
  | "PERINGATAN_1"
  | "PERINGATAN_2"
  | "PERINGATAN_3"
  | "TERMINASI";

export const JENIS_POD_VALUES: JenisPod[] = [
  "POD_I",
  "REVISI_PODI_1",
  "REVISI_PODI_2_PERPANJANGAN",
  "PERINGATAN_1",
  "PERINGATAN_2",
  "PERINGATAN_3",
  "TERMINASI",
];

export const JENIS_POD_LABEL: Record<JenisPod, string> = {
  POD_I: "POD I",
  REVISI_PODI_1: "Revisi POD I ke-1",
  REVISI_PODI_2_PERPANJANGAN: "Revisi POD I ke-2 (Perpanjangan)",
  PERINGATAN_1: "Peringatan 1",
  PERINGATAN_2: "Peringatan 2",
  PERINGATAN_3: "Peringatan 3",
  TERMINASI: "Terminasi",
};
