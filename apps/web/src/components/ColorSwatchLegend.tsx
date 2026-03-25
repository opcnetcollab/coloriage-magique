"use client";

import { useState } from "react";
import type { ColorLegendEntry } from "@/lib/api";

interface ColorSwatchLegendProps {
  legend: ColorLegendEntry[];
}

export default function ColorSwatchLegend({ legend }: ColorSwatchLegendProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="bg-gray-100 rounded-2xl p-4">
      <p className="text-sm font-semibold text-gray-700 mb-3">
        Nuancier — {legend.length} couleur{legend.length > 1 ? "s" : ""}
      </p>

      <div className="flex flex-wrap gap-2">
        {legend.map((entry, index) => (
          <div
            key={`${entry.symbol}-${index}`}
            className="relative"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Swatch */}
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center cursor-default select-none"
              style={{ backgroundColor: entry.hex }}
              aria-label={`Couleur ${entry.name} (${entry.symbol})`}
            >
              <span
                className="text-xs font-bold text-white"
                style={{
                  textShadow:
                    "0 1px 2px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,0.6)",
                }}
              >
                {entry.symbol}
              </span>
            </div>

            {/* Tooltip */}
            {hoveredIndex === index && (
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10
                           bg-gray-900 text-white text-xs rounded-lg px-2 py-1
                           whitespace-nowrap pointer-events-none shadow-lg"
                role="tooltip"
              >
                {entry.name}
                {/* Arrow */}
                <span
                  className="absolute top-full left-1/2 -translate-x-1/2
                             border-4 border-transparent border-t-gray-900"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
