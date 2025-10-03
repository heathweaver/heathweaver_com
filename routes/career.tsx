import { Head } from "fresh/runtime";
import Navigation from "../components/Navigation.tsx";
import CVGenerator from "../islands/CVGenerator.tsx";
import DocumentPreview from "../islands/DocumentPreview.tsx";
import { define } from "../utils.ts";

export const handler = define.handlers({
  GET(ctx) {
    const { user } = ctx.state;

    if (!user) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/auth/login" },
      });
    }

    return { data: null };
  },
});

export default define.page<typeof handler>(function Career() {
  return (
    <>
      <Head>
        <title>CV Generator - Remote Executive</title>
        <meta
          name="description"
          content="Professional CV generator for remote executives."
        />
      </Head>
      <div class="min-h-screen bg-gray-100">
        <Navigation />
        <div class="max-w-screen-2xl mx-auto">
          <div class="grid grid-cols-12 gap-6 p-4">
            {/* Left sidebar with chat and controls */}
            <div class="col-span-3 space-y-4">
              <div class="bg-white rounded-lg shadow-sm p-4">
                <CVGenerator />
              </div>
            </div>

            {/* Main content area with CV preview */}
            <div class="col-span-9">
              <div class="sticky top-4">
                <DocumentPreview />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});
