import type { Metadata } from "next";
import { Silkscreen, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const pixel = Silkscreen({
  weight: "400",
  variable: "--font-pixel",
  subsets: ["latin"],
  display: "swap",
});

const pixelBold = Silkscreen({
  weight: "700",
  variable: "--font-pixel-bold",
  subsets: ["latin"],
  display: "swap",
});

const body = Inter({
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
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${pixel.variable} ${pixelBold.variable} ${body.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
