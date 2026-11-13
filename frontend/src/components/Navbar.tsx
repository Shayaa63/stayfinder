
"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, loading, logout } = useAuth();

  return (
    <header className="border-b border-stone-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold">
          StayFinder
        </Link>

        <div className="flex items-center gap-5 text-sm">
          <Link href="/properties">Explore stays</Link>

          {!loading && user ? (
            <>
              <Link href="/dashboard">Dashboard</Link>

              <Link
                href="/properties/new"
                className="rounded-lg bg-stone-900 px-4 py-2 text-white! hover:bg-stone-700"
              >
                + Lägg upp boende
              </Link>

              <button
                onClick={() => void logout()}
                className="rounded-lg bg-stone-900 px-4 py-2 text-white! hover:bg-stone-700"
              >
                Log out
              </button>
            </>
          ) : !loading ? (
            <>
              <Link href="/login">Log in</Link>
              <Link
                href="/register"
                className="rounded-lg bg-stone-900 px-4 py-2 text-white! hover:bg-stone-700"
              >
                Sign up
              </Link>
            </>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
