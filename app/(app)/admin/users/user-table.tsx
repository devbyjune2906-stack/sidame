"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Button, Input, Label, Select, Card } from "@/components/ui";
import { addToast } from "@/lib/toast";
import { deleteUser, editUser } from "./actions";

type User = { id: string; nama: string; email: string; role: string };
type Role = { id: number; nama: string };

/* ── Edit modal ── */
function EditModal({
  user,
  roleList,
  onClose,
}: {
  user: User;
  roleList: Role[];
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(editUser, null);

  useEffect(() => {
    if (state?.ok) {
      addToast("Data user berhasil diperbarui.");
      onClose();
    }
    if (state?.error) addToast(state.error, "error");
  }, [state, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <Card className="relative z-10 w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-petroleum/10">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5 text-petroleum"
              >
                <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
              </svg>
            </div>
            <h2 className="font-display text-base font-bold text-ink">Edit User</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-line/70 hover:text-ink"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={user.id} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="edit-nama">Nama</Label>
              <Input id="edit-nama" name="nama" defaultValue={user.nama} required />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                name="email"
                type="email"
                defaultValue={user.email}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="edit-password">Password Baru</Label>
              <Input
                id="edit-password"
                name="password"
                type="password"
                placeholder="Kosongkan jika tidak diganti"
                minLength={8}
              />
              <p className="mt-1 text-[11px] text-muted">Min. 8 karakter, atau kosongkan.</p>
            </div>
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select
                id="edit-role"
                name="roleId"
                defaultValue={roleList.find((r) => r.nama === user.role)?.id ?? ""}
                required
              >
                <option value="" disabled>— Pilih role —</option>
                {roleList.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nama}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

/* ── Delete confirmation dialog ── */
function DeleteDialog({
  user,
  onCancel,
  onConfirm,
  pending,
}: {
  user: User;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl"
        style={{ animation: "dialog-pop 0.18s cubic-bezier(.34,1.56,.64,1) both" }}
      >
        {/* Red accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-danger/70 via-danger to-danger/70" />

        <div className="p-6">
          {/* Warning icon */}
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/10">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                className="h-7 w-7 text-danger"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
          </div>

          <h3 className="mb-1 text-center font-display text-lg font-bold text-ink">
            Hapus User?
          </h3>
          <p className="text-center text-sm text-muted">
            User{" "}
            <span className="font-semibold text-ink">"{user.nama}"</span> akan
            dihapus secara permanen dan tidak bisa dipulihkan.
          </p>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              className="flex-1 rounded-xl border border-line py-2.5 text-sm font-medium text-ink transition-colors hover:bg-line/50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={pending}
              className="flex-1 rounded-xl bg-danger py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Menghapus..." : "Ya, Hapus"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dialog-pop {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
      `}</style>
    </div>
  );
}

/* ── Main table component ── */
export function UserTable({
  userList,
  currentUserId,
  roleList,
  canEdit = true,
}: {
  userList: User[];
  currentUserId: string;
  roleList: Role[];
  canEdit?: boolean;
}) {
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [isPending, startTransition] = useTransition();
  const deleteFormRef = useRef<HTMLFormElement>(null);

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    const name = deleteTarget.nama;
    const fd = new FormData();
    fd.set("id", deleteTarget.id);
    startTransition(async () => {
      await deleteUser(fd);
      setDeleteTarget(null);
      addToast(`User "${name}" berhasil dihapus.`);
    });
  }

  return (
    <>
      <Card className="p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-semibold">Nama</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 text-right font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {userList.map((u) => (
              <tr key={u.id} className="border-b border-line/60 last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{u.nama}</td>
                <td className="px-4 py-3 text-ink">{u.email}</td>
                <td className="px-4 py-3 text-ink">{u.role}</td>
                <td className="px-4 py-3 text-right">
                  {u.id === currentUserId ? (
                    <span className="text-xs text-muted">Akun Anda</span>
                  ) : !canEdit ? (
                    <span className="text-xs text-muted">—</span>
                  ) : (
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setEditTarget(u)}
                        className="text-sm font-medium text-petroleum hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(u)}
                        className="text-sm font-medium text-danger hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Hidden form — not used but kept for fallback */}
      <form ref={deleteFormRef} action={deleteUser} className="hidden">
        <input type="hidden" name="id" value={deleteTarget?.id ?? ""} />
      </form>

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <DeleteDialog
          user={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          pending={isPending}
        />
      )}

      {/* Edit modal */}
      {editTarget && (
        <EditModal
          user={editTarget}
          roleList={roleList}
          onClose={() => setEditTarget(null)}
        />
      )}
    </>
  );
}
