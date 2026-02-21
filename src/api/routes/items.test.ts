import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { createDb } from "../db";
import app from "../index";
import { hashPassword, signJwt } from "../middleware/auth";

let token: string;
let listId: string;

beforeEach(async () => {
  const db = createDb(env.DB);
  const hash = await hashPassword("password");
  await db
    .insertInto("users")
    .values({
      id: "user-1",
      email: "test@example.com",
      password_hash: hash,
      name: "Test User",
      password_changed_at: "2025-01-01T00:00:00Z",
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    })
    .execute();
  token = await signJwt("user-1", env.JWT_SECRET);

  // Create a list and join
  const res = await app.request(
    "/api/lists",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "Test List" }),
    },
    env,
  );
  const body = await res.json();
  listId = body.id;
});

function req(opts?: { method?: string; body?: object }): RequestInit {
  return {
    method: opts?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(opts?.body ? { "Content-Type": "application/json" } : {}),
    },
    ...(opts?.body ? { body: JSON.stringify(opts.body) } : {}),
  };
}

describe("POST /api/items/:listId", () => {
  it("creates an item with decremented position (newest first)", async () => {
    const res1 = await app.request(
      `/api/items/${listId}`,
      req({ method: "POST", body: { text: "Apples" } }),
      env,
    );
    expect(res1.status).toBe(201);
    const item1 = await res1.json();
    expect(item1.text).toBe("Apples");

    const res2 = await app.request(
      `/api/items/${listId}`,
      req({ method: "POST", body: { text: "Bananas" } }),
      env,
    );
    const item2 = await res2.json();
    expect(item2.position).toBeLessThan(item1.position);
  });

  it("returns 403 for non-participant", async () => {
    // Create user-2 who is not a participant
    const db = createDb(env.DB);
    const hash = await hashPassword("password");
    await db
      .insertInto("users")
      .values({
        id: "user-2",
        email: "other@example.com",
        password_hash: hash,
        name: "Other",
        password_changed_at: "2025-01-01T00:00:00Z",
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
      })
      .execute();
    const token2 = await signJwt("user-2", env.JWT_SECRET);

    const res = await app.request(
      `/api/items/${listId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token2}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: "Hack" }),
      },
      env,
    );

    expect(res.status).toBe(403);
  });
});

describe("GET /api/items/:listId", () => {
  it("returns items excluding deleted ones", async () => {
    // Create two items
    await app.request(
      `/api/items/${listId}`,
      req({ method: "POST", body: { text: "Keep" } }),
      env,
    );
    const res2 = await app.request(
      `/api/items/${listId}`,
      req({ method: "POST", body: { text: "Delete me" } }),
      env,
    );
    const { id: deleteId } = await res2.json();

    // Soft delete the second item
    await app.request(
      `/api/items/${listId}/${deleteId}`,
      req({ method: "DELETE" }),
      env,
    );

    // Get items
    const res = await app.request(`/api/items/${listId}`, req(), env);
    const items = await res.json();

    expect(items).toHaveLength(1);
    expect(items[0].text).toBe("Keep");
  });
});

describe("PATCH /api/items/:listId/:itemId", () => {
  it("updates item text", async () => {
    const createRes = await app.request(
      `/api/items/${listId}`,
      req({ method: "POST", body: { text: "Old" } }),
      env,
    );
    const { id: itemId } = await createRes.json();

    const res = await app.request(
      `/api/items/${listId}/${itemId}`,
      req({ method: "PATCH", body: { text: "New" } }),
      env,
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.text).toBe("New");
  });

  it("toggles checked status", async () => {
    const createRes = await app.request(
      `/api/items/${listId}`,
      req({ method: "POST", body: { text: "Item" } }),
      env,
    );
    const { id: itemId } = await createRes.json();

    const res = await app.request(
      `/api/items/${listId}/${itemId}`,
      req({ method: "PATCH", body: { checked: true } }),
      env,
    );

    const body = await res.json();
    expect(body.checked).toBe(true);
    expect(body.checkedAt).toBeDefined();
  });
});

describe("GET /api/items/:listId auto-hide", () => {
  it("returns old checked items when auto_hide_done is disabled", async () => {
    // Create and check an item
    const createRes = await app.request(
      `/api/items/${listId}`,
      req({ method: "POST", body: { text: "Old Item" } }),
      env,
    );
    const { id: itemId } = await createRes.json();
    await app.request(
      `/api/items/${listId}/${itemId}`,
      req({ method: "PATCH", body: { checked: true } }),
      env,
    );

    // Backdate checked_at to 3 days ago
    const db = createDb(env.DB);
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      .toISOString()
      .replace(/\.\d{3}Z$/, "Z");
    await db
      .updateTable("items")
      .set({ checked_at: threeDaysAgo })
      .where("id", "=", itemId)
      .execute();

    // With auto_hide_done enabled (default), item should be hidden
    const res1 = await app.request(`/api/items/${listId}`, req(), env);
    const items1 = await res1.json();
    expect(items1.find((i: { id: string }) => i.id === itemId)).toBeUndefined();

    // Disable auto_hide_done
    await app.request(
      `/api/lists/${listId}`,
      req({ method: "PATCH", body: { autoHideDone: false } }),
      env,
    );

    // Now the old item should be returned
    const res2 = await app.request(`/api/items/${listId}`, req(), env);
    const items2 = await res2.json();
    expect(items2.find((i: { id: string }) => i.id === itemId)).toBeDefined();
  });
});

describe("PUT /api/items/:listId/reorder", () => {
  it("updates item positions", async () => {
    const res1 = await app.request(
      `/api/items/${listId}`,
      req({ method: "POST", body: { text: "A" } }),
      env,
    );
    const res2 = await app.request(
      `/api/items/${listId}`,
      req({ method: "POST", body: { text: "B" } }),
      env,
    );
    const { id: idA } = await res1.json();
    const { id: idB } = await res2.json();

    // Reorder: B before A
    const reorderRes = await app.request(
      `/api/items/${listId}/reorder`,
      req({ method: "PUT", body: { itemIds: [idB, idA] } }),
      env,
    );
    expect(reorderRes.status).toBe(200);

    // Verify order
    const listRes = await app.request(`/api/items/${listId}`, req(), env);
    const items = await listRes.json();
    expect(items[0].text).toBe("B");
    expect(items[1].text).toBe("A");
  });
});
