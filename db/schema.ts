import {
  pgTable,
  serial,
  text,
  integer,
  doublePrecision,
  timestamp,
  jsonb,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ===================== ENUM ===================== */
export const typeContract = pgEnum("type_contract", ["COST_RECOVERY", "GROSS_SPLIT"]);

export const statusWk = pgEnum("status_wk", [
  "SEDANG_DILELANG", // -> Pokja DMEW
  "EKSPLORASI", // -> Pokja DMEE
  "POD_I", // -> Pokja DMED
  "ONSTREAM", // -> Pokja DMEP
]);

export const slaUnit = pgEnum("sla_unit", ["HARI_KALENDER", "HARI_KERJA", "BULAN", "TANPA_SLA"]);
export const stageStatus = pgEnum("stage_status", ["BELUM_MULAI", "BERJALAN", "SELESAI"]);

export const jenisPod = pgEnum("jenis_pod", [
  "POD_I",
  "REVISI_PODI_1",
  "REVISI_PODI_2_PERPANJANGAN",
  "PERINGATAN_1",
  "PERINGATAN_2",
  "PERINGATAN_3",
  "TERMINASI",
]);

/* ===================== USER & ROLE ===================== */
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull().unique(), // Admin, Pokja DMEW, DMEE, DMED, DMEP
});

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  nama: text("nama").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // hash bcrypt
  roleId: integer("role_id")
    .notNull()
    .references(() => roles.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* ===================== WILAYAH ADMINISTRATIF ===================== */
export const provinsi = pgTable("provinsi", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull().unique(),
});

export const kabupaten = pgTable("kabupaten", {
  id: serial("id").primaryKey(),
  nama: text("nama").notNull(),
  // null = bukan kabupaten/kota administratif (mis. "Di Atas 12 Mil Laut")
  provinsiId: integer("provinsi_id").references(() => provinsi.id),
});

/* ===================== MASTER WK ===================== */
export const wilayahKerja = pgTable("wilayah_kerja", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  namaWk: text("nama_wk").notNull(),
  lapangan: text("lapangan"),
  operatorK3s: text("operator_k3s"),
  pemegangSaham: text("pemegang_saham"),
  // Wilayah Admin: 1 Provinsi + 1 Kabupaten/Kota
  provinsiId: integer("provinsi_id").references(() => provinsi.id),
  kabupatenId: integer("kabupaten_id").references(() => kabupaten.id),
  typeContract: typeContract("type_contract"),
  statusWk: statusWk("status_wk").notNull(),
  startPsc: timestamp("start_psc"),
  endPsc: timestamp("end_psc"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/* ===================== ENGINE TIMELINE / SLA ===================== */
export const processTemplate = pgTable("process_template", {
  id: text("id").primaryKey(), // kode unik, mis. DMEW_REGULER
  nama: text("nama").notNull(),
  subpokja: text("subpokja"), // DMEW-S | DMEW-T | DMED-T | DMED-E
});

export const stageTemplate = pgTable("stage_template", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  templateId: text("template_id")
    .notNull()
    .references(() => processTemplate.id),
  urutan: integer("urutan").notNull(),
  nama: text("nama").notNull(),
  slaValue: integer("sla_value"),
  slaUnit: slaUnit("sla_unit").default("TANPA_SLA").notNull(),
  extraFields: jsonb("extra_fields"),
});

export const wkProcess = pgTable("wk_process", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  wkId: text("wk_id")
    .notNull()
    .references(() => wilayahKerja.id, { onDelete: "cascade" }),
  templateId: text("template_id")
    .notNull()
    .references(() => processTemplate.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const wkStageProgress = pgTable("wk_stage_progress", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  wkProcessId: text("wk_process_id")
    .notNull()
    .references(() => wkProcess.id, { onDelete: "cascade" }),
  stageTemplateId: text("stage_template_id")
    .notNull()
    .references(() => stageTemplate.id),
  status: stageStatus("status").default("BELUM_MULAI").notNull(),
  startDate: timestamp("start_date"),
  completedDate: timestamp("completed_date"),
  values: jsonb("values"),
  catatan: text("catatan"),
});

export const hariLibur = pgTable("hari_libur", {
  id: serial("id").primaryKey(),
  tanggal: timestamp("tanggal").notNull().unique(),
  keterangan: text("keterangan"),
});

/* ===================== EKSTENSI PER POKJA (Fase 2) ===================== */
export const dmeeDetail = pgTable("dmee_detail", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  wkId: text("wk_id")
    .notNull()
    .unique()
    .references(() => wilayahKerja.id, { onDelete: "cascade" }),
  luasWilayahSisa: doublePrecision("luas_wilayah_sisa"),
});

export const dmewLelangDetail = pgTable("dmew_lelang_detail", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  wkId: text("wk_id")
    .notNull()
    .unique()
    .references(() => wilayahKerja.id, { onDelete: "cascade" }),
  subpokja: text("subpokja"), // DMEW-S | DMEW-T
  jalur: text("jalur"), // REGULER | JOINT_STUDY
});

