import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { wilayahKerja, provinsi, kabupaten, dmedPodiDetail } from "@/db/schema";
import { buildWkWhere, parseFilters } from "./wk-query";
import {
  STATUS_WK_LABEL,
  TYPE_CONTRACT_LABEL,
  JENIS_WK_LABEL,
  JENIS_POD_LABEL,
  type StatusWk,
  type TypeContract,
  type JenisWk,
  type JenisPod,
} from "./constants";

export type ExportRow = {
  // WK Umum
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
  // Detail POD I
  jenisPod: string;
  luasWilayahSisa: string;
  persetujuanPodI: string;
  revisiPodI1: string;
  revisiPodI2: string;
  perkiraanOnstream: string;
  fluidaProduksi: string;
  cadanganGas: string;
  cadanganMinyak: string;
  asumsiHargaGas: string;
  asumsiHargaMinyak: string;
  grossRevenue: string;
  costRecovery: string;
  goiTake: string;
  contTake: string;
  irr: string;
  npvGov: string;
  npvKkks: string;
  capex: string;
  opex: string;
  asr: string;
  sunkCost: string;
  statusKesdmDjm: string;
  statusSkkMigas: string;
  statusKkks: string;
  keterangan: string;
};

function fmt(d: Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtNum(n: number | null | undefined): string {
  if (n == null) return "";
  return n.toString();
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
      // POD I detail
      jenisPod: dmedPodiDetail.jenisPod,
      luasWilayahSisa: dmedPodiDetail.luasWilayahSisa,
      persetujuanPodI: dmedPodiDetail.persetujuanPodI,
      revisiPodI1: dmedPodiDetail.revisiPodI1,
      revisiPodI2: dmedPodiDetail.revisiPodI2,
      perkiraanOnstream: dmedPodiDetail.perkiraanOnstream,
      fluidaProduksi: dmedPodiDetail.fluidaProduksi,
      cadanganGas: dmedPodiDetail.cadanganGas,
      cadanganMinyak: dmedPodiDetail.cadanganMinyak,
      asumsiHargaGas: dmedPodiDetail.asumsiHargaGas,
      asumsiHargaMinyak: dmedPodiDetail.asumsiHargaMinyak,
      grossRevenue: dmedPodiDetail.grossRevenue,
      costRecovery: dmedPodiDetail.costRecovery,
      goiTake: dmedPodiDetail.goiTake,
      contTake: dmedPodiDetail.contTake,
      irr: dmedPodiDetail.irr,
      npvGov: dmedPodiDetail.npvGov,
      npvKkks: dmedPodiDetail.npvKkks,
      capex: dmedPodiDetail.capex,
      opex: dmedPodiDetail.opex,
      asr: dmedPodiDetail.asr,
      sunkCost: dmedPodiDetail.sunkCost,
      statusKesdmDjm: dmedPodiDetail.statusKesdmDjm,
      statusSkkMigas: dmedPodiDetail.statusSkkMigas,
      statusKkks: dmedPodiDetail.statusKkks,
      keterangan: dmedPodiDetail.keterangan,
    })
    .from(wilayahKerja)
    .leftJoin(provinsi, eq(wilayahKerja.provinsiId, provinsi.id))
    .leftJoin(dmedPodiDetail, eq(dmedPodiDetail.wkId, wilayahKerja.id))
    .where(where)
    .orderBy(asc(wilayahKerja.namaWk));

  return rows.map((r) => {
    let kabupatenNama = "";
    if (r.kabupatenIds) {
      kabupatenNama = r.kabupatenIds
        .split(",").map(Number).filter(Boolean)
        .map((id) => kabMap.get(id) ?? "").filter(Boolean)
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
      // POD I
      jenisPod: r.jenisPod ? (JENIS_POD_LABEL[r.jenisPod as JenisPod] ?? r.jenisPod) : "",
      luasWilayahSisa: fmtNum(r.luasWilayahSisa),
      persetujuanPodI: fmt(r.persetujuanPodI),
      revisiPodI1: fmt(r.revisiPodI1),
      revisiPodI2: fmt(r.revisiPodI2),
      perkiraanOnstream: fmt(r.perkiraanOnstream),
      fluidaProduksi: r.fluidaProduksi ?? "",
      cadanganGas: r.cadanganGas ?? "",
      cadanganMinyak: r.cadanganMinyak ?? "",
      asumsiHargaGas: fmtNum(r.asumsiHargaGas),
      asumsiHargaMinyak: fmtNum(r.asumsiHargaMinyak),
      grossRevenue: fmtNum(r.grossRevenue),
      costRecovery: fmtNum(r.costRecovery),
      goiTake: fmtNum(r.goiTake),
      contTake: fmtNum(r.contTake),
      irr: fmtNum(r.irr),
      npvGov: fmtNum(r.npvGov),
      npvKkks: fmtNum(r.npvKkks),
      capex: fmtNum(r.capex),
      opex: fmtNum(r.opex),
      asr: fmtNum(r.asr),
      sunkCost: fmtNum(r.sunkCost),
      statusKesdmDjm: r.statusKesdmDjm ?? "",
      statusSkkMigas: r.statusSkkMigas ?? "",
      statusKkks: r.statusKkks ?? "",
      keterangan: r.keterangan ?? "",
    };
  });
}
