"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Booking, Property } from "@/types";

type BookingsResponse = { bookings: Booking[]; total: number };

const statusText: Record<Booking["status"], string> = {
  pending: "Inväntar svar",
  confirmed: "Bekräftad",
  cancelled: "Nekad / avbokad",
};

function Status({ status }: { status: Booking["status"] }) {
  return <span className={`sf-status sf-status-${status}`}>{statusText[status]}</span>;
}

function date(value: string) {
  return new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

export default function BookingRequestsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    async function load() {
      try {
        const [myProperties, response] = await Promise.all([
          api<Property[]>("/properties/mine"),
          api<BookingsResponse>("/bookings?limit=100"),
        ]);
        setProperties(myProperties);
        const owned = new Set(myProperties.map((p) => p.property_id));
        setBookings(response.bookings.filter((b) => owned.has(b.property_id) && b.user_id !== user!.id));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Kunde inte hämta bokningsförfrågningar.");
      } finally {
        setPageLoading(false);
      }
    }
    void load();
  }, [user, loading, router]);

  const propertyTitles = useMemo(() => new Map(properties.map((p) => [p.property_id, p.title])), [properties]);
  const pending = bookings.filter((b) => b.status === "pending").length;

  async function updateStatus(id: string, status: "confirmed" | "cancelled") {
    try {
      setError("");
      setUpdatingId(id);
      await api(`/bookings/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
      setBookings((current) => current.map((b) => b.booking_id === id ? { ...b, status } : b));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte uppdatera bokningen.");
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading || pageLoading || !user) {
    return <main className="sf-page"><div className="sf-container animate-pulse"><div className="h-32 rounded-3xl bg-[#eee8df]" /><div className="mt-6 h-60 rounded-3xl bg-[#eee8df]" /></div></main>;
  }

  return (
    <main className="sf-page">
      <div className="sf-container">
        <p className="sf-eyebrow">Hosting</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="sf-heading">Bokningsförfrågningar</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 sf-muted">Här hanterar du gäster som vill boka något av dina boenden.</p>
          </div>
          <span className="rounded-full bg-[#f0ebe3] px-4 py-2 text-sm font-semibold text-[#685b4d]">{pending} väntar på svar</span>
        </div>

        {error && <p role="alert" className="sf-error mt-6">{error}</p>}

        {bookings.length === 0 ? (
          <div className="sf-empty mt-8">
            <div className="text-3xl text-[#b19a7d]">♧</div>
            <h2 className="mt-4 text-xl font-semibold">Inga förfrågningar ännu.</h2>
            <p className="mt-2 text-sm sf-muted">Nya bokningar för dina boenden visas här.</p>
            <Link href="/properties/mine" className="sf-btn sf-btn-secondary mt-6">Visa mina boenden</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {bookings.map((booking) => (
              <article key={booking.booking_id} className="sf-card p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="sf-eyebrow">Gästförfrågan</p>
                    <h2 className="mt-2 text-lg font-semibold">{propertyTitles.get(booking.property_id) ?? "Ditt boende"}</h2>
                  </div>
                  <Status status={booking.status} />
                </div>

                <div className="sf-panel mt-5 p-4">
                  <p className="font-semibold">{booking.guest_name}</p>
                  <a href={`mailto:${booking.guest_email}`} className="mt-1 inline-block text-sm text-[#92755c] underline-offset-4 hover:underline">{booking.guest_email}</a>
                  <div className="mt-4 grid grid-cols-2 gap-4 border-t border-[#eae4db] pt-4 sm:grid-cols-3">
                    <div><p className="text-xs sf-muted">Incheckning</p><p className="mt-1 text-sm font-semibold">{date(booking.check_in)}</p></div>
                    <div><p className="text-xs sf-muted">Utcheckning</p><p className="mt-1 text-sm font-semibold">{date(booking.check_out)}</p></div>
                    <div><p className="text-xs sf-muted">Gäster</p><p className="mt-1 text-sm font-semibold">{booking.guests}</p></div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {booking.status === "pending" ? (
                    <>
                      <button type="button" onClick={() => void updateStatus(booking.booking_id, "confirmed")} disabled={updatingId === booking.booking_id} className="sf-btn sf-btn-primary flex-1">
                        {updatingId === booking.booking_id ? "Uppdaterar…" : "Bekräfta bokning"}
                      </button>
                      <button type="button" onClick={() => void updateStatus(booking.booking_id, "cancelled")} disabled={updatingId === booking.booking_id} className="sf-btn sf-btn-danger">Neka</button>
                    </>
                  ) : (
                    <Link href={`/properties/${booking.property_id}`} className="sf-btn sf-btn-secondary">Visa boende ↗</Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
