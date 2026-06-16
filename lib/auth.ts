import "server-only";
import { cookies } from "next/headers";
import { signSession, verifySession, SESSION_COOKIE, SESSION_MAX_AGE, type SessionUser } from "./jwt";

export type { SessionUser };

export async function createSession(user: SessionUser) {
  const token = await signSession(user);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const payload = await verifySession(token);
  if (!payload) return null;
  return { id: payload.id, nama: payload.nama, email: payload.email, role: payload.role };
}
