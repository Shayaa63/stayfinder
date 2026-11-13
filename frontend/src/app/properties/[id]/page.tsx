
"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Property } from "@/types";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import BookingForm from "@/components/BookingForm";

function PropertyDetailsContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [propertyNotFound, setPropertyNotFound] = useState(false);

  useEffect(() => {
    async function loadProperty() {
      try {
        const result = await api<Property>(
          `/properties/${params.id}`
        );

        setProperty(result);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
  setPropertyNotFound(true);
  return;
}

        setError(
          err instanceof Error
            ? err.message
            : "Could not load property"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadProperty();
  }, [params.id]);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Är du säker på att du vill radera detta boende?"
    );

    if (!confirmed) return;

    setDeleting(true);
    setError("");

    try {
      await api(`/properties/${params.id}`, {
        method: "DELETE",
      });

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kunde inte radera boendet."
      );
    } finally {
      setDeleting(false);
    }
  }

  if (loading || authLoading) {
    return <p className="p-8">Loading...</p>;
  }
  if (propertyNotFound) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-orange-700">
        404 – Page not found
      </p>

      <h1 className="mt-4 text-4xl font-bold">
        Boendet kunde inte hittas
      </h1>

      <p className="mt-4 text-stone-600">
        Boendet du letar efter finns inte eller har tagits bort.
      </p>

      <Link
        href="/properties"
        className="mt-8 rounded-xl bg-stone-900 px-6 py-3 text-white! hover:bg-stone-700"
      >
        Tillbaka till boenden
      </Link>
    </main>
  );
}

  if (error && !property) {
    return (
      <p className="p-8 text-red-700">
        {error}
      </p>
    );
  }
  if (!property) {
  return null;
}

  const isOwner = user?.id === property.user_id;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-stone-500">
        {property.city}, {property.country}
      </p>

      <h1 className="mt-2 text-4xl font-bold">
        {property.title}
      </h1>

      <p className="mt-6 max-w-3xl text-stone-700">
        {property.description}
      </p>

      <p className="mt-4">
        {property.price_per_night} kr per natt ·
        {" "}Upp till {property.max_guests} gäster
      </p>

      {error && (
        <p className="mt-6 rounded-lg bg-red-50 p-3 text-red-700">
          {error}
        </p>
      )}

      {isOwner ? (
        <section className="mt-10 max-w-xl rounded-xl border p-6">
          <h2 className="text-xl font-semibold">
            Hantera ditt boende
          </h2>

          <p className="mt-2 text-stone-600">
            Det här är ditt boende. Du kan redigera informationen
            eller ta bort boendet.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/properties/${property.property_id}/edit`}
              className="rounded-lg bg-stone-900 px-5 py-3 text-white! hover:bg-stone-700"
            >
              Redigera boende
            </Link>

            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg border border-red-300 px-5 py-3 text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              {deleting ? "Raderar..." : "Radera boende"}
            </button>
          </div>
        </section>
      ) : user ? (
        <div className="mt-10 max-w-xl">
          <BookingForm property={property} />
        </div>
      ) : (
        <section className="mt-10 max-w-xl rounded-xl border p-6">
          <h2 className="text-xl font-semibold">
            Vill du boka detta boende?
          </h2>

          <p className="mt-2 text-stone-600">
            Du behöver logga in för att skicka en bokningsförfrågan.
          </p>

          <Link
            href="/login"
            className="mt-5 inline-block rounded-lg bg-stone-900 px-5 py-3 text-white hover:bg-stone-700"
          >
            Logga in
          </Link>
        </section>
      )}
    </main>
  );
}

export default function PropertyDetailsPage() {
  return (
    <Suspense fallback={<p className="p-8">Loading property...</p>}>
      <PropertyDetailsContent />
    </Suspense>
  );
}
