import { z } from "zod";

export const createPropertySchema = z.object({
  title: z.string().trim().min(5).max(100),

  description: z.string().trim().min(20).max(3000),

  city: z.string().trim().min(2).max(100),

  country: z.string().trim().min(2).max(100),

  address: z.string().trim().min(3).max(200),

  price_per_night: z.number().positive().max(1000000),

  max_guests: z.number().int().min(1).max(30),

  images: z.array(z.string().url()).max(10).default([]),

  is_published: z.boolean().default(true)
}).strict();

export const updatePropertySchema =
  createPropertySchema.partial().strict();

export const propertyIdSchema = z.object({
  id: z.string().uuid()
});

export type CreatePropertyBody =
  z.infer<typeof createPropertySchema>;

export type UpdatePropertyBody =
  z.infer<typeof updatePropertySchema>;