"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/trade-calculator", label: "Trade Calculator" },
  { href: "/team-builder", label: "Team Builder" },
  { href: "/compare", label: "Compare" },
  { href: "/damage-calculator", label: "Damage Calculator" },
  { href: "/inventory", label: "Inventory" },
  { href: "/values", label: "Values" },
  { href: "/news", label: "News" },
  { href: "/settings", label: "Settings" },
  { href: "/about", label: "About" },
];

export function Footer() {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  if (isLanding) return null;

  return (
    <footer
      className="mt-auto border-t border-white/10"
      style={{
        backgroundColor: "#1a1a1a",
        backgroundImage: "url('/stud_texture.png')",
        backgroundSize: "40px 40px",
        backgroundRepeat: "repeat",
        backgroundBlendMode: "soft-light",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-1 lg:col-span-1">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-white/10 p-1">
                <Image
                  src="/cab_icon.png"
                  alt="CAB Rot Dex"
                  width={40}
                  height={40}
                  className="h-full w-full object-contain [image-rendering:pixelated]"
                />
              </div>
              <div>
                <div
                  className="text-sm font-bold uppercase tracking-wide text-white"
                  style={{ fontFamily: "var(--font-pixel), monospace" }}
                >
                  CAB: Rot Dex
                </div>
                <div className="text-[10px] uppercase tracking-widest text-white/60">
                  Catch a Brainrot
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3
              className="text-xs font-bold uppercase tracking-widest text-white/80"
              style={{ fontFamily: "var(--font-pixel), monospace" }}
            >
              Explore
            </h3>
            <ul className="mt-4 space-y-2">
              {NAV_LINKS.slice(0, 5).map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs uppercase tracking-widest text-white/60 transition-colors hover:text-white"
                    style={{ fontFamily: "var(--font-pixel), monospace" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3
              className="text-xs font-bold uppercase tracking-widest text-white/80"
              style={{ fontFamily: "var(--font-pixel), monospace" }}
            >
              Tools
            </h3>
            <ul className="mt-4 space-y-2">
              {NAV_LINKS.slice(5).map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs uppercase tracking-widest text-white/60 transition-colors hover:text-white"
                    style={{ fontFamily: "var(--font-pixel), monospace" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3
              className="text-xs font-bold uppercase tracking-widest text-white/80"
              style={{ fontFamily: "var(--font-pixel), monospace" }}
            >
              Credits
            </h3>
            <div className="mt-4 space-y-3">
              <p className="text-xs text-white/60">
                Created by{" "}
                <a
                  href="https://devvyy.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-white underline transition-colors hover:text-white/80"
                  style={{ fontFamily: "var(--font-pixel), monospace" }}
                >
                  devvyyxyz
                </a>
              </p>
              <p className="text-[10px] text-white/40">
                Built with Next.js, Tailwind CSS, and Prisma.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6">
          <p
            className="text-center text-[10px] uppercase tracking-widest text-white/40"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            &copy; {new Date().getFullYear()} CAB: Rot Dex. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
