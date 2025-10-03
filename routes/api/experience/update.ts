import { updateExperienceField } from "../../../lib/db/user-db.ts";
import { define } from "../../../utils.ts";

interface UpdateRequest {
  id: number;
  field: string;
  value: string;
}

export const handler = define.handlers({
  async PUT(ctx) {

    console.log("API: Experience update request received");
    const { user } = ctx.state;
    if (!user) {
      console.log("API: Unauthorized - no user");
      return new Response(null, { status: 401 });
    }

    try {
      const body = await ctx.req.json() as UpdateRequest;
      console.log("API: Update request body:", body);

      if (!body.id || !body.field || body.value === undefined) {
        console.log("API: Invalid request body:", body);
        return new Response("Missing required fields", { status: 400 });
      }

      // Validate field name to prevent SQL injection
      const allowedFields = ["title", "company", "location", "narrative"];
      if (!allowedFields.includes(body.field)) {
        console.log("API: Invalid field name:", body.field);
        return new Response("Invalid field name", { status: 400 });
      }

      const result = await updateExperienceField({
        id: body.id,
        userId: user.$id,
        field: body.field,
        value: body.value,
      });

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("API: Error updating experience:", error);
      if (error instanceof Error && error.message.includes("Unauthorized")) {
        return new Response(error.message, { status: 403 });
      }
      return new Response("Internal Server Error", { status: 500 });
    }
  },
});