export const dmedPodiDetail = pgTable("dmed_podi_detail", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  wkId: text("wk_id")
    .notNull()
    .unique()
    .references(() => wilayahKerja.id, { onDelete: "cascade" }),
  jenisPod: jenisPod("jenis_pod"),
  luasWilayahSisa: doublePrecision("luas_wilayah_sisa"),
  persetujuanPodI: timestamp("persetujuan_pod_i"),
  revisiPodI1: timestamp("revisi_pod_i_1"),
  revisiPodI2: timestamp("revisi_pod_i_2"),
  perkiraanOnstream: timestamp("perkiraan_onstream"),
  fluidaProduksi: text("fluida_produksi"),
  cadanganGas: doublePrecision("cadangan_gas"),
  cadanganMinyak: doublePrecision("cadangan_minyak"),
  asumsiHargaGas: doublePrecision("asumsi_harga_gas"),
  asumsiHargaMinyak: doublePrecision("asumsi_harga_minyak"),
  grossRevenue: doublePrecision("gross_revenue"),
  costRecovery: doublePrecision("cost_recovery"),
  goiTake: doublePrecision("goi_take"),
  contTake: doublePrecision("cont_take"),
  irr: doublePrecision("irr"),
  npvGov: doublePrecision("npv_gov"),
  npvKkks: doublePrecision("npv_kkks"),
  capex: doublePrecision("capex"),
  opex: doublePrecision("opex"),
  asr: doublePrecision("asr"),
  sunkCost: doublePrecision("sunk_cost"),
  statusKesdmDjm: text("status_kesdm_djm"),
  statusSkkMigas: text("status_skk_migas"),
  statusKkks: text("status_kkks"),
  keterangan: text("keterangan"),
});

export const dmedPi10Detail = pgTable("dmed_pi10_detail", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  wkId: text("wk_id")
    .notNull()
    .unique()
    .references(() => wilayahKerja.id, { onDelete: "cascade" }),
  bumdPenerima: text("bumd_penerima"),
  bumdPengelola: text("bumd_pengelola"),
  statusKesdmDjm: text("status_kesdm_djm"),
  statusSkkMigas: text("status_skk_migas"),
  statusProvBumd: text("status_prov_bumd"),
  statusKkks: text("status_kkks"),
  tglEfekPi10: timestamp("tgl_efek_pi10"),
  tglPerstMesdm: timestamp("tgl_perst_mesdm"),
});

export const dmedEDetail = pgTable("dmed_e_detail", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  wkId: text("wk_id")
    .notNull()
    .unique()
    .references(() => wilayahKerja.id, { onDelete: "cascade" }),
  statusKesdmDjm: text("status_kesdm_djm"),
  statusSkkMigas: text("status_skk_migas"),
  statusProvBumd: text("status_prov_bumd"),
  statusKkks: text("status_kkks"),
  tglEfekPi10: timestamp("tgl_efek_pi10"),
  tglPerstMesdm: timestamp("tgl_perst_mesdm"),
});

export const dmepDetail = pgTable("dmep_detail", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  wkId: text("wk_id")
    .notNull()
    .unique()
    .references(() => wilayahKerja.id, { onDelete: "cascade" }),
  sisaCadanganMinyak: doublePrecision("sisa_cadangan_minyak"),
  sisaCadanganGas: doublePrecision("sisa_cadangan_gas"),
});

export const dmepProduksiBulanan = pgTable(
  "dmep_produksi_bulanan",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    wkId: text("wk_id")
      .notNull()
      .references(() => wilayahKerja.id, { onDelete: "cascade" }),
    tahun: integer("tahun").notNull(),
    bulan: integer("bulan").notNull(),
    produksiMinyak: doublePrecision("produksi_minyak"),
    produksiGas: doublePrecision("produksi_gas"),
  },
  (t) => ({
    uniqWkPeriode: uniqueIndex("uniq_dmep_wk_periode").on(t.wkId, t.tahun, t.bulan),
  })
);

/* ===================== RELATIONS ===================== */
export const usersRelations = relations(users, ({ one }) => ({
  role: one(roles, { fields: [users.roleId], references: [roles.id] }),
}));

export const wkRelations = relations(wilayahKerja, ({ one }) => ({
  provinsi: one(provinsi, { fields: [wilayahKerja.provinsiId], references: [provinsi.id] }),
  kabupaten: one(kabupaten, { fields: [wilayahKerja.kabupatenId], references: [kabupaten.id] }),
}));

export const kabupatenRelations = relations(kabupaten, ({ one }) => ({
  provinsi: one(provinsi, { fields: [kabupaten.provinsiId], references: [provinsi.id] }),
}));

export const dmedEDetailRelations = relations(dmedEDetail, ({ one }) => ({
  wk: one(wilayahKerja, { fields: [dmedEDetail.wkId], references: [wilayahKerja.id] }),
}));
