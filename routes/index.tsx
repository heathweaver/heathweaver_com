import { Head } from "$fresh/runtime.ts";
import ChatArea from "../islands/ChatArea.tsx";
import DocumentPreview from "../islands/DocumentPreview.tsx";

export default function Home() {
  return (
    <>
      <Head>
        <title>Heath Weaver - AI CV Generator</title>
        <meta name="description" content="AI-powered CV and cover letter generator" />
      </Head>
      <div class="min-h-screen bg-gradient-to-br from-slate-50 to-white">
        <div class="flex min-h-screen">
          {/* Left side - Chat */}
          <div class="w-1/2 p-6">
            <header class="pb-6">
              <h1 class="text-3xl font-bold text-slate-800 mb-2">Heath Weaver</h1>
              <p class="text-emerald-600 font-medium">AI CV & Cover Letter Generator</p>
            </header>
            <ChatArea />
          </div>

          {/* Right side - Preview */}
          <div class="w-1/2 bg-white shadow-lg p-6">
            <header class="pb-6">
              <h2 class="text-2xl font-semibold text-emerald-600">Preview</h2>
            </header>
            <DocumentPreview />
          </div>
        </div>
      </div>
    </>
  );
}
