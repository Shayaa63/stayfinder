import { z } from "zod";

import { Hono } from "hono";
import type { AppEnv } from "../types/app.js";

import {
  optionalAuth,
  requireAuth,
} from "../middleware/auth.js";

import {
  propertySchema,
  updatePropertySchema,
  propertyQuerySchema,
} from "../schemas/property.schema.js";

import {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getMyProperties,
  hasBookingsForProperty,
} from "../database/property.js";

const propertyRoutes = new Hono<AppEnv>();
const uuidSchema = z.string().uuid();
// GET /properties
// Publika annonser, med möjlighet att vara inloggad.
propertyRoutes.get("/", optionalAuth, async (c) => {
  const parsed = propertyQuerySchema.safeParse(
    c.req.query()
  );

  if (!parsed.success) {
    return c.json(
      { error: parsed.error.flatten() },
      400
    );
  }

 const { page, limit, ...filters } = parsed.data;

const result = await getProperties(
  c.get("supabase"),
  {
    ...filters,
    limit,
    offset: (page - 1) * limit,
  }
);

  return c.json(result);
});

propertyRoutes.get("/mine", requireAuth, async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json(
      { error: "Unauthorized" },
      401
    );
  }

  const properties = await getMyProperties(
    c.get("supabase"),
    user.id
  );

  return c.json(properties);
});

// GET /properties/:id
propertyRoutes.get("/:id", optionalAuth, async (c) => {
    const id = c.req.param("id");

  if (!uuidSchema.safeParse(id).success) {
    return c.json(
      { error: "Invalid property ID" },
      400
    );
  }

  const property = await getPropertyById(
    c.get("supabase"),
    id
  );

  if (!property) {
    return c.json(
      { error: "Property not found" },
      404
    );
  }

  return c.json(property);
});

// POST /properties
propertyRoutes.post("/", requireAuth, async (c) => {
  const body = await c.req.json();
  const parsed = propertySchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { error: parsed.error.flatten() },
      400
    );
  }

  const user = c.get("user");

  if (!user) {
    return c.json(
      { error: "Unauthorized" },
      401
    );
  }

  const property = await createProperty(
    c.get("supabase"),
    {
      ...parsed.data,
      user_id: user.id,
    }
  );

  return c.json(property, 201);
});

// PATCH /properties/:id
propertyRoutes.patch("/:id", requireAuth, async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const propertyId = c.req.param("id");
  if (!uuidSchema.safeParse(propertyId).success) {
  return c.json(
    { error: "Invalid property ID" },
    400
  );
}

  // Hämta boendet som ska uppdateras
  const existingProperty = await getPropertyById(
    c.get("supabase"),
    propertyId
  );

  if (!existingProperty) {
    return c.json(
      { error: "Property not found" },
      404
    );
  }

  // Kontrollera att inloggad användare äger boendet
  if (existingProperty.user_id !== user.id) {
    return c.json(
      { error: "You are not allowed to update this property" },
      403
    );
  }

  const body = await c.req.json();
  const parsed = updatePropertySchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      { error: parsed.error.flatten() },
      400
    );
  }

  const property = await updateProperty(
    c.get("supabase"),
    propertyId,
    parsed.data
  );

  if (!property) {
    return c.json(
      { error: "Property not found" },
      404
    );
  }

  return c.json(property);
});

// DELETE /properties/:id
propertyRoutes.delete("/:id", requireAuth, async (c) => {
  const user = c.get("user");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const propertyId = c.req.param("id");
  if (!uuidSchema.safeParse(propertyId).success) {
  return c.json(
    { error: "Invalid property ID" },
    400
  );
}

  const existingProperty = await getPropertyById(
    c.get("supabase"),
    propertyId
  );

  if (!existingProperty) {
    return c.json(
      { error: "Property not found" },
      404
    );
  }

  if (existingProperty.user_id !== user.id) {
    return c.json(
      { error: "You are not allowed to delete this property" },
      403
    );
  }

  const hasBookings = await hasBookingsForProperty(
  c.get("supabase"),
  propertyId
);

if (hasBookings) {
  return c.json(
    {
      error: "This property cannot be deleted because it has existing bookings.",
    },
    409
  );
}

  const deletedProperty = await deleteProperty(
    c.get("supabase"),
    propertyId
  );

  if (!deletedProperty) {
    return c.json(
      { error: "Property not found" },
      404
    );
  }

  return c.json({
    message: "Property deleted",
    property_id: deletedProperty.property_id,
  });
});

export default propertyRoutes;
