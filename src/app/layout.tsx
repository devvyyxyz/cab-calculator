import type { Metadata } from "next";
import { Silkscreen, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

// All UI text is bold — load Silkscreen at 700 weight only
const pixel = Silkscreen({
  weight: "700",
  variable: "--font-pixel",
  subsets: ["latin"],
  display: "swap",
});

const body = Inter({
  weight: ["400", "700"],
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CAB Trade Calculator — Catch a Brainrot",
  description:
    "A trade calculator for Catch a Brainrot. Load inventories, build offers, and compare trade values in real time.",
  keywords: [
    "Catch a Brainrot",
    "CAB",
    "trade calculator",
    "brainrot values",
    "Roblox trade",
  ],
  icons: {
    icon: "/cab_icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${pixel.variable} ${body.variable} antialiased bg-background text-foreground font-bold`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
