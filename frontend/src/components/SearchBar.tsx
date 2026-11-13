"use client";

import { useState } from "react";

type SearchBarProps = {
  onSearch: (filters: {
    city: string;
    guests: string;
  }) => void;
};

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [city, setCity] = useState("");
  const [guests, setGuests] = useState("1");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSearch({ city, guests });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap gap-3 rounded-xl bg-white p-4 shadow-sm"
    >
      <input
        value={city}
        onChange={(event) => setCity(event.target.value)}
        placeholder="Destination"
        className="min-w-40 flex-1 rounded-lg border p-3"
      />

      <input
        type="number"
        min="1"
        value={guests}
        onChange={(event) => setGuests(event.target.value)}
        className="w-28 rounded-lg border p-3"
      />

      <button className="rounded-lg bg-stone-900 px-5 py-3 text-white">
        Search
      </button>
    </form>
  );
}