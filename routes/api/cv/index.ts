import { withClient } from "@db/postgres-base.ts";
import { define } from "../../../utils.ts";

interface CV {
  content: Record<string, unknown>; // Complex JSON structure
}

interface CVList {
  id: number;
  title: string;
  job_title: string | null;
  company: string | null;
  created_at: Date;
  updated_at: Date;
}

export const handler = define.handlers({
  async GET(ctx) {
    const { user } = ctx.state;

    if (!user) {
      return new Response(null, { status: 401 });
    }

    const url = new URL(ctx.req.url);
    const id = url.searchParams.get("id");

    if (id) {
      // Get specific CV
      const result = await withClient(async (client) => {
        return await client<CV[]>`
          SELECT content FROM cvs WHERE id = ${id} AND user_id = ${user.$id}
        `;
      });

      if (!result.length) {
        return new Response(null, { status: 404 });
      }

      return new Response(JSON.stringify(result[0].content), {
        headers: { "Content-Type": "application/json" },
      });
    } else {
      // List all CVs for the user
      const result = await withClient(async (client) => {
        return await client<CVList[]>`
          SELECT id, title, job_title, company, created_at, updated_at 
          FROM cvs 
          WHERE user_id = ${user.$id}
          ORDER BY updated_at DESC
        `;
      });

      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  async POST(ctx) {
    const { user } = ctx.state;

    if (!user) {
      return new Response(null, { status: 401 });
    }

    const { title, cv, jobTitle, company } = await ctx.req.json();

    if (!title || !cv) {
      return new Response(
        JSON.stringify({ error: "Title and CV content are required" }),
        { status: 400 },
      );
    }

    const result = await withClient(async (client) => {
      return await client<{ id: number }[]>`
        INSERT INTO cvs (user_id, title, content, job_title, company, metadata)
        VALUES (${user.$id}, ${title}, ${cv}, ${jobTitle ?? null}, ${company ?? null}, ${JSON.stringify({})})
        RETURNING id
      `;
    });

    return new Response(JSON.stringify({ id: result[0].id }), {
      headers: { "Content-Type": "application/json" },
    });
  },

  async PUT(ctx) {
    const { user } = ctx.state;

    if (!user) {
      return new Response(null, { status: 401 });
    }

    const url = new URL(ctx.req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(
        JSON.stringify({ error: "CV ID is required" }),
        { status: 400 },
      );
    }

    const { cv } = await ctx.req.json();

    if (!cv) {
      return new Response(
        JSON.stringify({ error: "CV content is required" }),
        { status: 400 },
      );
    }

    await withClient(async (client) => {
      await client`
        UPDATE cvs 
        SET content = ${cv}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id} AND user_id = ${user.$id}
      `;
    });

    return new Response(null, { status: 204 });
  },

  async DELETE(ctx) {
    const { user } = ctx.state;

    if (!user) {
      return new Response(null, { status: 401 });
    }

    const url = new URL(ctx.req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(
        JSON.stringify({ error: "CV ID is required" }),
        { status: 400 },
      );
    }

    await withClient(async (client) => {
      await client`
        DELETE FROM cvs WHERE id = ${id} AND user_id = ${user.$id}
      `;
    });

    return new Response(null, { status: 204 });
  },
});
