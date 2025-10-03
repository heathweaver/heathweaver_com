/// <reference lib="deno.unstable" />

import { define } from "../utils.ts";
import {
  googleSigninHelpers,
  googleSignupHelpers,
} from "../plugins/auth/lib/kv_oauth.ts";

const PUBLIC_ROUTES = [
  "/auth/login",
  "/auth/signup",
  "/auth/verify",
  "/auth/callback", // Add general callback route
  "/auth/logout", // Add logout route
  "/auth/api/signup/twitter",
  "/auth/api/signup/twitter-callback",
  "/auth/api/signin/twitter",
  "/auth/api/signin/twitter-callback",
  "/auth/api/signup/google",
  "/auth/api/signup/google-callback",
  "/auth/api/signin/google",
  "/auth/api/signin/google-callback",
  "/auth/api/signup",
  "/auth/api/signin", // Add general signin route
  "/auth/test",
  /* Apple routes - uncomment when Apple Developer Account is set up
  "/auth/api/signup/apple",
  "/auth/api/signup/apple-callback",
  "/auth/api/signin/apple",
  "/auth/api/signin/apple-callback",
  */
  "/terms",
  "/privacy",
  "/auth/api/login",
  "/auth/api/login-magic",
];

const STATIC_FILE_EXTENSIONS = [
  ".css",
  ".js",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".ico",
  ".txt",
];

export interface AuthState {
  sessionId: string | null;
  user: any | null; // We'll type this properly when we move the user type
}

export const handler = define.middleware(async (ctx) => {
  const url = new URL(ctx.req.url);
  const pathname = url.pathname;

  // Check if it's a public route FIRST
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return await ctx.next();
  }

  // Then Fresh internal routes
  if (pathname.startsWith("/_frsh/")) {
    return await ctx.next();
  }

  // Then check static files
  if (
    pathname.startsWith("/static/") ||
    STATIC_FILE_EXTENSIONS.some((ext) => pathname.endsWith(ext))
  ) {
    return await ctx.next();
  }

  // Only try to get auth for protected routes
  try {
    // Try both signin and signup session handlers
    const signinSessionId = await googleSigninHelpers.getSessionId(ctx.req);
    const signupSessionId = await googleSignupHelpers.getSessionId(ctx.req);
    const sessionId = signinSessionId || signupSessionId;

    if (!sessionId) {
      throw new Error("No session");
    }

    // Get user from KV store
    const kv = await Deno.openKv();
    const sessionData = await kv.get(["sessions", sessionId]);

    if (!sessionData.value) {
      throw new Error("Invalid session");
    }

    // Set both session and user in state
    ctx.state.sessionId = sessionId;
    ctx.state.user = sessionData.value;

    return await ctx.next();
  } catch (error: unknown) {
    // Only log actual errors, not auth redirects
    if (
      !(error instanceof Error) ||
      (error.message !== "No session" && error.message !== "Invalid session")
    ) {
      console.error("Middleware - Unexpected error:", {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
    }

    // Handle auth redirects
    if (
      error instanceof Error &&
      (error.message === "No session" || error.message === "Invalid session")
    ) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: `/auth/login?redirect=${encodeURIComponent(pathname)}`,
        },
      });
    }

    // For other errors, let them propagate
    throw error;
  }
});
