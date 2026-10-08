import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { healthRouter } from "./routes/health.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { requestLogger } from "./middleware/logger.middleware.js";

// Load local environment in Node.js runtime if available
const envLocalPath = resolve(process.cwd(), ".env.local");
if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
} else {
  config();
}

type Bindings = {
  DATABASE_URL?: string;
  NODE_ENV?: string;
};

export const app = new Hono<{ Bindings: Bindings }>();

// Global middleware
app.use("*", cors());
app.use("*", requestLogger);
app.onError(errorHandler);

// Root route
app.get("/", (c) => {
  return c.json({
    name: "TideMesh API",
    tagline: "Coastal Flood Intelligence and Emergency Response Platform",
    status: "running",
    version: "0.1.0",
    documentation: "/docs",
    endpoints: {
      health: "/api/v1/health",
      databaseHealth: "/api/v1/health/db",
    },
  });
});

// Mount routes
app.route("/api/v1/health", healthRouter);

// Cloudflare Workers entrypoint
export default app;

// Node.js local runner (when running `tsx src/index.ts`)
if (typeof process !== "undefined" && process.env) {
  const isDirectRun =
    process.argv[1]?.endsWith("src/index.ts") ||
    process.argv[1]?.endsWith("dist/index.js");

  if (isDirectRun) {
    import("@hono/node-server").then(({ serve }) => {
      const port = Number(process.env.PORT) || 3000;
      console.log(`🌊 TideMesh API server starting on http://localhost:${port}`);
      serve({
        fetch: app.fetch,
        port,
      });
    });
  }
}
