
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function NewPropertyPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState("");
  const [maxGuests, setMaxGuests] = useState("1");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const result = await api<{ property_id: string }>("/properties", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          city,
          country,
          address,
          price_per_night: Number(price),
          max_guests: Number(maxGuests),
          images: [],
          is_published: true,
        }),
      });

      router.push(`/properties/${result.property_id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not create property"
      );
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return <p className="p-8">Loading...</p>;
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-xl px-6 py-12">
        <h1 className="text-2xl font-bold">
          Du behöver logga in
        </h1>
        <p className="mt-3">
          Logga in för att kunna lägga upp ett boende.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-block rounded-lg bg-stone-900 px-5 py-3 text-white"
        >
          Gå till inloggning
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-bold">
        Lägg upp ett boende
      </h1>

      <p className="mt-2 text-stone-600">
        Fyll i informationen om boendet.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="mb-2 block font-medium">
            Titel
          </label>
          <input
            required
            minLength={5}
            maxLength={100}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-lg border p-3"
            placeholder="Exempel: Mysig lägenhet i Stockholm"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Beskrivning
          </label>
          <textarea
            required
            minLength={20}
            maxLength={3000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="w-full rounded-lg border p-3"
            rows={5}
            placeholder="Beskriv boendet..."
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Stad
          </label>
          <input
            required
            value={city}
            onChange={(event) => setCity(event.target.value)}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Land
          </label>
          <input
            required
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Adress
          </label>
          <input
            required
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Pris per natt (kr)
          </label>
          <input
            required
            type="number"
            min="0.01"
            max="100000"
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">
            Max antal gäster
          </label>
          <input
            required
            type="number"
            min="1"
            max="30"
            step="1"
            value={maxGuests}
            onChange={(event) => setMaxGuests(event.target.value)}
            className="w-full rounded-lg border p-3"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-stone-900 px-5 py-3 text-white hover:bg-stone-700 disabled:opacity-50"
        >
          {loading ? "Skapar boende..." : "Skapa boende"}
        </button>
      </form>
    </main>
  );
}
