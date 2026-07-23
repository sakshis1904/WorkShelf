import pino from "pino";

// pino-pretty transport uses worker threads which can fail in Next.js App Router.
// Use simple console transport in all environments to keep it safe.
export const logger = pino({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",
  browser: {
    asObject: true,
  },
});

export const createContextLogger = (context: Record<string, unknown>) =>
  logger.child(context);
