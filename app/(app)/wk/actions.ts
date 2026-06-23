"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  wilayahKerja,
  dmewLelangDetail,
  dmedPodiDetail,
  dmedPi10Detail,
  dmedEDetail,
  wkProcess,
  processTemplate,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { canManageStatus, canWrite, isDmen } from "@/lib/rbac";
import { type StatusWk } from "@/lib/constants";
import {
  dmewTemplateId,
  dmenTemplateId,
  dmedTemplateId,
  type DmewJalur,
  type DmenSubpokja,
  type DmewSubpokja,
  type DmedJenis,
} from "@/lib/process-map";
import { createWkProcess } from "@/lib/process-engine";

const schema = z.object({
  namaWk: z.string().trim().min(1, "Nama WK wajib diisi"),
  lapangan: z.string().trim().optional(),
  operatorK3s: z.string().trim().optional(),
  pemegangSaham: z.string().trim().optional(),
  provinsiId: z.coerce.number().int().positive().optional(),
  provinsiIds: z.string().optional(),
  kabupatenId: z.coerce.number().int().positive().optional(),
  kabupatenIds: z.string().optional(),
  typeContract: z.enum(["COST_RECOVERY", "GROSS_SPLIT"]).optional(),
  statusWk: z.enum(["WK_USULAN_BARU", "SEDANG_DILELANG", "EKSPLORASI", "POD_I", "ONSTREAM"]),
  startPsc: z.string().optional(),
  endPsc: z.string().optional(),
});

type ActionState = { error?: string } | null;

function parse(formData: FormData) {
  const raw = {
    namaWk: formData.get("namaWk"),
    lapangan: formData.get("lapangan") || undefined,
    operatorK3s: formData.get("operatorK3s") || undefined,
    pemegangSaham: formData.get("pemegangSaham") || undefined,
    provinsiId: formData.get("provinsiId") || undefined,
    provinsiIds: formData.get("provinsiIds") || undefined,
    kabupatenId: formData.get("kabupatenId") || undefined,
    kabupatenIds: formData.get("kabupatenIds") || undefined,
    typeContract: formData.get("typeContract") || undefined,
    statusWk: formData.get("statusWk"),
    startPsc: formData.get("startPsc") || undefined,
    endPsc: formData.get("endPsc") || undefined,
  };
  return schema.safeParse(raw);
}

function toDate(v?: string | null): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  return v ? String(v) : null;
}

