"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/404");
    }
  }, []);

  return (
    <html lang="en">
      <body
        className="antialiased bg-background text-foreground font-bold"
        style={{ fontFamily: "var(--font-pixel), monospace" }}
      >
        <div
          className="relative flex h-screen w-full flex-col items-center justify-center px-4"
          style={{
            backgroundColor: "#0099ff",
            backgroundImage: "url('/stud_texture.png')",
            backgroundSize: "100px 100px",
            backgroundRepeat: "repeat",
          }}
        >
          <div className="flex flex-col items-center gap-4">
            <h1
              className="text-outline text-center text-6xl text-white sm:text-8xl"
              style={{ fontFamily: "var(--font-pixel), monospace" }}
            >
              500
            </h1>
            <h2
              className="text-outline text-center text-xl text-white sm:text-2xl"
              style={{ fontFamily: "var(--font-pixel), monospace" }}
            >
              APPLICATION ERROR
            </h2>
            <p
              className="text-outline max-w-md text-center text-sm text-white/90"
              style={{ fontFamily: "var(--font-pixel), monospace" }}
            >
              A critical error occurred. Please refresh the page or return home.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={reset}
                className="btn-follow rounded-lg bg-white px-6 py-3 text-xs uppercase text-gray-900 active:translate-y-0.5"
                style={{
                  fontFamily: "var(--font-pixel), monospace",
                  boxShadow: "0 3px 0 rgba(0,0,0,0.2)",
                }}
              >
                TRY AGAIN
              </button>
              <Link
                href="/"
                className="btn-follow rounded-lg bg-gray-200 px-6 py-3 text-xs uppercase text-gray-900 active:translate-y-0.5"
                style={{
                  fontFamily: "var(--font-pixel), monospace",
                  boxShadow: "0 3px 0 rgba(0,0,0,0.2)",
                }}
              >
                GO HOME
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
