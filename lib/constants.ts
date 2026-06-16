/* Nilai enum & label tampilan (Bahasa Indonesia) */

export const ROLE = {
  ADMIN: "Admin",
  DMEW: "Pokja DMEW",
  DMEE: "Pokja DMEE",
  DMED: "Pokja DMED",
  DMEP: "Pokja DMEP",
} as const;

export const ROLE_LIST = [ROLE.ADMIN, ROLE.DMEW, ROLE.DMEE, ROLE.DMED, ROLE.DMEP];

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
};

/* Warna badge per status (kelas Tailwind) */
export const STATUS_BADGE: Record<StatusWk, string> = {
  SEDANG_DILELANG: "bg-warn/10 text-warn",
  EKSPLORASI: "bg-petroleum-light/10 text-petroleum",
  POD_I: "bg-petroleum/10 text-petroleum-dark",
  ONSTREAM: "bg-ok/10 text-ok",
};
