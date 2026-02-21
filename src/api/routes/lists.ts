import { Hono } from "hono";
import * as v from "valibot";
import {
  CreateListRequestSchema,
  UpdateListRequestSchema,
} from "../../models/list";
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
      "lists.auto_hide_done",
      "lists.created_by",
      "lists.created_at",
      "lists.updated_at",
      "list_participants.user_id as participant_user_id",
    ])
    .orderBy("lists.updated_at", "desc")
    .execute();

  const listIds = lists.map((l) => l.id);
  const participants =
    listIds.length > 0
      ? await db
          .selectFrom("list_participants")
          .innerJoin("users", "users.id", "list_participants.user_id")
          .select([
            "list_participants.list_id",
            "users.id",
            "users.name",
            "users.avatar_key",
          ])
          .where("list_participants.list_id", "in", listIds)
          .execute()
      : [];

  const participantsByList = new Map<
    string,
    { id: string; name: string; avatarUrl: string | null }[]
  >();
  for (const p of participants) {
    const list = participantsByList.get(p.list_id) ?? [];
    list.push({
      id: p.id,
      name: p.name,
      avatarUrl: p.avatar_key ? `/api/avatar/${p.id}` : null,
    });
    participantsByList.set(p.list_id, list);
  }

  return c.json(
    lists.map((list) => ({
      id: list.id,
      name: list.name,
      createdBy: list.created_by,
      createdAt: list.created_at,
      updatedAt: list.updated_at,
      isParticipant: list.participant_user_id !== null,
      autoHideDone: list.auto_hide_done === 1,
      participants: participantsByList.get(list.id) ?? [],
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

  const creator = await db
    .selectFrom("users")
    .select(["name", "avatar_key"])
    .where("id", "=", userId)
    .executeTakeFirstOrThrow();

  return c.json(
    {
      id,
      name: result.output.name,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      isParticipant: true,
      autoHideDone: true,
      participants: [
        {
          id: userId,
          name: creator.name,
          avatarUrl: creator.avatar_key ? `/api/avatar/${userId}` : null,
        },
      ],
    },
    201,
  );
});

// Update list
listsRoutes.patch("/:id", async (c) => {
  const listId = c.req.param("id");
  const userId = c.get("userId");
  const db = c.get("db");

  const participant = await db
    .selectFrom("list_participants")
    .select("user_id")
    .where("list_id", "=", listId)
    .where("user_id", "=", userId)
    .executeTakeFirst();

  if (!participant) {
    return c.json({ error: "Not a participant" }, 403);
  }

  const body = await c.req.json();
  const result = v.safeParse(UpdateListRequestSchema, body);
  if (!result.success) {
    return c.json({ error: "Invalid request" }, 400);
  }

  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  const updates: Record<string, unknown> = { updated_at: now };
  if (result.output.name !== undefined) {
    updates.name = result.output.name;
  }
  if (result.output.autoHideDone !== undefined) {
    updates.auto_hide_done = result.output.autoHideDone ? 1 : 0;
  }

  await db.updateTable("lists").set(updates).where("id", "=", listId).execute();

  return c.json({ ok: true });
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
