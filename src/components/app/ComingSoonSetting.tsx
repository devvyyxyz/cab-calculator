"use client";

import { PixelIcon } from "@/components/trade/PixelIcon";

export function ComingSoonSetting({
  label,
}: {
  label: string;
}) {
  return (
    <div
      className="relative mb-2 flex items-center justify-between overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-100 p-3"
    >
      <span
        className="text-sm font-semibold text-gray-500"
        style={{ fontFamily: "var(--font-pixel), monospace" }}
      >
        {label}
      </span>
      <PixelIcon name="switch" size={18} color="#9ca3af" />
      <div className="pointer-events-none absolute inset-0 grid place-items-center bg-gray-100/80">
        <span
          className="rounded-md bg-gray-300 px-2 py-0.5 text-[8px] uppercase text-gray-600"
          style={{ fontFamily: "var(--font-pixel), monospace" }}
        >
          COMING SOON
        </span>
      </div>
    </div>
  );
}
