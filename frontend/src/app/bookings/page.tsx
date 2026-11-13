"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Booking, Property } from "@/types";

type BookingsResponse = { bookings: Booking[]; total: number };

const statusText: Record<Booking["status"], string> = {
  pending: "Inväntar svar",
  confirmed: "Bekräftad",
  cancelled: "Avbokad",
};

function Status({ status }: { status: Booking["status"] }) {
  return <span className={`sf-status sf-status-${status}`}>{statusText[status]}</span>;
}
function date(value: string) {
  return new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

export default function MyBookingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
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
        const response = await api<BookingsResponse>("/bookings?limit=100");
        const mine = response.bookings.filter((booking) => booking.user_id === user!.id);
        setBookings(mine);

        const ids = [...new Set(mine.map((b) => b.property_id))];
        const entries = await Promise.all(ids.map(async (id) => {
          try {
            const property = await api<Property>(`/properties/${id}`);
            return [id, property.title] as const;
          } catch {
            return [id, "Boendet är inte längre tillgängligt"] as const;
          }
        }));
        setTitles(Object.fromEntries(entries));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Kunde inte hämta dina bokningar.");
      } finally {
        setPageLoading(false);
      }
    }
    void load();
  }, [user, loading, router]);

  async function cancelBooking(id: string) {
    if (!window.confirm("Vill du avboka den här bokningen?")) return;
    try {
      setError("");
      setUpdatingId(id);
      await api(`/bookings/${id}`, { method: "PATCH", body: JSON.stringify({ status: "cancelled" }) });
      setBookings((current) => current.map((b) => b.booking_id === id ? { ...b, status: "cancelled" } : b));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunde inte avboka bokningen.");
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
        <p className="sf-eyebrow">Travel</p>
        <h1 className="sf-heading">Mina bokningar</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 sf-muted">Här hittar du bokningar du själv har gjort och kan följa deras status.</p>

        {error && <p role="alert" className="sf-error mt-6">{error}</p>}

        {bookings.length === 0 ? (
          <div className="sf-empty mt-8">
            <div className="text-3xl text-[#b19a7d]">◷</div>
            <h2 className="mt-4 text-xl font-semibold">Ditt nästa äventyr väntar.</h2>
            <p className="mt-2 text-sm sf-muted">Du har inte bokat något boende ännu.</p>
            <Link href="/properties" className="sf-btn sf-btn-primary mt-6">Utforska boenden</Link>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {bookings.map((booking) => (
              <article key={booking.booking_id} className="sf-card p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="sf-eyebrow">Din bokning</p>
                    <h2 className="mt-2 text-lg font-semibold">{titles[booking.property_id] ?? "Hämtar boende…"}</h2>
                    <Link href={`/properties/${booking.property_id}`} className="mt-1 inline-block text-sm text-[#92755c] underline-offset-4 hover:underline">Visa boende ↗</Link>
                  </div>
                  <Status status={booking.status} />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[#f0ebe4] pt-5 sm:grid-cols-3">
                  <div><p className="text-xs sf-muted">Incheckning</p><p className="mt-1 text-sm font-semibold">{date(booking.check_in)}</p></div>
                  <div><p className="text-xs sf-muted">Utcheckning</p><p className="mt-1 text-sm font-semibold">{date(booking.check_out)}</p></div>
                  <div><p className="text-xs sf-muted">Gäster</p><p className="mt-1 text-sm font-semibold">{booking.guests}</p></div>
                </div>
                {booking.status !== "cancelled" && (
                  <div className="mt-5 border-t border-[#f0ebe4] pt-5">
                    <button type="button" onClick={() => void cancelBooking(booking.booking_id)} disabled={updatingId === booking.booking_id} className="sf-btn sf-btn-danger">
                      {updatingId === booking.booking_id ? "Avbokar…" : "Avboka"}
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
