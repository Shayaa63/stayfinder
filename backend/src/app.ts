import { Hono } from "hono";
import { cors } from "hono/cors";

import { env } from "./config/env.js";
import { supabaseMiddleware } from "./middleware/supabase.js";
import propertyRoutes from "./routes/property.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import authRoutes from "./routes/auth.routes.js";
import { errorHandler } from "./middleware/error-handler.js";
import { originCheck } from "./middleware/origin-check.js";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: env.frontendUrl,
    credentials: true,
    allowMethods: [
      "GET",
      "POST",
      "PATCH",
      "DELETE",
      "OPTIONS"
    ],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-CSRF-Token"
    ]
  })
);

app.use("*", supabaseMiddleware);
app.get("/health", (c) => {
  return c.json({
    status: "OK",
    message: "StayFinder API is running",
  });
});
app.get("/", (c) => {
  return c.json({
    message: "StayFinder API",
    status: "running"
  });
});

app.use("*", originCheck);
app.route("/auth", authRoutes);
app.route("/properties", propertyRoutes);
app.route("/bookings", bookingRoutes);
app.onError(errorHandler);

app.notFound((c) => {
  return c.json({ error: "Route not found" }, 404);
});

export default app;