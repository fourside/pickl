import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";

interface User {
  email: string;
  name: string;
}

const USERS: User[] = [
  { email: "fourside@gmail.com", name: "fourside" },
  // { email: "user2@pickl.app", name: "User 2" },
];

const isRemote = process.argv.includes("--remote");
const flag = isRemote ? "--remote" : "--local";

function generatePassword(): string {
  return randomBytes(4).toString("hex"); // 8 characters
}

// PBKDF2 hash using Web Crypto API compatible format
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

async function main() {
  console.log(`Seeding users (${isRemote ? "remote" : "local"})...\n`);

  for (const user of USERS) {
    const id = crypto.randomUUID();
    const password = generatePassword();
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

    const sql = `INSERT OR IGNORE INTO users (id, email, password_hash, name, password_changed_at, created_at, updated_at) VALUES ('${id}', '${user.email}', '${passwordHash}', '${user.name}', '${now}', '${now}', '${now}');`;

    try {
      execSync(`npx wrangler d1 execute pickl ${flag} --command="${sql}"`, {
        stdio: "pipe",
      });
      console.log(`  ${user.name} (${user.email})`);
      console.log(`    Password: ${password}`);
      console.log();
    } catch (e) {
      console.error(`  Failed to seed ${user.email}:`, (e as Error).message);
    }
  }

  console.log("Done! Users can change passwords in Settings after login.");
}

main();
