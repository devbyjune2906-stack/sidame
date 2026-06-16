import { NextResponse, type NextRequest } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/jwt";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);

  if (!session) {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }

  // Batasi area admin hanya untuk role Admin
  if (req.nextUrl.pathname.startsWith("/admin") && session.role !== "Admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/wk/:path*", "/admin/:path*", "/api/export/:path*"],
};
