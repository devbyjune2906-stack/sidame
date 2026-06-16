import { type NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { getCurrentUser } from "@/lib/auth";
import { getExportRows } from "@/lib/export-data";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
  const rows = await getExportRows(user.role, sp);

  const wb = new ExcelJS.Workbook();
  wb.creator = "SIDAME";
  const ws = wb.addWorksheet("Wilayah Kerja");

  ws.columns = [
    { header: "Nama WK", key: "namaWk", width: 28 },
    { header: "Lapangan", key: "lapangan", width: 20 },
    { header: "Operator/K3S", key: "operatorK3s", width: 24 },
    { header: "Pemegang Saham", key: "pemegangSaham", width: 26 },
    { header: "Provinsi", key: "provinsi", width: 18 },
    { header: "Type Contract", key: "typeContract", width: 16 },
    { header: "Status WK", key: "statusWk", width: 16 },
    { header: "Start PSC", key: "startPsc", width: 14 },
    { header: "End PSC", key: "endPsc", width: 14 },
  ];

  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0B5E54" } };
  rows.forEach((r) => ws.addRow(r));

  const buffer = await wb.xlsx.writeBuffer();
  const tgl = new Date().toISOString().slice(0, 10);

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="wilayah-kerja-${tgl}.xlsx"`,
    },
  });
}
