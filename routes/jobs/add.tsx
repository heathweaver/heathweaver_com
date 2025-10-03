import { Head } from "fresh/runtime";
import { define } from "../../utils.ts";
import Navigation from "../../components/Navigation.tsx";
import AddJobForm from "../../islands/jobs/AddJobForm.tsx";

export const handler = define.handlers({
  GET(ctx) {
    const { user } = ctx.state;
    if (!user) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/auth/signin" },
      });
    }
    return { data: {} };
  },
});

export default define.page<typeof handler>(function AddJobPage() {
  return (
    <>
      <Head>
        <title>Add New Job - Job Tracker</title>
      </Head>
      <div class="min-h-screen bg-gray-50">
        <Navigation />
        <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div class="px-4 py-6 sm:px-0">
            <h1 class="text-3xl font-bold text-gray-900 mb-6">Add New Job</h1>
            <AddJobForm />
          </div>
        </main>
      </div>
    </>
  );
});
