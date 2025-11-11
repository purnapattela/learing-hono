import { Context, Hono } from "hono";
import { readUsers } from "../utils";
import { User } from "../types/User";
import { generateHashPassword, writeUsers, generateJWT } from "../utils";
import bcrypt from "bcryptjs";

const authRoute = new Hono();

authRoute.post("/signup", async (c) => {
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

authRoute.post("/login", async (c: Context) => {
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

export default authRoute;
