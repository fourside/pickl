import path from "node:path";
import {
  defineWorkersConfig,
  readD1Migrations,
} from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig(async () => {
  const migrationsPath = path.join(__dirname, "migrations");
  const migrations = await readD1Migrations(migrationsPath);

  return {
    test: {
      include: ["src/api/routes/**/*.test.ts"],
      setupFiles: ["./src/api/routes/test-setup.ts"],
      poolOptions: {
        workers: {
          singleWorker: true,
          wrangler: {
            configPath: "./wrangler.test.toml",
          },
          miniflare: {
            bindings: { TEST_MIGRATIONS: migrations },
          },
        },
      },
    },
  };
});
