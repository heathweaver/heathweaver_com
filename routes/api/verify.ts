import { FreshContext } from "$fresh/server.ts";
import { config } from "../../config.ts";
import { PromptMode } from "../../backend/prompt/index.ts";
import { Client } from "postgres";
import { DBJobContent } from "../../backend/types/db.ts";

export async function handler(
  req: Request,
  _ctx: FreshContext,
): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { code } = await req.json();

    // Check if it's a joke request
    if (code.toLowerCase().includes('joke')) {
      return new Response(
        JSON.stringify({ 
          isValid: true,
          mode: "jokes" as PromptMode
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Connect to the database
    const client = new Client({
      hostname: config.database.host,
      port: config.database.port,
      database: config.database.database,
      user: config.database.user,
      password: config.database.password,
      tls: { enabled: false }
    });

    try {
      await client.connect();
      const result = await client.queryObject<DBJobContent>('SELECT * FROM job_content WHERE id = $1', [code]);

      if (!result.rows?.length) {
        return new Response(
          JSON.stringify({ 
            isValid: false,
            mode: "initial" as PromptMode
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      }

      const jobData = result.rows[0];
      
      const initialMessage = `Great! I can see you're interested in the ${jobData.title} position at ${jobData.company}. I'd be happy to discuss why Heath would be an excellent fit for this role. 

The position involves ${jobData.description || 'various responsibilities'}, and I can provide specific insights about Heath's relevant experience and qualifications. What aspects of the role would you like to discuss first?`;
      
      return new Response(
        JSON.stringify({
          isValid: true,
          mode: "verified" as PromptMode,
          jobData: jobData,
          initialMessage,
          cvData: jobData.raw_content
        }),
        { headers: { "Content-Type": "application/json" } }
      );

    } finally {
      await client.end();
    }

  } catch (error) {
    console.error('Verification error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : String(error),
        isValid: false,
        mode: "initial" as PromptMode
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
} 