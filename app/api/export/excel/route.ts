import { type NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { getCurrentUser } from "@/lib/auth";
import { getExportRows } from "@/lib/export-data";

export const runtime = "nodejs";

const ALL_COLS = [
  { header: "Nama WK",                   key: "namaWk",            width: 28 },
  { header: "Lapangan",                  key: "lapangan",           width: 20 },
  { header: "Operator/K3S",              key: "operatorK3s",        width: 24 },
  { header: "Pemegang Saham",            key: "pemegangSaham",      width: 26 },
  { header: "Provinsi",                  key: "provinsi",           width: 18 },
  { header: "Kabupaten/Kota",            key: "kabupaten",          width: 22 },
  { header: "Type Contract",             key: "typeContract",       width: 16 },
  { header: "Jenis WK",                  key: "jenisWk",            width: 18 },
  { header: "Status WK",                 key: "statusWk",           width: 16 },
  { header: "Start PSC",                 key: "startPsc",           width: 14 },
  { header: "End PSC",                   key: "endPsc",             width: 14 },
  { header: "Jenis POD",                 key: "jenisPod",           width: 20 },
  { header: "Luas Wilayah Sisa (Km2)",   key: "luasWilayahSisa",    width: 20 },
  { header: "Persetujuan POD I",         key: "persetujuanPodI",    width: 16 },
  { header: "Revisi POD I ke 1",         key: "revisiPodI1",        width: 16 },
  { header: "Revisi POD I ke 2",         key: "revisiPodI2",        width: 16 },
  { header: "Perkiraan Onstream",        key: "perkiraanOnstream",  width: 16 },
  { header: "Fluida Produksi",           key: "fluidaProduksi",     width: 14 },
  { header: "Cadangan Gas",             key: "cadanganGas",        width: 14 },
  { header: "Cadangan Minyak",          key: "cadanganMinyak",     width: 14 },
  { header: "Asumsi Harga Gas (USD/MMBTU)", key: "asumsiHargaGas", width: 22 },
  { header: "Asumsi Harga Minyak (USD/BBL)", key: "asumsiHargaMinyak", width: 22 },
  { header: "Gross Revenue (MM USD)",    key: "grossRevenue",       width: 20 },
  { header: "Cost Recovery (MM USD)",    key: "costRecovery",       width: 20 },
  { header: "GOI Take (MM USD)",         key: "goiTake",            width: 18 },
  { header: "Cont. Take (MM USD)",       key: "contTake",           width: 18 },
  { header: "IRR (%)",                   key: "irr",                width: 12 },
  { header: "NPV Gov (MM USD)",          key: "npvGov",             width: 18 },
  { header: "NPV KKKS (MM USD)",         key: "npvKkks",            width: 18 },
  { header: "Capex (MM USD)",            key: "capex",              width: 16 },
  { header: "Opex (MM USD)",             key: "opex",               width: 16 },
  { header: "ASR (MM USD)",              key: "asr",                width: 14 },
  { header: "Sunk Cost (MM USD)",        key: "sunkCost",           width: 16 },
  { header: "Status KESDM/DJM",          key: "statusKesdmDjm",     width: 18 },
  { header: "Status SKK Migas",          key: "statusSkkMigas",     width: 18 },
  { header: "Status KKKS",               key: "statusKkks",         width: 16 },
  { header: "Keterangan",                key: "keterangan",         width: 30 },
] as const;

type ColKey = (typeof ALL_COLS)[number]["key"];

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
  const rows = await getExportRows(user.role, sp);

  const selectedKeys: ColKey[] = sp.cols
    ? (sp.cols.split(",").filter((k) => ALL_COLS.some((c) => c.key === k)) as ColKey[])
    : ALL_COLS.map((c) => c.key);

  const activeCols = ALL_COLS.filter((c) => selectedKeys.includes(c.key));

  const wb = new ExcelJS.Workbook();
  wb.creator = "SIDAME";
  const ws = wb.addWorksheet("Wilayah Kerja");

  ws.columns = activeCols.map((c) => ({ header: c.header, key: c.key, width: c.width }));

  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0B5E54" } };

  rows.forEach((r) => {
    const rowData: Record<string, string> = {};
    for (const col of activeCols) rowData[col.key] = r[col.key] ?? "";
    ws.addRow(rowData);
  });

  const buffer = await wb.xlsx.writeBuffer();
  const tgl = new Date().toISOString().slice(0, 10);

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="wilayah-kerja-${tgl}.xlsx"`,
    },
  });
}
