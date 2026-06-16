import "dotenv/config";
import { db } from "./index";
import {
  roles,
  users,
  processTemplate,
  stageTemplate,
  hariLibur,
  provinsi,
  kabupaten,
} from "./schema";
import { eq, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { ROLE_LIST } from "../lib/constants";
import { KABUPATEN_KOTA_BY_PROVINSI, KABUPATEN_NON_ADMINISTRATIF } from "./data/kabupaten-kota";

const PROVINSI_LIST = [
  "Aceh",
  "Sumatera Utara",
  "Sumatera Barat",
  "Riau",
  "Kepulauan Riau",
  "Jambi",
  "Bengkulu",
  "Sumatera Selatan",
  "Kepulauan Bangka Belitung",
  "Lampung",
  "DKI Jakarta",
  "Jawa Barat",
  "Jawa Tengah",
  "DI Yogyakarta",
  "Jawa Timur",
  "Banten",
  "Bali",
  "Nusa Tenggara Barat",
  "Nusa Tenggara Timur",
  "Kalimantan Barat",
  "Kalimantan Tengah",
  "Kalimantan Selatan",
  "Kalimantan Timur",
  "Kalimantan Utara",
  "Sulawesi Utara",
  "Gorontalo",
  "Sulawesi Tengah",
  "Sulawesi Barat",
  "Sulawesi Selatan",
  "Sulawesi Tenggara",
  "Maluku",
  "Maluku Utara",
  "Papua",
  "Papua Barat",
  "Papua Barat Daya",
  "Papua Tengah",
  "Papua Pegunungan",
  "Papua Selatan",
];

async function seedProvinsi() {
  for (const nama of PROVINSI_LIST) {
    const existing = await db.select().from(provinsi).where(eq(provinsi.nama, nama));
    if (existing.length === 0) {
      await db.insert(provinsi).values({ nama });
    }
  }
  console.log("  + provinsi (38 provinsi)");
}

async function seedKabupatenKota() {
  const provinsiRows = await db.select().from(provinsi);
  const provinsiIdByNama = new Map(provinsiRows.map((p) => [p.nama, p.id]));

  let inserted = 0;
  for (const [namaProvinsi, { kab, kota }] of Object.entries(KABUPATEN_KOTA_BY_PROVINSI)) {
    const provinsiId = provinsiIdByNama.get(namaProvinsi);
    if (!provinsiId) continue;

    const existing = await db
      .select({ nama: kabupaten.nama })
      .from(kabupaten)
      .where(eq(kabupaten.provinsiId, provinsiId));
    const existingNama = new Set(existing.map((r) => r.nama));

    const namaList = [
      ...kab.map((n) => `Kabupaten ${n}`),
      ...kota.map((n) => `Kota ${n}`),
    ];
    for (const nama of namaList) {
      if (existingNama.has(nama)) continue;
      await db.insert(kabupaten).values({ nama, provinsiId });
      inserted++;
    }
  }

  // Opsi non-administratif (lepas pantai, >12 mil laut) -- provinsiId null
  const existingNonAdmin = await db
    .select()
    .from(kabupaten)
    .where(isNull(kabupaten.provinsiId));
  if (!existingNonAdmin.some((r) => r.nama === KABUPATEN_NON_ADMINISTRATIF)) {
    await db.insert(kabupaten).values({ nama: KABUPATEN_NON_ADMINISTRATIF, provinsiId: null });
    inserted++;
  }

  console.log(`  + kabupaten/kota (${inserted} baris baru)`);
}

async function seedRoles() {
  for (const nama of ROLE_LIST) {
    const existing = await db.select().from(roles).where(eq(roles.nama, nama));
    if (existing.length === 0) {
      await db.insert(roles).values({ nama });
      console.log("  + role:", nama);
    }
  }
}

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@sidame.go.id";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "admin12345";
  const nama = process.env.SEED_ADMIN_NAMA ?? "Administrator";

  const existing = await db.select().from(users).where(eq(users.email, email));
  if (existing.length > 0) {
    console.log("  = admin sudah ada:", email);
    return;
  }
  const [adminRole] = await db.select().from(roles).where(eq(roles.nama, "Admin"));
  const hash = await bcrypt.hash(password, 10);
  await db.insert(users).values({ nama, email, password: hash, roleId: adminRole.id });
  console.log("  + admin:", email, "(password dari SEED_ADMIN_PASSWORD)");
}

type ExtraField = { key: string; label: string };

