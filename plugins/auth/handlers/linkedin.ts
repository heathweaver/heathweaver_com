import { Handlers } from "$fresh/server.ts";
import { AuthPluginConfig } from "../mod.ts";

const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";

type LinkedInConfig = NonNullable<NonNullable<AuthPluginConfig["providers"]>["linkedin"]>;

export function createLinkedInHandlers(config?: LinkedInConfig): Handlers {
  if (!config) {
    throw new Error("LinkedIn configuration is required");
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
        headers.append("Set-Cookie", `linkedin_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax`);

        // Build authorization URL
        const authUrl = new URL(LINKEDIN_AUTH_URL);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("client_id", config.clientId);
        authUrl.searchParams.set("redirect_uri", config.redirectUri);
        authUrl.searchParams.set("scope", config.scopes.join(" "));
        authUrl.searchParams.set("state", state);

        return new Response(null, {
          status: 302,
          headers: {
            ...Object.fromEntries(headers),
            Location: authUrl.toString()
          }
        });
      }

      return new Response(null, {
        status: 302,
        headers: { Location: "/api/connect/linkedin-callback?code=" + code }
      });
    }
  };
} 