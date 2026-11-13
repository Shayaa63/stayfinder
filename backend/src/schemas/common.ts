import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const dateSchema = z.string().date();

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

export const dateRangeSchema = z.object({
  from: dateSchema.optional(),
  to: dateSchema.optional()
}).refine(
  (data) => {
    if (data.from && data.to) {
      return data.to >= data.from;
    }

    return true;
  },
  {
    message: "The end date must not be before the start date"
  }
);