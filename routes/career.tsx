import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import Navigation from "../components/Navigation.tsx";
import CVGenerator from "../islands/CVGenerator.tsx";
import DocumentPreview from "../islands/DocumentPreview.tsx";
import { AuthState } from "../plugins/auth/mod.ts";

export const handler: Handlers<null, AuthState> = {
  async GET(_req, ctx) {
    const { user } = ctx.state;
    
    if (!user) {
      return new Response(null, {
        status: 302,
        headers: { Location: "/auth/login" }
      });
    }

    return ctx.render(null);
  },
};

export default function Career() {
  return (
    <>
      <Head>
        <title>CV Generator - Remote Executive</title>
        <meta name="description" content="Professional CV generator for remote executives." />
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
} 