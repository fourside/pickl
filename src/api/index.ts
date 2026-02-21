import { Hono } from "hono";
import type { Kysely } from "kysely";
import type { Database } from "./db";
import { createDb } from "./db";
import { authMiddleware } from "./middleware/auth";
import { authRoutes } from "./routes/auth";
import { avatarPublicRoutes, avatarRoutes } from "./routes/avatar";
import { itemsRoutes } from "./routes/items";
import { listsRoutes } from "./routes/lists";
import { syncRoutes } from "./routes/sync";

export type Env = {
  Bindings: {
    DB: D1Database;
    JWT_SECRET: string;
    AVATAR_BUCKET: R2Bucket;
    VAPID_PRIVATE_KEY?: string;
    VAPID_PUBLIC_KEY?: string;
    VAPID_SUBJECT?: string;
  };
  Variables: {
    db: Kysely<Database>;
    userId: string;
  };
};

const app = new Hono<Env>();

// Inject DB into context
app.use("/api/*", async (c, next) => {
  const db = createDb(c.env.DB);
  c.set("db", db);
  await next();
});

// Public routes
app.route("/api/auth", authRoutes);
app.route("/api/avatar", avatarPublicRoutes);

// Protected routes
app.use("/api/*", authMiddleware);
app.route("/api/lists", listsRoutes);
app.route("/api/items", itemsRoutes);
app.route("/api/sync", syncRoutes);
app.route("/api/avatar", avatarRoutes);

export default app;
