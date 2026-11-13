import { createServerClient } from "@supabase/ssr";
import { getCookie, setCookie } from "hono/cookie";

import { env } from "../config/env.js";
import type { Context } from "hono";
import type { Database } from "../types/database.types.js";

export function createSupabaseClient(c: Context) 
 {
  return createServerClient<Database>(
    env.supabaseUrl,
    env.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          const cookies = getCookie(c);

          return Object.entries(cookies).map(
            ([name, value]) => ({
              name,
              value
            })
          );
        },

        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            setCookie(c, name, value, {
              ...options,
              httpOnly: true,
              secure: env.nodeEnv === "production",
              sameSite: "Lax",
              path: "/",
              ...(env.cookieDomain
                ? { domain: env.cookieDomain }
                : {})
            });
          }
        }
      }
    }
  );
}