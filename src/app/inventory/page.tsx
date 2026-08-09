"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { InventoryView } from "@/components/views/InventoryView";
import { useAppState } from "@/components/app/AppStateProvider";

function InventoryInner() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("user");
  const state = useAppState();

  useEffect(() => {
    if (userId && state.youProfile?.id !== userId && !state.loading) {
      state.loadYourInventory(userId);
    }
  }, [userId, state.loading, state.youProfile?.id, state.loadYourInventory]);

  return <InventoryView />;
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center text-white">Loading...</div>}>
      <InventoryInner />
    </Suspense>
  );
}