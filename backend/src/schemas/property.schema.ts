import { z } from "zod";

export const propertySchema = z.object({
  title: z.string().trim().min(5).max(100),
  description: z.string().trim().min(20).max(3000),
  city: z.string().trim().min(2).max(100),
  country: z.string().trim().min(2).max(100),
  address: z.string().trim().min(3).max(200),
  price_per_night: z.number().positive().max(100000),
  max_guests: z.number().int().min(1).max(50),
  images: z.array(z.string().url()).max(10).default([]),
  is_published: z.boolean().default(false),
});

export const updatePropertySchema = propertySchema.partial();


export const propertyQuerySchema = z.object({
  city: z.string().optional(),
  guests: z.coerce.number().int().positive().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  sort: z.enum(["price_asc", "price_desc"]).default("price_asc"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});
