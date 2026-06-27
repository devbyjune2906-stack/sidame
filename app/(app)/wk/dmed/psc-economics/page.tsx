import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin, isDmed } from "@/lib/rbac";

export default async function PscEconomicsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user.role) && !isDmed(user.role)) redirect("/wk");

  return (
    <div className="relative flex min-h-[82vh] items-center justify-center overflow-hidden rounded-2xl">
      {/* Background image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/banner-dme.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Petroleum overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(5,45,40,0.88) 0%, rgba(11,94,84,0.72) 50%, rgba(5,45,40,0.85) 100%)",
        }}
      />

      {/* Decorative grid lines */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 px-8 py-20 text-center text-white">
        {/* Gear icon */}
        <div className="mb-10 flex justify-center">
          <div className="relative">
            <svg
              className="h-28 w-28 text-white/20"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 15.5A3.5 3.5 0 018.5 12 3.5 3.5 0 0112 8.5a3.5 3.5 0 013.5 3.5 3.5 3.5 0 01-3.5 3.5m7.43-2.92c.04-.34.07-.69.07-1.08s-.03-.74-.07-1.08l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.58-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 10.92c-.04.34-.07.67-.07 1.08s.03.74.07 1.08L2.46 14.71c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.58 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.63z" />
            </svg>
            <svg
              className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 text-white/30"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 15.5A3.5 3.5 0 018.5 12 3.5 3.5 0 0112 8.5a3.5 3.5 0 013.5 3.5 3.5 3.5 0 01-3.5 3.5m7.43-2.92c.04-.34.07-.69.07-1.08s-.03-.74-.07-1.08l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.58-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 10.92c-.04.34-.07.67-.07 1.08s.03.74.07 1.08L2.46 14.71c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.58 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.63z" />
            </svg>
          </div>
        </div>

        {/* Label */}
        <p
          className="mb-6 text-xs font-bold uppercase tracking-[0.6em] text-white/50"
        >
          Pokja DMED &nbsp;·&nbsp; PSC Economics
        </p>

        {/* Main heading */}
        <h1
          className="font-display font-extrabold italic leading-none tracking-tight text-white drop-shadow-2xl"
          style={{ fontSize: "clamp(3.5rem, 8vw, 7rem)" }}
        >
          Under
          <br />
          <span
            style={{
              WebkitTextStroke: "2px rgba(255,255,255,0.5)",
              color: "transparent",
            }}
          >
            Construction
          </span>
        </h1>

        {/* Divider */}
        <div className="mx-auto my-10 flex items-center gap-4" style={{ maxWidth: 420 }}>
          <div className="h-px flex-1 bg-white/20" />
          <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
          <div className="h-px flex-1 bg-white/20" />
        </div>

        {/* Sub text */}
        <p
          className="mx-auto text-lg font-light italic leading-relaxed text-white/65"
          style={{ maxWidth: 440 }}
        >
          Fitur analisis ekonomi Production Sharing Contract
          <br />
          sedang dalam tahap pengembangan.
        </p>

        <p className="mt-4 text-sm font-semibold uppercase tracking-widest text-white/35">
          Akan segera hadir
        </p>
      </div>
    </div>
  );
}
