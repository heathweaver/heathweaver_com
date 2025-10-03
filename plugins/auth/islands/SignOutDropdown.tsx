import { useState } from "preact/hooks";

export default function SignOutDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div class="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        class="text-gray-500 hover:text-gray-700"
      >
        <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {isOpen && (
        <form
          method="POST"
          action="/api/signout"
          class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg"
        >
          <button
            type="submit"
            class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Sign out
          </button>
        </form>
      )}
    </div>
  );
}
