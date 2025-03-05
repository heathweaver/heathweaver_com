import { useSignal } from "@preact/signals";

export default function EmailInput() {
  const isValid = useSignal(true);
  
  const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    isValid.value = re.test(email);
  };

  return (
    <div>
      <input
        type="email"
        name="email"
        required
        onInput={(e) => validateEmail((e.target as HTMLInputElement).value)}
        class={`appearance-none block w-full px-3 py-2 border ${
          isValid.value ? 'border-gray-300' : 'border-red-500'
        } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
      />
      {!isValid.value && (
        <p class="mt-2 text-sm text-red-600">Please enter a valid email address</p>
      )}
    </div>
  );
} 