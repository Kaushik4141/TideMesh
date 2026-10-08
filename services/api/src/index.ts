import { config } from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { healthRouter } from "./routes/health.js";
import { simulationRouter } from "./routes/simulation.js";
import {
  environmentalRouter,
  eventEnvironmentRouter,
} from "./routes/environmental.js";
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
  ML_API_URL?: string;
  NODE_ENV?: string;
};

export const app = new Hono<{ Bindings: Bindings }>();

// Global middleware
app.use(
  "*",
  cors({
    origin: (origin) => origin || "*",
    allowHeaders: ["Content-Type", "Authorization", "Accept", "X-Requested-With"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    exposeHeaders: ["Content-Length", "Content-Type"],
    credentials: true,
  })
);

// Chromium Private Network Access (PNA) preflight support
app.use("*", async (c, next) => {
  if (c.req.header("Access-Control-Request-Private-Network")) {
    c.res.headers.set("Access-Control-Allow-Private-Network", "true");
  }
  await next();
  c.res.headers.set("Access-Control-Allow-Private-Network", "true");
});

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
      simulations: "/api/v1/simulations",
      mangaluruForecast: "/api/v1/simulations/mangaluru-historical-2018/forecast",
      mangaluruExtent: "/api/v1/simulations/mangaluru-historical-2018/extent",
      environmentalObservations: "/api/v1/environmental-observations",
      ingestEnvironment: "/api/v1/environmental-observations/ingest",
      eventEnvironment: "/api/v1/events/mangaluru-historical-2018/environment",
      sfincsForcing: "/api/v1/environmental-observations/sfincs-forcing",
    },
  });
});

// Mount routes
app.route("/api/v1/health", healthRouter);
app.route("/api/v1/simulations", simulationRouter);
app.route("/api/v1/environmental-observations", environmentalRouter);
app.route("/api/v1/events", eventEnvironmentRouter);



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
