"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Booking } from "@/types";

export default function BookingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState("");

  async function loadBookings() {
    try {
      const result = await api<{
  bookings: Booking[];
  total: number;
}>("/bookings");

setBookings(result.bookings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load bookings");
    }
  }

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    void loadBookings();
  }, [user, loading, router]);

  async function cancelBooking(id: string) {
    try {
      await api(`/bookings/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "cancelled" }),
      });

      await loadBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel booking");
    }
  }

  if (loading || !user) {
    return <p className="p-8">Loading...</p>;
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold">My bookings</h1>

      {error && <p className="mt-4 text-red-700">{error}</p>}

      <div className="mt-8 space-y-4">
        {bookings.map((booking) => (
          <article key={booking.booking_id} className="rounded-xl border bg-white p-5">
            <p className="font-semibold">
              {booking.check_in} – {booking.check_out}
            </p>

            <p className="mt-2 text-sm text-stone-600">
              Guests: {booking.guests}
            </p>

            <p className="mt-2 text-sm">
              Status: {booking.status}
            </p>

            {booking.status !== "cancelled" && (
              <button
                onClick={() => void cancelBooking(booking.booking_id)}
                className="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700"
              >
                Cancel booking
              </button>
            )}
          </article>
        ))}

        {bookings.length === 0 && (
          <p className="text-stone-600">No bookings found.</p>
        )}
      </div>
    </main>
  );
}