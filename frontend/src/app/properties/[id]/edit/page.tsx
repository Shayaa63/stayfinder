
"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Property } from "@/types";

function EditPropertyContent() {
  const params = useParams<{ id: string }>();
  const propertyId = params.id;

  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [price, setPrice] = useState("");
  const [maxGuests, setMaxGuests] = useState("1");

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setPageLoading(false);
      return;
    }

    async function fetchProperty() {
      try {
        const result = await api<Property>(
          `/properties/${propertyId}`
        );

        setProperty(result);
        setTitle(result.title);
        setDescription(result.description);
        setCity(result.city);
        setCountry(result.country);
        setAddress(result.address);
        setPrice(String(result.price_per_night));
        setMaxGuests(String(result.max_guests));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Kunde inte hämta boendet."
        );
      } finally {
        setPageLoading(false);
      }
    }

    void fetchProperty();
  }, [propertyId, user, authLoading]);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!property) return;

    setSaving(true);
    setError("");

    try {
      await api(`/properties/${propertyId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title,
          description,
          city,
          country,
          address,
          price_per_night: Number(price),
          max_guests: Number(maxGuests),
          images: property.images,
          is_published: property.is_published,
        }),
      });

      router.push(`/properties/${propertyId}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kunde inte uppdatera boendet."
      );
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || pageLoading) {
    return <p className="p-8">Laddar boende...</p>;
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-xl px-6 py-12">
        <h1 className="text-2xl font-bold">
          Du behöver logga in
        </h1>
        <Link href="/login" className="mt-5 inline-block underline">
          Gå till inloggning
        </Link>
      </main>
    );
  }

  if (!property) {
    return (
      <main className="mx-auto max-w-xl px-6 py-12">
        <h1 className="text-2xl font-bold">
          Boendet kunde inte hittas
        </h1>
        {error && <p className="mt-3 text-red-600">{error}</p>}
        <Link href="/dashboard" className="mt-5 inline-block underline">
          Tillbaka till dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-3xl font-bold">
        Redigera boende
      </h1>

      <p className="mt-2 text-stone-600">
        Ändra informationen om ditt boende.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="mb-2 block font-medium">Titel</label>
          <input
            required
            minLength={5}
            maxLength={100}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-lg border p-3"
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
            rows={5}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">Stad</label>
          <input
            required
            value={city}
            onChange={(event) => setCity(event.target.value)}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">Land</label>
          <input
            required
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-2 block font-medium">Adress</label>
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
            max="50"
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

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-lg bg-stone-900 px-5 py-3 text-white hover:bg-stone-700 disabled:opacity-50"
          >
            {saving ? "Sparar..." : "Spara ändringar"}
          </button>

          <Link
            href={`/properties/${propertyId}`}
            className="rounded-lg border px-5 py-3"
          >
            Avbryt
          </Link>
        </div>
      </form>
    </main>
  );
}

export default function EditPropertyPage() {
  return (
    <Suspense fallback={<p className="p-8">Laddar...</p>}>
      <EditPropertyContent />
    </Suspense>
  );
}
