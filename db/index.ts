import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Catatan: jangan melempar error saat import — agar `next build` tidak gagal
// ketika DATABASE_URL belum tersedia di tahap build. Koneksi bersifat lazy
// (postgres-js tidak konek sampai ada query), dan saat runtime env sudah di-set.
const connectionString =
  process.env.DATABASE_URL || "postgres://user:pass@localhost:5432/postgres";

if (!process.env.DATABASE_URL && process.env.NODE_ENV !== "production") {
  console.warn("[SIDAME] DATABASE_URL belum di-set — memakai placeholder (hanya aman saat build).");
}

// Hindari banyak koneksi saat hot-reload di mode development
const globalForDb = globalThis as unknown as { client?: ReturnType<typeof postgres> };

const client = globalForDb.client ?? postgres(connectionString, { max: 10 });
if (process.env.NODE_ENV !== "production") globalForDb.client = client;

export const db = drizzle(client, { schema });
export { schema };
