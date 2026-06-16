// Pemetaan pilihan sub-pokja + jalur/jenis -> id processTemplate (lihat db/seed.ts TEMPLATES).
// Dipakai saat membuat WK baru untuk menentukan template mana yang dipasangkan.

export type DmewSubpokja = "DMEW-S" | "DMEW-T";
export type DmewJalur = "REGULER" | "JOINT_STUDY";

export type DmedSubpokja = "DMED-T" | "DMED-E";
export type DmedJenis = "POD_I" | "PI10";

export function dmewTemplateId(subpokja: DmewSubpokja, jalur: DmewJalur): string {
  if (subpokja === "DMEW-S") {
    return jalur === "REGULER" ? "DMEW_REGULER" : "DMEW_JOINT_STUDY";
  }
  return jalur === "REGULER" ? "DMEW_T_REGULER" : "DMEW_T_JOINT_STUDY";
}

export function dmedTemplateId(subpokja: DmedSubpokja, jenis?: DmedJenis): string | null {
  if (subpokja === "DMED-E") return "DMED_E";
  if (jenis === "POD_I") return "DMED_PODI";
  if (jenis === "PI10") return "DMED_PI10";
  return null;
}
