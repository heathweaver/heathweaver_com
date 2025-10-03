import { App, staticFiles } from "fresh";
import { define, type State } from "./utils.ts";
import { authPlugin } from "./plugins/auth/mod.ts";

export const app = new App<State>();

app.use(staticFiles());

// Pass a shared value from a middleware
app.use((ctx) => {
  ctx.state.shared = "hello";
  return ctx.next();
});

// this is the same as the /api/:name route defined via a file. feel free to delete this!
app.get("/api2/:name", (ctx) => {
  const name = ctx.params.name;
  return new Response(
    `Hello, ${name.charAt(0).toUpperCase() + name.slice(1)}!`,
  );
});

// this can also be defined via a file. feel free to delete this!
const exampleLoggerMiddleware = define.middleware((ctx) => {
  console.log(`${ctx.req.method} ${ctx.req.url}`);
  return ctx.next();
});

// Register auth plugin routes AFTER fsRoutes
app.use(exampleLoggerMiddleware);

// Include file-system based routes here
app.fsRoutes();

// Register auth plugin
authPlugin()(app);
