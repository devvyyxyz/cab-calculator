"use client";

import { useTilt } from "@/lib/useTilt";

/**
 * Wraps a modal/container in the same 3D tilt-on-hover effect used by buttons,
 * but with a much subtler range so large cards feel alive without being gimmicky.
 */
export function TiltCard({
  children,
  className,
  maxTilt = 4,
  maxTranslate = 2,
  style,
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  maxTranslate?: number;
  style?: React.CSSProperties;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "className" | "style">) {
  const { ref, handleMouseMove, handleMouseEnter, handleMouseLeave, tilt, isHovering } =
    useTilt<HTMLDivElement>(maxTilt, maxTranslate);

  return (
    <div
      {...rest}
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        ...style,
        transform: isHovering
          ? `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translate(${tilt.translateX}px, ${tilt.translateY}px)`
          : (style?.transform ?? "none"),
        transition: isHovering
          ? "none"
          : (style?.transition ?? "transform 0.3s ease-out, box-shadow 0.3s ease-out"),
      }}
    >
      {children}
    </div>
  );
}