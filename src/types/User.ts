import * as v from "valibot";

export interface User {
  id: string;
  username: string;
  password: string;
}

export const createUserSchema = v.object({
  name: v.string(),
  email: v.string(),
});
