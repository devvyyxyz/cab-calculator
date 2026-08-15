"use client";

import { AppStateProvider, useAppState } from "@/components/app/AppStateProvider";
import { TopNav } from "@/components/trade/TopNav";
import { Preloader } from "@/components/trade/Preloader";
import { Onboarding } from "@/components/trade/Onboarding";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import "./globals.css";

function Inner({ children }: { children: React.ReactNode }) {
  const state = useAppState();
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return (
    <>
      {!isLanding && <Preloader />}
      {!isLanding && <Preloader visible={!state.metaLoaded} message="LOADING GAME DATA" />}
      {!isLanding && !state.onboarded && state.mounted && (
        <Onboarding
          onConfirm={state.handleOnboarded}
          initialProfile={state.savedProfile}
        />
      )}
      {!isLanding && (
        <TopNav
          profile={state.youProfile}
          onLogout={state.handleLogout}
        />
      )}
      <main
        suppressHydrationWarning
        className={cn(
          "relative flex h-screen w-full flex-col overflow-auto transition-all duration-200",
          !isLanding && "pt-16"
        )}
        style={{
          backgroundColor: isLanding ? "#000000" : "#0099ff",
          backgroundImage: isLanding ? "none" : "url('/stud_texture.png')",
          backgroundSize: isLanding ? "" : "100px 100px",
          backgroundRepeat: isLanding ? "" : "repeat",
        }}
      >
        {children}
      </main>
      <Toaster />
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`antialiased bg-background text-foreground font-bold`}
        style={{ fontFamily: "var(--font-pixel), monospace" }}
      >
        <SessionProvider>
          <AppStateProvider>
            <Inner>{children}</Inner>
          </AppStateProvider>
        </SessionProvider>
      </body>
    </html>
  );
}