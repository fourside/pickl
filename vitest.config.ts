import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: [
      "src/front/**/*.test.{ts,tsx}",
      "src/models/**/*.test.ts",
      "src/api/middleware/**/*.test.ts",
    ],
    setupFiles: ["./src/front/test-setup.ts"],
  },
});
