import { PageProps } from "$fresh/server.ts";

export default function TestPage({ data }: PageProps) {
  return (
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
      <div class="bg-white p-8 rounded-lg shadow-md">
        <h1 class="text-2xl font-bold text-gray-900 mb-4">Auth Plugin Test Page</h1>
        <p class="text-gray-600">If you can see this with proper styling, the plugin routing and styling are working!</p>
      </div>
    </div>
  );
} 