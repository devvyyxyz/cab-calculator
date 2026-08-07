// ===== Trade share image (server-side) =====
// Builds an SVG that visually mirrors the trade calculator's on-site look as a
// horizontal 1200x630 card. Icons are supplied as inline data-URIs so the SVG
// can be rasterized to PNG by sharp without external network fetches.

import type { ShareTrade, ShareSide } from "./share-trade";

const FONT = "'Courier New', Courier, monospace";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface VerdictStyle {
  symbol: string;
  color: string;
  border: string;
}

function computeVerdict(you: number, them: number): VerdictStyle {
  const diff = you - them;
  const winner = diff > 0.5 ? "you" : diff < -0.5 ? "them" : "fair";
  if (winner === "fair")
    return { symbol: "=", color: "#fbbf24", border: "#92400e" };
  if (winner === "you") return { symbol: "−", color: "#ef4444", border: "#7f1d1d" };
  return { symbol: "+", color: "#22c55e", border: "#14532d" };
}

function renderSlots(
  side: ShareSide,
  panelX: number,
  panelY: number,
  innerBg: string,
  icons: Record<string, string>
): string {
  const cols = 4;
  const gap = 12;
  const pad = 22;
  const slotW = (520 - pad * 2 - gap * (cols - 1)) / cols;
  const slots = side.slots;
  const cells: string[] = [];

  for (let idx = 0; idx < 12; idx++) {
    const row = Math.floor(idx / cols);
    const col = idx % cols;
    const x = panelX + pad + col * (slotW + gap);
    const y = panelY + 66 + row * (slotW + gap);
    const slot = slots[idx];

    cells.push(
      `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${slotW.toFixed(1)}" height="${slotW.toFixed(
        1
      )}" rx="20" fill="${innerBg}" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>`
    );

    if (!slot) continue;

    const dataUri = slot.i ? icons[slot.i] : "";
    if (dataUri) {
      const s = slotW - 24;
      cells.push(
        `<image href="${dataUri}" x="${(x + (slotW - s) / 2).toFixed(
          1
        )}" y="${(y + (slotW - s) / 2).toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(
          1
        )}" preserveAspectRatio="xMidYMid meet" image-rendering="pixelated"/>`
      );
    }

    // quantity badge for items with qty > 1
    if (slot.q && slot.q > 1) {
      cells.push(
        `<text x="${(x + slotW - 6).toFixed(1)}" y="${(y + slotW - 6).toFixed(
          1
        )}" text-anchor="end" font-family="${FONT}" font-size="22" font-weight="bold" fill="#fff" style="paint-order:stroke fill;" stroke="#1e3a5f" stroke-width="4">×${slot.q}</text>`
      );
    }
  }
  return cells.join("");
}


function renderPanel(
  title: string,
  side: ShareSide,
  panelX: number,
  panelY: number,
  panelBg: string,
  panelBorder: string,
  innerBg: string,
  icons: Record<string, string>
): string {
  return `
    <g>
      <rect x="${panelX}" y="${panelY}" width="520" height="500" rx="24" fill="${panelBg}" stroke="${panelBorder}" stroke-width="5"/>
      <text x="${(panelX + 260).toFixed(1)}" y="${panelY + 30}" text-anchor="middle" font-family="${FONT}" font-size="28" font-weight="bold" fill="#fff" style="paint-order:stroke fill;" stroke="${panelBorder}" stroke-width="5">${esc(
    title
  )}</text>
      ${renderSlots(side, panelX, panelY, innerBg, icons)}
    </g>`;
}

export function buildTradeSvg(
  t: ShareTrade,
  icons: Record<string, string>
): string {
  const v = computeVerdict(t.you.total, t.them.total);
  const panelY = 110;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0099ff"/>

  ${renderPanel(
    "YOUR OFFER",
    t.you,
    34,
    panelY,
    "#7cb3ff",
    "#1e3a5f",
    "#d4e0eb",
    icons
  )}
  ${renderPanel(
    "THEIR OFFER",
    t.them,
    646,
    panelY,
    "#7ed957",
    "#2e5a1f",
    "#d8ecc8",
    icons
  )}

  <!-- fairness badge -->
  <g>
    <circle cx="600" cy="370" r="48" fill="${v.color}" stroke="${v.border}" stroke-width="6"/>
    <text x="600" y="${
      370 + 18
    }" text-anchor="middle" font-family="${FONT}" font-size="52" font-weight="bold" fill="#fff" style="paint-order:stroke fill;" stroke="${
    v.border
  }" stroke-width="5">${v.symbol}</text>
  </g>
</svg>`;
}

