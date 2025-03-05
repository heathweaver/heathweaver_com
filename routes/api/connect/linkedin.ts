import { Handlers } from "$fresh/server.ts";
import { getRequiredEnv } from "../../../lib/env.ts";

const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";

export const handler: Handlers = {
  async GET(req) {
    // Generate and store state for CSRF protection
    const state = crypto.randomUUID();
    
    // Store state in cookie for verification
    const headers = new Headers();
    headers.append("Set-Cookie", `linkedin_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax`);

    // Build authorization URL
    const authUrl = new URL(LINKEDIN_AUTH_URL);
    const redirectUri = getRequiredEnv("LINKEDIN_REDIRECT_URI");
    console.log("LinkedIn redirect URI:", redirectUri);
    
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", getRequiredEnv("LINKEDIN_CLIENT_ID"));
    authUrl.searchParams.set("redirect_uri", redirectUri);
    // Using Member Data Portability API scope as per documentation
    authUrl.searchParams.set("scope", "r_dma_portability_3rd_party");
    authUrl.searchParams.set("state", state);

    console.log("Full LinkedIn auth URL:", authUrl.toString());

    return new Response(null, {
      status: 302,
      headers: {
        ...Object.fromEntries(headers),
        Location: authUrl.toString()
      }
    });
  }
}; 