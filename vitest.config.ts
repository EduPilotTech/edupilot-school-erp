import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Sprint 4.8C — first test runner introduced into this project (none existed before). Scoped to
// component/integration tests for Client Components only; server-side code (repositories,
// application services) is verified live against the real database instead (see every prior
// sprint's report), not through this runner.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    css: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
