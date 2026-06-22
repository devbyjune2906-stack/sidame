"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Textarea } from "@/components/ui";
import { editStageName, editStageCatatan, editStageValues } from "./edit-stage-action";

type ExtraField = { key: string; label: string; type?: "text" | "checkbox" };

export function EditStageNameButton({
  stageProgressId,
  wkId,
  currentNama,
}: {
  stageProgressId: string;
  wkId: string;
  currentNama: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-muted hover:text-petroleum"
        title="Edit nama tahap"
      >
        ✎ Edit
      </button>
    );
  }

  async function handleSubmit(formData: FormData) {
    await editStageName(formData);
    setOpen(false);
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="flex items-center gap-2">
      <input type="hidden" name="stageProgressId" value={stageProgressId} />
      <input type="hidden" name="wkId" value={wkId} />
      <Input
        name="namaOverride"
        defaultValue={currentNama}
        className="h-7 py-0 text-sm"
        autoFocus
      />
      <Button type="submit" className="h-7 px-2 py-0 text-xs">
        Simpan
      </Button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs text-muted hover:text-danger"
      >
        Batal
      </button>
    </form>
  );
}

export function CatatanSection({
  stageProgressId,
  wkId,
  currentCatatan,
}: {
  stageProgressId: string;
  wkId: string;
  currentCatatan: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(currentCatatan ?? "");

  useEffect(() => { setValue(currentCatatan ?? ""); }, [currentCatatan]);

  async function handleSimpan(formData: FormData) {
    await editStageCatatan(formData);
    setOpen(false);
    router.refresh();
  }

  async function handleHapus() {
    const fd = new FormData();
    fd.set("stageProgressId", stageProgressId);
    fd.set("wkId", wkId);
    fd.set("catatan", "");
    await editStageCatatan(fd);
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <div className="flex items-start gap-2">
        {currentCatatan ? (
          <>
            <div className="flex-1">
              <p className="text-xs font-medium text-muted">Catatan</p>
              <p className="mt-0.5 text-sm text-ink">{currentCatatan}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="shrink-0 text-xs text-muted hover:text-petroleum"
            >
              ✎ Edit
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-xs text-muted hover:text-petroleum"
          >
            + Tambah catatan
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted">Catatan</p>
      <form action={handleSimpan} className="space-y-2">
        <input type="hidden" name="stageProgressId" value={stageProgressId} />
        <input type="hidden" name="wkId" value={wkId} />
        <Textarea
          name="catatan"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={3}
          className="text-sm"
          placeholder="Tulis catatan di sini..."
          autoFocus
        />
        <div className="flex gap-2">
          <Button type="submit" className="h-7 px-3 py-0 text-xs">
            Simpan
          </Button>
          {currentCatatan && (
            <button
              type="button"
              onClick={handleHapus}
              className="h-7 rounded px-3 py-0 text-xs text-danger hover:bg-danger/10"
            >
              Hapus
            </button>
          )}
          <button
            type="button"
            onClick={() => { setValue(currentCatatan ?? ""); setOpen(false); }}
            className="text-xs text-muted hover:text-danger"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}

export function EditStageValuesButton({
  stageProgressId,
  wkId,
  extra,
  currentValues,
  currentCatatan,
}: {
  stageProgressId: string;
  wkId: string;
  extra: ExtraField[];
  currentValues: Record<string, string>;
  currentCatatan?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const checkboxKeys = extra.filter((f) => f.type === "checkbox").map((f) => f.key).join(",");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-muted hover:text-petroleum"
        title="Edit nilai tahap"
      >
        ✎ Edit
      </button>
    );
  }

  async function handleSubmit(formData: FormData) {
    await editStageValues(formData);
    setOpen(false);
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="space-y-3 rounded-lg bg-line/20 p-3">
      <input type="hidden" name="stageProgressId" value={stageProgressId} />
      <input type="hidden" name="wkId" value={wkId} />
      <input type="hidden" name="_checkboxKeys" value={checkboxKeys} />
      {extra.map((f) =>
        f.type === "checkbox" ? (
          <label key={f.key} className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              name={`extra_${f.key}`}
              defaultChecked={currentValues[f.key] === "true"}
              className="h-4 w-4 rounded border-line accent-petroleum"
            />
            <span className="text-sm text-ink">{f.label}</span>
          </label>
        ) : (
          <div key={f.key}>
            <label className="text-xs text-muted">{f.label}</label>
            <Input
              name={`extra_${f.key}`}
              defaultValue={currentValues[f.key] ?? ""}
              className="mt-1"
            />
          </div>
        )
      )}
      <div>
        <label className="text-xs text-muted">Catatan</label>
        <Textarea
          name="catatan"
          defaultValue={currentCatatan ?? ""}
          rows={3}
          className="mt-1 text-sm"
          placeholder="Tulis catatan di sini..."
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="h-7 px-3 py-0 text-xs">
          Simpan
        </Button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-muted hover:text-danger"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
