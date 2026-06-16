import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const SESSION_COOKIE = "sidame_session";
export const SESSION_MAX_AGE = 60 * 60 * 8; // 8 jam

export type SessionUser = {
  id: string;
  nama: string;
  email: string;
  role: string;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET belum di-set");
  return new TextEncoder().encode(secret);
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());
}

export async function verifySession(token: string | undefined): Promise<(SessionUser & JWTPayload) | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as SessionUser & JWTPayload;
  } catch {
    return null;
  }
}
