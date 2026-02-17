import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { createDb } from "../db";
import app from "../index";
import { hashPassword } from "../middleware/auth";

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    const db = createDb(env.DB);
    const hash = await hashPassword("correct-password");
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
  });

  it("returns token and user on valid credentials", async () => {
    const res = await app.request(
      "/api/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          password: "correct-password",
        }),
      },
      env,
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBeDefined();
    expect(body.user).toEqual({
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
    });
  });

  it("returns 401 on wrong email", async () => {
    const res = await app.request(
      "/api/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "wrong@example.com",
          password: "correct-password",
        }),
      },
      env,
    );

    expect(res.status).toBe(401);
  });

  it("returns 401 on wrong password", async () => {
    const res = await app.request(
      "/api/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@example.com",
          password: "wrong-password",
        }),
      },
      env,
    );

    expect(res.status).toBe(401);
  });

  it("returns 400 on invalid body", async () => {
    const res = await app.request(
      "/api/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "not-an-email" }),
      },
      env,
    );

    expect(res.status).toBe(400);
  });
});
