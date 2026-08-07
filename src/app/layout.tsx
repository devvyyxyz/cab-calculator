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
  title: {
    default: "CAB Trade Calculator - Catch a Brainrot | Trade Calculator, Values List & Inventory Viewer",
    template: "%s | CAB Trade Calculator"
  },
  description:
    "Official Catch a Brainrot (CAB) trade calculator and values list. View brainrot values, item database, inventory viewer, and trade calculator for Roblox Catch a Brainrot game. Updated values list for all in-game rots and items.",
  keywords: [
    "Catch a Brainrot",
    "CAB",
    "CAB Trade Calculator",
    "brainrot calculator",
    "brainrot values",
    "trade calculator",
    "Roblox trade calculator",
    "inventory viewer",
    "brainrot database",
    "item values",
    "rot values",
    "CAB values list",
    "brainrot trading",
    "Roblox brainrot",
    "catch a brainrot trade",
    "brainrot IV calculator",
    "team builder",
    "damage calculator"
  ],
  authors: [{ name: "CAB Trade Calculator" }],
  creator: "CAB Trade Calculator",
  publisher: "CAB Trade Calculator",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://cab.devvyy.xyz/",
    siteName: "CAB Trade Calculator",
    title: "CAB Trade Calculator - Catch a Brainrot | Official Trade Calculator & Values List",
    description: "Official Catch a Brainrot trade calculator. View values, build trades, and track your brainrot inventory. The most accurate CAB values list and trading tool.",
    images: [
      {
        url: "/cab_icon.png",
        width: 512,
        height: 512,
        alt: "CAB Trade Calculator Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CAB Trade Calculator - Catch a Brainrot",
    description: "Official Catch a Brainrot trade calculator and values list. Build trades, view values, and track your inventory.",
    images: ["/cab_icon.png"],
  },
  icons: {
    icon: "/cab_icon.png",
    apple: "/cab_icon.png",
  },
  alternates: {
    canonical: "https://cab.devvyy.xyz/",
  },
  category: "gaming",
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
