import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const searchParams = request.nextUrl.searchParams;
  const tableId = searchParams.get("table_id");
  const adminToken = request.cookies.get("admin_token")?.value;

  if (tableId) {
    const response = NextResponse.next();
    response.cookies.set("oasis_table_id", tableId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 4,
    });

    const url = request.nextUrl.clone();
    url.searchParams.delete("table_id");
    return NextResponse.redirect(url, { headers: response.headers });
  }

  if (pathname.startsWith("/admin/dashboard") && !adminToken) {
    return NextResponse.redirect(new URL("/admin/auth", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
