import type { Context, ErrorHandler } from "hono";

export const errorHandler: ErrorHandler = (err: Error, c: Context) => {
  console.error("Unhandled API Error:", err.message);

  // Strip database connection strings or passwords if any leaked into message
  const sanitized = err.message.replace(/:\/\/[^@]+@/, "://***:***@");

  return c.json(
    {
      error: {
        message:
          process.env.NODE_ENV === "production"
            ? "An internal server error occurred."
            : sanitized,
        status: 500,
        timestamp: new Date().toISOString(),
      },
    },
    500
  );
};
