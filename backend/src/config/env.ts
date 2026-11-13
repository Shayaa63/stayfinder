
import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  HONO_PORT: z.coerce.number().default(3001),

  FRONTEND_URL: z
    .string()
    .url()
    .default("http://localhost:3000"),

  SUPABASE_URL: z.string().url(),

  SUPABASE_ANON_KEY: z.string().min(1),

  COOKIE_DOMAIN: z.string().optional(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error(
    "Invalid environment variables:",
    result.error.flatten()
  );

  throw new Error("Invalid environment variables");
}

export const env = {
  port: result.data.HONO_PORT,
  frontendUrl: result.data.FRONTEND_URL,
  supabaseUrl: result.data.SUPABASE_URL,
  supabaseAnonKey: result.data.SUPABASE_ANON_KEY,
  nodeEnv: result.data.NODE_ENV,
  cookieDomain: result.data.COOKIE_DOMAIN,
};
