"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button, Input, Label, Select, Card } from "@/components/ui";
import { addToast } from "@/lib/toast";
import { createUser } from "./actions";

type Role = { id: number; nama: string };

export function UserForm({ roleList }: { roleList: Role[] }) {
  const [state, formAction, pending] = useActionState(createUser, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      addToast("User berhasil ditambahkan.");
    }
    if (state?.error) addToast(state.error, "error");
  }, [state]);

  return (
    <Card>
      <h2 className="mb-4 font-display text-base font-semibold text-ink">Tambah User</h2>
      <form ref={formRef} action={formAction} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="nama">Nama</Label>
            <Input id="nama" name="nama" required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" minLength={8} required />
          </div>
          <div>
            <Label htmlFor="roleId">Role</Label>
            <Select id="roleId" name="roleId" required defaultValue="">
              <option value="" disabled>
                — Pilih role —
              </option>
              {roleList.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nama}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan..." : "Tambah User"}
        </Button>
      </form>
    </Card>
  );
}
