import { Hono } from "hono";
import { serveStatic } from "hono/cloudflare-workers";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/game.js", serveStatic({ path: "./game.js" }));

export default app;
