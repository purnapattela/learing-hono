import { Hono } from "hono";
import { getCtxUser, readUsers } from "../utils";

const usersRoute = new Hono();

usersRoute.all("*", async (c) => {
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

export default usersRoute;
