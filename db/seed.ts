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
  direktorat,
  pokja,
  masterSubPokja,
} from "./schema";
import { and, eq, isNull } from "drizzle-orm";
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

/* ===== MASTER HIERARKI ORGANISASI ===== */

const DIREKTORAT_DATA = {
  kode: "DME",
  nama: "Direktorat Pembinaan Usaha Hulu Migas",
};

const POKJA_DATA = [
  { kode: "DMEW", nama: "Pengembangan Wilayah Kerja Minyak dan Gas Bumi Konvensional" },
  { kode: "DMED", nama: "Pengembangan Usaha Hulu Minyak dan Gas Bumi" },
  { kode: "DMEE", nama: "Pengawasan Eksplorasi Minyak dan Gas Bumi" },
  { kode: "DMEP", nama: "Pengawasan Eksploitasi Minyak dan Gas Bumi" },
  { kode: "DMEN", nama: "Pengembangan Wilayah Kerja Minyak dan Gas Bumi Non Konvensional" },
];

const SUB_POKJA_DATA: { pokjaKode: string; kode: string; nama: string }[] = [
  { pokjaKode: "DMEW", kode: "DMEW-S", nama: "DMEW-S" },
  { pokjaKode: "DMEW", kode: "DMEW-T", nama: "DMEW-T" },
  { pokjaKode: "DMED", kode: "DMED-T", nama: "DMED-T" },
  { pokjaKode: "DMED", kode: "DMED-E", nama: "DMED-E" },
  { pokjaKode: "DMEE", kode: "DMEE-L", nama: "DMEE-L" },
  { pokjaKode: "DMEE", kode: "DMEE-M", nama: "DMEE-M" },
  { pokjaKode: "DMEP", kode: "DMEP-L", nama: "DMEP-L" },
  { pokjaKode: "DMEP", kode: "DMEP-P", nama: "DMEP-P" },
  { pokjaKode: "DMEN", kode: "DMEN-N", nama: "DMEN-N" },
  { pokjaKode: "DMEN", kode: "DMEN-K", nama: "DMEN-K" },
];

async function seedDirektorat() {
  const existing = await db.select().from(direktorat).where(eq(direktorat.kode, DIREKTORAT_DATA.kode));
  if (existing.length === 0) {
    await db.insert(direktorat).values(DIREKTORAT_DATA);
    console.log("  + direktorat:", DIREKTORAT_DATA.nama);
  } else {
    await db.update(direktorat).set({ nama: DIREKTORAT_DATA.nama }).where(eq(direktorat.kode, DIREKTORAT_DATA.kode));
    console.log("  = direktorat di-update");
  }
}

async function seedPokja() {
  const [dir] = await db.select().from(direktorat).where(eq(direktorat.kode, DIREKTORAT_DATA.kode));
  if (!dir) return;
  for (const p of POKJA_DATA) {
    const existing = await db.select().from(pokja).where(eq(pokja.kode, p.kode));
    if (existing.length === 0) {
      await db.insert(pokja).values({ ...p, direktoratId: dir.id });
      console.log("  + pokja:", p.kode);
    } else {
      await db.update(pokja).set({ nama: p.nama }).where(eq(pokja.kode, p.kode));
    }
  }
}

async function seedMasterSubPokja() {
  const pokjaRows = await db.select().from(pokja);
  const pokjaIdByKode = new Map(pokjaRows.map((p) => [p.kode, p.id]));
  for (const sp of SUB_POKJA_DATA) {
    const pokjaId = pokjaIdByKode.get(sp.pokjaKode);
    if (!pokjaId) continue;
    const existing = await db.select().from(masterSubPokja).where(eq(masterSubPokja.kode, sp.kode));
    if (existing.length === 0) {
      await db.insert(masterSubPokja).values({ kode: sp.kode, nama: sp.nama, pokjaId });
      console.log("  + sub pokja:", sp.kode);
    } else {
      await db.update(masterSubPokja).set({ nama: sp.nama }).where(eq(masterSubPokja.kode, sp.kode));
    }
  }
}

type ExtraField = { key: string; label: string; type?: "text" | "checkbox" };

type StageDef = {
  urutan: number;
  nama: string;
  slaValue?: number;
  slaUnit?: "HARI_KALENDER" | "HARI_KERJA" | "BULAN" | "TANPA_SLA";
  extraFields?: ExtraField[];
};

