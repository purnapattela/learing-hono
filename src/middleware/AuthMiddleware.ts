import { join } from "path";
import { JsonWebTokenError, verify } from "jsonwebtoken";
import type { Context, Next } from "hono";
import { readUsers } from "../utils/index";

export async function protectedMiddleware(c: Context, next: Next) {
  const publicRoutes = [
    "/api/auth/signup",
    "/api/auth/login",
    "/api/docs",
    "/api/openapi.json",
  ];
  console.log(`[${c.req.method}-------[${c.req.path}]]`);

  if (publicRoutes.some((r) => c.req.path.startsWith(r))) {
    return next();
  }
  const cookie = c.req.header("Cookie") || "";
  const token = cookie
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("token="))
    ?.split("=")[1];

  if (!token) {
    return c.json({ success: false, message: "No token found" }, 401);
  }
  try {
    const decoded = verify(token, Bun.env.JWT_SECRET!);

    if (
      typeof decoded === "object" &&
      decoded !== null &&
      "username" in decoded
    ) {
      //
    } else {
      return c.json({ success: false, message: "Invalid token" });
    }

    const users = await readUsers();
    const user = users.find((u) => u.username === decoded.username);

    if (!user) {
      return c.json({ success: false, message: "User not found" }, 401);
    }
    c.set("user", { id: user.id, username: user.username });
    return next();
  } catch (error) {
    if (error instanceof JsonWebTokenError) {
      return c.json({
        success: false,
        message: error.message,
      });
    } else {
      return c.json({
        success: false,
        message: "Invalid token",
      });
    }
  }
}
