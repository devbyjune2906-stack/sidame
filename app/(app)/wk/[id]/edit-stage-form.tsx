"use client";

import { useState } from "react";
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

export function EditCatatanButton({
  stageProgressId,
  wkId,
  currentCatatan,
}: {
  stageProgressId: string;
  wkId: string;
  currentCatatan: string | null;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-muted hover:text-petroleum"
        title="Edit catatan"
      >
        ✎ Edit Catatan
      </button>
    );
  }

  async function handleSubmit(formData: FormData) {
    await editStageCatatan(formData);
    setOpen(false);
  }

  return (
    <form action={handleSubmit} className="space-y-2">
      <input type="hidden" name="stageProgressId" value={stageProgressId} />
      <input type="hidden" name="wkId" value={wkId} />
      <Textarea
        name="catatan"
        defaultValue={currentCatatan ?? ""}
        rows={3}
        className="text-sm"
        placeholder="Tulis catatan..."
        autoFocus
      />
      <div className="flex gap-2">
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
      </div>
    </form>
  );
}
