import { useSignal } from "@preact/signals";

export default function SignupForm() {
  const email = useSignal("");
  const formState = useSignal<"idle" | "submitting" | "submitted">("idle");
  const errorMessage = useSignal<string | null>(null);

  const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (formState.value === "submitting") return;

    formState.value = "submitting";
    errorMessage.value = null;

    if (!validateEmail(email.value)) {
      errorMessage.value = "Please enter a valid email address.";
      return;
    }

    try {
      const res = await fetch("/auth/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.value }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to sign up");
      }

      formState.value = "submitted";
      errorMessage.value = "A signup link has been sent to your email.";
    } catch (err: unknown) {
      console.error("Signup error:", err);
      errorMessage.value = err instanceof Error
        ? err.message
        : "An error occurred during signup.";
    }
  };

  const renderStars = () => (
    <div class="flex items-center mb-4">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          class="h-5 w-5 text-yellow-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span class="ml-2 text-sm text-gray-600">
        4.8/5 based on 7,039 reviews
      </span>
    </div>
  );

  const renderSocialButtons = () => (
    <div class="mt-6">
      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-300" />
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-[#fff9e5] text-gray-500">Or</span>
        </div>
      </div>
      <div class="mt-6 grid grid-cols-2 gap-3">
        <button class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
          <svg
            class="w-5 h-5 mr-2"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
          </svg>
          Sign up with Twitter
        </button>
        <button class="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
          <svg
            class="w-5 h-5 mr-2"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z" />
          </svg>
          Sign up with Google
        </button>
      </div>
    </div>
  );

  return (
    <div class="space-y-6">
      <h2 class="text-5xl font-bold text-gray-900 mb-2">
        Sign up for AI Run Coach — Your Personal Running Assistant
      </h2>
      <p class="text-xl text-gray-600 mb-6">
        Get personalized training plans, real-time feedback, and achieve your
        running goals with AI-powered coaching.
      </p>

      {renderStars()}

      {errorMessage.value && (
        <div class="text-red-600 text-sm">{errorMessage.value}</div>
      )}

      <form onSubmit={handleSubmit} class="space-y-6">
        <div>
          <label htmlFor="email" class="sr-only">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Enter your email"
            value={email.value}
            onInput={(e) => email.value = (e.target as HTMLInputElement).value}
          />
        </div>
        <div>
          <button
            type="submit"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign Up
          </button>
        </div>
      </form>

      {renderSocialButtons()}
    </div>
  );
}
