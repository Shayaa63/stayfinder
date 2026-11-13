"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { Property } from "@/types";

const money = (value: number) => new Intl.NumberFormat("sv-SE").format(value);

export default function MyPropertiesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    api<Property[]>("/properties/mine")
      .then(setProperties)
      .catch((err) => setError(err instanceof Error ? err.message : "Kunde inte hämta dina boenden."))
      .finally(() => setPageLoading(false));
  }, [user, loading, router]);

  if (loading || pageLoading || !user) {
    return <main className="sf-page"><div className="sf-container animate-pulse"><div className="h-36 rounded-3xl bg-[#eee8df]" /><div className="mt-6 h-64 rounded-3xl bg-[#eee8df]" /></div></main>;
  }

  return (
    <main className="sf-page">
      <div className="sf-container">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="sf-eyebrow">Your collection</p>
            <h1 className="sf-heading">Mina boenden</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 sf-muted">Här kan du se och hantera alla boenden du har publicerat på StayFinder.</p>
          </div>
          <Link href="/properties/new" className="sf-btn sf-btn-primary">+ Lägg upp boende</Link>
        </div>

        {error && <p role="alert" className="sf-error mt-6">{error}</p>}

        {!error && properties.length === 0 ? (
          <div className="sf-empty mt-8">
            <div className="text-3xl text-[#b19a7d]">⌂</div>
            <h2 className="mt-4 text-xl font-semibold">Ditt första boende börjar här.</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 sf-muted">Lägg upp ett boende för att börja ta emot bokningsförfrågningar.</p>
            <Link href="/properties/new" className="sf-btn sf-btn-primary mt-6">Skapa boende</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {properties.map((property) => (
              <article key={property.property_id} className="sf-card group overflow-hidden transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#514438]/5">
                <Link href={`/properties/${property.property_id}`} className="block">
                  <div className="relative h-52 overflow-hidden bg-[#eae3d8]">
                    {property.images?.[0] ? (
                      <img src={property.images[0]} alt={property.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs font-semibold tracking-[.2em] text-[#92755c]">STAYFINDER</div>
                    )}
                    <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#685b4d]">Ditt boende</span>
                  </div>
                  <div className="p-5">
                    <h2 className="line-clamp-1 text-lg font-semibold">{property.title}</h2>
                    <p className="mt-1 text-sm sf-muted">{property.city}, {property.country}</p>
                    <p className="mt-4 border-t border-[#f0ebe4] pt-4 text-sm sf-muted"><strong className="text-base text-[#342e28]">{money(property.price_per_night)} kr</strong> / natt · Upp till {property.max_guests} gäster</p>
                  </div>
                </Link>
                <div className="flex flex-wrap gap-2 px-5 pb-5">
                  <Link href={`/properties/${property.property_id}`} className="sf-btn sf-btn-secondary flex-1">Visa boende ↗</Link>
                  <Link href={`/properties/${property.property_id}/edit`} className="sf-btn sf-btn-primary flex-1">Redigera</Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
