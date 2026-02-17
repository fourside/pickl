import { describe, expect, it } from "vitest";
import { hashPassword, signJwt, verifyJwt, verifyPassword } from "./auth";

const SECRET = "test-secret-key";

describe("signJwt / verifyJwt", () => {
  it("signs and verifies a token", async () => {
    const token = await signJwt("user-1", SECRET);
    const payload = await verifyJwt(token, SECRET);

    expect(payload.sub).toBe("user-1");
    expect(payload.exp).toBeGreaterThan(payload.iat);
  });

  it("sets expiration to 30 days", async () => {
    const token = await signJwt("user-1", SECRET);
    const payload = await verifyJwt(token, SECRET);
    const thirtyDays = 30 * 24 * 60 * 60;

    expect(payload.exp - payload.iat).toBe(thirtyDays);
  });

  it("rejects a token with wrong secret", async () => {
    const token = await signJwt("user-1", SECRET);

    await expect(verifyJwt(token, "wrong-secret")).rejects.toThrow(
      "Invalid signature",
    );
  });

  it("rejects a tampered token", async () => {
    const token = await signJwt("user-1", SECRET);
    const [header, , signature] = token.split(".");
    const tampered = `${header}.${btoa(JSON.stringify({ sub: "hacker", iat: 0, exp: 9999999999 }))}.${signature}`;

    await expect(verifyJwt(tampered, SECRET)).rejects.toThrow(
      "Invalid signature",
    );
  });

  it("rejects a token with invalid format", async () => {
    await expect(verifyJwt("not-a-jwt", SECRET)).rejects.toThrow(
      "Invalid token format",
    );
  });
});

describe("hashPassword / verifyPassword", () => {
  it("hashes and verifies a password", async () => {
    const hash = await hashPassword("my-password");

    expect(await verifyPassword("my-password", hash)).toBe(true);
  });

  it("rejects wrong password", async () => {
    const hash = await hashPassword("my-password");

    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("produces different hashes for the same password (random salt)", async () => {
    const hash1 = await hashPassword("same-password");
    const hash2 = await hashPassword("same-password");

    expect(hash1).not.toBe(hash2);
  });

  it("produces hash in salt:hash hex format", async () => {
    const hash = await hashPassword("test");

    expect(hash).toMatch(/^[0-9a-f]{32}:[0-9a-f]{64}$/);
  });
});
