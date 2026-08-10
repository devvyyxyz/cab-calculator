"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SocialLinks } from "@/components/trade/SocialLinks";

const BACKGROUNDS = [
  "/backgrounds/battle.png",
  "/backgrounds/cat.png",
  "/backgrounds/desert.png",
  "/backgrounds/egg.png",
  "/backgrounds/illigal_brainrot.png",
];

const FADE_INTERVAL_MS = 5000;
const FADE_DURATION_MS = 1000;

/**
 * Landing page — full-screen hero with rotating background images.
 *
 * Cycles through /public/backgrounds/* with a smooth fade transition.
 * The dark overlay ensures text remains legible against any background.
 */
export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [bgOpacity, setBgOpacity] = useState(1);
  const [tilt, setTilt] = useState({ x: 0, y: 0, translateX: 0, translateY: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rafRef = useRef<number>();

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      setBgOpacity(0);

      // After fade completes, swap image and fade back in
      const timeout = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % BACKGROUNDS.length);
        setBgOpacity(1);
      }, FADE_DURATION_MS);

      return () => clearTimeout(timeout);
    }, FADE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate mouse position relative to button center (-1 to 1)
    const mouseX = (e.clientX - centerX) / (rect.width / 2);
    const mouseY = (e.clientY - centerY) / (rect.height / 2);

    // Cancel any pending animation frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    // Smooth update using requestAnimationFrame
    rafRef.current = requestAnimationFrame(() => {
      // Rotation: max 12 degrees tilt
      const rotateX = -mouseY * 12; // Tilt up/down based on vertical mouse position
      const rotateY = mouseX * 12; // Tilt left/right based on horizontal mouse position

      // Translation: max 4px movement toward cursor
      const translateX = mouseX * 4;
      const translateY = mouseY * 4;

      setTilt({ x: rotateX, y: rotateY, translateX, translateY });
    });
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    // Smoothly reset to default position
    setTilt({ x: 0, y: 0, translateX: 0, translateY: 0 });
  };

  return (
    <main className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
      {/* Background image layer with fade transition */}
      <div
        className="absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out"
        style={{
          backgroundImage: `url('${BACKGROUNDS[currentIndex]}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          opacity: bgOpacity,
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
            ref={buttonRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="px-8 py-4 text-sm font-bold uppercase tracking-widest transition-transform duration-75 hover:brightness-110 active:translate-y-1 md:text-base"
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
      `}</style>
    </main>
  );
}