const SK_TNC_FIELDS: ExtraField[] = [
  { key: "split", label: "Split", type: "text" },
  { key: "komitmenPasti", label: "Komitmen Pasti (PB)", type: "text" },
  { key: "signatureBonus", label: "Signature Bonus", type: "text" },
  { key: "semua_selesai", label: "Semua progress sudah selesai, lanjut ke Sub Pokja berikutnya", type: "checkbox" },
];

const TEMPLATES: { id: string; nama: string; subpokja: string; stages: StageDef[] }[] = [
  {
    id: "DMEW_REGULER",
    nama: "DMEW-S Reguler",
    subpokja: "DMEW-S",
    stages: [
      {
        urutan: 1,
        nama: "Tim WK / Usulan dari KKKS",
        slaValue: 4,
        slaUnit: "BULAN",
        extraFields: [{ key: "kirim_dokumen", label: "Sudah mengirim dokumen", type: "checkbox" }],
      },
      {
        urutan: 2,
        nama: "Penyiapan WK yang Dilelang",
        slaUnit: "TANPA_SLA",
        extraFields: [{ key: "dok_lengkap", label: "Dokumen lengkap", type: "checkbox" }],
      },
      {
        urutan: 3,
        nama: "Pertimbangan SKK Migas / BPMA",
        slaUnit: "TANPA_SLA",
        extraFields: [{ key: "rek_terbit", label: "Rekomendasi SKK Migas / BPMA sudah terbit", type: "checkbox" }],
      },
      {
        urutan: 4,
        nama: "SK TNC",
        slaUnit: "TANPA_SLA",
        extraFields: SK_TNC_FIELDS,
      },
    ],
  },
  {
    id: "DMEW_JOINT_STUDY",
    nama: "DMEW-S Joint Study",
    subpokja: "DMEW-S",
    stages: [
      {
        urutan: 1,
        nama: "Cek Dokumen dan Administrasi",
        slaUnit: "TANPA_SLA",
        extraFields: [{ key: "terpenuhi", label: "Dokumen dan administrasi terpenuhi", type: "checkbox" }],
      },
    ],
  },
  {
    id: "DMEW_T_REGULER",
    nama: "DMEW-T Reguler",
    subpokja: "DMEW-T",
    stages: [
      {
        urutan: 1,
        nama: "Masa Lelang Reguler",
        slaValue: 120,
        slaUnit: "HARI_KALENDER",
        extraFields: [{ key: "pengumuman_terbit", label: "Pengumuman lelang sudah diterbitkan", type: "checkbox" }],
      },
      {
        urutan: 2,
        nama: "Penetapan Pemenang (surat Dirjen Migas)",
        slaUnit: "TANPA_SLA",
        extraFields: [{ key: "surat_pemenang_terbit", label: "Surat penetapan pemenang dari Dirjen Migas sudah terbit", type: "checkbox" }],
      },
      {
        urutan: 3,
        nama: "Pembahasan Kontrak",
        slaUnit: "TANPA_SLA",
        extraFields: [{ key: "kontrak_disepakati", label: "Kontrak sudah disepakati semua pihak", type: "checkbox" }],
      },
      {
        urutan: 4,
        nama: "TTD Kontrak",
        slaUnit: "TANPA_SLA",
        extraFields: [
          { key: "kontrak_ditandatangani", label: "Kontrak sudah ditandatangani", type: "checkbox" },
          { key: "nomor_kontrak", label: "Nomor Kontrak", type: "text" },
          { key: "tanggal_ttd", label: "Tanggal TTD", type: "text" },
        ],
      },
    ],
  },
  {
    id: "DMEW_T_JOINT_STUDY",
    nama: "DMEW-T Joint Study",
    subpokja: "DMEW-T",
    stages: [
      {
        urutan: 1,
        nama: "Masa Lelang Joint Study",
        slaValue: 45,
        slaUnit: "HARI_KALENDER",
        extraFields: [{ key: "pengumuman_terbit", label: "Pengumuman lelang sudah diterbitkan", type: "checkbox" }],
      },
      {
        urutan: 2,
        nama: "Penetapan Pemenang (surat Dirjen Migas)",
        slaUnit: "TANPA_SLA",
        extraFields: [{ key: "surat_pemenang_terbit", label: "Surat penetapan pemenang dari Dirjen Migas sudah terbit", type: "checkbox" }],
      },
      {
        urutan: 3,
        nama: "Pembahasan Kontrak",
        slaUnit: "TANPA_SLA",
        extraFields: [{ key: "kontrak_disepakati", label: "Kontrak sudah disepakati semua pihak", type: "checkbox" }],
      },
      {
        urutan: 4,
        nama: "TTD Kontrak",
        slaUnit: "TANPA_SLA",
        extraFields: [
          { key: "kontrak_ditandatangani", label: "Kontrak sudah ditandatangani", type: "checkbox" },
          { key: "nomor_kontrak", label: "Nomor Kontrak", type: "text" },
          { key: "tanggal_ttd", label: "Tanggal TTD", type: "text" },
        ],
      },
    ],
  },
  {
    id: "DMED_PODI",
    nama: "DMED-T POD I",
    subpokja: "DMED-T",
    stages: [
      {
        urutan: 1,
        nama: "Rekomendasi SKK Migas",
        slaUnit: "TANPA_SLA",
        extraFields: [{ key: "surat_rekomendasi", label: "Surat Rekomendasi", type: "checkbox" }],
      },
      {
        urutan: 2,
        nama: "Menteri Menugaskan Dirjen Migas",
        slaUnit: "TANPA_SLA",
        extraFields: [{ key: "disposisi", label: "Disposisi", type: "checkbox" }],
      },
      {
        urutan: 3,
        nama: "Dirjen Migas Menugaskan DME",
        slaValue: 1,
        slaUnit: "HARI_KERJA",
        extraFields: [{ key: "disposisi", label: "Disposisi", type: "checkbox" }],
      },
      {
        urutan: 4,
        nama: "Dir DME Menugaskan Koord DMED",
        slaUnit: "TANPA_SLA",
      },
      {
        urutan: 5,
        nama: "Koordinator pengecekan POD I Rekom SKK Migas",
        slaValue: 3,
        slaUnit: "HARI_KERJA",
        extraFields: [
          { key: "lengkap", label: "a. Lengkap — lanjut ke tahap berikutnya", type: "checkbox" },
          { key: "tidak_lengkap", label: "b. Tidak Lengkap — konsepkan surat dari Dir DME ke SKK Migas", type: "checkbox" },
        ],
      },
      {
        urutan: 6,
        nama: "Koord DME melakukan penilaian",
        slaValue: 5,
        slaUnit: "HARI_KERJA",
        extraFields: [
          { key: "sesuai", label: "a. Sesuai — lanjut ke tahap berikutnya", type: "checkbox" },
          { key: "tidak_sesuai", label: "b. Tidak Sesuai — konsep surat pengembalian ke SKK/BPMA", type: "checkbox" },
        ],
      },
      {
        urutan: 7,
        nama: "Penentuan Kawasan",
        slaValue: 1,
        slaUnit: "HARI_KERJA",
        extraFields: [
          { key: "dalam_12_mil", label: "a. 0–12 Mil Laut — konsepkan surat dari DJMigas ke Gubernur", type: "checkbox" },
          { key: "atas_12_mil", label: "b. Di atas 12 Mil Laut", type: "checkbox" },
        ],
      },
      {
        urutan: 8,
        nama: "Konsultasi dengan Pemda terkait (Konsulda)",
        slaUnit: "TANPA_SLA",
      },
      {
        urutan: 9,
        nama: "Membuat konsep surat dari DJMigas ke Sekjen KESDM",
        slaValue: 2,
        slaUnit: "HARI_KERJA",
      },
      {
        urutan: 10,
        nama: "DJMigas menyampaikan kepada Sekjen evaluasi permohonan persetujuan POD I",
        slaValue: 1,
        slaUnit: "HARI_KERJA",
      },
    ],
  },
  {
    id: "DMED_PI10",
    nama: "DMED-T PI 10%",
    subpokja: "DMED-T",
    stages: [
      {
        urutan: 1,
        nama: "Persetujuan POD I atau Tgl Efektif KKS Perpanjangan/Alih Kelola",
        slaUnit: "TANPA_SLA",
      },
      {
        urutan: 2,
        nama: "Kepala SKK Migas menyampaikan surat kepada Gubernur untuk menunjuk BUMD",
        slaValue: 10,
        slaUnit: "HARI_KERJA",
      },
      {
        urutan: 3,
        nama: "Gubernur menyampaikan Surat Penunjukan BUMD kepada SKK Migas",
        slaValue: 12,
        slaUnit: "BULAN",
      },
      {
        urutan: 4,
        nama: "Kepala SKK Migas menyampaikan surat kepada Kontraktor untuk memulai penawaran PI 10%",
        slaValue: 10,
        slaUnit: "HARI_KERJA",
      },
      {
        urutan: 5,
        nama: "Kontraktor menyampaikan penawaran tertulis kepada BUMD yang ditunjuk",
        slaValue: 60,
        slaUnit: "HARI_KALENDER",
      },
      {
        urutan: 6,
        nama: "BUMD menyampaikan Pernyataan Minat & Kesanggupan kepada Kontraktor",
        slaValue: 60,
        slaUnit: "HARI_KALENDER",
      },
      {
        urutan: 7,
        nama: "BUMD melakukan Uji Tuntas (Due Diligence) dan Akses Data",
        slaValue: 60,
        slaUnit: "HARI_KALENDER",
      },
      {
        urutan: 8,
        nama: "BUMD menyampaikan surat meneruskan / tidak meneruskan minat atas PI 10%",
        slaValue: 180,
        slaUnit: "HARI_KALENDER",
      },
      {
        urutan: 9,
        nama: "Kontraktor & BUMD menindaklanjuti proses Pengalihan PI 10%",
        slaValue: 180,
        slaUnit: "HARI_KALENDER",
      },
      {
        urutan: 10,
        nama: "Kontraktor mengajukan Permohonan Pengalihan PI 10% kepada Menteri ESDM melalui SKK Migas",
        slaUnit: "TANPA_SLA",
      },
      {
        urutan: 11,
        nama: "SKK Migas menyampaikan rekomendasi pengalihan PI 10% kepada MESDM cq DJM",
        slaValue: 30,
        slaUnit: "HARI_KALENDER",
      },
      {
        urutan: 12,
        nama: "DJM melakukan pemeriksaan dan klarifikasi",
        slaValue: 15,
        slaUnit: "HARI_KALENDER",
      },
      {
        urutan: 13,
        nama: "MESDM menerbitkan persetujuan pengalihan PI 10%",
        slaUnit: "TANPA_SLA",
      },
      {
        urutan: 14,
        nama: "PI 10% Selesai",
        slaUnit: "TANPA_SLA",
      },
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
  // DMEN -- struktur sama dengan DMEW, beda di jenis WK (Non Konvensional)
  {
    id: "DMEN_REGULER",
    nama: "DMEN-N Reguler",
    subpokja: "DMEN-N",
    stages: [
      {
        urutan: 1,
        nama: "Tim WK / Usulan dari KKKS",
        slaValue: 4,
        slaUnit: "BULAN",
        extraFields: [{ key: "kirim_dokumen", label: "Sudah mengirim dokumen", type: "checkbox" }],
      },
      {
        urutan: 2,
        nama: "Penyiapan WK yang Dilelang",
        slaUnit: "TANPA_SLA",
        extraFields: [{ key: "dok_lengkap", label: "Dokumen lengkap", type: "checkbox" }],
      },
      {
        urutan: 3,
        nama: "Pertimbangan SKK Migas / BPMA",
        slaUnit: "TANPA_SLA",
        extraFields: [{ key: "rek_terbit", label: "Rekomendasi SKK Migas / BPMA sudah terbit", type: "checkbox" }],
      },
      {
        urutan: 4,
        nama: "SK TNC",
        slaUnit: "TANPA_SLA",
        extraFields: SK_TNC_FIELDS,
      },
    ],
  },
  {
    id: "DMEN_JOINT_STUDY",
    nama: "DMEN-N Joint Study",
    subpokja: "DMEN-N",
    stages: [
      {
        urutan: 1,
        nama: "Cek Dokumen dan Administrasi",
        slaUnit: "TANPA_SLA",
        extraFields: [{ key: "terpenuhi", label: "Dokumen dan administrasi terpenuhi", type: "checkbox" }],
      },
    ],
  },
  {
    id: "DMEN_T_REGULER",
    nama: "DMEN-K Reguler",
    subpokja: "DMEN-K",
    stages: [
      {
        urutan: 1,
        nama: "Masa Lelang Reguler",
        slaValue: 120,
        slaUnit: "HARI_KALENDER",
        extraFields: [{ key: "pengumuman_terbit", label: "Pengumuman lelang sudah diterbitkan", type: "checkbox" }],
      },
      {
        urutan: 2,
        nama: "Penetapan Pemenang (surat Dirjen Migas)",
        slaUnit: "TANPA_SLA",
        extraFields: [{ key: "surat_pemenang_terbit", label: "Surat penetapan pemenang dari Dirjen Migas sudah terbit", type: "checkbox" }],
      },
      {
        urutan: 3,
        nama: "Pembahasan Kontrak",
        slaUnit: "TANPA_SLA",
        extraFields: [{ key: "kontrak_disepakati", label: "Kontrak sudah disepakati semua pihak", type: "checkbox" }],
      },
      {
        urutan: 4,
        nama: "TTD Kontrak",
        slaUnit: "TANPA_SLA",
        extraFields: [
          { key: "kontrak_ditandatangani", label: "Kontrak sudah ditandatangani", type: "checkbox" },
          { key: "nomor_kontrak", label: "Nomor Kontrak", type: "text" },
          { key: "tanggal_ttd", label: "Tanggal TTD", type: "text" },
        ],
      },
    ],
  },
  {
    id: "DMEN_T_JOINT_STUDY",
    nama: "DMEN-K Joint Study",
    subpokja: "DMEN-K",
    stages: [
      {
        urutan: 1,
        nama: "Masa Lelang Joint Study",
        slaValue: 45,
        slaUnit: "HARI_KALENDER",
        extraFields: [{ key: "pengumuman_terbit", label: "Pengumuman lelang sudah diterbitkan", type: "checkbox" }],
      },
      {
        urutan: 2,
        nama: "Penetapan Pemenang (surat Dirjen Migas)",
        slaUnit: "TANPA_SLA",
        extraFields: [{ key: "surat_pemenang_terbit", label: "Surat penetapan pemenang dari Dirjen Migas sudah terbit", type: "checkbox" }],
      },
      {
        urutan: 3,
        nama: "Pembahasan Kontrak",
        slaUnit: "TANPA_SLA",
        extraFields: [{ key: "kontrak_disepakati", label: "Kontrak sudah disepakati semua pihak", type: "checkbox" }],
      },
      {
        urutan: 4,
        nama: "TTD Kontrak",
        slaUnit: "TANPA_SLA",
        extraFields: [
          { key: "kontrak_ditandatangani", label: "Kontrak sudah ditandatangani", type: "checkbox" },
          { key: "nomor_kontrak", label: "Nomor Kontrak", type: "text" },
          { key: "tanggal_ttd", label: "Tanggal TTD", type: "text" },
        ],
      },
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
      // Juga update stages yang sudah ada (nama, SLA, extraFields) berdasarkan urutan
      for (const s of t.stages) {
        const existingStage = await db
          .select({ id: stageTemplate.id })
          .from(stageTemplate)
          .where(and(eq(stageTemplate.templateId, t.id), eq(stageTemplate.urutan, s.urutan)))
          .limit(1);
        if (existingStage.length > 0) {
          await db
            .update(stageTemplate)
            .set({
              nama: s.nama,
              slaValue: s.slaValue ?? null,
              slaUnit: s.slaUnit ?? "TANPA_SLA",
              extraFields: s.extraFields ? { fields: s.extraFields } : null,
            })
            .where(eq(stageTemplate.id, existingStage[0].id));
        } else {
          // Tahap baru untuk template yang sudah ada — insert
          await db.insert(stageTemplate).values({
            templateId: t.id,
            urutan: s.urutan,
            nama: s.nama,
            slaValue: s.slaValue ?? null,
            slaUnit: s.slaUnit ?? "TANPA_SLA",
            extraFields: s.extraFields ? { fields: s.extraFields } : null,
          });
          console.log(`    + tahap baru urutan ${s.urutan} untuk template ${t.id}`);
        }
      }
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
  await seedDirektorat();
  await seedPokja();
  await seedMasterSubPokja();
  console.log("Selesai.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
