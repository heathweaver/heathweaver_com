import { type Config } from "tailwindcss";

export default {
  content: [
    "{routes,islands,components,plugins}/**/*.{ts,tsx,js,jsx}",
  ],
} satisfies Config;
