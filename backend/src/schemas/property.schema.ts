import { z } from "zod";

// Bas utan defaults. Zod 4 tillämpar defaults även inuti .partial(), så om
// updatePropertySchema byggdes av ett schema med .default() skulle varje
// PATCH återställa images till [] och is_published till false.
const propertyBaseSchema = z.object({
  title: z.string().trim().min(5).max(100),
  description: z.string().trim().min(20).max(3000),
  city: z.string().trim().min(2).max(100),
  country: z.string().trim().min(2).max(100),
  address: z.string().trim().min(3).max(200),
  price_per_night: z.number().positive().max(100000),
  max_guests: z.number().int().min(1).max(30),
  images: z.array(z.string().url()).max(10),
  is_published: z.boolean(),
});

// Skapa: images och is_published får defaults om de saknas.
export const propertySchema = propertyBaseSchema.extend({
  images: propertyBaseSchema.shape.images.default([]),
  is_published: propertyBaseSchema.shape.is_published.default(false),
});

// Uppdatera: bara de fält som skickas med ändras.
export const updatePropertySchema = propertyBaseSchema
  .partial()
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Minst ett fält måste anges."
  );

export const propertyQuerySchema = z.object({
  city: z.string().optional(),
  guests: z.coerce.number().int().positive().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  sort: z.enum(["price_asc", "price_desc"]).default("price_asc"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});