import { Handlers } from "$fresh/server.ts";
import { AuthState } from "../../../plugins/auth/mod.ts";
import { withClient } from "@db/postgres-base.ts";

interface CV {
  content: any; // Using any since it's a complex JSON structure
}

interface CVList {
  id: number;
  title: string;
  job_title: string | null;
  company: string | null;
  created_at: Date;
  updated_at: Date;
}

export const handler: Handlers<null, AuthState> = {
  async GET(req, ctx) {
    const { user } = ctx.state;
    
    if (!user) {
      return new Response(null, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (id) {
      // Get specific CV
      const result = await withClient(async (client) => {
        return await client.queryObject<CV>(
          `SELECT content FROM cvs WHERE id = $1 AND user_id = $2`,
          [id, user.$id]
        );
      });

      if (!result.rows.length) {
        return new Response(null, { status: 404 });
      }

      return new Response(JSON.stringify(result.rows[0].content), {
        headers: { "Content-Type": "application/json" },
      });
    } else {
      // List all CVs for the user
      const result = await withClient(async (client) => {
        return await client.queryObject<CVList>(
          `SELECT id, title, job_title, company, created_at, updated_at 
           FROM cvs 
           WHERE user_id = $1 
           ORDER BY updated_at DESC`,
          [user.$id]
        );
      });

      return new Response(JSON.stringify(result.rows), {
        headers: { "Content-Type": "application/json" },
      });
    }
  },

  async POST(req, ctx) {
    const { user } = ctx.state;
    
    if (!user) {
      return new Response(null, { status: 401 });
    }

    const { title, cv, jobTitle, company } = await req.json();

    if (!title || !cv) {
      return new Response(
        JSON.stringify({ error: "Title and CV content are required" }),
        { status: 400 }
      );
    }

    const result = await withClient(async (client) => {
      return await client.queryObject<{ id: number }>(
        `INSERT INTO cvs (user_id, title, content, job_title, company, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [user.$id, title, cv, jobTitle, company, {}]
      );
    });

    return new Response(JSON.stringify({ id: result.rows[0].id }), {
      headers: { "Content-Type": "application/json" },
    });
  },

  async PUT(req, ctx) {
    const { user } = ctx.state;
    
    if (!user) {
      return new Response(null, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(
        JSON.stringify({ error: "CV ID is required" }),
        { status: 400 }
      );
    }

    const { cv } = await req.json();

    if (!cv) {
      return new Response(
        JSON.stringify({ error: "CV content is required" }),
        { status: 400 }
      );
    }

    await withClient(async (client) => {
      await client.queryObject(
        `UPDATE cvs 
         SET content = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND user_id = $3`,
        [cv, id, user.$id]
      );
    });

    return new Response(null, { status: 204 });
  },

  async DELETE(req, ctx) {
    const { user } = ctx.state;
    
    if (!user) {
      return new Response(null, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(
        JSON.stringify({ error: "CV ID is required" }),
        { status: 400 }
      );
    }

    await withClient(async (client) => {
      await client.queryObject(
        `DELETE FROM cvs WHERE id = $1 AND user_id = $2`,
        [id, user.$id]
      );
    });

    return new Response(null, { status: 204 });
  },
}; 