import { redirect, notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  provinsi,
  kabupaten,
  wilayahKerja,
  wkProcess,
  processTemplate,
  dmewLelangDetail,
  dmedPodiDetail,
  dmedPi10Detail,
  dmedEDetail,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { allowedStatuses, canManageStatus, canWrite, isDmew, isDmen } from "@/lib/rbac";
import { STATUS_WK_VALUES, type StatusWk } from "@/lib/constants";
import { WkForm, type WkInitial } from "../../wk-form";
import { updateWk } from "../../actions";

function toInput(d: Date | null): string | undefined {
  if (!d) return undefined;
  return new Date(d).toISOString().slice(0, 10);
}

async function loadProcessInitial(wkId: string): Promise<{ dmew?: WkInitial["dmew"]; dmed?: WkInitial["dmed"]; hasProcess: boolean }> {
  const [proc] = await db
    .select({ templateId: wkProcess.templateId, subpokja: processTemplate.subpokja })
    .from(wkProcess)
    .innerJoin(processTemplate, eq(wkProcess.templateId, processTemplate.id))
    .where(eq(wkProcess.wkId, wkId))
    .limit(1);

  if (!proc) return { hasProcess: false };

  if (["DMEW-S", "DMEW-T", "DMEN-N", "DMEN-K"].includes(proc.subpokja ?? "")) {
    const [detail] = await db.select().from(dmewLelangDetail).where(eq(dmewLelangDetail.wkId, wkId)).limit(1);
    const pokja = (detail?.subpokja ?? "").startsWith("DMEN") ? "DMEN" : "DMEW";
    return {
      hasProcess: true,
      dmew: { pokja, subpokja: detail?.subpokja, jalur: detail?.jalur, diusulkanWkBaru: detail?.diusulkanWkBaru },
    };
  }

  if (proc.templateId === "DMED_PODI") {
    const [d] = await db.select().from(dmedPodiDetail).where(eq(dmedPodiDetail.wkId, wkId)).limit(1);
    return {
      hasProcess: true,
      dmed: {
        subpokja: "DMED-T",
        jenis: "POD_I",
        podi: d
          ? {
              jenisPod: d.jenisPod,
              luasWilayahSisa: d.luasWilayahSisa,
              persetujuanPodI: toInput(d.persetujuanPodI),
              revisiPodI1: toInput(d.revisiPodI1),
              revisiPodI2: toInput(d.revisiPodI2),
              perkiraanOnstream: toInput(d.perkiraanOnstream),
              fluidaProduksi: d.fluidaProduksi,
              cadanganGas: d.cadanganGas,
              cadanganMinyak: d.cadanganMinyak,
              asumsiHargaGas: d.asumsiHargaGas,
              asumsiHargaMinyak: d.asumsiHargaMinyak,
              grossRevenue: d.grossRevenue,
              costRecovery: d.costRecovery,
              goiTake: d.goiTake,
              contTake: d.contTake,
              irr: d.irr,
              npvGov: d.npvGov,
              npvKkks: d.npvKkks,
              capex: d.capex,
              opex: d.opex,
              asr: d.asr,
              sunkCost: d.sunkCost,
              statusKesdmDjm: d.statusKesdmDjm,
              statusSkkMigas: d.statusSkkMigas,
              statusKkks: d.statusKkks,
              keterangan: d.keterangan,
            }
          : undefined,
      },
    };
  }

  if (proc.templateId === "DMED_PI10") {
    const [d] = await db.select().from(dmedPi10Detail).where(eq(dmedPi10Detail.wkId, wkId)).limit(1);
    return {
      hasProcess: true,
      dmed: {
        subpokja: "DMED-T",
        jenis: "PI10",
        pi10: d
          ? {
              bumdPenerima: d.bumdPenerima,
              bumdPengelola: d.bumdPengelola,
              statusKesdmDjm: d.statusKesdmDjm,
              statusSkkMigas: d.statusSkkMigas,
              statusProvBumd: d.statusProvBumd,
              statusKkks: d.statusKkks,
              tglEfekPi10: toInput(d.tglEfekPi10),
              tglPerstMesdm: toInput(d.tglPerstMesdm),
            }
          : undefined,
      },
    };
  }

  if (proc.templateId === "DMED_E") {
    const [d] = await db.select().from(dmedEDetail).where(eq(dmedEDetail.wkId, wkId)).limit(1);
    return {
      hasProcess: true,
      dmed: {
        subpokja: "DMED-E",
        dmedE: d
          ? {
              statusKesdmDjm: d.statusKesdmDjm,
              statusSkkMigas: d.statusSkkMigas,
              statusProvBumd: d.statusProvBumd,
              statusKkks: d.statusKkks,
              tglEfekPi10: toInput(d.tglEfekPi10),
              tglPerstMesdm: toInput(d.tglPerstMesdm),
            }
          : undefined,
      },
    };
  }

  return { hasProcess: true };
}

export default async function EditWkPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const sp = await searchParams;
  const back = typeof sp.back === "string" && /^\/wk(\/|$)/.test(sp.back) ? sp.back : undefined;
  const [wk] = await db.select().from(wilayahKerja).where(eq(wilayahKerja.id, id)).limit(1);
  if (!wk) notFound();

  if (!canWrite(user.role) || !canManageStatus(user.role, wk.statusWk as StatusWk)) {
    redirect(`/wk/${id}`);
  }

  const allowed = allowedStatuses(user.role);
  const selectable: StatusWk[] = allowed === "ALL" ? STATUS_WK_VALUES : allowed;
  const userPokja = isDmew(user.role) ? "DMEW" : isDmen(user.role) ? "DMEN" : undefined;

  const provinsiList = await db
    .select({ id: provinsi.id, nama: provinsi.nama })
    .from(provinsi)
    .orderBy(asc(provinsi.nama));

  const kabupatenList = await db
    .select({ id: kabupaten.id, nama: kabupaten.nama, provinsiId: kabupaten.provinsiId })
    .from(kabupaten)
    .orderBy(asc(kabupaten.nama));

  const { dmew, dmed, hasProcess } = await loadProcessInitial(id);

  // bind id ke action update
  const action = updateWk.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="font-display text-2xl font-bold text-ink">Edit Wilayah Kerja</h1>
      <WkForm
        action={action}
        selectableStatuses={selectable}
        provinsiList={provinsiList}
        kabupatenList={kabupatenList}
        submitLabel="Simpan Perubahan"
        hasProcess={hasProcess}
        userPokja={userPokja}
        back={back}
        initial={{
          namaWk: wk.namaWk,
          lapangan: wk.lapangan,
          operatorK3s: wk.operatorK3s,
          pemegangSaham: wk.pemegangSaham,
          provinsiId: wk.provinsiId,
          provinsiIds: wk.provinsiIds,
          kabupatenId: wk.kabupatenId,
          kabupatenIds: wk.kabupatenIds,
          typeContract: wk.typeContract,
          statusWk: wk.statusWk,
          startPsc: toInput(wk.startPsc),
          endPsc: toInput(wk.endPsc),
          dmew,
          dmed,
        }}
      />
    </div>
  );
}
