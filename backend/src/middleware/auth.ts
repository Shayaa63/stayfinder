import type { MiddlewareHandler } from "hono";

import type { AppEnv } from "../types/app.js";

export const optionalAuth: MiddlewareHandler<AppEnv> =
  async (c, next) => {
    const supabase = c.get("supabase");

    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    c.set("user", error ? null : user);

    await next();
  };

export const requireAuth: MiddlewareHandler<AppEnv> =
  async (c, next) => {
    const supabase = c.get("supabase");

    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    if (error || !user) {
      return c.json(
        {
          error: "Unauthorized",
          message: "You must be logged in"
        },
        401
      );
    }

    c.set("user", user);

    await next();
  };