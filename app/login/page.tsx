"use client";

import { useActionState, useState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null as { error?: string } | null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main
      className="relative flex min-h-screen"
      style={{
        backgroundImage: "url('/banner-dme.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Full-screen overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(8,68,61,0.85) 0%, rgba(11,94,84,0.70) 55%, rgba(8,68,61,0.80) 100%)",
        }}
      />

      {/* Left: branding (desktop only) */}
      <div className="relative z-10 hidden flex-1 flex-col items-center justify-center px-4 text-center text-white lg:flex">
        <img
          src="/logo-dme.png"
          alt="DME"
          className="mb-7 h-28 w-28 object-contain drop-shadow-2xl"
        />
        <h1
          className="font-display font-extrabold leading-tight tracking-tight drop-shadow-lg"
          style={{ fontSize: "clamp(1.7rem, 2.5vw, 2.5rem)" }}
        >
          Direktorat Pembinaan<br />Usaha Hulu Migas
        </h1>
        <div className="my-5 h-px w-24 bg-white/30" />
        <p className="text-base font-semibold text-white/90">SIDAME</p>
        <p className="mt-1 text-sm text-white/65">Sistem Database Wilayah Kerja Migas</p>
        <p className="mt-8 text-[11px] font-semibold uppercase tracking-widest text-white/40">
          Kementerian Energi dan Sumber Daya Mineral
        </p>
      </div>

      {/* Right: glassmorphism panel */}
      <div
        className="relative z-10 flex w-full flex-col items-center justify-center px-6 py-12 m-4 lg:w-[440px] lg:shrink-0 lg:m-0 lg:my-8 lg:mr-8"
        style={{
          background: "rgba(255,255,255,0.10)",
          backdropFilter: "blur(35px)",
          WebkitBackdropFilter: "blur(35px)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 20,
        }}
      >
        <div className="w-full max-w-[340px]">

          {/* KESDM logo + nama */}
          <div className="mb-8 flex items-center justify-center gap-4">
            <img
              src="/logo-kesdm.png"
              alt="KESDM"
              className="h-16 w-16 shrink-0 object-contain drop-shadow-lg"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            <div className="border-l border-white/30 pl-4 leading-snug" style={{ width: "9.5rem" }}>
              <p
                className="text-sm font-bold uppercase text-white/80 block"
                style={{ textAlign: "justify", textAlignLast: "justify" }}
              >
                Kementerian
              </p>
              <p
                className="text-[2rem] font-extrabold text-white drop-shadow leading-none block"
                style={{ textAlign: "justify", textAlignLast: "justify" }}
              >
                ESDM
              </p>
            </div>
          </div>

          {/* Form — sharp corners, glassmorphism */}
          <form
            action={formAction}
            style={{
              background: "rgba(255,255,255,0.13)",
              border: "1px solid rgba(255,255,255,0.22)",
              borderRadius: 12,
              padding: "1.75rem",
            }}
          >
            {/* Email */}
            <div className="mb-4">
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-white/80"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                placeholder="Enter Your Email"
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.30)",
                  borderRadius: 8,
                  padding: "0.625rem 0.75rem",
                  fontSize: "0.875rem",
                  color: "#ffffff",
                  outline: "none",
                }}
                className="login-input placeholder:text-white/40 focus:border-white/60 transition-colors"
              />
            </div>

            {/* Password + eye */}
            <div className="mb-5">
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-white/80"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="Enter Your Password"
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.30)",
                    borderRadius: 0,
                    padding: "0.625rem 2.5rem 0.625rem 0.75rem",
                    fontSize: "0.875rem",
                    color: "#ffffff",
                    outline: "none",
                  }}
                  className="login-input placeholder:text-white/40 focus:border-white/60 transition-colors"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/55 transition-colors hover:text-white"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {state?.error && (
              <div
                className="mb-4 px-3 py-2 text-sm text-white"
                style={{ background: "rgba(180,50,43,0.45)", border: "1px solid rgba(255,100,100,0.3)", borderRadius: 8 }}
              >
                {state.error}
              </div>
            )}

            {/* Sign In button — sharp corners */}
            <button
              type="submit"
              disabled={pending}
              className="w-full py-2.5 text-sm font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{
                background: "#0B5E54",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              {pending ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-5 text-center text-[11px] text-white/40">
            Akses dibatasi sesuai kewenangan Pokja masing-masing.
          </p>
        </div>
      </div>
    </main>
  );
}
