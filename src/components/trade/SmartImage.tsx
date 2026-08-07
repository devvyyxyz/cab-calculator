"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * SmartImage - wraps next/image with a graceful fallback.
 * If the image fails to load OR the src is empty, we show a muted
 * version of the CAB logo plus a "no icon :(" caption below.
 *
 * Used for all brainrot/item icons across the site.
 */
export function SmartImage({
  src,
  alt,
  className,
  imgClassName,
  fallbackSize = 40,
  showCaption = true,
  fill = true,
}: {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  fallbackSize?: number;
  showCaption?: boolean;
  /** When true (default), uses layout-fill. When false, uses fixed fallbackSize. */
  fill?: boolean;
}) {
  const [errored, setErrored] = useState(false);

  if (errored || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-1 ${className ?? ""}`}
        style={fill ? { position: "absolute", inset: 0 } : { width: fallbackSize, height: fallbackSize }}
      >
        <Image
          src="/cab_icon.png"
          alt="No icon available"
          width={fallbackSize}
          height={fallbackSize}
          className="opacity-20 [image-rendering:pixelated]"
          style={{ filter: "grayscale(1)" }}
        />
        {showCaption && (
          <span
            className="text-[7px] leading-tight text-white/40"
            style={{ fontFamily: "var(--font-pixel), monospace" }}
          >
            no icon :(
          </span>
        )}
      </div>
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        onError={() => setErrored(true)}
        className={imgClassName ?? "h-full w-full object-contain p-1 [image-rendering:pixelated]"}
        style={{ imageRendering: "pixelated" }}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={fallbackSize}
      height={fallbackSize}
      unoptimized
      onError={() => setErrored(true)}
      className={imgClassName ?? "object-contain [image-rendering:pixelated]"}
      style={{ imageRendering: "pixelated" }}
    />
  );
}
