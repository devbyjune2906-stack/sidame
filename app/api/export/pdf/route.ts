import { type NextRequest } from "next/server";
import PDFDocument from "pdfkit";
import { getCurrentUser } from "@/lib/auth";
import { getExportRows, type ExportRow } from "@/lib/export-data";

export const runtime = "nodejs";

const ALL_COLS: { key: keyof ExportRow; label: string; width: number }[] = [
  { key: "namaWk",            label: "Nama WK",                   width: 140 },
  { key: "lapangan",          label: "Lapangan",                  width: 100 },
  { key: "operatorK3s",       label: "Operator/K3S",              width: 120 },
  { key: "pemegangSaham",     label: "Pemegang Saham",            width: 110 },
  { key: "provinsi",          label: "Provinsi",                  width: 85  },
  { key: "kabupaten",         label: "Kab/Kota",                  width: 90  },
  { key: "typeContract",      label: "Kontrak",                   width: 75  },
  { key: "jenisWk",           label: "Jenis WK",                  width: 85  },
  { key: "statusWk",          label: "Status",                    width: 85  },
  { key: "startPsc",          label: "Start PSC",                 width: 65  },
  { key: "endPsc",            label: "End PSC",                   width: 65  },
  { key: "jenisPod",          label: "Jenis POD",                 width: 90  },
  { key: "luasWilayahSisa",   label: "Luas (Km2)",               width: 70  },
  { key: "persetujuanPodI",   label: "Persetujuan POD I",         width: 80  },
  { key: "revisiPodI1",       label: "Revisi POD I-1",            width: 75  },
  { key: "revisiPodI2",       label: "Revisi POD I-2",            width: 75  },
  { key: "perkiraanOnstream", label: "Perkiraan Onstream",        width: 80  },
  { key: "fluidaProduksi",    label: "Fluida Produksi",           width: 70  },
  { key: "cadanganGas",       label: "Cad. Gas",                  width: 60  },
  { key: "cadanganMinyak",    label: "Cad. Minyak",               width: 65  },
  { key: "asumsiHargaGas",    label: "Harga Gas (USD/MMBTU)",     width: 80  },
  { key: "asumsiHargaMinyak", label: "Harga Minyak (USD/BBL)",    width: 80  },
  { key: "grossRevenue",      label: "Gross Rev (MM USD)",        width: 80  },
  { key: "costRecovery",      label: "Cost Rec (MM USD)",         width: 80  },
  { key: "goiTake",           label: "GOI Take",                  width: 65  },
  { key: "contTake",          label: "Cont. Take",                width: 65  },
  { key: "irr",               label: "IRR (%)",                   width: 55  },
  { key: "npvGov",            label: "NPV Gov",                   width: 65  },
  { key: "npvKkks",           label: "NPV KKKS",                  width: 65  },
  { key: "capex",             label: "Capex",                     width: 60  },
  { key: "opex",              label: "Opex",                      width: 60  },
  { key: "asr",               label: "ASR",                       width: 55  },
  { key: "sunkCost",          label: "Sunk Cost",                 width: 65  },
  { key: "statusKesdmDjm",    label: "Status KESDM/DJM",          width: 90  },
  { key: "statusSkkMigas",    label: "Status SKK Migas",          width: 85  },
  { key: "statusKkks",        label: "Status KKKS",               width: 75  },
  { key: "keterangan",        label: "Keterangan",                width: 100 },
];

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
  const rows = await getExportRows(user.role, sp);

  const selectedKeys = sp.cols
    ? sp.cols.split(",").filter((k) => ALL_COLS.some((c) => c.key === k))
    : ALL_COLS.map((c) => c.key);

  const COLS = ALL_COLS.filter((c) => selectedKeys.includes(c.key));

  const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: 36 });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const startX = doc.page.margins.left;

  const totalColWidth = COLS.reduce((s, c) => s + c.width, 0);
  const scale = pageWidth / totalColWidth;
  const scaledCols = COLS.map((c) => ({ ...c, width: c.width * scale }));

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
    for (const c of scaledCols) {
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
    for (const c of scaledCols) {
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
