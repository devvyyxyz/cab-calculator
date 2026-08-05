"use client";

/**
 * pixelarticons loader — renders the pixelarticons.com SVG icons inline so we
 * can tint them via `currentColor` (the source SVGs use fill="currentColor").
 * Source: https://pixelarticons.com/ (MIT license, by halfmage)
 *
 * Each icon is a 24×24 SVG with one or more <path> elements.
 */

type IconPaths = { d: string; fill?: string }[];

const ICON_PATHS: Record<string, IconPaths> = {
  repeat: [
    { d: "M17 5h2v2h-2zM5 17h2v2H5zm6-14h2v6h-2zM9 1h2v8H9zm0 8h2v2H9zm10 8H9v2h10zM5 7H3v10h2z" },
    { d: "M13 15h-2v6h2zm2-2h-2v8h2zm0 8h-2v2h2zM5 5h10v2H5zm14 12h2V7h-2z" },
  ],
  backpack: [
    { d: "M5 6h14v2H5zM3 8h2v12H3zm2 12h14v2H5zM19 8h2v12h-2z" },
    { d: "M7 16h2v6H7zm8 0h2v6h-2zm-6-2h6v2H9zm-2-4h10v2H7zm1-6h2v2H8zm6 0h2v2h-2zm-4-2h4v2h-4z" },
  ],
  "book-open": [
    { d: "M2 3h9v2H2zM0 19h11v2H0zM13 3h9v2h-9zm0 16h11v2H13zM11 5h2v18h-2zM0 5h2v14H0zm22 0h2v14h-2zm-7 2h5v2h-5zm0 4h5v2h-5zm0 4h2v2h-2z" },
  ],
  fire: [
    { d: "M9 2h2v4H9zM7 6h2v2H7zM5 8h2v2H5zm8 2h2v2h-2zm2-2h2v2h-2zm2 2h2v2h-2zm2 2h2v6h-2zM3 10h2v8H3zm8-4h2v4h-2zm6 12h2v2h-2zM7 20h10v2H7zm-2-2h2v2H5zm4-2h6v4H9z" },
    { d: "M11 14h2v3h-2z" },
  ],
  scale: [
    { d: "M13 9h2v2h-2zm2-2h2v2h-2zm2-2h2v2h-2zm2-2h2v8h-2z" },
    { d: "M13 3h8v2h-8zm-2 12H9v-2h2zm-2 2H7v-2h2zm-2 2H5v-2h2zm-2 2H3v-8h2z" },
    { d: "M11 21H3v-2h8z" },
  ],
  "info-box": [
    { d: "M4 2h16v2H4zm0 18h16v2H4zM2 4h2v16H2zm18 0h2v16h-2zm-9 5h2V7h-2zm0 8h2v-6h-2z" },
  ],
  close: [
    { d: "M7 19H5V17H7V19ZM19 19H17V17H19V19ZM9 15V17H7V15H9ZM17 17H15V15H17V17ZM11 15H9V13H11V15ZM15 15H13V13H15V15ZM13 13H11V11H13V13ZM11 11H9V9H11V11ZM15 11H13V9H15V11ZM9 9H7V7H9V9ZM17 9H15V7H17V9ZM7 7H5V5H7V7ZM19 7H17V5H19V7Z" },
  ],
  plus: [
    { d: "M13 11h7v2h-7v7h-2v-7H4v-2h7V4h2v7Z" },
  ],
};

export function PixelIcon({
  name,
  size = 24,
  color = "currentColor",
  outline,
  outlineWidth = 3,
  className,
}: {
  name: string;
  size?: number;
  color?: string;
  /** Optional outline (stroke) color — mimics the text-outline effect. */
  outline?: string;
  outlineWidth?: number;
  className?: string;
}) {
  const paths = ICON_PATHS[name] ?? ICON_PATHS["info-box"];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      shapeRendering="crispEdges"
      style={{
        imageRendering: "pixelated",
        // Draw stroke first, then fill — same effect as text-outline
        paintOrder: outline ? "stroke fill" : "normal",
      }}
      aria-hidden
    >
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          fill={color}
          stroke={outline ?? "none"}
          strokeWidth={outline ? outlineWidth : 0}
          strokeLinejoin="round"
          strokeLinecap="square"
        />
      ))}
    </svg>
  );
}
