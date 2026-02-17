import { Hono } from "hono";
import * as v from "valibot";
import { CreateListRequestSchema } from "../../models/list";
import type { Env } from "../index";

export const listsRoutes = new Hono<Env>();

// Get all lists with participation status
listsRoutes.get("/", async (c) => {
  const userId = c.get("userId");
  const db = c.get("db");

  const lists = await db
    .selectFrom("lists")
    .leftJoin("list_participants", (join) =>
      join
        .onRef("list_participants.list_id", "=", "lists.id")
        .on("list_participants.user_id", "=", userId),
    )
    .select([
      "lists.id",
      "lists.name",
      "lists.created_by",
      "lists.created_at",
      "lists.updated_at",
      "list_participants.user_id as participant_user_id",
    ])
    .orderBy("lists.updated_at", "desc")
    .execute();

  return c.json(
    lists.map((list) => ({
      id: list.id,
      name: list.name,
      createdBy: list.created_by,
      createdAt: list.created_at,
      updatedAt: list.updated_at,
      isParticipant: list.participant_user_id !== null,
    })),
  );
});

// Create a new list (creator auto-joins)
listsRoutes.post("/", async (c) => {
  const body = await c.req.json();
  const result = v.safeParse(CreateListRequestSchema, body);
  if (!result.success) {
    return c.json({ error: "Invalid request" }, 400);
  }

  const userId = c.get("userId");
  const db = c.get("db");
  const id = crypto.randomUUID();
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  await db
    .insertInto("lists")
    .values({
      id,
      name: result.output.name,
      created_by: userId,
      created_at: now,
      updated_at: now,
    })
    .execute();

  await db
    .insertInto("list_participants")
    .values({
      list_id: id,
      user_id: userId,
      joined_at: now,
    })
    .execute();

  return c.json(
    {
      id,
      name: result.output.name,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      isParticipant: true,
    },
    201,
  );
});

// Join a list
listsRoutes.post("/:id/join", async (c) => {
  const listId = c.req.param("id");
  const userId = c.get("userId");
  const db = c.get("db");

  const list = await db
    .selectFrom("lists")
    .select("id")
    .where("id", "=", listId)
    .executeTakeFirst();

  if (!list) {
    return c.json({ error: "List not found" }, 404);
  }

  const existing = await db
    .selectFrom("list_participants")
    .select("user_id")
    .where("list_id", "=", listId)
    .where("user_id", "=", userId)
    .executeTakeFirst();

  if (existing) {
    return c.json({ error: "Already joined" }, 409);
  }

  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  await db
    .insertInto("list_participants")
    .values({
      list_id: listId,
      user_id: userId,
      joined_at: now,
    })
    .execute();

  return c.json({ ok: true });
});

// Leave a list
listsRoutes.post("/:id/leave", async (c) => {
  const listId = c.req.param("id");
  const userId = c.get("userId");
  const db = c.get("db");

  await db
    .deleteFrom("list_participants")
    .where("list_id", "=", listId)
    .where("user_id", "=", userId)
    .execute();

  return c.json({ ok: true });
});
