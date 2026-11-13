
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-full px-3 py-2 text-sm font-medium text-[#766b60] transition hover:bg-[#faf8f4] hover:text-[#342e28]"
    >
      {children}
    </Link>
  );
}

export default function Navbar() {
  const { user, loading, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-[#eae4db] bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-3 sm:px-8">

        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-bold tracking-tight text-[#342e28]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eae3d8] text-lg text-[#92755c]">
            ⌂
          </span>
          StayFinder
        </Link>

        <div className="flex flex-wrap items-center justify-end gap-1">
          <NavLink href="/properties">Upptäck</NavLink>

          {!loading && user && (
            <>
              <NavLink href="/dashboard">Översikt</NavLink>
              <NavLink href="/properties/mine">Mina boenden</NavLink>
              <NavLink href="/bookings/requests">Bokningsförfrågningar</NavLink>
              <NavLink href="/bookings">Mina bokningar</NavLink>

              <Link
                href="/properties/new"
                className="sf-btn sf-btn-primary ml-1 min-h-10! px-4! py-2!"
              >
                + Lägg till boende
              </Link>

              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-full px-3 py-2 text-sm font-medium text-[#82796f] transition hover:bg-[#faf8f4] hover:text-[#342e28]"
              >
                Logga ut
              </button>
            </>
          )}

          {!loading && !user && (
            <>
              <NavLink href="/login">Logga in</NavLink>

              <Link
                href="/register"
                className="sf-btn sf-btn-primary ml-1 min-h-10! px-4! py-2!"
              >
                Registrera dig
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
