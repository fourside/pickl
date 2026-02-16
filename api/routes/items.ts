import type { Context } from "hono";
import { Hono } from "hono";
import * as v from "valibot";
import {
  CreateItemRequestSchema,
  ReorderItemsRequestSchema,
  UpdateItemRequestSchema,
} from "../../models/item";
import type { Env } from "../index";

export const itemsRoutes = new Hono<Env>();

// Middleware: check list participation for write operations
async function requireParticipant(
  c: Context<Env>,
  listId: string,
): Promise<Response | null> {
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
  return null;
}

// Get items for a list
itemsRoutes.get("/:listId", async (c) => {
  const listId = c.req.param("listId");
  const db = c.get("db");

  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000)
    .toISOString()
    .replace(/\.\d{3}Z$/, "Z");

  const items = await db
    .selectFrom("items")
    .selectAll()
    .where("list_id", "=", listId)
    .where("deleted_at", "is", null)
    .where((eb) =>
      eb.or([
        eb("checked", "=", 0),
        eb("checked_at", "is", null),
        eb("checked_at", ">=", fortyEightHoursAgo),
      ]),
    )
    .orderBy("position", "asc")
    .execute();

  return c.json(
    items.map((item) => ({
      id: item.id,
      listId: item.list_id,
      text: item.text,
      checked: item.checked === 1,
      checkedAt: item.checked_at,
      createdBy: item.created_by,
      updatedBy: item.updated_by,
      position: item.position,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    })),
  );
});

// Add item to a list
itemsRoutes.post("/:listId", async (c) => {
  const listId = c.req.param("listId");
  const denied = await requireParticipant(c, listId);
  if (denied) return denied;

  const body = await c.req.json();
  const result = v.safeParse(CreateItemRequestSchema, body);
  if (!result.success) {
    return c.json({ error: "Invalid request" }, 400);
  }

  const userId = c.get("userId");
  const db = c.get("db");
  const id = crypto.randomUUID();
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  // Get max position
  const maxPos = await db
    .selectFrom("items")
    .select(db.fn.max("position").as("max_position"))
    .where("list_id", "=", listId)
    .where("deleted_at", "is", null)
    .executeTakeFirst();

  const position = (maxPos?.max_position ?? -1) + 1;

  await db
    .insertInto("items")
    .values({
      id,
      list_id: listId,
      text: result.output.text,
      checked: 0,
      checked_at: null,
      created_by: userId,
      updated_by: userId,
      position,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    })
    .execute();

  return c.json(
    {
      id,
      listId,
      text: result.output.text,
      checked: false,
      checkedAt: null,
      createdBy: userId,
      updatedBy: userId,
      position,
      createdAt: now,
      updatedAt: now,
    },
    201,
  );
});

// Update an item
itemsRoutes.patch("/:listId/:itemId", async (c) => {
  const listId = c.req.param("listId");
  const itemId = c.req.param("itemId");
  const denied = await requireParticipant(c, listId);
  if (denied) return denied;

  const body = await c.req.json();
  const result = v.safeParse(UpdateItemRequestSchema, body);
  if (!result.success) {
    return c.json({ error: "Invalid request" }, 400);
  }

  const userId = c.get("userId");
  const db = c.get("db");
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  const updates: Record<string, unknown> = {
    updated_by: userId,
    updated_at: now,
  };

  if (result.output.text !== undefined) {
    updates.text = result.output.text;
  }

  if (result.output.checked !== undefined) {
    updates.checked = result.output.checked ? 1 : 0;
    updates.checked_at = result.output.checked ? now : null;
  }

  await db
    .updateTable("items")
    .set(updates)
    .where("id", "=", itemId)
    .where("list_id", "=", listId)
    .where("deleted_at", "is", null)
    .execute();

  const item = await db
    .selectFrom("items")
    .selectAll()
    .where("id", "=", itemId)
    .executeTakeFirst();

  if (!item) {
    return c.json({ error: "Item not found" }, 404);
  }

  return c.json({
    id: item.id,
    listId: item.list_id,
    text: item.text,
    checked: item.checked === 1,
    checkedAt: item.checked_at,
    createdBy: item.created_by,
    updatedBy: item.updated_by,
    position: item.position,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  });
});

// Delete an item (soft delete)
itemsRoutes.delete("/:listId/:itemId", async (c) => {
  const listId = c.req.param("listId");
  const itemId = c.req.param("itemId");
  const denied = await requireParticipant(c, listId);
  if (denied) return denied;

  const db = c.get("db");
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  await db
    .updateTable("items")
    .set({ deleted_at: now, updated_at: now })
    .where("id", "=", itemId)
    .where("list_id", "=", listId)
    .execute();

  return c.json({ ok: true });
});

// Delete all checked items in a list
itemsRoutes.delete("/:listId/checked", async (c) => {
  const listId = c.req.param("listId");
  const denied = await requireParticipant(c, listId);
  if (denied) return denied;

  const db = c.get("db");
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  await db
    .updateTable("items")
    .set({ deleted_at: now, updated_at: now })
    .where("list_id", "=", listId)
    .where("checked", "=", 1)
    .where("deleted_at", "is", null)
    .execute();

  return c.json({ ok: true });
});

// Reorder items
itemsRoutes.put("/:listId/reorder", async (c) => {
  const listId = c.req.param("listId");
  const denied = await requireParticipant(c, listId);
  if (denied) return denied;

  const body = await c.req.json();
  const result = v.safeParse(ReorderItemsRequestSchema, body);
  if (!result.success) {
    return c.json({ error: "Invalid request" }, 400);
  }

  const db = c.get("db");
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  // Update positions based on array order
  for (let i = 0; i < result.output.itemIds.length; i++) {
    await db
      .updateTable("items")
      .set({ position: i, updated_at: now })
      .where("id", "=", result.output.itemIds[i])
      .where("list_id", "=", listId)
      .execute();
  }

  return c.json({ ok: true });
});
