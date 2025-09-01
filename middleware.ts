import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase-client"

// Routes that require authentication
const protectedRoutes = ["/profile", "/create", "/settings", "/my-events", "/saved"]

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Create supabase client using your project's setup
  const supabase = createClient()

  // Check auth status
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const path = req.nextUrl.pathname

  // Check if the path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route))

  // If it's a protected route and user is not authenticated
  if (isProtectedRoute && !session) {
    // Store the URL they were trying to access
    const redirectUrl = new URL("/auth", req.url)
    redirectUrl.searchParams.set("redirectTo", path)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is already logged in and trying to access login/signup
  if (path === "/auth" && session) {
    return NextResponse.redirect(new URL("/app", req.url))
  }

  return res
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
