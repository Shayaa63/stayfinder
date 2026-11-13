import Link from "next/link";
import type { Property } from "@/types";

export default function PropertyCard({
  property,
}: {
  property: Property;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
      <div className="flex h-48 items-center justify-center bg-stone-200 text-stone-500">
        {property.images?.[0] ? (
          <img
            src={property.images[0]}
            alt={property.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>No image available</span>
        )}
      </div>

      <div className="p-5">
        <p className="text-sm text-stone-500">
          {property.city}, {property.country}
        </p>

        <h2 className="mt-2 text-lg font-semibold">
          {property.title}
        </h2>

        <p className="mt-2 text-sm text-stone-600">
          Up to {property.max_guests} guests
        </p>

        <p className="mt-4 font-semibold">
          {property.price_per_night} kr / night
        </p>

        <Link
          href={`/properties/${property.property_id}`}
          className="mt-4 inline-block text-sm font-semibold underline"
        >
          View property
        </Link>
      </div>
    </article>
  );
}