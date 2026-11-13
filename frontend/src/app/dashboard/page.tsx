
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Property, Booking } from "@/types";

type DashboardData = {
  properties: Property[];
  bookings: Booking[];
};

type BookingsResponse = {
  bookings: Booking[];
  total: number;
};

function StatusBadge({ status }: { status: Booking["status"] }) {
  const styles = {
    pending: "bg-amber-50 text-amber-800 ring-amber-200",
    confirmed: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    cancelled: "bg-stone-100 text-stone-500 ring-stone-200",
  };

const labels = {
  pending: "Väntar på svar",
  confirmed: "Bekräftad",
  cancelled: "Avbokad",
};

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status]}`}
    >
      <span className="mr-2 h-1.5 w-1.5 rounded-full bg-current" />
      {labels[status]}
    </span>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  count,
}: {
  eyebrow: string;
  title: string;
  description: string;
  count: number;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#98745d]">
          {eyebrow}
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#302b26]">
          {title}
        </h2>
        <p className="mt-1 text-sm text-[#82796f]">{description}</p>
      </div>

      <span className="rounded-full bg-[#f0ebe3] px-3 py-1.5 text-sm font-medium text-[#685b4d]">
        {count} {count === 1 ? "objekt" : "objekt"}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [data, setData] = useState<DashboardData>({
    properties: [],
    bookings: [],
  });

  const [error, setError] = useState("");
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(
    null,
  );
  const [deletingBookingId, setDeletingBookingId] = useState<string | null>(
    null,
  );
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [editCheckIn, setEditCheckIn] = useState("");
  const [editCheckOut, setEditCheckOut] = useState("");
  const [editGuests, setEditGuests] = useState(1);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [bookingPropertyTitles, setBookingPropertyTitles] = useState<
    Record<string, string>
  >({});

  const userId = user?.id;

  useEffect(() => {
    if (loading) return;

    if (!userId) {
      router.push("/login");
      return;
    }

    async function loadDashboard() {
      try {
        setError("");

        const [properties, bookingsResponse] = await Promise.all([
          api<Property[]>("/properties/mine"),
          api<BookingsResponse>("/bookings?limit=100"),
        ]);

        const propertyIds = [
          ...new Set(
            bookingsResponse.bookings.map((booking) => booking.property_id),
          ),
        ];

        const ownedPropertyIds = new Set(
          properties.map((property) => property.property_id),
        );

        const missingPropertyIds = propertyIds.filter(
          (id) => !ownedPropertyIds.has(id),
        );

        const titleEntries = await Promise.all(
          missingPropertyIds.map(async (id) => {
            try {
              const property = await api<Property>(`/properties/${id}`);
              return [id, property.title] as const;
            } catch {
              return [id, "Boendets titel kunde inte hämtas"] as const;
            }
          }),
        );

        setBookingPropertyTitles(Object.fromEntries(titleEntries));

        setData({
          properties,
          bookings: bookingsResponse.bookings,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Kunde inte ladda översikten",
        );
      } finally {
        setDashboardLoading(false);
      }
    }

    void loadDashboard();
  }, [userId, loading, router]);

  async function updateBookingStatus(
    bookingId: string,
    status: "confirmed" | "cancelled",
  ) {
    try {
      setError("");
      setUpdatingBookingId(bookingId);

      await api(`/bookings/${bookingId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      setData((current) => ({
        ...current,
        bookings: current.bookings.map((booking) =>
          booking.booking_id === bookingId ? { ...booking, status } : booking,
        ),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte uppdatera bokningen");
    } finally {
      setUpdatingBookingId(null);
    }
  }

  async function deleteBooking(bookingId: string) {
    const confirmed = window.confirm(
      "Är du säker på att du vill ta bort den här bokningen?",
    );

    if (!confirmed) return;

    try {
      setError("");
      setDeletingBookingId(bookingId);

      await api(`/bookings/${bookingId}`, {
        method: "DELETE",
      });

      setData((current) => ({
        ...current,
        bookings: current.bookings.filter(
          (booking) => booking.booking_id !== bookingId,
        ),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte ta bort bokningen");
    } finally {
      setDeletingBookingId(null);
    }
  }

  async function editBooking(bookingId: string) {
    try {
      setError("");

      if (!editCheckIn || !editCheckOut) {
        setError("Välj både inchecknings- och utcheckningsdatum.");
        return;
      }

      if (editCheckOut <= editCheckIn) {
        setError("Utcheckningsdatumet måste vara efter incheckningsdatumet.");
        return;
      }

      if (!Number.isInteger(editGuests) || editGuests < 1 || editGuests > 50) {
        setError("Antalet gäster måste vara mellan 1 och 50.");
        return;
      }

      setUpdatingBookingId(bookingId);

      await api(`/bookings/${bookingId}`, {
        method: "PATCH",
        body: JSON.stringify({
          check_in: editCheckIn,
          check_out: editCheckOut,
          guests: editGuests,
        }),
      });

      setData((current) => ({
        ...current,
        bookings: current.bookings.map((booking) =>
          booking.booking_id === bookingId
            ? {
                ...booking,
                check_in: editCheckIn,
                check_out: editCheckOut,
                guests: editGuests,
              }
            : booking,
        ),
      }));

      setEditingBookingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte uppdatera bokningen");
    } finally {
      setUpdatingBookingId(null);
    }
  }

  if (loading || dashboardLoading || !user) {
    return (
      <main className="min-h-screen bg-[#faf8f4] px-6 py-20">
        <div className="mx-auto max-w-6xl animate-pulse space-y-6">
          <div className="h-48 rounded-3xl bg-[#eee8df]" />
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="h-28 rounded-2xl bg-[#eee8df]" />
            <div className="h-28 rounded-2xl bg-[#eee8df]" />
            <div className="h-28 rounded-2xl bg-[#eee8df]" />
          </div>
          <div className="h-64 rounded-3xl bg-[#eee8df]" />
        </div>
      </main>
    );
  }

  const ownedPropertyIds = new Set(
    data.properties.map((property) => property.property_id),
  );

  const myBookings = data.bookings.filter(
    (booking) => booking.user_id === user.id,
  );

  const bookingRequests = data.bookings.filter(
    (booking) =>
      ownedPropertyIds.has(booking.property_id) && booking.user_id !== user.id,
  );

  const propertyTitles = new Map(
    data.properties.map((property) => [property.property_id, property.title]),
  );

  const pendingCount = bookingRequests.filter(
    (booking) => booking.status === "pending",
  ).length;

  const money = (price: number) =>
    new Intl.NumberFormat("sv-SE").format(price);

  return (
    <main className="min-h-screen bg-[#faf8f4] text-[#302b26]">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">

        {/* Welcome section */}
        <section className="relative overflow-hidden rounded-4xl bg-[#eae3d8] px-7 py-10 sm:px-12 sm:py-14">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-[#d5c6b4] sm:h-96 sm:w-96" />
          <div className="pointer-events-none absolute -right-5 -top-12 h-60 w-60 rounded-full border border-[#d5c6b4] sm:h-80 sm:w-80" />

          <div className="relative z-10 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#92755c]">
              STAYFINDER · DIN PLATS
            </p>

            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-[#342e28] sm:text-5xl">
              Välkommen tillbaka
              <br />
              <span className="font-normal italic text-[#92755c]">
                Känn dig som hemma.
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-sm leading-7 text-[#74695d] sm:text-base">
              Hantera dina bokningar, välkomna dina gäster och håll allt samlat på ett ställe.
            </p>

            <Link
              href="/properties"
              className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#342e28] px-6 py-3.5 text-sm font-medium text-white transition hover:bg-[#514438]"
            >
              Utforska boenden
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </section>

        {/* Statistics */}
        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#eae4db] bg-white p-6">
            <p className="text-sm text-[#8b8176]">Boenden du hyr ut</p>
            <div className="mt-3 flex items-end justify-between">
              <p className="text-4xl font-semibold tracking-tight">
                {data.properties.length}
              </p>
              <span className="text-2xl text-[#b19a7d]" aria-hidden="true">
                ⌂
              </span>
            </div>
            <p className="mt-2 text-xs text-[#9b9186]">Places you host</p>
          </div>

          <div className="rounded-2xl border border-[#eae4db] bg-white p-6">
            <p className="text-sm text-[#8b8176]">Bokningsförfrågningar</p>
            <div className="mt-3 flex items-end justify-between">
              <p className="text-4xl font-semibold tracking-tight">
                {bookingRequests.length}
              </p>
              <span className="text-2xl text-[#b19a7d]" aria-hidden="true">
                ♧
              </span>
            </div>
            <p className="mt-2 text-xs text-[#9b9186]">
              {pendingCount} väntar på ditt svar
            </p>
          </div>

          <div className="rounded-2xl border border-[#eae4db] bg-white p-6">
            <p className="text-sm text-[#8b8176]">Mina bokningar</p>
            <div className="mt-3 flex items-end justify-between">
              <p className="text-4xl font-semibold tracking-tight">
                {myBookings.length}
              </p>
              <span className="text-2xl text-[#b19a7d]" aria-hidden="true">
                ◷
              </span>
            </div>
            <p className="mt-2 text-xs text-[#9b9186]">Dina kommande vistelser</p>
          </div>
        </section>

        {/* Error message */}
        {error && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            <span aria-hidden="true">!</span>
            <p>{error}</p>
          </div>
        )}

        {/* Properties */}
        <section className="mt-16">
          <SectionHeading
            eyebrow="DINA BOENDEN"
            title="Boenden du hyr ut"
            description="The places you share with the world."
            count={data.properties.length}
          />

          {data.properties.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#d9d0c5] bg-white px-6 py-12 text-center">
              <p className="text-lg font-medium">Ditt första boende börjar här.</p>
              <p className="mt-2 text-sm text-[#8b8176]">
                Du har inte lagt till något boende ännu.
              </p>
              <Link
                href="/properties/new"
                className="mt-5 inline-flex rounded-full bg-[#342e28] px-5 py-3 text-sm text-white transition hover:bg-[#514438]"
              >
                Lägg till boende
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.properties.map((property) => (
                <article
                  key={property.property_id}
                  className="group overflow-hidden rounded-3xl border border-[#eae4db] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#514438]/5"
                >
                  <Link href={`/properties/${property.property_id}`}>
                    <div className="relative h-48 overflow-hidden bg-[#eae3d8]">
                      {property.images?.[0] ? (
                        <img
                          src={property.images[0]}
                          alt={property.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <span className="text-sm tracking-widest text-[#92755c]">
                            STAYFINDER
                          </span>
                        </div>
                      )}

                      <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-[#514438] backdrop-blur">
                        Ditt boende
                      </span>
                    </div>

                    <div className="p-5">
                      <h3 className="line-clamp-1 text-lg font-semibold text-[#342e28] transition group-hover:text-[#92755c]">
                        {property.title}
                      </h3>

                      <p className="mt-2 text-sm text-[#8b8176]">
                        {property.city}, {property.country}
                      </p>

                      <div className="mt-5 flex items-center justify-between border-t border-[#f0ebe4] pt-4">
                        <p className="text-sm text-[#8b8176]">
                          <strong className="text-base text-[#342e28]">
                            {money(property.price_per_night)} kr
                          </strong>{" "}
                          / natt
                        </p>
                        <span className="text-lg text-[#92755c]">↗</span>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Bokningsförfrågningar */}
        <section className="mt-16">
          <SectionHeading
            eyebrow="UTHYRNING"
            title="Bokningsförfrågningar"
            description="Bokningar som andra gäster har gjort på dina boenden."
            count={bookingRequests.length}
          />

          {bookingRequests.length === 0 ? (
            <div className="rounded-3xl border border-[#eae4db] bg-white px-6 py-10 text-center">
              <p className="text-lg font-medium">Inga förfrågningar ännu.</p>
              <p className="mt-2 text-sm text-[#8b8176]">
                Nya bokningsförfrågningar för dina boenden visas här.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {bookingRequests.map((booking) => (
                <article
                  key={booking.booking_id}
                  className="rounded-3xl border border-[#eae4db] bg-white p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#92755c]">
                        GÄSTBOKNING
                      </p>
                      <h3 className="mt-2 text-lg font-semibold">
                        {propertyTitles.get(booking.property_id) ?? "Ditt boende"}
                      </h3>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>

                  <div className="mt-5 rounded-2xl bg-[#faf8f4] p-4">
                    <p className="font-medium">{booking.guest_name}</p>
                    <p className="mt-1 text-sm text-[#8b8176]">
                      {booking.guest_email}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-4 border-t border-[#eae4db] pt-4">
                      <div>
                        <p className="text-xs text-[#9b9186]">Incheckning</p>
                        <p className="mt-1 text-sm font-medium">{booking.check_in}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#9b9186]">Utcheckning</p>
                        <p className="mt-1 text-sm font-medium">{booking.check_out}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#9b9186]">Gäster</p>
                        <p className="mt-1 text-sm font-medium">{booking.guests}</p>
                      </div>
                    </div>
                  </div>

                  {booking.status === "pending" && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateBookingStatus(booking.booking_id, "confirmed")
                        }
                        disabled={updatingBookingId === booking.booking_id}
                        className="flex-1 rounded-full bg-[#435747] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#344738] disabled:opacity-50"
                      >
                        {updatingBookingId === booking.booking_id
                          ? "Updating..."
                          : "Confirm booking"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateBookingStatus(booking.booking_id, "cancelled")
                        }
                        disabled={updatingBookingId === booking.booking_id}
                        className="rounded-full border border-[#e5d9d0] px-4 py-3 text-sm font-medium text-[#9c5b4d] transition hover:bg-[#fbf3f0] disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => deleteBooking(booking.booking_id)}
                    disabled={deletingBookingId === booking.booking_id}
                    className="mt-4 text-xs font-medium text-[#a16b60] transition hover:text-red-800 disabled:opacity-50"
                  >
                    {deletingBookingId === booking.booking_id
                      ? "Tar bort..."
                      : "Ta bort bokning"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Mina bokningar */}
        <section className="mt-16">
          <SectionHeading
            eyebrow="TRAVEL"
            title="Mina bokningar"
            description="Dina bokningar och kommande vistelser."
            count={myBookings.length}
          />

          {myBookings.length === 0 ? (
            <div className="rounded-3xl border border-[#eae4db] bg-white px-6 py-10 text-center">
              <p className="text-lg font-medium">Ditt nästa äventyr väntar.</p>
              <p className="mt-2 text-sm text-[#8b8176]">
                Du har inte bokat något boende ännu.
              </p>
              <Link
                href="/properties"
                className="mt-5 inline-flex rounded-full bg-[#342e28] px-5 py-3 text-sm text-white transition hover:bg-[#514438]"
              >
                Utforska boenden
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myBookings.map((booking) => (
                <article
                  key={booking.booking_id}
                  className="rounded-3xl border border-[#eae4db] bg-white p-5 sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#92755c]">
                        DIN BOKNING
                      </p>
                      <h3 className="mt-2 text-lg font-semibold">
                        {propertyTitles.get(booking.property_id) ??
                          bookingPropertyTitles[booking.property_id] ??
                          "Boendets titel kunde inte hämtas"}
                      </h3>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-[#9b9186]">Incheckning</p>
                      <p className="mt-1 text-sm font-medium">{booking.check_in}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#9b9186]">Utcheckning</p>
                      <p className="mt-1 text-sm font-medium">{booking.check_out}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#9b9186]">Gäster</p>
                      <p className="mt-1 text-sm font-medium">{booking.guests}</p>
                    </div>
                  </div>

                  {booking.status !== "cancelled" &&
                    editingBookingId === booking.booking_id && (
                      <div className="mt-6 rounded-2xl bg-[#faf8f4] p-5">
                        <h4 className="font-semibold">Redigera din bokning</h4>

                        <div className="mt-4 grid gap-4 sm:grid-cols-3">
                          <div>
                            <label
                              htmlFor={`edit-check-in-${booking.booking_id}`}
                              className="block text-xs font-medium text-[#766b60]"
                            >
                              Incheckning
                            </label>
                            <input
                              id={`edit-check-in-${booking.booking_id}`}
                              type="date"
                              value={editCheckIn}
                              onChange={(e) => setEditCheckIn(e.target.value)}
                              className="mt-2 w-full rounded-xl border border-[#e2d9ce] bg-white p-3 text-sm outline-none focus:border-[#92755c]"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor={`edit-check-out-${booking.booking_id}`}
                              className="block text-xs font-medium text-[#766b60]"
                            >
                              Utcheckning
                            </label>
                            <input
                              id={`edit-check-out-${booking.booking_id}`}
                              type="date"
                              min={editCheckIn || undefined}
                              value={editCheckOut}
                              onChange={(e) => setEditCheckOut(e.target.value)}
                              className="mt-2 w-full rounded-xl border border-[#e2d9ce] bg-white p-3 text-sm outline-none focus:border-[#92755c]"
                            />
                          </div>

                          <div>
                            <label
                              htmlFor={`edit-guests-${booking.booking_id}`}
                              className="block text-xs font-medium text-[#766b60]"
                            >
                              Antal gäster
                            </label>
                            <input
                              id={`edit-guests-${booking.booking_id}`}
                              type="number"
                              min="1"
                              max="50"
                              value={editGuests}
                              onChange={(e) => setEditGuests(Number(e.target.value))}
                              className="mt-2 w-full rounded-xl border border-[#e2d9ce] bg-white p-3 text-sm outline-none focus:border-[#92755c]"
                            />
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => editBooking(booking.booking_id)}
                            disabled={updatingBookingId === booking.booking_id}
                            className="rounded-full bg-[#342e28] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#514438] disabled:opacity-50"
                          >
                            {updatingBookingId === booking.booking_id
                              ? "Uppdaterar..."
                              : "Spara ändringar"}
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingBookingId(null)}
                            className="rounded-full border border-[#e2d9ce] px-5 py-2.5 text-sm font-medium text-[#685b4d] transition hover:bg-white"
                          >
                            Avbryt
                          </button>
                        </div>
                      </div>
                    )}

                  <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[#f0ebe4] pt-5">
                    {booking.status !== "cancelled" && (
                      <>
                        {editingBookingId !== booking.booking_id && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingBookingId(booking.booking_id);
                              setEditCheckIn(booking.check_in);
                              setEditCheckOut(booking.check_out);
                              setEditGuests(booking.guests);
                            }}
                            className="rounded-full border border-[#e2d9ce] px-4 py-2.5 text-sm font-medium text-[#685b4d] transition hover:bg-[#faf8f4]"
                          >
                            Redigera bokning
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            updateBookingStatus(booking.booking_id, "cancelled")
                          }
                          disabled={updatingBookingId === booking.booking_id}
                          className="rounded-full border border-[#ead4ce] px-4 py-2.5 text-sm font-medium text-[#a16b60] transition hover:bg-[#fbf3f0] disabled:opacity-50"
                        >
                          {updatingBookingId === booking.booking_id
                            ? "Uppdaterar..."
                            : "Avbryt bokning"}
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => deleteBooking(booking.booking_id)}
                      disabled={deletingBookingId === booking.booking_id}
                      className="ml-auto text-xs font-medium text-[#a16b60] transition hover:text-red-800 disabled:opacity-50"
                    >
                      {deletingBookingId === booking.booking_id
                        ? "Tar bort..."
                        : "Ta bort bokning"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Bottom CTA */}
        <section className="mt-16 rounded-3xl bg-[#eae3d8] px-6 py-10 text-center sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#92755c]">
            DIN NÄSTA MÅL
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            Någonstans ny är väntan.
          </h2>
          <p className="mt-2 text-sm text-[#74695d]">
            Upptäck ett boende där du kan känna dig som hemma.
          </p>
          <Link
            href="/properties"
            className="mt-6 inline-flex rounded-full bg-[#342e28] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#514438]"
          >
            Bläddra bland alla egenskaper ↗
          </Link>
        </section>

        <footer className="py-10 text-center text-xs tracking-wide text-[#a49a8e]">
          STAYFINDER · HITTA DITT BOENDE
        </footer>
      </div>
    </main>
  );
}
