import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";

const TEST_USER = {
  id: "e2e-user-1",
  email: "e2e@example.com",
  password: "password123",
  name: "E2E User",
};

const TEST_LIST = {
  id: "e2e-list-1",
  name: "E2E Test List",
};

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
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

function wrangler(command: string): void {
  execSync(`npx wrangler ${command}`, { stdio: "pipe" });
}

function d1Execute(sql: string): void {
  wrangler(`d1 execute pickl --local --command="${sql}"`);
}

async function globalSetup(): Promise<void> {
  // Apply migrations
  wrangler("d1 migrations apply pickl --local");

  // Clean existing data
  d1Execute(
    "DELETE FROM items; DELETE FROM list_participants; DELETE FROM lists; DELETE FROM push_subscriptions; DELETE FROM users;",
  );

  // Seed test user
  const passwordHash = await hashPassword(TEST_USER.password);
  const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

  d1Execute(
    `INSERT INTO users (id, email, password_hash, name, created_at, updated_at) VALUES ('${TEST_USER.id}', '${TEST_USER.email}', '${passwordHash}', '${TEST_USER.name}', '${now}', '${now}')`,
  );

  // Seed test list with user as participant
  d1Execute(
    `INSERT INTO lists (id, name, created_by, created_at, updated_at) VALUES ('${TEST_LIST.id}', '${TEST_LIST.name}', '${TEST_USER.id}', '${now}', '${now}')`,
  );
  d1Execute(
    `INSERT INTO list_participants (list_id, user_id, joined_at) VALUES ('${TEST_LIST.id}', '${TEST_USER.id}', '${now}')`,
  );
}

export default globalSetup;

export { TEST_LIST, TEST_USER };
