import { Handlers } from "$fresh/server.ts";
import { withClient } from "@db/postgres-base.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const id = ctx.params.id;
    
    try {
      const cv = await withClient(async (client) => {
        const result = await client.queryObject<{
          id: number;
          user_id: number;
          content: Record<string, unknown>;
        }>(
          `SELECT id, user_id, content FROM cvs WHERE id = $1`,
          [id]
        );
        return result.rows[0];
      });

      if (!cv) {
        return new Response(null, { status: 404 });
      }

      return new Response(JSON.stringify(cv.content), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error('Error fetching CV:', error);
      return new Response(null, { status: 500 });
    }
  },

  async PUT(req, ctx) {
    const id = ctx.params.id;
    const content = await req.json();
    
    try {
      await withClient(async (client) => {
        await client.queryObject(
          `UPDATE cvs SET content = $1, updated_at = NOW() WHERE id = $2`,
          [content, id]
        );
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error('Error updating CV:', error);
      return new Response(null, { status: 500 });
    }
  }
}; 