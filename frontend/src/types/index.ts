export type User = {
  id: string;
  email?: string;
};

export type Property = {
  property_id: string;
  user_id: string;
  title: string;
  description: string;
  city: string;
  country: string;
  address: string;
  price_per_night: number;
  max_guests: number;
  images: string[];
  is_published: boolean;
  created_at: string;
};

export type Booking = {
  booking_id: string;
  property_id: string;
  user_id: string;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  guests: number;
  status: "pending" | "confirmed" | "cancelled";
  created_at: string;
};