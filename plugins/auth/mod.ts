// Plugin interface for Fresh 2.x
interface Plugin {
  name: string;
  routes?: Array<{
    path: string;
    component?: any;
    handler?: any;
  }>;
  islands?: {
    baseLocation: string;
    paths: string[];
  };
}

import { AuthState } from "../../routes/_middleware.ts";
import { handler as loginHandler } from "./routes/login/index.tsx";
import SignUpPage from "./routes/signup/index.tsx";
import TestPage from "./routes/test/index.tsx";
import { handler as googleSigninHandler } from "./routes/api/signin/google.ts";
import { handler as googleSignupHandler } from "./routes/api/signup/google.ts";
import { handler as googleSignupCallbackHandler } from "./routes/api/signup/google-callback.ts";
import { handler as googleSigninCallbackHandler } from "./routes/api/signin/google-callback.ts";

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

export function authPlugin(_config: AuthPluginConfig = {}) {
  return (app: any) => {
    console.log("Auth plugin is being called!");
    // Register all auth routes
    const routes = [
      {
        path: "/auth/login",
        handler: loginHandler,
      },
      {
        path: "/auth/signup",
        component: SignUpPage,
      },
      {
        path: "/auth/test",
        component: TestPage,
      },
      {
        path: "/auth/api/signin/google",
        handler: googleSigninHandler,
      },
      {
        path: "/auth/api/signup/google",
        handler: googleSignupHandler,
      },
      {
        path: "/auth/api/signup/google-callback",
        handler: googleSignupCallbackHandler,
      },
      {
        path: "/auth/api/signin/google-callback",
        handler: googleSigninCallbackHandler,
      },
    ];

    // Register each route with the app
    for (const route of routes) {
      console.log(`Registering route: ${route.path}`);
      if (route.handler) {
        // Handlers are objects with GET/POST methods
        const handler = route.handler as any;
        console.log(`  Handler keys:`, Object.keys(handler));
        
        // Register each HTTP method
        if (handler.GET) {
          app.get(route.path, handler.GET);
          console.log(`  -> Registered GET handler`);
        }
        if (handler.POST) {
          app.post(route.path, handler.POST);
          console.log(`  -> Registered POST handler`);
        }
        if (handler.PUT) {
          app.put(route.path, handler.PUT);
          console.log(`  -> Registered PUT handler`);
        }
        if (handler.DELETE) {
          app.delete(route.path, handler.DELETE);
          console.log(`  -> Registered DELETE handler`);
        }
      } else if (route.component) {
        // Page routes with just components (no handler)
        const Component = route.component;
        app.get(route.path, (ctx: any) => {
          const element = Component();
          return ctx.render(element);
        });
        console.log(`  -> Registered as component`);
      }
    }
    console.log("Auth plugin registration complete!");
  };
}
