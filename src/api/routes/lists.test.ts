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
  });
});

describe("POST /api/lists/:id/join", () => {
  it("joins a list", async () => {
    // Create list as user-1, then join as user-2
    const createRes = await app.request(
      "/api/lists",
      authHeaders({ name: "Shared List" }),
      env,
    );
    const { id: listId } = await createRes.json();

    // Create user-2
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
    const token2 = await signJwt("user-2", env.JWT_SECRET);

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
