import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../types/app.js";
import { requireAuth } from "../middleware/auth.js";

const authRoutes = new Hono<AppEnv>();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().trim().min(2).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRoutes.post("/register", async (c) => {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const { email, password, name } = parsed.data;
  const supabase = c.get("supabase");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (error) {
    return c.json({ error: error.message }, 400);
  }

  return c.json(
    {
      user: data.user,
      requiresEmailConfirmation: !data.session,
    },
    201,
  );
});

authRoutes.post("/login", async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const supabase = c.get("supabase");

  const { data, error } = await supabase.auth.signInWithPassword(
    parsed.data,
  );

  if (error) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  return c.json({ user: data.user });
});

authRoutes.post("/logout", async (c) => {
  const supabase = c.get("supabase");
  const { error } = await supabase.auth.signOut();

  if (error) {
    return c.json({ error: error.message }, 400);
  }

  return c.json({ message: "Logged out" });
});

authRoutes.get("/me", requireAuth, async (c) => {
  return c.json({ user: c.get("user") });
});

export default authRoutes;