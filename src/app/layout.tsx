"use client";

import { AppStateProvider, useAppState } from "@/components/app/AppStateProvider";
import { SideNav } from "@/components/trade/SideNav";
import { Preloader } from "@/components/trade/Preloader";
import { Onboarding } from "@/components/trade/Onboarding";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

function Inner({ children }: { children: React.ReactNode }) {
  const state = useAppState();

  return (
    <>
      <Preloader />
      <Preloader visible={!state.metaLoaded} message="LOADING GAME DATA" />
      {!state.onboarded && state.mounted && (
        <Onboarding
          onConfirm={state.handleOnboarded}
          initialProfile={state.savedProfile}
        />
      )}
      <SideNav
        profile={state.youProfile}
        onProfileClick={() => state.setShowAccountModal(true)}
        expanded={state.sidebarExpanded}
        onExpandedChange={state.setSidebarExpanded}
      />
      <main
        suppressHydrationWarning
        className={`relative flex h-screen w-full flex-col overflow-hidden transition-all duration-200 ${state.sidebarExpanded ? "pl-44 sm:pl-52" : "pl-16 sm:pl-20"}`}
        style={{
          backgroundColor: "#0099ff",
          backgroundImage: "url('/stud_texture.png')",
          backgroundSize: "100px 100px",
          backgroundRepeat: "repeat",
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
      <body
        className={`antialiased bg-background text-foreground font-bold`}
      >
        <AppStateProvider>
          <Inner>{children}</Inner>
        </AppStateProvider>
      </body>
    </html>
  );
}