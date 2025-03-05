import { PageProps } from "$fresh/server.ts";
import MarketingNavigation from "../../components/MarketingNavigation.tsx";

export default function LoginSuccessPage(props: PageProps) {
  return (
    <>
      <MarketingNavigation />
      <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div class="sm:mx-auto sm:w-full sm:max-w-md">
          <img class="mx-auto h-12 w-auto" src="/logo.svg" alt="AI Run Coach" />
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Please check your inbox to continue logging in.
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Click the link in the email we sent to your email address to complete the login process.
          </p>
        </div>
      </div>
    </>
  );
} 