"use client";

import { useState } from "react";
import type { ColorLegendEntry } from "@/lib/api";

interface ColorSwatchLegendProps {
  legend: ColorLegendEntry[];
}

/** Compute whether white or dark text is more readable on a given hex background */
function getTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Perceived luminance
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55 ? "#1c1917" : "#ffffff";
}

export default function ColorSwatchLegend({ legend }: ColorSwatchLegendProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const count = legend.length;
  const label = `Nuancier — ${count} couleur${count > 1 ? "s" : ""}`;

  return (
    <div
      className="card-amber p-5"
      style={{ backgroundColor: "#fffbf5" }}
    >
      {/* Header — single visible label that tests can find */}
      <p
        className="font-display font-semibold uppercase tracking-wide text-xs mb-1"
        style={{ color: "#d97706" }}
      >
        Palette de couleurs
      </p>
      <p
        className="font-display font-semibold text-sm mb-4"
        style={{ color: "#1c1917" }}
      >
        {label}
      </p>

      {/* Swatches grid */}
      <div
        className="flex flex-wrap gap-3"
        role="list"
        aria-label="Nuancier des couleurs"
      >
        {legend.map((entry, index) => {
          const isHovered = hoveredIndex === index;
          const textColor = getTextColor(entry.hex);

          return (
            <div
              key={`${entry.symbol}-${index}`}
              className="relative"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              role="listitem"
            >
              {/* Swatch — 48×48px */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center cursor-default select-none transition-all duration-150"
                style={{
                  backgroundColor: entry.hex,
                  transform: isHovered ? "scale(1.12)" : "scale(1)",
                  boxShadow: isHovered
                    ? `0 8px 20px ${entry.hex}60`
                    : `0 2px 8px ${entry.hex}40`,
                }}
                aria-label={`Couleur ${entry.name} (${entry.symbol})`}
              >
                <span
                  className="font-display font-extrabold text-sm leading-none"
                  style={{
                    color: textColor,
                    textShadow:
                      textColor === "#ffffff"
                        ? "0 1px 3px rgba(0,0,0,0.5)"
                        : "0 1px 2px rgba(255,255,255,0.5)",
                  }}
                  aria-hidden="true"
                >
                  {entry.symbol}
                </span>
              </div>

              {/* Tooltip */}
              {isHovered && (
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20
                             rounded-xl px-3 py-1.5 whitespace-nowrap pointer-events-none
                             font-body text-xs shadow-amber-md"
                  style={{
                    background: "linear-gradient(135deg, #1c1917, #312e29)",
                    color: "#fff8f0",
                  }}
                  role="tooltip"
                >
                  <span className="font-semibold">{entry.name}</span>
                  <span className="ml-1.5 opacity-60">#{index + 1}</span>
                  {/* Arrow */}
                  <span
                    className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent"
                    style={{ borderTopColor: "#1c1917" }}
                    aria-hidden="true"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
