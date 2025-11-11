import { Hono } from "hono";
import authRoute from "./authRoute";
import usersRoute from "./usersRoute";

const index = new Hono();

index.route("/auth", authRoute);
index.route("/users", usersRoute);

export default index;
