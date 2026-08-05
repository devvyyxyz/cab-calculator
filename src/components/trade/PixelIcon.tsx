"use client";

/**
 * Hand-crafted pixel-art SVG icons rendered on a 16×16 grid.
 * Uses `shape-rendering: crispEdges` so the pixels stay sharp at any size.
 * Each icon is built from <rect> blocks — no curves, no anti-aliasing.
 */

export type PixelIconName =
  | "trade"
  | "inventory"
  | "rots"
  | "skins"
  | "values"
  | "about";

// 16x16 grid helper. Colors: 1 = foreground, 0 = transparent.
// Each icon is defined as rows of 16 chars. The grid is then rendered as rects.
function gridToRects(grid: string[], color: string) {
  const rects: React.ReactNode[] = [];
  const size = grid.length;
  const cell = 1; // 1 unit per cell in the SVG viewBox

  grid.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = row[x];
      if (c === "1") {
        rects.push(
          <rect
            key={`${x}-${y}`}
            x={x * cell}
            y={y * cell}
            width={cell}
            height={cell}
            fill={color}
          />
        );
      }
    }
  });
  return rects;
}

// ---- Icon definitions (16x16 pixel grids) ----
// "1" = filled pixel, "." = transparent
const ICONS: Record<PixelIconName, string[]> = {
  // Trade: two thick horizontal arrows pointing opposite directions (swap)
  // Top arrow points right, bottom arrow points left
  trade: [
    "................",
    "................",
    "....11111111....",
    "...1........1...",
    "...1..11111111..",
    "...1..1.........",
    "...1..1.........",
    ".......1........",
    ".......1........",
    ".......1........",
    ".1111111..1.....",
    ".1........1.....",
    "..11111111..1...",
    "................",
    "................",
    "................",
  ],
  // Inventory: a backpack with a flap and straps
  inventory: [
    "................",
    "................",
    "...11111111.....",
    "..1........1....",
    ".1..111111..1...",
    ".1..1....1..1...",
    ".1..1....1..1...",
    "11..111111..11..",
    "1.............1.",
    "1.11111111111.1.",
    "1.1.........1.1.",
    "1.1.........1.1.",
    "1.11111111111.1.",
    ".1...........1..",
    "..11111111111...",
    "................",
  ],
  // Brainrots: a brain — two squiggly hemispheres with a clear gap
  rots: [
    "................",
    "................",
    "..1111....1111..",
    ".1....1..1....1.",
    "1.11..11.11..11.",
    "1.1..1.1.1.1..1.",
    "1.1.1.1.1.1.1.1.",
    "1.1.1.1.1.1.1.1.",
    "1.1.1.1.1.1.1.1.",
    "1.1.1.1.1.1.1.1.",
    "1.1.1.1.1.1.1.1.",
    "1.11..11.11..11.",
    ".1....1..1....1.",
    "..1111....1111..",
    "................",
    "................",
  ],
  // Hoverboards: a rocket
  skins: [
    "................",
    ".......11.......",
    "......111.......",
    "......111.......",
    ".....11111......",
    ".....1...1......",
    "....1.....1.....",
    "....1.....1.....",
    "....1.....1.....",
    "....1.....1.....",
    ".....11111......",
    ".....1...1......",
    "....1.1.1.1.....",
    "....1.1.1.1.....",
    ".....1...1......",
    "................",
  ],
  // Values: a balance scale — central pillar, beam, two pans hanging
  values: [
    "................",
    "................",
    ".......11.......",
    ".......11.......",
    ".......11.......",
    "11111111111111..",
    "1............1..",
    ".1....11....1...",
    "..1..1..1..1....",
    "...111..111.....",
    ".......11.......",
    ".......11.......",
    ".....11111111...",
    ".....1......1...",
    ".....1......1...",
    ".....11111111...",
  ],
  // About: info "i" in a rounded square frame
  about: [
    "................",
    "....11111111....",
    "...1........1...",
    "..1....11....1..",
    "..1....11....1..",
    "..1..........1..",
    "..1....11....1..",
    "..1....11....1..",
    "..1....11....1..",
    "..1....11....1..",
    "..1....11....1..",
    "..1..........1..",
    "...1........1...",
    "....11111111....",
    "................",
    "................",
  ],
};

export function PixelIcon({
  name,
  size = 24,
  color = "#cbd5e1",
  className,
}: {
  name: PixelIconName;
  size?: number;
  color?: string;
  className?: string;
}) {
  const grid = ICONS[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      className={className}
      shapeRendering="crispEdges"
      style={{ imageRendering: "pixelated" }}
      aria-hidden
    >
      {gridToRects(grid, color)}
    </svg>
  );
}
