import type { AppSupabaseClient } from "../types/app.js";
import type { TablesInsert, TablesUpdate } from "../types/database.types.js";

type UpdatePropertyInput = Pick<
  TablesUpdate<"properties">,
  | "title"
  | "description"
  | "city"
  | "country"
  | "address"
  | "price_per_night"
  | "max_guests"
  | "images"
  | "is_published"
>;
export async function getProperties(
  supabase: AppSupabaseClient,
filters: {
  city?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  sort: "price_asc" | "price_desc";
  limit: number;
  offset: number;
}
) {
  let query = supabase
    .from("properties")
    .select("*", { count: "exact" })
    .eq("is_published", true);

  if (filters.city) {
    query = query.ilike("city", `%${filters.city}%`);
  }

  if (filters.guests) {
    query = query.gte("max_guests", filters.guests);
  }

  if (filters.minPrice !== undefined) {
    query = query.gte(
      "price_per_night",
      filters.minPrice
    );
  }

  if (filters.maxPrice !== undefined) {
    query = query.lte(
      "price_per_night",
      filters.maxPrice
    );
  }

const { data, error, count } = await query
  .order("price_per_night", {
    ascending: filters.sort === "price_asc",
  })
  .range(
    filters.offset,
    filters.offset + filters.limit - 1
  );

  if (error) throw error;

  return {
    properties: data ?? [],
    total: count ?? 0
  };
}

export async function getPropertyById(
  supabase: AppSupabaseClient,
  id: string
) {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("property_id", id)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function createProperty(
  supabase: AppSupabaseClient,
  input: Omit<
    TablesInsert<"properties">,
    "property_id" | "created_at" | "updated_at"
  >
) {
  const { data, error } = await supabase
    .from("properties")
    .insert(input)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateProperty(
  supabase: AppSupabaseClient,
  id: string,
  input: UpdatePropertyInput
) {
  const { data, error } = await supabase
    .from("properties")
    .update(input)
    .eq("property_id", id)
    .select()
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function deleteProperty(
  supabase: AppSupabaseClient,
  id: string
) {
  const { data, error } = await supabase
    .from("properties")
    .delete()
    .eq("property_id", id)
    .select("property_id")
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function getMyProperties(
  supabase: AppSupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data ?? [];
}

export async function hasBookingsForProperty(
  supabase: AppSupabaseClient,
  propertyId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("bookings")
    .select("booking_id")
    .eq("property_id", propertyId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return data !== null;
}