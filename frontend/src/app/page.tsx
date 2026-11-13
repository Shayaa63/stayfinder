
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-24">
      <section className="max-w-3xl">
        <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-orange-700">
          Hitta ditt nästa boende
        </p>

        <h1 className="text-5xl font-bold leading-tight md:text-6xl">
          Hitta ett boende där du kan känna dig som hemma.
        </h1>

        <p className="mt-6 max-w-xl text-lg text-stone-600">
          Upptäck boenden, utforska nya resmål och boka din
          nästa vistelse med StayFinder.
        </p>

        <Link
          href="/properties"
          className="mt-8 inline-block rounded-xl bg-stone-900 px-6 py-3 text-white"
        >
          Utforska boenden
        </Link>
      </section>
    </main>
  );
}
