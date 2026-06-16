/**
 * Kalkulasi deadline SLA.
 * - HARI_KALENDER: semua hari dihitung
 * - HARI_KERJA: lewati Sabtu, Minggu, dan hari libur nasional
 * - BULAN: tambah n bulan
 */

export type SlaUnit = "HARI_KALENDER" | "HARI_KERJA" | "BULAN" | "TANPA_SLA";

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function hitungDeadline(
  start: Date,
  slaValue: number | null,
  unit: SlaUnit,
  hariLibur: Date[] = []
): Date | null {
  if (slaValue == null || unit === "TANPA_SLA") return null;

  const liburSet = new Set(hariLibur.map(ymd));
  const d = new Date(start);

  if (unit === "HARI_KALENDER") {
    d.setDate(d.getDate() + slaValue);
    return d;
  }

  if (unit === "BULAN") {
    d.setMonth(d.getMonth() + slaValue);
    return d;
  }

  // HARI_KERJA
  let sisa = slaValue;
  while (sisa > 0) {
    d.setDate(d.getDate() + 1);
    const hari = d.getDay(); // 0 = Minggu, 6 = Sabtu
    const akhirPekan = hari === 0 || hari === 6;
    const libur = liburSet.has(ymd(d));
    if (!akhirPekan && !libur) sisa--;
  }
  return d;
}

export type StatusSla = "ON_TRACK" | "MENDEKATI" | "LEWAT" | "TANPA_SLA";

/** Status SLA relatif terhadap hari ini. `mendekatiHari` = ambang peringatan kuning. */
export function statusSla(deadline: Date | null, mendekatiHari = 7, now = new Date()): StatusSla {
  if (!deadline) return "TANPA_SLA";
  const selisihHari = Math.ceil((deadline.getTime() - now.getTime()) / 86_400_000);
  if (selisihHari < 0) return "LEWAT";
  if (selisihHari <= mendekatiHari) return "MENDEKATI";
  return "ON_TRACK";
}
