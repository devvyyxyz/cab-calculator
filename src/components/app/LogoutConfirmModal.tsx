"use client";

import { useState } from "react";

interface LogoutConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutConfirmModal({ open, onClose, onConfirm }: LogoutConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-black/20 bg-white/95 p-6 shadow-xl"
        style={{
          backgroundImage: "url('/stud_texture.png')",
          backgroundSize: "40px 40px",
          backgroundRepeat: "repeat",
          backgroundBlendMode: "soft-light",
          boxShadow: "0 4px 0 0 rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.4)",
          border: "4px solid #1e3a5f",
        }}
      >
        <div
          className="flex shrink-0 items-center justify-between gap-3"
          style={{ borderBottom: "3px solid #1e3a5f" }}
        >
          <h3
            className="text-outline text-lg text-white"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            LOGOUT
          </h3>
          <button
            onClick={onClose}
            className="btn-follow grid h-8 w-8 place-items-center rounded-full bg-red-500 text-white"
            style={{ boxShadow: "0 3px 0 #7f1d1d" }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div
          className="pointer-events-none absolute inset-0 z-0 rounded-2xl"
          style={{
            background:
              "linear-gradient(180deg, rgba(15,19,32,0.35) 0%, rgba(15,19,32,0.55) 100%)",
          }}
        />

        <div className="relative z-10">
          <p className="text-sm text-slate-800">
            Are you sure you want to log out? This will clear your saved profile and inventory data.
          </p>

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-follow rounded-lg bg-gray-200 px-4 py-2 text-sm font-bold text-gray-700"
              style={{
                fontFamily: "var(--font-pixel), monospace",
                border: "3px solid #6b7280",
                boxShadow: "0 3px 0 0 #374151",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="btn-follow rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white"
              style={{
                fontFamily: "var(--font-pixel), monospace",
                border: "3px solid #7f1d1d",
                boxShadow: "0 3px 0 0 #7f1d1d",
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
