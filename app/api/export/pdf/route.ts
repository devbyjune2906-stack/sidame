import { type NextRequest } from "next/server";
import PDFDocument from "pdfkit";
import { getCurrentUser } from "@/lib/auth";
import { getExportRows, type ExportRow } from "@/lib/export-data";

export const runtime = "nodejs";

// Kolom yang dicetak di PDF (landscape A4)
const COLS: { key: keyof ExportRow; label: string; width: number }[] = [
  { key: "namaWk", label: "Nama WK", width: 150 },
  { key: "operatorK3s", label: "Operator/K3S", width: 130 },
  { key: "provinsi", label: "Provinsi", width: 90 },
  { key: "typeContract", label: "Kontrak", width: 80 },
  { key: "statusWk", label: "Status", width: 90 },
  { key: "startPsc", label: "Start PSC", width: 70 },
  { key: "endPsc", label: "End PSC", width: 70 },
];

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
  const rows = await getExportRows(user.role, sp);

  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 36 });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const startX = doc.page.margins.left;

  // Judul
  doc.fillColor("#0B5E54").fontSize(16).font("Helvetica-Bold").text("SIDAME — Daftar Wilayah Kerja Migas");
  doc
    .fillColor("#64726F")
    .fontSize(9)
    .font("Helvetica")
    .text(
      `Dicetak: ${new Date().toLocaleString("id-ID")}  •  Total: ${rows.length} WK  •  Oleh: ${user.nama} (${user.role})`
    );
  doc.moveDown(0.8);

  const rowHeight = 20;

  function drawHeader(y: number) {
    doc.save();
    doc.rect(startX, y, pageWidth, rowHeight).fill("#0B5E54");
    doc.fillColor("#FFFFFF").fontSize(8).font("Helvetica-Bold");
    let x = startX + 4;
    for (const c of COLS) {
      doc.text(c.label, x, y + 6, { width: c.width - 6, ellipsis: true });
      x += c.width;
    }
    doc.restore();
    return y + rowHeight;
  }

  let y = drawHeader(doc.y);

  doc.font("Helvetica").fontSize(8);
  rows.forEach((r, i) => {
    if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = drawHeader(doc.page.margins.top);
      doc.font("Helvetica").fontSize(8);
    }
    if (i % 2 === 0) {
      doc.save().rect(startX, y, pageWidth, rowHeight).fill("#F6F8F7").restore();
    }
    doc.fillColor("#16211F");
    let x = startX + 4;
    for (const c of COLS) {
      doc.text(String(r[c.key] ?? ""), x, y + 6, { width: c.width - 6, ellipsis: true });
      x += c.width;
    }
    y += rowHeight;
  });

  if (rows.length === 0) {
    doc.fillColor("#64726F").text("Belum ada data.", startX, y + 8);
  }

  doc.end();
  const pdf = await done;
  const tgl = new Date().toISOString().slice(0, 10);

  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="wilayah-kerja-${tgl}.pdf"`,
    },
  });
}