function num(fd: FormData, key: string): number | null {
  const v = fd.get(key);
  if (!v) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function podiFieldsFromForm(fd: FormData) {
  return {
    jenisPod: str(fd, "jenisPod") as
      | "POD_I"
      | "REVISI_PODI_1"
      | "REVISI_PODI_2_PERPANJANGAN"
      | "PERINGATAN_1"
      | "PERINGATAN_2"
      | "PERINGATAN_3"
      | "TERMINASI"
      | null,
    luasWilayahSisa: num(fd, "luasWilayahSisa"),
    persetujuanPodI: toDate(str(fd, "persetujuanPodI")),
    revisiPodI1: toDate(str(fd, "revisiPodI1")),
    revisiPodI2: toDate(str(fd, "revisiPodI2")),
    perkiraanOnstream: toDate(str(fd, "perkiraanOnstream")),
    fluidaProduksi: str(fd, "fluidaProduksi"),
    cadanganGas: str(fd, "cadanganGas"),
    cadanganMinyak: str(fd, "cadanganMinyak"),
    asumsiHargaGas: num(fd, "asumsiHargaGas"),
    asumsiHargaMinyak: num(fd, "asumsiHargaMinyak"),
    grossRevenue: num(fd, "grossRevenue"),
    costRecovery: num(fd, "costRecovery"),
    goiTake: num(fd, "goiTake"),
    contTake: num(fd, "contTake"),
    irr: num(fd, "irr"),
    npvGov: num(fd, "npvGov"),
    npvKkks: num(fd, "npvKkks"),
    capex: num(fd, "capex"),
    opex: num(fd, "opex"),
    asr: num(fd, "asr"),
    sunkCost: num(fd, "sunkCost"),
    statusKesdmDjm: str(fd, "statusKesdmDjm"),
    statusSkkMigas: str(fd, "statusSkkMigas"),
    statusKkks: str(fd, "statusKkks"),
    keterangan: str(fd, "keterangan"),
  };
}

function pi10FieldsFromForm(fd: FormData) {
  return {
    bumdPenerima: str(fd, "bumdPenerima"),
    bumdPengelola: str(fd, "bumdPengelola"),
    statusKesdmDjm: str(fd, "statusKesdmDjm"),
    statusSkkMigas: str(fd, "statusSkkMigas"),
    statusProvBumd: str(fd, "statusProvBumd"),
    statusKkks: str(fd, "statusKkks"),
    tglEfekPi10: toDate(str(fd, "tglEfekPi10")),
    tglPerstMesdm: toDate(str(fd, "tglPerstMesdm")),
  };
}

function dmedEFieldsFromForm(fd: FormData) {
  return {
    statusKesdmDjm: str(fd, "statusKesdmDjm"),
    statusSkkMigas: str(fd, "statusSkkMigas"),
    statusProvBumd: str(fd, "statusProvBumd"),
    statusKkks: str(fd, "statusKkks"),
    tglEfekPi10: toDate(str(fd, "tglEfekPi10")),
    tglPerstMesdm: toDate(str(fd, "tglPerstMesdm")),
  };
}

/** Buat detail row + wk_process untuk WK DMEW/DMEN/DMED yang baru dibuat. */
async function createProcessAndDetail(wkId: string, statusWk: StatusWk, formData: FormData) {
  if (statusWk === "SEDANG_DILELANG" || statusWk === "WK_USULAN_BARU") {
    const pokjaCode = (str(formData, "pokjaDmew") ?? "DMEW") as "DMEW" | "DMEN";
    const jalur = (str(formData, "jalurDmew") ?? "REGULER") as DmewJalur;
    let templateId: string;

    if (pokjaCode === "DMEN") {
      const subpokja = (str(formData, "subpokjaDmew") ?? "DMEN-N") as DmenSubpokja;
      templateId = dmenTemplateId(subpokja, jalur);
      await db.insert(dmewLelangDetail).values({ wkId, subpokja, jalur, diusulkanWkBaru: false });
    } else {
      const subpokja = (str(formData, "subpokjaDmew") ?? "DMEW-S") as DmewSubpokja;
      templateId = dmewTemplateId(subpokja, jalur);
      const diusulkanWkBaru = formData.get("diusulkanWkBaru") === "on";
      await db.insert(dmewLelangDetail).values({ wkId, subpokja, jalur, diusulkanWkBaru });
    }

    await createWkProcess(wkId, templateId);
    return;
  }

  if (statusWk === "POD_I") {
    const subpokja = (str(formData, "subpokjaDmed") ?? "DMED-T") as "DMED-T" | "DMED-E";

    if (subpokja === "DMED-E") {
      await db.insert(dmedEDetail).values({ wkId, ...dmedEFieldsFromForm(formData) });
      await createWkProcess(wkId, "DMED_E");
      return;
    }

    const jenis = (str(formData, "jenisDmed") ?? "POD_I") as DmedJenis;
    const templateId = dmedTemplateId(subpokja, jenis);
    if (!templateId) return;

    if (jenis === "POD_I") {
      await db.insert(dmedPodiDetail).values({ wkId, ...podiFieldsFromForm(formData) });
    } else {
      await db.insert(dmedPi10Detail).values({ wkId, ...pi10FieldsFromForm(formData) });
    }
    await createWkProcess(wkId, templateId);
  }
}

/** Update detail row WK yang sudah punya wk_process (sub-pokja/template tidak berubah). */
async function updateDetailForExistingProcess(wkId: string, formData: FormData) {
  const [proc] = await db
    .select({ templateId: wkProcess.templateId, subpokja: processTemplate.subpokja })
    .from(wkProcess)
    .innerJoin(processTemplate, eq(wkProcess.templateId, processTemplate.id))
    .where(eq(wkProcess.wkId, wkId))
    .limit(1);
  if (!proc) return;

  if (proc.templateId === "DMED_PODI") {
    await db.update(dmedPodiDetail).set(podiFieldsFromForm(formData)).where(eq(dmedPodiDetail.wkId, wkId));
  } else if (proc.templateId === "DMED_PI10") {
    await db.update(dmedPi10Detail).set(pi10FieldsFromForm(formData)).where(eq(dmedPi10Detail.wkId, wkId));
  } else if (proc.templateId === "DMED_E") {
    await db.update(dmedEDetail).set(dmedEFieldsFromForm(formData)).where(eq(dmedEDetail.wkId, wkId));
  }
  // DMEW: subpokja/jalur terkunci, tapi diusulkanWkBaru bisa diubah
  if (["DMEW-S", "DMEW-T"].includes(proc.subpokja ?? "")) {
    const diusulkanWkBaru = formData.get("diusulkanWkBaru") === "on";
    await db.update(dmewLelangDetail).set({ diusulkanWkBaru }).where(eq(dmewLelangDetail.wkId, wkId));
  }
}

export async function createWk(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!canWrite(user.role)) {
    return { error: "Anda tidak berwenang melakukan tindakan ini." };
  }

  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  const data = parsed.data;

  if (!canManageStatus(user.role, data.statusWk as StatusWk)) {
    return { error: "Anda tidak berwenang menambah data pada status WK ini." };
  }

  // Tentukan jenisWk untuk WK yang masuk pipeline DMEW/DMEN
  let jenisWkValue: "KONVENSIONAL" | "NON_KONVENSIONAL" | null = null;
  if (data.statusWk === "SEDANG_DILELANG" || data.statusWk === "WK_USULAN_BARU") {
    const pokjaCode = str(formData, "pokjaDmew") ?? (isDmen(user.role) ? "DMEN" : "DMEW");
    jenisWkValue = pokjaCode === "DMEN" ? "NON_KONVENSIONAL" : "KONVENSIONAL";
  }

  const [created] = await db
    .insert(wilayahKerja)
    .values({
      namaWk: data.namaWk,
      lapangan: data.lapangan ?? null,
      operatorK3s: data.operatorK3s ?? null,
      pemegangSaham: data.pemegangSaham ?? null,
      provinsiId: data.provinsiId ?? null,
      provinsiIds: data.provinsiIds ?? null,
      kabupatenId: data.kabupatenId ?? null,
      kabupatenIds: data.kabupatenIds ?? null,
      typeContract: data.typeContract ?? null,
      statusWk: data.statusWk,
      jenisWk: jenisWkValue,
      startPsc: toDate(data.startPsc),
      endPsc: toDate(data.endPsc),
    })
    .returning();

  await createProcessAndDetail(created.id, data.statusWk as StatusWk, formData);

  revalidatePath("/wk");
  redirect("/wk");
}

