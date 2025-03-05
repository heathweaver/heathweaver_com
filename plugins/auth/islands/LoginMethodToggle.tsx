import { Signal } from "@preact/signals";

interface LoginMethodToggleProps {
  authMethod: Signal<"password" | "magic">;
}

export default function LoginMethodToggle({ authMethod }: LoginMethodToggleProps) {
  const handleMethodChange = (method: "password" | "magic") => {
    authMethod.value = method;
    // Find the parent form and update its action
    const form = document.querySelector('form');
    if (form) {
      form.action = method === "password" ? "/auth/api/login" : "/auth/api/login-magic";
    }
  };

  return (
    <>
      <div class="space-y-4">
        <p class="text-sm font-medium text-gray-700">Choose your login method:</p>
        <div class="flex items-center space-x-4">
          <label class="flex items-center">
            <input
              type="radio"
              class="form-radio"
              name="authMethod"
              value="password"
              checked={authMethod.value === "password"}
              onChange={() => handleMethodChange("password")}
            />
            <span class="ml-2">Password</span>
          </label>
          <label class="flex items-center">
            <input
              type="radio"
              class="form-radio"
              name="authMethod"
              value="magic"
              checked={authMethod.value === "magic"}
              onChange={() => handleMethodChange("magic")}
            />
            <span class="ml-2">Use single sign-on</span>
          </label>
        </div>
      </div>

      {authMethod.value === "password" ? (
        <div>
          <label htmlFor="password" class="block text-sm font-medium text-gray-700">
            Password
          </label>
          <div class="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      ) : (
        <div class="bg-gray-100 p-4 rounded-md">
          <p class="text-sm text-gray-600">
            You'll receive a one-time password via email to log in.
          </p>
        </div>
      )}
    </>
  );
} 