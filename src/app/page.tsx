import Link from "next/link";

/**
 * Landing page — full-screen hero with background image.
 *
 * Place your background image in /public and update the `backgroundImage`
 * URL below. The dark overlay ensures text remains legible.
 */
export default function Home() {
  return (
    <main className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
      {/* Background image layer */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/cab_icon.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        aria-hidden="true"
      />

      {/* Dark gradient overlay for text legibility */}
      <div
        className="absolute inset-0 z-10 bg-gradient-to-b from-black/70 via-black/50 to-black/70"
        aria-hidden="true"
      />

      {/* Centered content */}
      <div className="relative z-20 flex max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
        {/* Site name */}
        <h1 className="text-4xl font-bold uppercase tracking-wider text-white text-outline-white md:text-6xl lg:text-7xl">
          CAB Calculator
        </h1>

        {/* Tagline */}
        <p className="text-base font-bold uppercase tracking-widest text-white/90 text-outline-sm-white md:text-lg">
          Creatures and Buddies Trade Tool
        </p>

        {/* Brief description */}
        <p className="max-w-lg text-sm leading-relaxed text-white/80 md:text-base">
          Calculate fair trade values, manage your inventory, and build the perfect
          team. Your essential companion for mastering the CAB marketplace.
        </p>

        {/* Call-to-action */}
        <Link href="/trade-calculator" className="mt-4">
          <button
            className="px-8 py-4 text-sm font-bold uppercase tracking-widest transition-all duration-200 hover:brightness-110 active:translate-y-1 md:text-base"
            style={{
              background: "#7cb3ff",
              color: "#ffffff",
              borderRadius: "12px",
              boxShadow: "0 6px 0 0 #1e3a5f, inset 0 2px 0 0 rgba(255,255,255,0.4)",
              border: "3px solid #1e3a5f",
              fontFamily: "var(--font-pixel), monospace",
              textShadow: "1px 1px 0 rgba(0,0,0,0.5)",
            }}
          >
            Get Started
          </button>
        </Link>
      </div>
    </main>
  );
}
