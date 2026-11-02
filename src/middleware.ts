import { withAuth } from "next-auth/middleware";

/**
 * NextAuth middleware — protects all dashboard routes.
 * Unauthenticated users are redirected to /login.
 */
export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  // Protect all routes under /dashboard and the root dashboard page
  // Allow auth-related routes, static files, and API auth routes publicly
  matcher: [
    /*
     * Match all request paths except:
     * - /login, /register (auth pages)
     * - /api/auth (NextAuth API routes)
     * - /_next (Next.js internals)
     * - /favicon.ico, /images, etc. (static files)
     */
    "/((?!login|register|api/auth|_next/static|_next/image|favicon\\.ico).*)",
  ],
};
