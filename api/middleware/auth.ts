import { createMiddleware } from "hono/factory";
import type { Env } from "../index";

interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
}

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const token = header.slice(7);
  try {
    const payload = await verifyJwt(token, c.env.JWT_SECRET);

    // Check if password was changed after token was issued
    const db = c.get("db");
    const user = await db
      .selectFrom("users")
      .select(["id", "password_changed_at"])
      .where("id", "=", payload.sub)
      .executeTakeFirst();

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const passwordChangedAt = new Date(user.password_changed_at).getTime();
    const tokenIssuedAt = payload.iat * 1000;
    if (tokenIssuedAt < passwordChangedAt) {
      return c.json({ error: "Token invalidated by password change" }, 401);
    }

    c.set("userId", payload.sub);

    // Sliding expiration: refresh if within 7 days of expiry
    const now = Math.floor(Date.now() / 1000);
    const sevenDays = 7 * 24 * 60 * 60;
    if (payload.exp - now < sevenDays) {
      const newToken = await signJwt(payload.sub, c.env.JWT_SECRET);
      c.header("X-Refreshed-Token", newToken);
    }

    await next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
});

export async function signJwt(userId: string, secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const thirtyDays = 30 * 24 * 60 * 60;

  const header = { alg: "HS256", typ: "JWT" };
  const payload: JwtPayload = {
    sub: userId,
    iat: now,
    exp: now + thirtyDays,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signingInput),
  );

  const encodedSignature = base64UrlEncode(
    String.fromCharCode(...new Uint8Array(signature)),
  );

  return `${signingInput}.${encodedSignature}`;
}

export async function verifyJwt(
  token: string,
  secret: string,
): Promise<JwtPayload> {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid token format");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const signatureBytes = Uint8Array.from(
    atob(encodedSignature.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0),
  );

  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    new TextEncoder().encode(signingInput),
  );

  if (!valid) {
    throw new Error("Invalid signature");
  }

  const payload: JwtPayload = JSON.parse(
    atob(encodedPayload.replace(/-/g, "+").replace(/_/g, "/")),
  );

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    throw new Error("Token expired");
  }

  return payload;
}

function base64UrlEncode(str: string): string {
  const base64 = btoa(str);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );

  const hash = new Uint8Array(derivedBits);
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const hashHex = Array.from(hash)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [saltHex, expectedHashHex] = storedHash.split(":");
  const salt = Uint8Array.from(
    saltHex.match(/.{2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? [],
  );

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );

  const hashHex = Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex === expectedHashHex;
}
