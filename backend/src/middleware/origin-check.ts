import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../types/app.js";
import { env } from "../config/env.js";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

export const originCheck: MiddlewareHandler<AppEnv> = async (
  c,
  next,
) => {
  if (safeMethods.has(c.req.method)) {
    return next();
  }

  const origin = c.req.header("Origin");

  if (origin !== env.frontendUrl) {
    return c.json({ error: "Invalid request origin" }, 403);
  }

  await next();
};