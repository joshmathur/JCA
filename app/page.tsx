import Link from "next/link";

export default function Home() {
  return (
    <main className="max-w-4xl mx-auto px-6">
      {/* Hero */}
      <section className="py-20 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">
          JCA — Josh&apos;s Crypto Aid
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto mb-8">
          JCA is a crypto research dashboard that tracks your watchlist in
          real time, pulls the latest market news, and uses AI to generate
          daily coin analysis and picks — all in one place.
        </p>
        <Link
          href="/login"
          className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-lg transition-colors"
        >
          Get Started →
        </Link>
      </section>

      {/* Features */}
      <section className="py-12 border-t border-gray-800">
        <h2 className="text-xl font-semibold text-white mb-6 text-center">
          What you get
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <h3 className="text-white font-medium mb-2">Watchlist</h3>
            <p className="text-gray-400 text-sm">
              Track live prices for the coins you care about, updated
              automatically.
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <h3 className="text-white font-medium mb-2">AI Signals</h3>
            <p className="text-gray-400 text-sm">
              Get AI-generated analysis on any coin, backed by current market
              data.
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
            <h3 className="text-white font-medium mb-2">Daily Picks</h3>
            <p className="text-gray-400 text-sm">
              A daily shortlist of coins worth a closer look, generated
              automatically.
            </p>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-12 border-t border-gray-800 text-center">
        <p className="text-gray-500 text-sm">
          Built by Josh as a full-stack project combining live market data,
          Supabase auth, and the Claude API for AI-driven analysis.
        </p>
      </section>
    </main>
  );
}