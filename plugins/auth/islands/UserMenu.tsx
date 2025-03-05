import { useState } from "preact/hooks";

export default function UserMenu() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div class="relative">
      <button
        type="button"
        class="flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <span class="sr-only">Open user menu</span>
        <div class="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
          <span class="text-emerald-600 font-medium">JD</span>
        </div>
      </button>
      {isDropdownOpen && (
        <div class="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
          <a
            href="/profile"
            class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsDropdownOpen(false)}
          >
            Account
          </a>
          <button
            type="button"
            class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsDropdownOpen(false)}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
} 