import UserMenu from "../plugins/auth/islands/UserMenu.tsx";

export default function Navigation() {
  return (
    <nav class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          {/* Logo - Left side */}
          <div class="flex-shrink-0">
            <a href="/" class="text-xl font-bold text-emerald-600">AI CV Generator</a>
          </div>

          {/* Center navigation */}
          <div class="hidden sm:flex sm:space-x-8">
            <a
              href="/"
              class="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
            >
              Home
            </a>
            <a
              href="/profile"
              class="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
            >
              Profile
            </a>
          </div>

          {/* Right side - User section */}
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-500">Credits: 5</span>
            <button
              type="button"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Buy More Credits
            </button>
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  );
} 