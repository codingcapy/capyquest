import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { mightFail } from "might-fail";
import z from "zod";
import { db } from "../db";
import { users as usersTable } from "../schemas/users";
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { randomUUIDv7 } from "bun";

const scryptAsync = promisify(scrypt);

const createUserSchema = z.object({
  username: z.string().max(32),
  email: z.string().max(256),
  password: z.string().max(128),
});

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export const usersRouter = new Hono().post(
  "/",
  zValidator("json", createUserSchema),
  async (c) => {
    const insertValues = c.req.valid("json");
    const { error: emailQueryError, result: emailQueryResult } =
      await mightFail(
        db
          .select()
          .from(usersTable)
          .where(eq(usersTable.email, insertValues.email)),
      );
    if (emailQueryError) {
      throw new HTTPException(500, {
        message: "Error while fetching user",
        cause: emailQueryError,
      });
    }
    if (emailQueryResult.length > 0) {
      return c.json(
        { message: "An account with this email already exists" },
        409,
      );
    }
    const { error: usernameQueryError, result: usernameQueryResult } =
      await mightFail(
        db
          .select()
          .from(usersTable)
          .where(eq(usersTable.username, insertValues.username)),
      );
    if (usernameQueryError) {
      throw new HTTPException(500, {
        message: "Error while fetching user",
        cause: usernameQueryError,
      });
    }
    if (usernameQueryResult.length > 0) {
      return c.json(
        { message: "An account with this username already exists" },
        409,
      );
    }
    const encrypted = await hashPassword(insertValues.password);
    const userId = randomUUIDv7();
    const { error: userInsertError, result: userInsertResult } =
      await mightFail(
        db
          .insert(usersTable)
          .values({
            userId: userId,
            username: insertValues.username,
            email: insertValues.email,
            password: encrypted,
          })
          .returning(),
      );
    if (userInsertError) {
      console.log("Error while creating user");
      throw new HTTPException(500, {
        message: "Error while creating user",
        cause: userInsertError,
      });
    }
    const newUser = userInsertResult[0];
    if (!newUser) {
      throw new HTTPException(500, { message: "User insert returned no rows" });
    }
    return c.json({ user: userInsertResult[0] }, 200);
  },
);
