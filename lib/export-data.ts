import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { wilayahKerja, provinsi, kabupaten } from "@/db/schema";
import { buildWkWhere, parseFilters } from "./wk-query";
import {
  STATUS_WK_LABEL,
  TYPE_CONTRACT_LABEL,
  JENIS_WK_LABEL,
  type StatusWk,
  type TypeContract,
  type JenisWk,
} from "./constants";

export type ExportRow = {
  namaWk: string;
  lapangan: string;
  operatorK3s: string;
  pemegangSaham: string;
  provinsi: string;
  kabupaten: string;
  typeContract: string;
  jenisWk: string;
  statusWk: string;
  startPsc: string;
  endPsc: string;
};

function fmt(d: Date | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export async function getExportRows(
  role: string,
  sp: Record<string, string | string[] | undefined>
): Promise<ExportRow[]> {
  const filters = parseFilters(sp);
  const where = buildWkWhere(role, filters);

  const allKabupaten = await db.select({ id: kabupaten.id, nama: kabupaten.nama }).from(kabupaten);
  const kabMap = new Map(allKabupaten.map((k) => [k.id, k.nama]));

  const rows = await db
    .select({
      namaWk: wilayahKerja.namaWk,
      lapangan: wilayahKerja.lapangan,
      operatorK3s: wilayahKerja.operatorK3s,
      pemegangSaham: wilayahKerja.pemegangSaham,
      provinsiNama: provinsi.nama,
      kabupatenId: wilayahKerja.kabupatenId,
      kabupatenIds: wilayahKerja.kabupatenIds,
      typeContract: wilayahKerja.typeContract,
      jenisWk: wilayahKerja.jenisWk,
      statusWk: wilayahKerja.statusWk,
      startPsc: wilayahKerja.startPsc,
      endPsc: wilayahKerja.endPsc,
    })
    .from(wilayahKerja)
    .leftJoin(provinsi, eq(wilayahKerja.provinsiId, provinsi.id))
    .where(where)
    .orderBy(asc(wilayahKerja.namaWk));

  return rows.map((r) => {
    let kabupatenNama = "";
    if (r.kabupatenIds) {
      kabupatenNama = r.kabupatenIds
        .split(",")
        .map(Number)
        .filter(Boolean)
        .map((id) => kabMap.get(id) ?? "")
        .filter(Boolean)
        .join(", ");
    } else if (r.kabupatenId) {
      kabupatenNama = kabMap.get(r.kabupatenId) ?? "";
    }

    return {
      namaWk: r.namaWk,
      lapangan: r.lapangan ?? "",
      operatorK3s: r.operatorK3s ?? "",
      pemegangSaham: r.pemegangSaham ?? "",
      provinsi: r.provinsiNama ?? "",
      kabupaten: kabupatenNama,
      typeContract: r.typeContract ? TYPE_CONTRACT_LABEL[r.typeContract as TypeContract] : "",
      jenisWk: r.jenisWk ? (JENIS_WK_LABEL[r.jenisWk as JenisWk] ?? r.jenisWk) : "",
      statusWk: STATUS_WK_LABEL[r.statusWk as StatusWk],
      startPsc: fmt(r.startPsc),
      endPsc: fmt(r.endPsc),
    };
  });
}
