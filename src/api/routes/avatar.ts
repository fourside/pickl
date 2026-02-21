import { Hono } from "hono";
import type { Env } from "../index";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Public: no auth required
export const avatarPublicRoutes = new Hono<Env>();

// Get avatar by user ID
avatarPublicRoutes.get("/:userId", async (c) => {
  const targetUserId = c.req.param("userId");
  const db = c.get("db");
  const bucket = c.env.AVATAR_BUCKET;

  const user = await db
    .selectFrom("users")
    .select("avatar_key")
    .where("id", "=", targetUserId)
    .executeTakeFirst();

  if (!user?.avatar_key) {
    return c.json({ error: "No avatar" }, 404);
  }

  const object = await bucket.get(user.avatar_key);
  if (!object) {
    return c.json({ error: "Avatar not found" }, 404);
  }

  const headers = new Headers();
  headers.set("Content-Type", object.httpMetadata?.contentType ?? "image/webp");
  headers.set("Cache-Control", "public, max-age=3600");

  return new Response(object.body, { headers });
});

// Protected: auth required
export const avatarRoutes = new Hono<Env>();

// Upload avatar
avatarRoutes.put("/", async (c) => {
  const userId = c.get("userId");
  const db = c.get("db");
  const bucket = c.env.AVATAR_BUCKET;

  const contentType = c.req.header("Content-Type") ?? "";
  if (!ALLOWED_TYPES.includes(contentType)) {
    return c.json({ error: "Unsupported image type" }, 400);
  }

  const body = await c.req.arrayBuffer();
  if (body.byteLength > MAX_SIZE) {
    return c.json({ error: "File too large (max 2MB)" }, 400);
  }

  const key = `avatars/${userId}.webp`;

  await bucket.put(key, body, {
    httpMetadata: { contentType },
  });

  await db
    .updateTable("users")
    .set({ avatar_key: key })
    .where("id", "=", userId)
    .execute();

  return c.json({ ok: true });
});
