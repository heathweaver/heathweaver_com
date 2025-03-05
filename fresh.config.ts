import { defineConfig } from "$fresh/server.ts";
import tailwind from "$fresh/plugins/tailwind.ts";
import { authPlugin } from "./plugins/auth/mod.ts";

export default defineConfig({
  plugins: [
    tailwind(),
    authPlugin({
      routes: {
        login: "/auth/login",
        signup: "/auth/signup",
        callback: "/auth/callback",
        logout: "/auth/logout"
      }
    })
  ]
});
