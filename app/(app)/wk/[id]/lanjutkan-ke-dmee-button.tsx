"use client";

import { Button } from "@/components/ui";
import { lanjutkanKeDmee } from "./lanjutkan-ke-dmee-action";

export default function LanjutkanKeDmeeButton({ wkId }: { wkId: string }) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!confirm("Lanjutkan WK ini ke Pokja DMEE? Status WK akan berubah menjadi Eksplorasi.")) {
      e.preventDefault();
    }
  }

  return (
    <form action={lanjutkanKeDmee} onSubmit={handleSubmit}>
      <input type="hidden" name="wkId" value={wkId} />
      <Button type="submit">Lanjutkan ke DMEE</Button>
    </form>
  );
}
