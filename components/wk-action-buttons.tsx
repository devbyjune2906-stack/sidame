"use client";

import Link from "next/link";
import { useTransition } from "react";
import { deleteWk } from "@/app/(app)/wk/actions";

export function WkActionButtons({
  id,
  editHref,
  canWrite,
}: {
  id: string;
  editHref: string;
  canWrite: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Hapus WK ini secara permanen? Tindakan tidak dapat dibatalkan.")) return;
    const fd = new FormData();
    fd.set("id", id);
    startTransition(() => deleteWk(fd));
  }

  return (
    <div className="flex items-center justify-end gap-0.5">
      {/* View */}
      <Link
        href={`/wk/${id}`}
        title="Lihat Detail"
        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-petroleum transition-colors hover:bg-petroleum/10"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
          <path
            fillRule="evenodd"
            d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41z"
            clipRule="evenodd"
          />
        </svg>
      </Link>

      {/* Edit */}
      {canWrite && (
        <Link
          href={editHref}
          title="Edit"
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-ink/60 transition-colors hover:bg-line/70 hover:text-ink"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
          </svg>
        </Link>
      )}

      {/* Delete */}
      {canWrite && (
        <button
          type="button"
          title="Hapus"
          disabled={isPending}
          onClick={handleDelete}
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-danger/70 transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-40"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path
              fillRule="evenodd"
              d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
