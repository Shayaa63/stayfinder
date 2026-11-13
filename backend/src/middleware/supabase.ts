import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../types/app.js";
import { createSupabaseClient } from "../database/client.js";

export const supabaseMiddleware: MiddlewareHandler<AppEnv> =
  async (c, next) => {
    const supabase = createSupabaseClient(c);

    c.set("supabase", supabase);

    await next();
  };