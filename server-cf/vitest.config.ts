import { defineConfig } from "vitest/config";

// Node project: fast, dependency-free schema unit tests (Part A).
// The Workers integration project (Part B) lives in vitest.workers.config.ts and
// is wired in here as a second project so a single `vitest run` executes both.
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "node",
          environment: "node",
          include: ["src/**/*.test.ts"],
        },
      },
      "./vitest.workers.config.ts",
    ],
  },
});
