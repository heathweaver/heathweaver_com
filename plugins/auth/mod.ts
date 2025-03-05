import { Plugin, MiddlewareHandler, FreshContext } from "$fresh/server.ts";
import { handler as authHandler, AuthState } from "../../routes/_middleware.ts";
import LoginPage from "./routes/login/index.tsx";
import SignUpPage from "./routes/signup/index.tsx";
import TestPage from "./routes/test/index.tsx";
import { handler as googleSigninHandler } from "./routes/api/signin/google.ts";
import { handler as googleSignupHandler } from "./routes/api/signup/google.ts";
import { handler as googleSignupCallbackHandler } from "./routes/api/signup/google-callback.ts";
import { handler as googleSigninCallbackHandler } from "./routes/api/signin/google-callback.ts";
import UserMenu from "./islands/UserMenu.tsx";

// Re-export AuthState type
export type { AuthState };

export interface AuthPluginConfig {
  // OAuth Provider Configuration
  providers?: {
    google?: {
      clientId: string;
      clientSecret: string;
      redirectUri: string;
    };
    twitter?: {
      clientId: string;
      clientSecret: string;
      redirectUri: string;
    };
  };

  // Session Configuration
  session?: {
    duration?: number; // Session duration in seconds
    cookieName?: string;
    cookieOptions?: {
      secure?: boolean;
      httpOnly?: boolean;
      sameSite?: "Strict" | "Lax" | "None";
      path?: string;
    };
  };

  // Route Configuration
  routes?: {
    login?: string; // Path to login page
    signup?: string; // Path to signup page
    callback?: string; // Path to OAuth callback
    logout?: string; // Path to logout handler
  };

  // UI Configuration
  ui?: {
    logo?: string; // Path to logo image
    theme?: {
      primaryColor?: string;
      backgroundColor?: string;
    };
  };

  // Security Configuration
  security?: {
    allowedOrigins?: string[]; // CORS allowed origins
    csrfProtection?: boolean;
    rateLimit?: {
      windowMs?: number;
      max?: number;
    };
  };
}

export function authPlugin(config: AuthPluginConfig = {}): Plugin {
  // Create a middleware handler that initializes auth state
  const pluginMiddleware: MiddlewareHandler = async (
    req: Request,
    ctx: FreshContext
  ) => {
    // Initialize auth state
    ctx.state = {
      sessionId: null,
      user: null,
      ...ctx.state
    };
    
    return await authHandler(req, ctx as FreshContext<AuthState>);
  };

  return {
    name: "auth",
    middlewares: [{
      middleware: {
        handler: pluginMiddleware
      },
      path: "/"
    }],
    routes: [
      {
        path: "/auth/login",
        component: LoginPage
      },
      {
        path: "/auth/signup",
        component: SignUpPage
      },
      {
        path: "/auth/test",
        component: TestPage
      },
      {
        path: "/auth/api/signin/google",
        handler: googleSigninHandler
      },
      {
        path: "/auth/api/signup/google",
        handler: googleSignupHandler
      },
      {
        path: "/auth/api/signup/google-callback",
        handler: googleSignupCallbackHandler
      },
      {
        path: "/auth/api/signin/google-callback",
        handler: googleSigninCallbackHandler
      }
    ],
    islands: {
      baseLocation: import.meta.url,
      paths: [
        "./islands/UserMenu.tsx"
      ]
    }
  };
}
