"use client";

import { useState, useRef, useEffect } from "react";
import { PixelIcon } from "./PixelIcon";

export interface SortOption<T> {
  value: T;
  label: string;
}

/**
 * Sort pill - a dropdown styled like a retro pill button.
 * Shows the current sort, opens a dropdown with all options when clicked.
 *
 * Uses the pixelarticons "sort" feel via the backpack/info-box icons rotated
 * or just a small chevron + label.
 */
export function SortPill<T extends string>({
  options,
  value,
  onChange,
  label = "SORT",
}: {
  options: SortOption<T>[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value) ?? options[0];

  // Close on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="stud-input flex items-center gap-2 px-3 py-2 text-[10px] uppercase"
        style={{
          color: "#1f2937",
          fontFamily: "var(--font-pixel), monospace",
          borderRadius: "0.875rem",
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-gray-500">{label}:</span>
        <span className="text-gray-900">{current.label}</span>
        <span
          className="ml-1 text-[8px] text-gray-600"
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s",
            display: "inline-block",
          }}
        >
          ▼
        </span>
      </button>

      {open && (
        <div
          role="listbox"
          className="stud-input absolute right-0 z-50 mt-2 min-w-[180px] overflow-hidden p-1"
          style={{
            borderRadius: "0.875rem",
          }}
        >
          {options.map((opt) => {
            const isActive = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[10px] uppercase transition-colors hover:bg-black/10"
                style={{
                  color: isActive ? "#1e3a5f" : "#374151",
                  fontFamily: "var(--font-pixel), monospace",
                  borderRadius: "0.5rem",
                  background: isActive ? "rgba(124,179,255,0.3)" : "transparent",
                }}
              >
                {isActive && (
                  <PixelIcon
                    name="info-box"
                    size={14}
                    color="#1e3a5f"
                  />
                )}
                <span className={isActive ? "" : "ml-5"}>{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
