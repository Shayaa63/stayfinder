import type { AppSupabaseClient } from "../types/app.js";
import type { TablesInsert, TablesUpdate  } from "../types/database.types.js";

type UpdateBookingInput = Pick<
  TablesUpdate<"bookings">,
  | "guest_name"
  | "guest_email"
  | "check_in"
  | "check_out"
  | "guests"
  | "status"
>;

export async function getBookings(
  supabase: AppSupabaseClient,
  filters: {
    from?: string;
    to?: string;
    limit: number;
    offset: number;
  }
) {
  let query = supabase
    .from("bookings")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters.from) {
    query = query.gte("check_in", filters.from);
  }

  if (filters.to) {
    query = query.lte("check_out", filters.to);
  }

  const { data, error, count } = await query.range(
    filters.offset,
    filters.offset + filters.limit - 1
  );

  if (error) throw error;

  return {
    bookings: data ?? [],
    total: count ?? 0
  };
}

export async function getBookingById(
  supabase: AppSupabaseClient,
  id: string
) {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("booking_id", id)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function createBooking(
  supabase: AppSupabaseClient,
  input: Omit<
    TablesInsert<"bookings">,
    "booking_id" | "created_at"
  >
) {
  const { data, error } = await supabase
    .from("bookings")
    .insert(input)
    .select()
    .single();

  if (error) throw error;

  return data;
}

export async function updateBooking(
  supabase: AppSupabaseClient,
  id: string,
  input: UpdateBookingInput
) {
  const { data, error } = await supabase
    .from("bookings")
    .update(input)
    .eq("booking_id", id)
    .select()
    .maybeSingle();

  if (error) throw error;

  return data;
}



export async function getOverlappingBooking(
  supabase: AppSupabaseClient,
  propertyId: string,
  checkIn: string,
  checkOut: string,
  excludeBookingId?: string
) {
  let query = supabase
    .from("bookings")
    .select("booking_id")
    .eq("property_id", propertyId)
    .neq("status", "cancelled")
    .lt("check_in", checkOut)
    .gt("check_out", checkIn);

  if (excludeBookingId) {
    query = query.neq(
      "booking_id",
      excludeBookingId
    );
  }

  const { data, error } = await query.limit(1);

  if (error) {
    throw error;
  }

  return data.length > 0;
}