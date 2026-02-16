import { Hono } from "hono";
import type { Env } from "../index";

export const syncRoutes = new Hono<Env>();

// Get changes since timestamp for all lists the user participates in
syncRoutes.get("/", async (c) => {
  const since = c.req.query("since");
  const userId = c.get("userId");
  const db = c.get("db");

  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000)
    .toISOString()
    .replace(/\.\d{3}Z$/, "Z");

  // Get all lists (with participation status)
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

  // Get participant list IDs for item queries
  const participantListIds = lists
    .filter((l) => l.participant_user_id !== null)
    .map((l) => l.id);

  let items: Array<{
    id: string;
    list_id: string;
    text: string;
    checked: number;
    checked_at: string | null;
    created_by: string;
    updated_by: string;
    position: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  }> = [];

  if (participantListIds.length > 0) {
    let query = db
      .selectFrom("items")
      .selectAll()
      .where("list_id", "in", participantListIds)
      .where((eb) =>
        eb.or([
          eb("deleted_at", "is", null),
          // Include recently deleted items so client can remove them
          ...(since ? [eb("deleted_at", ">=", since)] : []),
        ]),
      )
      .where((eb) =>
        eb.or([
          eb("checked", "=", 0),
          eb("checked_at", "is", null),
          eb("checked_at", ">=", fortyEightHoursAgo),
          // Include recently deleted checked items
          ...(since ? [eb("deleted_at", ">=", since)] : []),
        ]),
      )
      .orderBy("position", "asc");

    if (since) {
      query = query.where("updated_at", ">=", since);
    }

    items = await query.execute();
  }

  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  return c.json({
    lists: lists.map((list) => ({
      id: list.id,
      name: list.name,
      createdBy: list.created_by,
      createdAt: list.created_at,
      updatedAt: list.updated_at,
      isParticipant: list.participant_user_id !== null,
    })),
    items: items.map((item) => ({
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
      deletedAt: item.deleted_at,
    })),
    syncedAt: now,
  });
});
