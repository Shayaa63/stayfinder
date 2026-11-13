
import type { Context, Env } from "hono";
import type { User } from "@supabase/supabase-js";
import type { createSupabaseClient } from "../database/client.js";

export type AppSupabaseClient = ReturnType<
  typeof createSupabaseClient
>;

export type AppEnv = Env & {
  Variables: {
    supabase: AppSupabaseClient;
    user: User | null;
  };
};

export type AppContext = Context<AppEnv>;
