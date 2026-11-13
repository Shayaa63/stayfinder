
"use client";

import { useEffect, useState } from "react";
import type { Property } from "@/types";
import { api } from "@/lib/api";
import PropertyCard from "@/components/PropertyCard";

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [city, setCity] = useState("");
  const [guests, setGuests] = useState("1");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("price_asc");

  async function searchProperties() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (city.trim()) {
        params.set("city", city.trim());
      }

      if (guests) {
        params.set("guests", guests);
      }

      if (maxPrice.trim()) {
        params.set("maxPrice", maxPrice);
      }

      params.set("sort", sort);

      const result = await api<{
        properties: Property[];
        total: number;
      }>(`/properties?${params.toString()}`);

      setProperties(result.properties);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Search failed"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void searchProperties();
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-3xl font-bold">Utforska boenden</h1>

      <div className="my-6 grid grid-cols-1 gap-4 rounded-xl border border-stone-200 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">
            Stad
          </label>
          <input
            type="text"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Exempel: Stockholm"
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">
            Minsta antal gäster
          </label>
          <input
            type="number"
            min="1"
            value={guests}
            onChange={(event) => setGuests(event.target.value)}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">
            Maxpris per natt (kr)
          </label>
          <input
            type="number"
            min="0"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            placeholder="Exempel: 1500"
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700">
            Sortera efter pris
          </label>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="w-full rounded-lg border p-3"
          >
            <option value="price_asc">Lägsta pris först</option>
            <option value="price_desc">Högsta pris först</option>
          </select>
        </div>

        <div className="sm:col-span-2 lg:col-span-4">
          <button
            onClick={() => void searchProperties()}
            className="w-full rounded-lg bg-stone-900 px-5 py-3 text-white hover:bg-stone-700"
          >
            Sök boenden
          </button>
        </div>
      </div>

      {loading ? (
        <p className="mt-8">Loading properties...</p>
      ) : error ? (
  <section
    className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6"
    role="alert"
  >
    <h2 className="text-lg font-semibold text-red-800">
      Kunde inte hämta boenden
    </h2>

    <p className="mt-2 text-red-700">
      {error}
    </p>

    <button
      onClick={() => void searchProperties()}
      className="mt-4 rounded-lg bg-stone-900 px-5 py-3 text-white hover:bg-stone-700"
    >
      Försök igen
    </button>
  </section>
      ) : properties.length === 0 ? (
        <p className="mt-8 text-stone-600">
          No properties found yet.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard
              key={property.property_id}
              property={property}
            />
          ))}
        </div>
      )}
    </main>
  );
}
