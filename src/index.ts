// Local Notes taking application with auth
import { Hono } from "hono";
import type { Context, Next } from "hono";
import fs from "fs/promises";
import { join } from "path";
import { JsonWebTokenError, JwtPayload, sign, verify } from "jsonwebtoken";
import bcrypt, { hash } from "bcryptjs";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { cors } from "hono/cors";

const USER_DB_PATH = join(__dirname, "db", "users.json");

interface User {
  id: string;
  username: string;
  password: string;
}

export async function readUsers(): Promise<User[]> {
  const raw = await fs.readFile(USER_DB_PATH, "utf-8");
  return JSON.parse(raw);
}

export async function writeUsers(data: User) {
  const users = await readUsers();
  users.push(data);
  await fs.writeFile(USER_DB_PATH, JSON.stringify(users), "utf-8");
}

export function generateJWT({ username }: { username: string }) {
  return sign({ username }, Bun.env.JWT_SECRET!, { expiresIn: "1d" });
}

export async function generateHashPassword(password: string) {
  return await hash(password, 10);
}

export async function protectedMiddleware(c: Context, next: Next) {
  const publicRoutes = ["/auth/signup", "/auth/login"];

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

const app = new Hono().basePath("/api");
app.use(logger());
app.use("/api/*", cors());
app.use(secureHeaders());
app.use("*", protectedMiddleware);

app.post("/auth/signup", async (c) => {
  const body = await c.req.json();
  const USERS = await readUsers();
  for (let i = 0; i < USERS.length; i++) {
    if (USERS[i].username == body?.username) {
      return c.json(
        { success: false, message: "Username already exists" },
        400
      );
    }
  }
  const user: User = {
    id: `${USERS.length}`,
    username: body.username,
    password: await generateHashPassword(body.password),
  };
  await writeUsers(user);
  return c.json({ success: true, message: "User registered" }, 201);
});

app.post("/auth/login", async (c) => {
  const body = await c.req.json();
  const USERS = await readUsers();
  for (let i = 0; i < USERS.length; i++) {
    if (
      USERS[i].username == body?.username &&
      bcrypt.compareSync(body?.password, USERS[i].password)
    ) {
      const token = generateJWT({ username: USERS[i].username });
      return c.json({ success: true, message: "Login successful" }, 200, {
        "Set-Cookie": `token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=86400`,
      });
    }
  }
  return c.json({ success: false, message: "Invalid Credentials" }, 400);
});

export type CtxUser = { id: string; username: string } | undefined;
export function getCtxUser(c: Context): CtxUser {
  return c.get("user") as CtxUser;
}

app.get("/users", async (c) => {
  const user = getCtxUser(c);
  return c.json(
    {
      success: true,
      data: await readUsers(),
    },
    200,
    {
      "Requested-by": `${user?.username}`,
    }
  );
});

export default {
  port: 8000,
  fetch: app.fetch,
};
