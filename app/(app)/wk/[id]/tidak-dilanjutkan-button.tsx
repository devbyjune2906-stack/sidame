"use client";

import { Button } from "@/components/ui";
import { markTidakDilanjutkan } from "./tidak-dilanjutkan-action";

export default function TidakDilanjutkanButton({ wkId }: { wkId: string }) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!confirm("Tandai WK ini sebagai Tidak Dilanjutkan? Tindakan ini tidak dapat dibatalkan.")) {
      e.preventDefault();
    }
  }

  return (
    <form action={markTidakDilanjutkan} onSubmit={handleSubmit}>
      <input type="hidden" name="wkId" value={wkId} />
      <Button type="submit" variant="outline" className="border-danger text-danger hover:bg-danger/10">
        Tidak Dilanjutkan
      </Button>
    </form>
  );
}
