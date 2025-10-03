import { withClient } from "@db/postgres-base.ts";
import { define } from "../../../utils.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const id = ctx.params.id;

    try {
      const cv = await withClient(async (client) => {
        const result = await client<{
          id: number;
          user_id: number;
          content: Record<string, unknown>;
        }[]>`
          SELECT id, user_id, content FROM cvs WHERE id = ${id}
        `;
        return result[0];
      });

      if (!cv) {
        return new Response(null, { status: 404 });
      }

      return new Response(JSON.stringify(cv.content), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error fetching CV:", error);
      return new Response(null, { status: 500 });
    }
  },

  async PUT(ctx) {
    const id = ctx.params.id;
    const content = await ctx.req.json();

    try {
      await withClient(async (client) => {
        await client`
          UPDATE cvs SET content = ${content}, updated_at = NOW() WHERE id = ${id}
        `;
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error updating CV:", error);
      return new Response(null, { status: 500 });
    }
  },
});
