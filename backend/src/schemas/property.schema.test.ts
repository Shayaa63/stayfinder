import { describe, expect, it } from "vitest";
import { propertySchema } from "./property.schema.js";

describe("propertySchema", () => {
  it("accepts valid property data", () => {
    const result = propertySchema.safeParse({
      title: "Cozy apartment",
      description: "A lovely apartment close to the city.",
      city: "Stockholm",
      country: "Sweden",
      address: "Example Street 1",
      price_per_night: 1200,
      max_guests: 4,
      images: [],
      is_published: true,
    });

    expect(result.success).toBe(true);
  });

  it("rejects a negative price", () => {
    const result = propertySchema.safeParse({
      title: "Cozy apartment",
      description: "A lovely apartment close to the city.",
      city: "Stockholm",
      country: "Sweden",
      address: "Example Street 1",
      price_per_night: -100,
      max_guests: 4,
      images: [],
      is_published: true,
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid guest limit", () => {
    const result = propertySchema.safeParse({
      title: "Cozy apartment",
      description: "A lovely apartment close to the city.",
      city: "Stockholm",
      country: "Sweden",
      address: "Example Street 1",
      price_per_night: 1200,
      max_guests: 0,
      images: [],
      is_published: true,
    });

    expect(result.success).toBe(false);
  });
});