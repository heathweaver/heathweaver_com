import { Handlers } from "$fresh/server.ts";
import { getRequiredEnv } from "../../../lib/env.ts";
import { updateUserWithLinkedIn } from "../../../lib/db/user-db.ts";

interface LinkedInState {
  linkedinToken?: string;
  lastLinkedInFetch?: string;
}

interface CookieState {
  linkedin_state?: string;
}

export const handler: Handlers = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const error_description = url.searchParams.get("error_description");

    console.log("LinkedIn callback received:", {
      code: code ? "present" : "missing",
      state: state ? "present" : "missing",
      error,
      error_description
    });

    // Get stored state from cookie
    const cookies = req.headers.get("cookie")?.split(";")
      .map(cookie => cookie.trim().split("="))
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {} as CookieState);
    
    const storedState = cookies?.linkedin_state;
    console.log("Stored state from cookie:", storedState);

    if (error) {
      console.error("LinkedIn OAuth error:", { error, error_description });
      return new Response(null, {
        status: 302,
        headers: { 
          Location: `/profile?error=${encodeURIComponent(error_description || error)}`
        }
      });
    }

    if (!code || !state || state !== storedState) {
      console.error("Invalid callback state:", { 
        receivedState: state, 
        storedState,
        hasCode: !!code 
      });
      return new Response(null, {
        status: 302,
        headers: { 
          Location: "/profile?error=invalid_linkedin_callback"
        }
      });
    }

    try {
      const redirectUri = getRequiredEnv("LINKEDIN_REDIRECT_URI");
      console.log("Exchanging code for token with redirect URI:", redirectUri);

      const tokenResponse = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: getRequiredEnv("LINKEDIN_CLIENT_ID"),
          client_secret: getRequiredEnv("LINKEDIN_CLIENT_SECRET"),
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("Token exchange failed:", {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          error: errorText
        });
        throw new Error(`Failed to get access token: ${tokenResponse.status} ${tokenResponse.statusText}`);
      }

      const tokenData = await tokenResponse.json();
      console.log("Token exchange successful:", {
        hasAccessToken: !!tokenData.access_token,
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope
      });

      // Store token in session
      (ctx.state as LinkedInState).linkedinToken = tokenData.access_token;
      
      // Clear state cookie
      const headers = new Headers();
      headers.append("Set-Cookie", "linkedin_state=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT");

      // After successful token exchange, fetch the member data
      try {
        const memberDataResponse = await fetch("https://api.linkedin.com/v2/me", {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            "X-Restli-Protocol-Version": "2.0.0"
          }
        });

        if (!memberDataResponse.ok) {
          throw new Error("Failed to fetch member data");
        }

        const memberData = await memberDataResponse.json();
        console.log("Member data fetched successfully:", {
          id: memberData.id,
          firstName: memberData.localizedFirstName,
          lastName: memberData.localizedLastName
        });

        // Store the last fetch time
        (ctx.state as LinkedInState).lastLinkedInFetch = new Date().toISOString();

        // Get the current user's ID from the session
        const userId = (ctx.state as any).user?.$id;
        if (!userId) {
          throw new Error("No user ID found in session");
        }

        // Update user with LinkedIn data
        await updateUserWithLinkedIn(userId, memberData);

        return new Response(null, {
          status: 302,
          headers: {
            ...Object.fromEntries(headers),
            Location: "/profile?success=linkedin_connected"
          }
        });
      } catch (error) {
        console.error("Failed to fetch or store member data:", error);
        // Still redirect to success page as we have the token
        return new Response(null, {
          status: 302,
          headers: {
            ...Object.fromEntries(headers),
            Location: "/profile?success=linkedin_connected"
          }
        });
      }
    } catch (error) {
      console.error("LinkedIn callback error:", error);
      return new Response(null, {
        status: 302,
        headers: { 
          Location: "/profile?error=linkedin_connection_failed"
        }
      });
    }
  }
}; 