import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const mswDir = resolve(__dirname, "../node_modules/msw");

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^msw\/browser$/, replacement: resolve(mswDir, "lib/browser/index.mjs") },
      { find: /^msw$/, replacement: resolve(mswDir, "lib/core/index.mjs") },
    ],
  },
});
