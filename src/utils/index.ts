import { User } from "../types/User";
import fs from "fs/promises";
import { join } from "path";
import { sign } from "jsonwebtoken";
import { hash } from "bcryptjs";
import { Context } from "hono";

export const USER_DB_PATH = join(__dirname, "..", "db", "users.json");

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

export type CtxUser = { id: string; username: string } | undefined;
export function getCtxUser(c: Context): CtxUser {
  return c.get("user") as CtxUser;
}
