import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { createDb } from "../db";
import app from "../index";
import { hashPassword, signJwt } from "../middleware/auth";

let token: string;

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
});

function authHeaders(body?: object): RequestInit {
  return {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };
}

describe("POST /api/lists", () => {
  it("creates a list and auto-joins creator", async () => {
    const res = await app.request(
      "/api/lists",
      authHeaders({ name: "Groceries" }),
      env,
    );

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe("Groceries");
    expect(body.createdBy).toBe("user-1");
    expect(body.isParticipant).toBe(true);
    expect(body.autoHideDone).toBe(true);
    expect(body.isPrivate).toBe(false);
    expect(body.participants).toEqual([
      { id: "user-1", name: "Test User", avatarUrl: null },
    ]);
  });

  it("returns 400 on invalid body", async () => {
    const res = await app.request("/api/lists", authHeaders({}), env);

    expect(res.status).toBe(400);
  });
});

describe("GET /api/lists", () => {
  it("returns lists with participation status", async () => {
    // Create a list first
    await app.request("/api/lists", authHeaders({ name: "My List" }), env);

    const res = await app.request("/api/lists", authHeaders(), env);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("My List");
    expect(body[0].isParticipant).toBe(true);
    expect(body[0].autoHideDone).toBe(true);
    expect(body[0].isPrivate).toBe(false);
    expect(body[0].participants).toEqual([
      { id: "user-1", name: "Test User", avatarUrl: null },
    ]);
  });
});

describe("PATCH /api/lists/:id", () => {
  it("updates isPrivate setting by creator", async () => {
    const createRes = await app.request(
      "/api/lists",
      authHeaders({ name: "My List" }),
      env,
    );
    const { id: listId } = await createRes.json();

    const res = await app.request(
      `/api/lists/${listId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isPrivate: true }),
      },
      env,
    );

    expect(res.status).toBe(200);

    const listsRes = await app.request("/api/lists", authHeaders(), env);
    const lists = await listsRes.json();
    const updated = lists.find((l: { id: string }) => l.id === listId);
    expect(updated.isPrivate).toBe(true);
  });

  it("rejects isPrivate update by non-creator", async () => {
    const createRes = await app.request(
      "/api/lists",
      authHeaders({ name: "My List" }),
      env,
    );
    const { id: listId } = await createRes.json();

    const token2 = await createUser2();

    // user-2 joins the list first
    await app.request(
      `/api/lists/${listId}/join`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token2}` },
      },
      env,
    );

    const res = await app.request(
      `/api/lists/${listId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token2}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isPrivate: true }),
      },
      env,
    );

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Only the list creator can change privacy");
  });

  it("updates autoHideDone setting", async () => {
    const createRes = await app.request(
      "/api/lists",
      authHeaders({ name: "My List" }),
      env,
    );
    const { id: listId } = await createRes.json();

    const res = await app.request(
      `/api/lists/${listId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ autoHideDone: false }),
      },
      env,
    );

    expect(res.status).toBe(200);

    // Verify the setting was updated
    const listsRes = await app.request("/api/lists", authHeaders(), env);
    const lists = await listsRes.json();
    const updated = lists.find((l: { id: string }) => l.id === listId);
    expect(updated.autoHideDone).toBe(false);
  });
});

async function createUser2() {
  const db = createDb(env.DB);
  const hash = await hashPassword("password");
  await db
    .insertInto("users")
    .values({
      id: "user-2",
      email: "other@example.com",
      password_hash: hash,
      name: "Other User",
      password_changed_at: "2025-01-01T00:00:00Z",
      created_at: "2025-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    })
    .execute();
  return signJwt("user-2", env.JWT_SECRET);
}

describe("POST /api/lists/:id/join", () => {
  it("joins a list", async () => {
    const createRes = await app.request(
      "/api/lists",
      authHeaders({ name: "Shared List" }),
      env,
    );
    const { id: listId } = await createRes.json();

    const token2 = await createUser2();

    const res = await app.request(
      `/api/lists/${listId}/join`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token2}` },
      },
      env,
    );

    expect(res.status).toBe(200);
  });

  it("returns 403 when list is private", async () => {
    const createRes = await app.request(
      "/api/lists",
      authHeaders({ name: "Private List" }),
      env,
    );
    const { id: listId } = await createRes.json();

    await app.request(
      `/api/lists/${listId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isPrivate: true }),
      },
      env,
    );

    const token2 = await createUser2();

    const res = await app.request(
      `/api/lists/${listId}/join`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token2}` },
      },
      env,
    );

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("This list is private");
  });

  it("returns 409 when already joined", async () => {
    const createRes = await app.request(
      "/api/lists",
      authHeaders({ name: "My List" }),
      env,
    );
    const { id: listId } = await createRes.json();

    const res = await app.request(
      `/api/lists/${listId}/join`,
      authHeaders({}),
      env,
    );

    expect(res.status).toBe(409);
  });

  it("returns 404 for non-existent list", async () => {
    const res = await app.request(
      "/api/lists/non-existent/join",
      authHeaders({}),
      env,
    );

    expect(res.status).toBe(404);
  });
});

describe("GET /api/lists (private filtering)", () => {
  it("hides private lists from non-participants", async () => {
    const createRes = await app.request(
      "/api/lists",
      authHeaders({ name: "Secret List" }),
      env,
    );
    const { id: listId } = await createRes.json();

    await app.request(
      `/api/lists/${listId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isPrivate: true }),
      },
      env,
    );

    // user-1 (participant) can still see it
    const res1 = await app.request("/api/lists", authHeaders(), env);
    const lists1 = await res1.json();
    expect(lists1.some((l: { id: string }) => l.id === listId)).toBe(true);

    // user-2 (non-participant) cannot see it
    const token2 = await createUser2();
    const res2 = await app.request(
      "/api/lists",
      {
        headers: { Authorization: `Bearer ${token2}` },
      },
      env,
    );
    const lists2 = await res2.json();
    expect(lists2.some((l: { id: string }) => l.id === listId)).toBe(false);
  });
});

describe("POST /api/lists/:id/leave", () => {
  it("leaves a list", async () => {
    const createRes = await app.request(
      "/api/lists",
      authHeaders({ name: "My List" }),
      env,
    );
    const { id: listId } = await createRes.json();

    const res = await app.request(
      `/api/lists/${listId}/leave`,
      authHeaders({}),
      env,
    );

    expect(res.status).toBe(200);

    // Verify no longer participant
    const listsRes = await app.request("/api/lists", authHeaders(), env);
    const lists = await listsRes.json();
    const left = lists.find((l: { id: string }) => l.id === listId);
    expect(left.isParticipant).toBe(false);
  });
});
