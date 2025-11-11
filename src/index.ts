// Local Notes taking application with auth
import { Hono } from "hono";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { cors } from "hono/cors";
import { protectedMiddleware } from "./middleware/AuthMiddleware";
import index from "./routes";
import { openAPIRouteHandler } from "hono-openapi";
import { swaggerUI } from "@hono/swagger-ui";

const app = new Hono().basePath("/api");
app.use(logger());
app.use("/api/*", cors());
app.use(secureHeaders());
app.use("*", protectedMiddleware);

app.route("/", index);

// Swagger-ui
app.get(
  "/openapi.json",
  openAPIRouteHandler(app, {
    documentation: {
      info: { title: "Dummy Hono project just for learning", version: "1.0.0" },
      servers: [{ url: "http://localhost:3000" }],
    },
  })
);
app.get("/docs", swaggerUI({ url: "/api/openapi.json" }));

export default {
  port: 8000,
  fetch: app.fetch,
};
