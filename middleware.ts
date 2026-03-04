import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/utils/supabase/middleware"
import { PHASE_2_ENABLED, PHASE_2_ROUTES } from "@/lib/phase2"

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/profile", "/create", "/settings", "/my-events", "/saved"]

// Admin email whitelist (matches admin-auth-guard.tsx)
const ADMIN_EMAILS = [
  process.env.NEXT_PUBLIC_ADMIN_EMAIL,
].filter(Boolean)

export async function middleware(req: NextRequest) {
  // Create supabase client for middleware and get user
  const { supabase, response, user } = await createClient(req)

  const path = req.nextUrl.pathname

  // Check if the path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route))

  // If it's a protected route and user is not authenticated
  if (isProtectedRoute && !user) {
    // Store the URL they were trying to access
    const redirectUrl = new URL("/auth", req.url)
    redirectUrl.searchParams.set("redirectTo", path)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is already logged in and trying to access login/signup
  if (path === "/auth" && user) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // Phase 2 route gating: when disabled, only admins can access Phase 2 pages
  if (!PHASE_2_ENABLED) {
    const isPhase2Route = PHASE_2_ROUTES.some((route) => path.startsWith(route))

    if (isPhase2Route) {
      // Not logged in — redirect to auth
      if (!user) {
        const redirectUrl = new URL("/auth", req.url)
        redirectUrl.searchParams.set("redirectTo", path)
        return NextResponse.redirect(redirectUrl)
      }

      // Check admin status: email whitelist + database role
      const isAdminEmail = ADMIN_EMAILS.includes(user.email || "")

      let isAdmin = isAdminEmail
      if (!isAdmin) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin, role")
          .eq("id", user.id)
          .single()

        isAdmin = profile?.is_admin === true || profile?.role === "admin"
      }

      if (!isAdmin) {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes that handle their own auth
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api).*)",
  ],
}