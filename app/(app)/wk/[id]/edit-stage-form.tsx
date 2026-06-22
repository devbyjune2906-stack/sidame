"use client";

import { useEffect, useState } from "react";
import { Button, Input, Textarea } from "@/components/ui";
import { editStageName, editStageCatatan } from "./edit-stage-action";

export function EditStageNameButton({
  stageProgressId,
  wkId,
  currentNama,
}: {
  stageProgressId: string;
  wkId: string;
  currentNama: string;
}) {
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
  const [value, setValue] = useState(currentCatatan ?? "");

  // Sync textarea when server refreshes the prop after save/delete
  useEffect(() => { setValue(currentCatatan ?? ""); }, [currentCatatan]);

  async function handleSimpan(formData: FormData) {
    await editStageCatatan(formData);
  }

  async function handleHapus() {
    const fd = new FormData();
    fd.set("stageProgressId", stageProgressId);
    fd.set("wkId", wkId);
    fd.set("catatan", "");
    await editStageCatatan(fd);
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
        </div>
      </form>
    </div>
  );
}
