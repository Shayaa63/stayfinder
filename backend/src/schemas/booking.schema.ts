
import { z } from "zod";

const dateSchema = z.string().date({
  message: "Ange ett giltigt datum",
});

export const createBookingSchema = z.object({
  property_id: z.string().uuid({
    message: "Ogiltigt boende",
  }),

  guest_name: z.string()
    .trim()
    .min(2, "Namnet måste innehålla minst 2 tecken")
    .max(100, "Namnet får innehålla högst 100 tecken"),

  guest_email: z.string()
    .trim()
    .email("Ange en giltig e-postadress"),

  check_in: dateSchema,

  check_out: dateSchema,

  guests: z.number({
    message: "Ange antal gäster",
  })
    .int("Antalet gäster måste vara ett heltal")
    .min(1, "Du måste ange minst 1 gäst")
    .max(30, "Det går inte att boka för fler än 30 gäster"),
}).refine(
  (data) => data.check_out > data.check_in,
  {
    message: "Utcheckningsdatum måste vara efter incheckningsdatum",
    path: ["check_out"],
  },
);

export const updateBookingSchema = z.object({
  status: z.enum(["confirmed", "cancelled"]).optional(),

  check_in: dateSchema.optional(),

  check_out: dateSchema.optional(),

  guests: z.number()
    .int("Antalet gäster måste vara ett heltal")
    .min(1, "Du måste ange minst 1 gäst")
    .max(30, "Det går inte att boka för fler än 30 gäster")
    .optional(),
}).refine(
  (data) =>
    !data.check_in ||
    !data.check_out ||
    data.check_out > data.check_in,
  {
    message: "Utcheckningsdatum måste vara efter incheckningsdatum",
    path: ["check_out"],
  },
).strict();
