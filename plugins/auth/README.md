# Fresh Auth Plugin

A plugin for handling authentication in Fresh applications.

## Setup

### 1. Installation
Add the plugin to your Fresh application:

```ts
// fresh.config.ts
import { defineConfig } from "$fresh/server.ts";
import { authPlugin } from "./plugins/auth/mod.ts";

export default defineConfig({
  plugins: [
    authPlugin({
      // configuration options here
    })
  ]
});
```

### 2. Tailwind Configuration
Make sure your `tailwind.config.ts` includes the plugin's directory in its content configuration:

```ts
export default {
  content: [
    "{routes,islands,components,plugins}/**/*.{ts,tsx,js,jsx}", // Include plugins!
  ],
} satisfies Config;
```

### 3. Routes
The plugin provides the following routes:
- `/auth/login` - Login page
- `/auth/signup` - Signup page
- `/auth/verify` - Email verification
- `/auth/api/*` - Authentication API endpoints

### 4. Configuration Options
See `AuthPluginConfig` in `mod.ts` for all available configuration options.

## Common Issues

1. **Missing Styles**: If Tailwind styles aren't applying correctly, ensure the plugin's directory is included in your Tailwind content configuration.
2. **404 Errors**: All plugin routes are prefixed with `/auth/`. Update any hardcoded links accordingly.
3. **State Management**: The plugin uses Fresh's state management. See `AuthState` in `middleware.ts` for available state properties. 