type StageDef = {
  urutan: number;
  nama: string;
  slaValue?: number;
  slaUnit?: "HARI_KALENDER" | "HARI_KERJA" | "BULAN" | "TANPA_SLA";
  extraFields?: ExtraField[];
};

const SK_TNC_FIELDS: ExtraField[] = [
  { key: "split", label: "Split" },
  { key: "komitmenPasti", label: "Komitmen Pasti (PB)" },
  { key: "signatureBonus", label: "Signature Bonus" },
];

const TEMPLATES: { id: string; nama: string; subpokja: string; stages: StageDef[] }[] = [
  {
    id: "DMEW_REGULER",
    nama: "DMEW-S Reguler",
    subpokja: "DMEW-S",
    stages: [
      { urutan: 1, nama: "Tim WK / Usulan dari KKKS", slaValue: 4, slaUnit: "BULAN" },
      { urutan: 2, nama: "Penyiapan WK yang dilelang", slaUnit: "TANPA_SLA" },
      { urutan: 3, nama: "Pertimbangan SKK Migas/BPMA", slaUnit: "TANPA_SLA" },
      {
        urutan: 4,
        nama: "SK TNC (Split, Komitmen Pasti, Signature Bonus)",
        slaUnit: "TANPA_SLA",
        extraFields: SK_TNC_FIELDS,
      },
    ],
  },
  {
    id: "DMEW_JOINT_STUDY",
    nama: "DMEW-S Joint Study",
    subpokja: "DMEW-S",
    stages: [{ urutan: 1, nama: "Langsung / Usulan dari KKKS", slaUnit: "TANPA_SLA" }],
  },
  {
    id: "DMEW_T_REGULER",
    nama: "DMEW-T Reguler",
    subpokja: "DMEW-T",
    stages: [
      { urutan: 1, nama: "Masa Lelang Reguler", slaValue: 120, slaUnit: "HARI_KALENDER" },
      { urutan: 2, nama: "Penetapan Pemenang (surat Dirjen Migas)", slaUnit: "TANPA_SLA" },
      { urutan: 3, nama: "Pembahasan Kontrak", slaUnit: "TANPA_SLA" },
      { urutan: 4, nama: "TTD Kontrak", slaUnit: "TANPA_SLA" },
    ],
  },
  {
    id: "DMEW_T_JOINT_STUDY",
    nama: "DMEW-T Joint Study",
    subpokja: "DMEW-T",
    stages: [
      { urutan: 1, nama: "Masa Lelang Joint Study", slaValue: 45, slaUnit: "HARI_KALENDER" },
      { urutan: 2, nama: "Penetapan Pemenang (surat Dirjen Migas)", slaUnit: "TANPA_SLA" },
      { urutan: 3, nama: "Pembahasan Kontrak", slaUnit: "TANPA_SLA" },
      { urutan: 4, nama: "TTD Kontrak", slaUnit: "TANPA_SLA" },
    ],
  },
  {
    id: "DMED_PODI",
    nama: "DMED-T POD I",
    subpokja: "DMED-T",
    stages: [
      { urutan: 1, nama: "Rekomendasi dari SKK Migas/BPMA", slaUnit: "TANPA_SLA" },
      { urutan: 2, nama: "Tindak lanjut oleh DME/DMED", slaUnit: "TANPA_SLA" },
      { urutan: 3, nama: "Tindak lanjut oleh SDMH", slaUnit: "TANPA_SLA" },
      { urutan: 4, nama: "Tindak lanjut oleh SJH", slaUnit: "TANPA_SLA" },
      { urutan: 5, nama: "Persetujuan MESDM", slaUnit: "TANPA_SLA" },
    ],
  },
  {
    id: "DMED_PI10",
    nama: "DMED-T PI 10%",
    subpokja: "DMED-T",
    stages: [
      { urutan: 1, nama: "Persetujuan POD I / Tgl Efektif KKS Perpanjangan / Alih Kelola", slaUnit: "TANPA_SLA" },
      { urutan: 2, nama: "Surat Ka. SKK Migas ke Gubernur untuk menunjuk BUMD", slaValue: 10, slaUnit: "HARI_KERJA" },
      { urutan: 3, nama: "Gubernur sampaikan Surat Penunjukan BUMD", slaValue: 365, slaUnit: "HARI_KERJA" },
      { urutan: 4, nama: "Surat Ka. SKK Migas ke Kontraktor untuk memulai penawaran", slaValue: 10, slaUnit: "HARI_KERJA" },
      { urutan: 5, nama: "Kontraktor sampaikan penawaran tertulis ke BUMD", slaValue: 60, slaUnit: "HARI_KERJA" },
      { urutan: 6, nama: "BUMD sampaikan Pernyataan Minat & Kesanggupan", slaValue: 60, slaUnit: "HARI_KERJA" },
      { urutan: 7, nama: "BUMD lakukan Uji Tuntas (Due Diligence) & Akses Data", slaValue: 60, slaUnit: "HARI_KERJA" },
      { urutan: 8, nama: "BUMD sampaikan surat meneruskan / tidak atas PI 10%", slaValue: 180, slaUnit: "HARI_KERJA" },
      { urutan: 9, nama: "Tindak lanjut proses Pengalihan PI 10%", slaValue: 180, slaUnit: "HARI_KERJA" },
      { urutan: 10, nama: "Kontraktor ajukan Permohonan Pengalihan ke MESDM via SKK", slaUnit: "TANPA_SLA" },
      { urutan: 11, nama: "SKK sampaikan rekomendasi pengalihan ke MESDM cq DJM", slaValue: 30, slaUnit: "HARI_KERJA" },
      { urutan: 12, nama: "DJM lakukan pemeriksaan & klarifikasi", slaValue: 15, slaUnit: "HARI_KERJA" },
      { urutan: 13, nama: "MESDM terbitkan persetujuan pengalihan PI 10%", slaUnit: "TANPA_SLA" },
      { urutan: 14, nama: "PI 10% sudah disetujui", slaUnit: "TANPA_SLA" },
    ],
  },
  {
    id: "DMED_E",
    nama: "DMED-E",
    subpokja: "DMED-E",
    stages: [
      { urutan: 1, nama: "Rekomendasi dari SKK Migas/BPMA", slaUnit: "TANPA_SLA" },
      { urutan: 2, nama: "Tindak lanjut oleh DME/DMED", slaUnit: "TANPA_SLA" },
      { urutan: 3, nama: "Tindak lanjut oleh SDMH", slaUnit: "TANPA_SLA" },
      { urutan: 4, nama: "Tindak lanjut oleh SJH", slaUnit: "TANPA_SLA" },
      { urutan: 5, nama: "Persetujuan MESDM", slaUnit: "TANPA_SLA" },
    ],
  },
];

