# SIDAME — Sistem Database Wilayah Kerja Migas

Aplikasi web untuk mengelola **database master Wilayah Kerja (WK) Minyak & Gas Bumi nasional**: pendataan, pencarian, filter, dashboard ringkasan, export Excel/PDF, dan manajemen akses berbasis Pokja.

Dibangun dengan **Next.js 15 + PostgreSQL + Drizzle ORM**, siap dideploy di **Coolify**.

---

## Fitur (Fase 1)

- **Autentikasi** email & password (session JWT httpOnly).
- **Hak akses berbasis Pokja** — tiap Pokja hanya mengelola WK sesuai status kewenangannya:
  - Pokja DMEW → `Sedang Dilelang`
  - Pokja DMEE → `Eksplorasi`
  - Pokja DMED → `POD I`
  - Pokja DMEP → `Onstream`
  - Admin → seluruh data + manajemen user.
- **CRUD Wilayah Kerja** (tambah, ubah, hapus) dengan validasi & batasan akses di sisi server.
- **Pencarian & filter** (nama WK, operator, lapangan, status, provinsi) + pagination.
- **Dashboard** — total WK, jumlah per status, per kontrak, per provinsi, per operator, plus grafik.
- **Export Excel & PDF** yang mengikuti filter dan kewenangan pengguna.
- **Manajemen user** (khusus Admin).

Skema database sudah menyiapkan fondasi **Fase 2** (modul detail per-Pokja, engine timeline/SLA, produksi bulanan DMEP, tabel hari libur) — lihat `db/schema.ts`.

---

## Stack

| Bagian | Teknologi |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Database | PostgreSQL |
| ORM | Drizzle ORM + drizzle-kit |
| Auth | JWT (jose) + bcrypt, cookie httpOnly |
| UI | Tailwind CSS (komponen sendiri) |
| Grafik | Recharts |
| Export | ExcelJS (Excel), PDFKit (PDF) |

---

## Struktur Folder

```
app/
  login/                 # halaman & action login
  (app)/                 # area terproteksi (sidebar + guard)
    dashboard/           # ringkasan + grafik
    wk/                  # daftar, tambah, edit, action CRUD
    admin/users/         # manajemen user (Admin)
  api/export/excel|pdf/  # route export
db/
  schema.ts              # seluruh tabel Drizzle
  index.ts               # koneksi
  seed.ts                # role, admin, process template, hari libur
lib/                     # auth, rbac, sla, konstanta, query helper
components/              # sidebar, charts, filter, UI dasar
Dockerfile, entrypoint.sh
drizzle.config.ts
```

---

## Menjalankan Secara Lokal

Prasyarat: Node.js 20+, PostgreSQL berjalan.

```bash
# 1. Install dependency
npm install

# 2. Siapkan environment
cp .env.example .env
#   lalu isi DATABASE_URL, AUTH_SECRET (openssl rand -base64 32),
#   dan kredensial SEED_ADMIN_*

# 3. Buat tabel di database
npm run db:push

# 4. Isi data awal (role, admin, template, hari libur)
npm run db:seed

# 5. Jalankan
npm run dev
```

Buka http://localhost:3000 dan login dengan akun `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.

### Skrip yang tersedia

| Skrip | Fungsi |
|---|---|
| `npm run dev` | Mode pengembangan |
| `npm run build` / `npm run start` | Build & jalankan produksi |
| `npm run db:push` | Terapkan skema langsung ke DB (cepat, untuk awal/dev) |
| `npm run db:generate` | Buat file migrasi SQL (untuk pelacakan perubahan/produksi) |
| `npm run db:migrate` | Terapkan migrasi yang sudah di-generate |
| `npm run db:studio` | Buka Drizzle Studio (GUI database) |
| `npm run db:seed` | Isi data awal |

---

## Deploy ke Coolify

1. **Push repo** ini ke GitHub/GitLab.
2. Di Coolify: **New Project → New Resource → Database → PostgreSQL**. Salin **connection string internal**-nya.
3. **New Resource → Application → from Git**, pilih repo ini. Build pack: **Dockerfile** (terdeteksi otomatis).
4. **Environment Variables**:
   - `DATABASE_URL` — connection string internal PostgreSQL dari langkah 2
   - `AUTH_SECRET` — hasil `openssl rand -base64 32`
   - `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAMA` — akun admin awal
5. **Port**: `3000`. Pasang domain & aktifkan HTTPS (Let's Encrypt otomatis).
6. **Deploy.** Saat container start, `entrypoint.sh` otomatis:
   - menerapkan skema (`drizzle-kit push`),
   - menjalankan seed (idempotent — aman dijalankan berulang),
   - menjalankan aplikasi.
7. Login dengan akun admin → **segera ganti password** → buat user untuk tiap Pokja.

> **Catatan migrasi:** Untuk kemudahan deploy pertama, `entrypoint.sh` memakai `drizzle-kit push` (menyamakan DB dengan skema). Bila nanti ingin pelacakan perubahan skema yang ketat untuk produksi, ganti ke alur migrasi: jalankan `npm run db:generate` lalu commit folder `drizzle/`, dan ubah perintah di `entrypoint.sh` menjadi `npx drizzle-kit migrate`.

---

## Keamanan Akses (RBAC)

Pembatasan ditegakkan di **sisi server** (Server Action & query), bukan sekadar disembunyikan di UI:

- Setiap query WK difilter berdasarkan status yang menjadi kewenangan role (`lib/rbac.ts`).
- Operasi tambah/ubah/hapus memeriksa apakah role berwenang atas status data tersebut.
- Area `/admin/*` dijaga oleh middleware (hanya role `Admin`).

---

## Akun Default

Dibuat oleh seed dari variabel `SEED_ADMIN_*`. **Wajib ganti password setelah login pertama.** Akun Pokja dibuat oleh Admin melalui menu Manajemen User.

---

## Lisensi

Internal — sesuaikan dengan kebijakan instansi.
