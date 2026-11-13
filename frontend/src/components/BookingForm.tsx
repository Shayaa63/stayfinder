"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Property } from "@/types";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type BookingErrors = {
  guest_name?: string;
  guest_email?: string;
  check_in?: string;
  check_out?: string;
  guests?: string;
};

export default function BookingForm({ property }: { property: Property }) {
  const router = useRouter();
  const { user } = useAuth();

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState(user?.email ?? "");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);

  const [errors, setErrors] = useState<BookingErrors>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const nights =
    checkIn && checkOut && checkOut > checkIn
      ? (Date.UTC(
          Number(checkOut.split("-")[0]),
          Number(checkOut.split("-")[1]) - 1,
          Number(checkOut.split("-")[2]),
        ) -
          Date.UTC(
            Number(checkIn.split("-")[0]),
            Number(checkIn.split("-")[1]) - 1,
            Number(checkIn.split("-")[2]),
          )) /
        (1000 * 60 * 60 * 24)
      : 0;

  const totalPrice = nights * property.price_per_night;

  const priceFormatter = new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    maximumFractionDigits: 0,
  });

  function validateForm() {
    const newErrors: BookingErrors = {};

    if (guestName.trim().length < 2) {
      newErrors.guest_name = "Namnet måste innehålla minst 2 tecken.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim())) {
      newErrors.guest_email = "Ange en giltig e-postadress.";
    }

    if (!checkIn) {
      newErrors.check_in = "Välj ett incheckningsdatum.";
    }

    if (!checkOut) {
      newErrors.check_out = "Välj ett utcheckningsdatum.";
    } else if (checkIn && checkOut <= checkIn) {
      newErrors.check_out =
        "Utcheckningsdatum måste vara efter incheckningsdatum.";
    }

    if (!Number.isInteger(guests) || guests < 1) {
      newErrors.guests = "Ange minst 1 gäst.";
    } else if (guests > property.max_guests) {
      newErrors.guests = `Boendet tillåter högst ${property.max_guests} gäster.`;
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setError("");
    setSuccess(false);

    if (!user) {
      router.push("/login");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      await api("/bookings", {
        method: "POST",
        body: JSON.stringify({
          property_id: property.property_id,
          guest_name: guestName.trim(),
          guest_email: guestEmail.trim(),
          check_in: checkIn,
          check_out: checkOut,
          guests,
        }),
      });

      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Bokningen kunde inte genomföras.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border bg-white p-6"
    >
      <h2 className="text-xl font-semibold">Request a booking</h2>

      <label className="block text-sm">
        Your name
        <input
          required
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="Your name"
          className="mt-1 w-full rounded-lg border p-3"
        />
        {errors.guest_name && (
          <p className="mt-1 text-sm text-red-700">{errors.guest_name}</p>
        )}
      </label>

      <label className="block text-sm">
        Email
        <input
          required
          type="email"
          value={guestEmail}
          onChange={(e) => setGuestEmail(e.target.value)}
          placeholder="Email"
          className="mt-1 w-full rounded-lg border p-3"
        />
        {errors.guest_email && (
          <p className="mt-1 text-sm text-red-700">{errors.guest_email}</p>
        )}
      </label>

      <label className="block text-sm">
        Check-in
        <input
          required
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          className="mt-1 w-full rounded-lg border p-3"
        />
        {errors.check_in && (
          <p className="mt-1 text-sm text-red-700">{errors.check_in}</p>
        )}
      </label>

      <label className="block text-sm">
        Check-out
        <input
          required
          type="date"
          min={checkIn || undefined}
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          className="mt-1 w-full rounded-lg border p-3"
        />
        {errors.check_out && (
          <p className="mt-1 text-sm text-red-700">{errors.check_out}</p>
        )}
      </label>

      <label className="block text-sm">
        Guests
        <input
          required
          type="number"
          min={1}
          max={property.max_guests}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className="mt-1 w-full rounded-lg border p-3"
        />
        {errors.guests && (
          <p className="mt-1 text-sm text-red-700">{errors.guests}</p>
        )}
      </label>
      <div className="rounded-xl border bg-stone-50 p-4 space-y-3">
        <h3 className="font-semibold text-lg">Price summary</h3>

        {nights > 0 ? (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Price per night</span>
              <span>{priceFormatter.format(property.price_per_night)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Number of nights</span>
              <span>{nights}</span>
            </div>

            <div className="border-t pt-3 flex justify-between font-semibold">
              <span>Total price</span>
              <span className="text-lg">
                {priceFormatter.format(totalPrice)}
              </span>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-600">
            Select valid check-in and check-out dates to see the total price.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-stone-900 p-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Request booking"}
      </button>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      {success && (
        <p role="status" className="text-sm text-green-700">
          Booking request submitted.
        </p>
      )}
    </form>
  );
}
