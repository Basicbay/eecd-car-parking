import { auth } from "@/auth"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isOnAdmin = req.nextUrl.pathname.startsWith("/admin")
  const isOnLogin = req.nextUrl.pathname === "/login"

  if (isOnAdmin && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl))
  }

  if (isOnLogin && isLoggedIn) {
    return Response.redirect(new URL("/admin", req.nextUrl))
  }

  if (req.nextUrl.pathname === "/") {
    return Response.redirect(new URL("/admin", req.nextUrl))
  }
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|next.svg|vercel.svg).*)"],
}
