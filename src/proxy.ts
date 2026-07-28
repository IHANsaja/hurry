import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth: withAuth } = NextAuth(authConfig);

const USER_ROUTES = ["/post", "/my-ads"];
const MODERATOR_ROUTES = ["/admin"];

export default withAuth((req) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;
  const user = req.auth?.user;

  const needsUser = USER_ROUTES.some((p) => path.startsWith(p));
  const needsModerator = MODERATOR_ROUTES.some((p) => path.startsWith(p));

  if (!needsUser && !needsModerator) return NextResponse.next();

  // if the user is not signed in -> bounce back to sign-in and come back after signing.
  if (!user) {
    const signInUrl = new URL("/signin", nextUrl);
    signInUrl.searchParams.set("callbackUrl", path + nextUrl.search);
    return NextResponse.redirect(signInUrl);
  }

  // Signed in but the user is not a moderator -> 403 page rather than a redirect loop.
  if (needsModerator && user.role !== "MODERATOR") {
    return NextResponse.rewrite(new URL("/forbidden", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Skip static assets and the auth API routes.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|uploads).*)"],
};
