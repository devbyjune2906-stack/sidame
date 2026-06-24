"use client";

import { useActionState, useState } from "react";
import { login } from "./actions";
import { Button, Label, Input } from "@/components/ui";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null as { error?: string } | null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="flex min-h-screen">

      {/* ── Left: background image panel (hidden on mobile) ── */}
      <div
        className="relative hidden flex-1 flex-col lg:flex"
        style={{
          backgroundImage: "url('/banner-dme.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(8,68,61,0.88) 0%, rgba(11,94,84,0.72) 50%, rgba(8,68,61,0.60) 100%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-14 text-center text-white">
          <img
            src="/logo-dme.png"
            alt="DME"
            className="mb-7 h-28 w-28 object-contain drop-shadow-2xl"
          />

          <h1
            className="font-display font-extrabold leading-tight tracking-tight drop-shadow-lg"
            style={{ fontSize: "clamp(1.6rem, 2.5vw, 2.4rem)" }}
          >
            Direktorat Pembinaan<br />Usaha Hulu Migas
          </h1>

          <div className="my-5 h-px w-20 rounded-full bg-white/30" />

          <p className="text-base font-semibold text-white/90">
            SIDAME
          </p>
          <p className="mt-1 text-sm text-white/65">
            Sistem Database Wilayah Kerja Migas
          </p>

          <p className="mt-8 text-xs font-medium uppercase tracking-widest text-white/45">
            Kementerian Energi dan Sumber Daya Mineral
          </p>
        </div>

        {/* Bottom watermark strip */}
        <div
          className="relative z-10 px-8 py-4"
          style={{ background: "rgba(8,68,61,0.75)", borderTop: "1px solid rgba(255,255,255,0.12)" }}
        >
          <p className="text-center text-[11px] font-semibold uppercase tracking-widest text-white/50">
            DME UPSTREAM OIL &amp; GAS DATABASE SYSTEM
          </p>
        </div>
      </div>

      {/* ── Right: login form panel ── */}
      <div className="flex w-full flex-col items-center justify-center bg-[#F0F4F3] px-6 py-12 lg:w-[420px] lg:shrink-0">

        {/* Mobile-only header (hidden on desktop where left panel shows) */}
        <div className="mb-8 text-center lg:hidden">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-petroleum/10 p-1">
            <img src="/logo-dme.png" alt="DME" className="h-full w-full object-contain" />
          </div>
          <h1 className="font-display text-xl font-bold text-petroleum">
            Direktorat Pembinaan Usaha Hulu Migas
          </h1>
          <p className="mt-1 text-xs text-muted">Sistem Database Wilayah Kerja Migas</p>
        </div>

        {/* Form card */}
        <div className="w-full max-w-sm">

          {/* Card header */}
          <div className="mb-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              Selamat Datang
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold text-ink">
              Sign In
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              Masuk ke akun Pokja Anda
            </p>
          </div>

          <form action={formAction} className="rounded-2xl bg-white p-6 shadow-card" style={{ border: "1px solid #E2E7E5" }}>

            {/* KESDM / DME logo inside card */}
            <div className="mb-5 flex items-center gap-3 rounded-xl bg-petroleum/5 px-4 py-3" style={{ border: "1px solid #0B5E5418" }}>
              <img src="/logo-dme.png" alt="DME" className="h-10 w-10 shrink-0 object-contain" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-petroleum">
                  Kementerian ESDM
                </p>
                <p className="text-xs font-semibold text-ink">
                  Direktorat Pembinaan Usaha Hulu Migas
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Email */}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  placeholder="Enter Your Email"
                />
              </div>

              {/* Password + eye toggle */}
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    placeholder="Enter Your Password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-ink"
                  >
                    {showPassword ? (
                      /* Eye-off */
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      /* Eye */
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {state?.error && (
                <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
                  {state.error}
                </p>
              )}

              <Button type="submit" className="w-full py-2.5 text-sm font-semibold" disabled={pending}>
                {pending ? "Signing in..." : "Sign In"}
              </Button>
            </div>
          </form>

          <p className="mt-5 text-center text-xs text-muted">
            Akses dibatasi sesuai kewenangan Pokja masing-masing.
          </p>
        </div>
      </div>
    </main>
  );
}
