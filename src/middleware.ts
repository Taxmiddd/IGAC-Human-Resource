import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Routes only accessible by core_admin
const CORE_ADMIN_ROUTES = ["/ledger", "/settings", "/api/financial"];

// Routes that require any authenticated user
const PROTECTED_PREFIXES = ["/dashboard", "/members", "/ledger", "/tasks", "/settings", "/api/members", "/api/tasks", "/api/departments", "/api/import", "/api/financial", "/api/uploadthing"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow Next.js internals, static files, auth routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|css|js|woff2?)$/)
  ) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (!isProtected && pathname !== "/") return NextResponse.next();

  // Verify session via Better Auth
  const session = await auth.api.getSession({ headers: request.headers });

  // Unauthenticated → redirect to login
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Root "/" → redirect authenticated users to dashboard
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Core Admin only routes
  const isCoreAdminRoute = CORE_ADMIN_ROUTES.some((r) => pathname.includes(r));
  if (isCoreAdminRoute && session.user.role !== "core_admin") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden — Core Admin only" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/dashboard?error=forbidden", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
