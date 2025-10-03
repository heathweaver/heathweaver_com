import { AuthPluginConfig } from "../mod.ts";
import { Handlers } from "fresh/compat";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

type GoogleConfig = NonNullable<
  NonNullable<AuthPluginConfig["providers"]>["google"]
>;

export function createGoogleHandlers(config?: GoogleConfig): Handlers {
  if (!config) {
    throw new Error("Google configuration is required");
  }

  return {
    async GET(req, ctx) {
      const url = new URL(req.url);
      const code = url.searchParams.get("code");

      if (!code) {
        // Generate and store state for CSRF protection
        const state = crypto.randomUUID();

        // Store state in cookie for verification
        const headers = new Headers();
        headers.append(
          "Set-Cookie",
          `google_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax`,
        );

        // Build authorization URL
        const authUrl = new URL(GOOGLE_AUTH_URL);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("client_id", config.clientId);
        authUrl.searchParams.set("redirect_uri", config.redirectUri);
        authUrl.searchParams.set("scope", "openid email profile");
        authUrl.searchParams.set("state", state);
        authUrl.searchParams.set("access_type", "offline");
        authUrl.searchParams.set("prompt", "consent");

        return new Response(null, {
          status: 302,
          headers: {
            ...Object.fromEntries(headers),
            Location: authUrl.toString(),
          },
        });
      }

      return new Response(null, {
        status: 302,
        headers: { Location: "/auth/google/callback?code=" + code },
      });
    },
  };
}
