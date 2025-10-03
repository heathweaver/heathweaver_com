import { Head } from "fresh/runtime";
import { define } from "../../utils.ts";
import Navigation from "../../components/Navigation.tsx";
import AddJobForm from "../../islands/jobs/AddJobForm.tsx";

interface Data {
  jobId?: string;
}

export const handler = define.handlers({
  GET(ctx) {
    const { user } = ctx.state;
    if (!user) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/auth/signin" },
      });
    }
    
    // Check if we're editing (id in query params)
    const url = new URL(ctx.req.url);
    const jobId = url.searchParams.get("id");
    
    return { data: { jobId: jobId || undefined } };
  },
});

export default define.page<typeof handler>(function AddJobPage(props) {
  const { jobId } = props.data;
  const isEditing = !!jobId;
  
  return (
    <>
      <Head>
        <title>{isEditing ? "Edit Job" : "Add New Job"} - Job Tracker</title>
      </Head>
      <div class="min-h-screen bg-gray-50">
        <Navigation />
        <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div class="px-4 py-6 sm:px-0">
            <h1 class="text-3xl font-bold text-gray-900 mb-6">
              {isEditing ? "Edit Job" : "Add New Job"}
            </h1>
            <AddJobForm jobId={jobId} />
          </div>
        </main>
      </div>
    </>
  );
});
