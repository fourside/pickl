import { Hono } from "hono";
import type { Kysely } from "kysely";
import type { Database } from "./db";
import { createDb } from "./db";
import { authMiddleware } from "./middleware/auth";
import { authRoutes } from "./routes/auth";
import { itemsRoutes } from "./routes/items";
import { listsRoutes } from "./routes/lists";
import { syncRoutes } from "./routes/sync";

export type Env = {
  Bindings: {
    DB: D1Database;
    JWT_SECRET: string;
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

// Protected routes
app.use("/api/*", authMiddleware);
app.route("/api/lists", listsRoutes);
app.route("/api/items", itemsRoutes);
app.route("/api/sync", syncRoutes);

export default app;
