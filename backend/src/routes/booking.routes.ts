
import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../types/app.js";
import { requireAuth } from "../middleware/auth.js";

import {
  createBookingSchema,
  updateBookingSchema,
} from "../schemas/booking.schema.js";

import {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  getOverlappingBooking,
} from "../database/booking.js";

import { getPropertyById } from "../database/property.js";

const bookingRoutes = new Hono<AppEnv>();
const uuidSchema = z.string().uuid();

bookingRoutes.use("*", requireAuth);

// Validering av query-parametrar för GET /
const bookingQuerySchema = z.object({
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// GET /bookings
bookingRoutes.get("/", async (c) => {
  const parsed = bookingQuerySchema.safeParse(c.req.query());

  if (!parsed.success) {
    return c.json(
      { error: parsed.error.flatten() },
      400
    );
  }

  const result = await getBookings(
    c.get("supabase"),
    parsed.data
  );

  return c.json(result);
});

// GET /bookings/:id
bookingRoutes.get("/:id", async (c) => {
  const bookingId = c.req.param("id");

  if (!uuidSchema.safeParse(bookingId).success) {
    return c.json(
      { error: "Invalid booking ID" },
      400
    );
  }

  const booking = await getBookingById(
    c.get("supabase"),
    bookingId
  );

  if (!booking) {
    return c.json(
      { error: "Booking not found" },
      404
    );
  }

  return c.json(booking);
});

// POST /bookings
bookingRoutes.post("/", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json();
  const parsed = createBookingSchema.safeParse(body);

if (!parsed.success) {
  return c.json(
    {
      error: "Bokningen innehåller ogiltiga uppgifter.",
      details: parsed.error.flatten().fieldErrors,
    },
    400
  );
}

  const input = parsed.data;
  const supabase = c.get("supabase");

  // 1. Kontrollera att boendet finns
  const property = await getPropertyById(
    supabase,
    input.property_id
  );

  if (!property || !property.is_published) {
    return c.json(
      { error: "Property not found or unavailable" },
      404
    );
  }

  // 2. Kontrollera antal gäster
  if (input.guests > property.max_guests) {
    return c.json(
      {
        error: `This property allows a maximum of ${property.max_guests} guests`,
      },
      400
    );
  }

  // 3. Kontrollera om datumen redan är bokade
  const hasOverlap = await getOverlappingBooking(
    supabase,
    input.property_id,
    input.check_in,
    input.check_out
  );

  if (hasOverlap) {
    return c.json(
      { error: "Property is already booked for these dates" },
      409
    );
  }

  // 4. Skapa bokningen
  const booking = await createBooking(
    supabase,
    {
      ...input,
      user_id: user.id,
      status: "pending",
    }
  );

  return c.json(booking, 201);
});

// PATCH /bookings/:id
bookingRoutes.patch("/:id", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const bookingId = c.req.param("id");

  if (!uuidSchema.safeParse(bookingId).success) {
    return c.json(
      { error: "Invalid booking ID" },
      400
    );
  }

  const supabase = c.get("supabase");

  // 1. Hämta bokningen
  const existingBooking = await getBookingById(
    supabase,
    bookingId
  );

  if (!existingBooking) {
    return c.json(
      { error: "Booking not found" },
      404
    );
  }

  // 2. Hämta boendet som bokningen gäller
  const property = await getPropertyById(
    supabase,
    existingBooking.property_id
  );

  if (!property) {
    return c.json(
      { error: "Property not found" },
      404
    );
  }

  // 3. Identifiera användarens roll
  const isGuest = existingBooking.user_id === user.id;
  const isHost = property.user_id === user.id;

  if (!isGuest && !isHost) {
    return c.json(
      { error: "You are not allowed to update this booking" },
      403
    );
  }

  // 4. Validera inkommande data
  const body = await c.req.json();
  const parsed = updateBookingSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { error: parsed.error.flatten() },
      400
    );
  }

  const updates = parsed.data;

  if (existingBooking.status === "cancelled") {
    return c.json(
      { error: "This booking has already been cancelled" },
      400
    );
  }

// 5. Kontrollera vad användaren får ändra
if (isGuest && updates.status !== undefined) {
  const onlyCancel =
    Object.keys(updates).length === 1 &&
    updates.status === "cancelled";

  if (!onlyCancel) {
    return c.json(
      { error: "Guests can only cancel their own bookings" },
      403
    );
  }
} else if (isHost && !isGuest) {
  const onlyStatus =
    Object.keys(updates).length === 1 &&
    updates.status !== undefined;

  if (!onlyStatus) {
    return c.json(
      { error: "Hosts can only update booking status" },
      403
    );
  }
}

  // 7. Kontrollera kapacitet vid ändring av antal gäster
  const guests = updates.guests ?? existingBooking.guests;

  if (guests > property.max_guests) {
    return c.json(
      {
        error: `This property allows a maximum of ${property.max_guests} guests`,
      },
      400
    );
  }

  // 8. Kontrollera att de nya datumen är giltiga
  const checkIn = updates.check_in ?? existingBooking.check_in;
  const checkOut = updates.check_out ?? existingBooking.check_out;

  if (checkOut <= checkIn) {
    return c.json(
      { error: "Check-out must be after check-in" },
      400
    );
  }

  // 9. Kontrollera att de nya datumen inte krockar
  const hasOverlap = await getOverlappingBooking(
    supabase,
    existingBooking.property_id,
    checkIn,
    checkOut,
    bookingId
  );

  if (hasOverlap) {
    return c.json(
      { error: "Property is already booked for these dates" },
      409
    );
  }

  // 10. Uppdatera bokningen
  const booking = await updateBooking(
    supabase,
    bookingId,
    updates
  );

  if (!booking) {
    return c.json(
      { error: "Booking not found" },
      404
    );
  }

  return c.json(booking);
});

// DELETE /bookings/:id
bookingRoutes.delete("/:id", async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const bookingId = c.req.param("id");

  if (!uuidSchema.safeParse(bookingId).success) {
    return c.json(
      { error: "Invalid booking ID" },
      400
    );
  }

  const supabase = c.get("supabase");

  const booking = await getBookingById(
    supabase,
    bookingId
  );

  if (!booking) {
    return c.json(
      { error: "Booking not found" },
      404
    );
  }

  const property = await getPropertyById(
    supabase,
    booking.property_id
  );

  if (!property) {
    return c.json(
      { error: "Property not found" },
      404
    );
  }

  const isGuest = booking.user_id === user.id;
  const isHost = property.user_id === user.id;

  if (!isGuest && !isHost) {
    return c.json(
      { error: "You are not allowed to delete this booking" },
      403
    );
  }

  const deletedBooking = await deleteBooking(
    supabase,
    bookingId
  );

  if (!deletedBooking) {
    return c.json(
      { error: "Booking not found" },
      404
    );
  }

  return c.json({
    message: "Booking deleted",
    booking_id: deletedBooking.booking_id,
  });
});

export default bookingRoutes;
