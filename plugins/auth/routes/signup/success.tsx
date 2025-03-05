import { PageProps } from "$fresh/server.ts";

export default function SignUpSuccessPage(props: PageProps) {
  const renderSocialButtons = () => (
    <div class="mt-6">
      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300" />
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-[#fff9e5] text-gray-500">Or continue with</span>
        </div>
      </div>

      <div class="mt-6 grid grid-cols-2 gap-3">
        <div>
          <a 
            href="/auth/api/auth-twitter/signup" 
            class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            <span class="sr-only">Sign up with Twitter</span>
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
            </svg>
          </a>
        </div>

        <div>
          <a href="#" class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
            <span class="sr-only">Sign up with Google</span>
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div class="min-h-screen bg-[#fff9e5] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="ml-[100px] max-w-md">
        <div class="space-y-6">
          <h2 class="text-5xl font-bold text-gray-900 mb-2">
            Please check your inbox to verify your email.
          </h2>
          <p class="text-xl text-gray-600 mb-6">
            Complete sign up through the email we sent to your email address, or choose a different option below.
          </p>

          <div class="p-4 bg-white rounded-lg border border-gray-200">
            <label class="flex items-center">
              <input type="checkbox" class="form-checkbox" />
              <span class="ml-2">
                By signing up, I agree to AI Run Coach's{' '}
                <a href="/terms" class="font-medium text-black hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="/privacy" class="font-medium text-black hover:underline">Privacy Policy</a>.
              </span>
            </label>
          </div>

          {renderSocialButtons()}
        </div>
      </div>
    </div>
  );
} 