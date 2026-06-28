"use client";

import { useEffect, useState } from "react";
import { subscribeToasts, removeToast, type Toast } from "@/lib/toast";

function ToastItem({ toast }: { toast: Toast }) {
  const isSuccess = toast.type === "success";

  return (
    <div
      className="flex w-80 items-start gap-3 overflow-hidden rounded-2xl border shadow-lg"
      style={{
        background: isSuccess ? "rgba(8,68,61,0.97)" : "rgba(180,30,30,0.97)",
        borderColor: isSuccess ? "rgba(255,255,255,0.12)" : "rgba(255,150,150,0.2)",
        backdropFilter: "blur(12px)",
        animation: "toast-in 0.28s cubic-bezier(.34,1.56,.64,1) both",
      }}
    >
      {/* Left accent bar */}
      <div
        className="w-1 self-stretch shrink-0"
        style={{ background: isSuccess ? "rgba(134,239,172,0.7)" : "rgba(252,165,165,0.8)" }}
      />

      {/* Icon + message */}
      <div className="flex flex-1 items-start gap-3 py-3 pr-3">
        <div
          className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
          style={{ background: isSuccess ? "rgba(134,239,172,0.15)" : "rgba(252,165,165,0.15)" }}
        >
          {isSuccess ? (
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" style={{ color: "rgba(134,239,172,0.9)" }}>
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" style={{ color: "rgba(252,165,165,0.9)" }}>
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          )}
        </div>

        <p className="flex-1 text-sm font-medium leading-snug text-white/90">
          {toast.message}
        </p>

        <button
          type="button"
          onClick={() => removeToast(toast.id)}
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white/40 transition-colors hover:text-white/80"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>

      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(100%) scale(0.95); }
          to   { opacity: 1; transform: translateX(0)     scale(1);    }
        }
      `}</style>
    </div>
  );
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => subscribeToasts(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
