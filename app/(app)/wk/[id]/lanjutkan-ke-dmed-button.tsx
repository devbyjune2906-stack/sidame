"use client";

import { Button } from "@/components/ui";
import { lanjutkanKeDmed } from "./lanjutkan-ke-dmed-action";

export default function LanjutkanKeDmedButton({ wkId }: { wkId: string }) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!confirm("Lanjutkan WK ini ke Pokja DMED (POD I)? Status WK akan berubah menjadi POD I.")) {
      e.preventDefault();
    }
  }

  return (
    <form action={lanjutkanKeDmed} onSubmit={handleSubmit}>
      <input type="hidden" name="wkId" value={wkId} />
      <Button type="submit">Lanjutkan ke POD I (DMED)</Button>
    </form>
  );
}