async function seedTemplates() {
  for (const t of TEMPLATES) {
    const existing = await db.select().from(processTemplate).where(eq(processTemplate.id, t.id));
    if (existing.length > 0) {
      await db
        .update(processTemplate)
        .set({ nama: t.nama, subpokja: t.subpokja })
        .where(eq(processTemplate.id, t.id));
      console.log("  = template di-update:", t.id);
      continue;
    }
    await db.insert(processTemplate).values({ id: t.id, nama: t.nama, subpokja: t.subpokja });
    for (const s of t.stages) {
      await db.insert(stageTemplate).values({
        templateId: t.id,
        urutan: s.urutan,
        nama: s.nama,
        slaValue: s.slaValue ?? null,
        slaUnit: s.slaUnit ?? "TANPA_SLA",
        extraFields: s.extraFields ? { fields: s.extraFields } : null,
      });
    }
    console.log("  + template:", t.id, `(${t.stages.length} tahap)`);
  }
}

// Hari libur nasional contoh (lengkapi/ubah sesuai SKB tiap tahun)
const HARI_LIBUR_2026 = [
  ["2026-01-01", "Tahun Baru Masehi"],
  ["2026-03-19", "Hari Raya Nyepi"],
  ["2026-03-20", "Idul Fitri (perkiraan)"],
  ["2026-03-21", "Idul Fitri (perkiraan)"],
  ["2026-05-01", "Hari Buruh"],
  ["2026-05-27", "Idul Adha (perkiraan)"],
  ["2026-08-17", "Hari Kemerdekaan RI"],
  ["2026-12-25", "Hari Raya Natal"],
];

async function seedHariLibur() {
  for (const [tgl, ket] of HARI_LIBUR_2026) {
    const tanggal = new Date(tgl + "T00:00:00Z");
    const existing = await db.select().from(hariLibur).where(eq(hariLibur.tanggal, tanggal));
    if (existing.length === 0) {
      await db.insert(hariLibur).values({ tanggal, keterangan: ket });
    }
  }
  console.log("  + hari libur 2026 (contoh) di-seed");
}

async function main() {
  console.log("Seeding SIDAME...");
  await seedProvinsi();
  await seedKabupatenKota();
  await seedRoles();
  await seedAdmin();
  await seedTemplates();
  await seedHariLibur();
  console.log("Selesai.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