export async function updateWk(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (!canWrite(user.role)) {
    return { error: "Anda tidak berwenang melakukan tindakan ini." };
  }

  const [existing] = await db.select().from(wilayahKerja).where(eq(wilayahKerja.id, id)).limit(1);
  if (!existing) return { error: "Data tidak ditemukan." };

  // harus berwenang atas status lama
  if (!canManageStatus(user.role, existing.statusWk as StatusWk)) {
    return { error: "Anda tidak berwenang mengubah data ini." };
  }

  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  const data = parsed.data;

  // dan berwenang atas status baru
  if (!canManageStatus(user.role, data.statusWk as StatusWk)) {
    return { error: "Anda tidak berwenang memindahkan data ke status WK tersebut." };
  }

  await db
    .update(wilayahKerja)
    .set({
      namaWk: data.namaWk,
      lapangan: data.lapangan ?? null,
      operatorK3s: data.operatorK3s ?? null,
      pemegangSaham: data.pemegangSaham ?? null,
      provinsiId: data.provinsiId ?? null,
      provinsiIds: data.provinsiIds ?? null,
      kabupatenId: data.kabupatenId ?? null,
      kabupatenIds: data.kabupatenIds ?? null,
      typeContract: data.typeContract ?? null,
      statusWk: data.statusWk,
      startPsc: toDate(data.startPsc),
      endPsc: toDate(data.endPsc),
      updatedAt: new Date(),
    })
    .where(eq(wilayahKerja.id, id));

  if (existing.statusWk === data.statusWk) {
    await updateDetailForExistingProcess(id, formData);
  }

  revalidatePath("/wk");
  redirect("/wk");
}

export async function deleteWk(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canWrite(user.role)) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const [existing] = await db.select().from(wilayahKerja).where(eq(wilayahKerja.id, id)).limit(1);
  if (!existing) return;

  if (!canManageStatus(user.role, existing.statusWk as StatusWk)) return;

  await db.delete(wilayahKerja).where(eq(wilayahKerja.id, id));
  revalidatePath("/wk");
}
