import { Hono } from "hono";
import * as v from "valibot";
import {
  ChangePasswordRequestSchema,
  LoginRequestSchema,
} from "../../models/user";
import type { Env } from "../index";
import {
  authMiddleware,
  hashPassword,
  signJwt,
  verifyPassword,
} from "../middleware/auth";

export const authRoutes = new Hono<Env>();

authRoutes.post("/login", async (c) => {
  const body = await c.req.json();
  const result = v.safeParse(LoginRequestSchema, body);
  if (!result.success) {
    return c.json({ error: "Invalid request" }, 400);
  }

  const { email, password } = result.output;
  const db = c.get("db");

  const user = await db
    .selectFrom("users")
    .select(["id", "password_hash", "name", "email", "avatar_key"])
    .where("email", "=", email)
    .executeTakeFirst();

  if (!user) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const token = await signJwt(user.id, c.env.JWT_SECRET);

  return c.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      hasAvatar: !!user.avatar_key,
    },
  });
});

authRoutes.put("/password", authMiddleware, async (c) => {
  const body = await c.req.json();
  const result = v.safeParse(ChangePasswordRequestSchema, body);
  if (!result.success) {
    return c.json({ error: "Invalid request" }, 400);
  }

  const { currentPassword, newPassword } = result.output;
  const userId = c.get("userId");
  const db = c.get("db");

  const user = await db
    .selectFrom("users")
    .select(["password_hash"])
    .where("id", "=", userId)
    .executeTakeFirst();

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const valid = await verifyPassword(currentPassword, user.password_hash);
  if (!valid) {
    return c.json({ error: "Current password is incorrect" }, 401);
  }

  const newHash = await hashPassword(newPassword);
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  await db
    .updateTable("users")
    .set({
      password_hash: newHash,
      password_changed_at: now,
      updated_at: now,
    })
    .where("id", "=", userId)
    .execute();

  const token = await signJwt(userId, c.env.JWT_SECRET);

  return c.json({ token });
});
