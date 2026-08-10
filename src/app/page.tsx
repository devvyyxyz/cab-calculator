"use client";

import Link from "next/link";
import { SocialLinks } from "@/components/trade/SocialLinks";
import { useTilt } from "@/lib/useTilt";

/**
 * Minimalist landing page - a single full-screen background with a centered
 * title, a call-to-action button and the social icons.
 *
 * The "Get Started" button uses the same 3D tilt-on-hover effect as every
 * other button in the app (via the shared useTilt hook).
 */
const BACKGROUND = "/backgrounds/illigal_brainrot.png";

export default function Home() {
  const { ref: getBtnRef, handleMouseMove, handleMouseEnter, handleMouseLeave, tilt, isHovering } =
    useTilt(12, 4);

  return (
    <main className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
      {/* Full-screen background image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('${BACKGROUND}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          animation: "slowZoom 20s ease-in-out infinite alternate",
        }}
        aria-hidden="true"
      />

      {/* Dark gradient overlay for text legibility */}
      <div
        className="absolute inset-0 z-10 bg-gradient-to-b from-black/70 via-black/50 to-black/70"
        aria-hidden="true"
      />

      {/* Centered content */}
      <div className="relative z-20 flex max-w-3xl flex-col items-center justify-center gap-8 px-6 text-center">
        {/* Site name with subtle rotation animation */}
        <h1
          className="text-4xl font-bold uppercase tracking-wider text-white text-outline-white md:text-6xl lg:text-7xl"
          style={{
            animation: "subtleRotate 4s ease-in-out infinite",
          }}
        >
          CAB Calculator
        </h1>

        {/* Tagline */}
        <p className="text-base font-bold uppercase tracking-widest text-white/90 text-outline-sm-white md:text-lg">
          Creatures and Buddies Trade Tool
        </p>

        {/* Call-to-action */}
        <Link href="/trade-calculator" className="mt-4">
          <button
            ref={getBtnRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="btn-follow px-8 py-4 text-sm font-bold uppercase tracking-widest transition-transform duration-75 hover:brightness-110 active:translate-y-1 md:text-base"
            style={{
              background: "#7cb3ff",
              color: "#ffffff",
              borderRadius: "12px",
              boxShadow: isHovering
                ? `0 ${6 + tilt.translateY * 0.5}px 0 0 #1e3a5f, inset 0 2px 0 0 rgba(255,255,255,0.4)`
                : "0 6px 0 0 #1e3a5f, inset 0 2px 0 0 rgba(255,255,255,0.4)",
              border: "3px solid #1e3a5f",
              fontFamily: "var(--font-pixel), monospace",
              textShadow: "1px 1px 0 rgba(0,0,0,0.5)",
              transform: isHovering
                ? `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translate(${tilt.translateX}px, ${tilt.translateY}px)`
                : "none",
              transition: isHovering ? "none" : "transform 0.3s ease-out, box-shadow 0.3s ease-out",
            }}
          >
            Get Started
          </button>
        </Link>

        {/* Social Media Links */}
        <div className="mt-16 w-full">
          <SocialLinks />
        </div>
      </div>

      {/* CSS Animation Styles */}
      <style jsx>{`
        @keyframes slowZoom {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(1.1);
          }
        }

        @keyframes subtleRotate {
          0%, 100% {
            transform: rotate(-2deg);
          }
          50% {
            transform: rotate(2deg);
          }
        }
      `}</style>
    </main>
  );
}
