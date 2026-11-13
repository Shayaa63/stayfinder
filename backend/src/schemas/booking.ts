import { z } from "zod";

const dateSchema = z.string().date();

export const createBookingSchema = z.object({
  property_id: z.string().uuid(),

  guest_name: z.string().trim().min(2).max(100),

  guest_email: z.string().email().max(254),

  check_in: dateSchema,

  check_out: dateSchema,

  guests: z.number().int().min(1).max(30)
}).strict().refine(
  (data) => data.check_out > data.check_in,
  {
    message: "Check-out must be after check-in",
    path: ["check_out"]
  }
);

export const updateBookingSchema = z.object({
  guest_name: z.string().trim().min(2).max(100).optional(),

  guest_email: z.string().email().max(254).optional(),

  check_in: dateSchema.optional(),

  check_out: dateSchema.optional(),

  guests: z.number().int().min(1).max(30).optional()
}).strict();

export const bookingStatusSchema = z.enum([
  "pending",
  "confirmed",
  "cancelled"
]);

export const bookingIdSchema = z.object({
  id: z.string().uuid()
});

export type CreateBookingBody =
  z.infer<typeof createBookingSchema>;

export type UpdateBookingBody =
  z.infer<typeof updateBookingSchema>;