#!/bin/sh
set -e

echo "[SIDAME] Menerapkan skema database (drizzle push)..."
npx drizzle-kit push

echo "[SIDAME] Menjalankan seed (idempotent)..."
npx tsx db/seed.ts

echo "[SIDAME] Menjalankan aplikasi di port ${PORT:-3000}..."
npm run start
