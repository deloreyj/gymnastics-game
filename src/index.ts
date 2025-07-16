import { Hono } from "hono";
import { serveStatic } from "hono/cloudflare-workers";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/message", (c) => {
  return c.text("Hello Hono!");
});

app.get("/game", serveStatic({ path: "./game.html" }));
app.get("/game.js", serveStatic({ path: "./game.js" }));

app.get("/", (c) => {
  return c.redirect("/game");
});

export default app;
