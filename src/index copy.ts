import { Context, Hono, Next } from "hono";

const app = new Hono().basePath("/api/v1");

const logger = async (c: Context, next: Next) => {
  console.log(c.req.method + " --- " + c.req.url);
  await next();
};
app.on(["GET", "POST"], "*", logger);

app.get("/", (c) => {
  return c.text("Hello from HONO");
});

app.get("/greet/:name?", (c) => {
  return c.json({
    success: true,
    message: "Greetings from hono. Mr." + (c.req.param("name") || "Anonymous"),
  });
});

app.notFound((c) => {
  return c.text("Custom 404 Message", 404);
});

export default {
  port: 8080,
  fetch: app.fetch,
};
