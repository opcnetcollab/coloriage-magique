"use client";

import { useState } from "react";
import type { ColorLegendEntry } from "@/lib/api";

interface ColorSwatchLegendProps {
  legend: ColorLegendEntry[];
}

export default function ColorSwatchLegend({ legend }: ColorSwatchLegendProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="bg-[#FFF8F0] rounded-3xl p-5 shadow-card">
      <p className="text-sm font-display font-semibold text-[#312e29] mb-4">
        {`Nuancier — ${legend.length} couleur${legend.length > 1 ? "s" : ""}`}
      </p>

      <div
        className="flex flex-wrap gap-3"
        role="list"
        aria-label="Nuancier des couleurs"
      >
        {legend.map((entry, index) => (
          <div
            key={`${entry.symbol}-${index}`}
            className="relative"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            role="listitem"
          >
            {/* Swatch */}
            <div
              className={`
                w-9 h-9 rounded-xl shadow-card flex items-center justify-center
                cursor-default select-none
                transition-transform duration-150
                ${hoveredIndex === index ? "scale-110" : "scale-100"}
              `}
              style={{ backgroundColor: entry.hex }}
              aria-label={`Couleur ${entry.name} (${entry.symbol})`}
            >
              <span
                className="text-xs font-display font-bold text-white"
                style={{
                  textShadow:
                    "0 1px 2px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,0.6)",
                }}
                aria-hidden="true"
              >
                {entry.symbol}
              </span>
            </div>

            {/* Elegant tooltip */}
            {hoveredIndex === index && (
              <div
                className="
                  absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10
                  bg-[#312e29] text-[#fff0e3] text-xs rounded-2xl
                  px-3 py-1.5 whitespace-nowrap pointer-events-none shadow-float
                  font-body
                "
                role="tooltip"
              >
                {entry.name}
                {/* Arrow */}
                <span
                  className="
                    absolute top-full left-1/2 -translate-x-1/2
                    border-4 border-transparent border-t-[#312e29]
                  "
                  aria-hidden="true"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
