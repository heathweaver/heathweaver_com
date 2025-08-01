import { Handlers } from "$fresh/server.ts";
import { AuthState } from "../../../../plugins/auth/mod.ts";
import { updateJobStatus } from "../../../../lib/db/job-tracking-db.ts";
import { JobStatus } from "../../../../backend/types/job-tracking.ts";

export const handler: Handlers<unknown, AuthState> = {
  async PATCH(req, ctx) {
    const { user } = ctx.state;
    if (!user) {
      return new Response(null, { status: 401 });
    }

    try {
      const { status } = await req.json();
      const id = ctx.params.id;

      // Validate status
      const validStatuses: JobStatus[] = ['saved', 'applied', 'interviewing', 'offer', 'closed'];
      if (!validStatuses.includes(status)) {
        return new Response(
          JSON.stringify({ error: "Invalid status" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const result = await updateJobStatus({
        id,
        userId: user.$id,
        status
      });

      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" }
      });

    } catch (error: unknown) {
      console.error('Error updating job status:', error);
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        return new Response(error.message, { status: 403 });
      }
      return new Response('Internal Server Error', { status: 500 });
    }
  }
}; 