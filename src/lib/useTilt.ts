"use client";

import { useRef, useState } from "react";

interface TiltValues {
  x: number;
  y: number;
  translateX: number;
  translateY: number;
}

const DEFAULT_TILT: TiltValues = { x: 0, y: 0, translateX: 0, translateY: 0 };

/**
 * 3D tilt-on-hover effect driven by mouse position relative to the button.
 * This is the same effect the landing "Get Started" button uses; extracting it
 * into a shared hook so every button across the app can share identical behavior.
 */
export function useTilt(maxTilt = 12, maxTranslate = 4) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rafRef = useRef<number>();
  const [tilt, setTilt] = useState<TiltValues>(DEFAULT_TILT);
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Mouse position relative to button center (-1 to 1)
    const mouseX = (e.clientX - centerX) / (rect.width / 2);
    const mouseY = (e.clientY - centerY) / (rect.height / 2);

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      setTilt({
        x: -mouseY * maxTilt,
        y: mouseX * maxTilt,
        translateX: mouseX * maxTranslate,
        translateY: mouseY * maxTranslate,
      });
    });
  };

  const handleMouseEnter = () => setIsHovering(true);

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    setTilt(DEFAULT_TILT);
  };

  return {
    buttonRef,
    handleMouseMove,
    handleMouseEnter,
    handleMouseLeave,
    tilt,
    isHovering,
  };
}