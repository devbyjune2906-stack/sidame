import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { Toaster } from "@/components/toaster";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <AppShell user={{ nama: user.nama, role: user.role }}>
      {children}
      <Toaster />
    </AppShell>
  );
}
