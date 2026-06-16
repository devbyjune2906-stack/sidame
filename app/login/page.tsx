"use client";

import { useActionState } from "react";
import { login } from "./actions";
import { Button, Input, Label } from "@/components/ui";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null as { error?: string } | null);

  return (
    <main className="flex min-h-screen items-center justify-center bg-petroleum-dark px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center text-white">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 font-display text-2xl font-extrabold tracking-tight">
            SD
          </div>
          <h1 className="font-display text-2xl font-bold">SIDAME</h1>
          <p className="mt-1 text-sm text-white/70">Sistem Database Wilayah Kerja Migas</p>
        </div>

        <form action={formAction} className="space-y-4 rounded-2xl bg-surface p-6 shadow-card">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="username" required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>

          {state?.error && (
            <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{state.error}</p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Memproses..." : "Masuk"}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-white/50">
          Akses dibatasi sesuai kewenangan Pokja masing-masing.
        </p>
      </div>
    </main>
  );
}
