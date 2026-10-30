import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/features/auth/session";

// Sends visitors without a login cookie to /login, which also creates the first account. Whether the cookie is valid
// is checked by the API: with an invalid one, every page gets a 401 from it and redirects to /login as well.
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/login") return NextResponse.next();
  if (request.cookies.has(AUTH_COOKIE)) return NextResponse.next();

  const login = new URL("/login", request.url);
  login.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(login);
}

export const config = {
  // Manifest and app icons without login, otherwise the phone gets the login page instead of icon and manifest.
  // The API (/api/v1) checks the login itself.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon/|apple-icon|api/).*)"],
};
