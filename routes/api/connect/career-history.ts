import { define } from "../../../utils.ts";

interface LinkedInState {
  linkedinToken?: string;
  lastLinkedInFetch?: string;
}

export const handler = define.handlers({
  async POST(ctx) {
    const { linkedinToken } = ctx.state as LinkedInState;

    if (!linkedinToken) {
      return new Response(
        JSON.stringify({
          error: "No LinkedIn connection found",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    try {
      // Fetch profile data
      const profileResponse = await fetch("https://api.linkedin.com/v2/me", {
        headers: {
          Authorization: `Bearer ${linkedinToken}`,
          "X-Restli-Protocol-Version": "2.0.0",
        },
      });

      if (!profileResponse.ok) {
        throw new Error("Failed to fetch LinkedIn profile");
      }

      const profile = await profileResponse.json();

      // Fetch positions data
      const positionsResponse = await fetch(
        "https://api.linkedin.com/v2/positions?q=members&members=urn:li:person:" +
          profile.id,
        {
          headers: {
            Authorization: `Bearer ${linkedinToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
          },
        },
      );

      if (!positionsResponse.ok) {
        throw new Error("Failed to fetch LinkedIn positions");
      }

      const positions = await positionsResponse.json();

      // Store the last fetch time
      (ctx.state as LinkedInState).lastLinkedInFetch = new Date().toISOString();

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            profile: {
              id: profile.id,
              firstName: profile.localizedFirstName,
              lastName: profile.localizedLastName,
              headline: profile.localizedHeadline,
            },
            positions: positions.elements,
          },
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      console.error("LinkedIn data retrieval error:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to retrieve LinkedIn career history",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
});
