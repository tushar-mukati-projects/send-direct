import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

// Workers integration project (Part B): runs test/worker.test.ts inside the
// workerd runtime via Miniflare, with real bindings from wrangler.toml.
export default defineWorkersConfig({
  test: {
    name: "workers",
    include: ["test/**/*.test.ts"],
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.toml" },
        miniflare: {
          // The top-level [[ratelimits]] key in wrangler.toml is not picked up
          // by the test runner, so provide the RATE_LIMITER binding directly to
          // Miniflare here (matching the production limit of 60 / 60s).
          ratelimits: {
            RATE_LIMITER: { simple: { limit: 60, period: 60 } },
          },
        },
      },
    },
  },
});
