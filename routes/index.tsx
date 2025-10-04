import { Head } from "fresh/runtime";
import ChatArea from "../islands/ChatArea.tsx";
import DocumentPreview from "../islands/DocumentPreview.tsx";
import CVGenerator from "../islands/CVGenerator.tsx";
import Navigation from "../components/Navigation.tsx";
import { define } from "../utils.ts";

export const handler = define.handlers({
  GET(ctx) {
    const { user } = ctx.state;
    return { data: { user: user || null } };
  },
});

export default define.page<typeof handler>(function Home(props) {
  const { user } = props.data;

  return (
    <>
      <Head>
        <title>AI CV Generator - Remote Executive</title>
        <meta
          name="description"
          content="Professional CV generator for remote executives"
        />
      </Head>
      <div class="min-h-screen bg-gradient-to-br from-slate-50 to-white">
        <Navigation />
        <div class="flex min-h-screen">
          {/* Left side - CV Generator and Chat */}
          <div class="w-[40%] p-6 flex flex-col space-y-4">
            <ChatArea user={user} />
          </div>

          {/* Right side - Preview */}
          <div class="w-[60%] bg-white shadow-lg p-6">
            <CVGenerator />
            <DocumentPreview />
          </div>
        </div>
      </div>
    </>
  );
});
