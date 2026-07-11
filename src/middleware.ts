import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const searchParams = request.nextUrl.searchParams;
  const tableId = searchParams.get("table_id");

  if (tableId) {
    // Validate table_id format: alphanumeric, hyphens, underscores, max 20 chars
    if (!/^[a-zA-Z0-9_-]{1,20}$/.test(tableId)) {
      // Invalid table_id — continue without setting cookie
      return NextResponse.next();
    }

    const response = NextResponse.next();
    response.cookies.set("oasis_table_id", tableId, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 4,
    });

    const url = request.nextUrl.clone();
    url.searchParams.delete("table_id");
    return NextResponse.redirect(url, { headers: response.headers });
  }

  // Admin route protection — require admin_token cookie for /admin
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const adminToken = request.cookies.get("admin_token")?.value;
    if (!adminToken) {
      const url = request.nextUrl.clone();
      url.pathname = "/profile";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

