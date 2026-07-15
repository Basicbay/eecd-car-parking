import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const isLoggedIn = !!req.nextauth.token;
    const isOnAdmin = req.nextUrl.pathname.startsWith("/admin");
    const isOnLogin = req.nextUrl.pathname === "/login";

    if (isOnAdmin && !isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }

    if (isOnLogin && isLoggedIn) {
      return NextResponse.redirect(new URL("/admin", req.nextUrl));
    }

    if (req.nextUrl.pathname === "/") {
      return NextResponse.redirect(new URL("/admin", req.nextUrl));
    }
  },
  {
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
      authorized: () => true, // Delegate authorization checks directly to the middleware function
    },
  },
);

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|next.svg|vercel.svg).*)",
  ],
};
