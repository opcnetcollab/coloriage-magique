"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ColorLegendEntry } from "@/lib/api";

interface ColorSwatchLegendProps {
  legend: ColorLegendEntry[];
}

function getTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55 ? "oklch(18% 0.02 60)" : "#ffffff";
}

/** 3D-tilt card swatch */
function SwatchCard({
  entry,
  index,
}: {
  entry: ColorLegendEntry;
  index: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const textColor = getTextColor(entry.hex);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.transform = `perspective(300px) rotateX(${-y * 16}deg) rotateY(${x * 16}deg) scale(1.08)`;
  };

  const handleMouseLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform =
      "perspective(300px) rotateX(0deg) rotateY(0deg) scale(1)";
    setIsHovered(false);
    setTooltipVisible(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.04,
        type: "spring",
        stiffness: 400,
        damping: 24,
      }}
      className="relative"
      onMouseEnter={() => {
        setIsHovered(true);
        setTooltipVisible(true);
      }}
      onMouseLeave={handleMouseLeave}
      role="listitem"
    >
      {/* 3D card */}
      <div
        ref={ref}
        onMouseMove={handleMouseMove}
        className="w-12 h-12 rounded-xl flex items-center justify-center cursor-default select-none"
        style={{
          backgroundColor: entry.hex,
          transformStyle: "preserve-3d",
          transition: "transform 0.15s ease, box-shadow 0.2s ease",
          boxShadow: isHovered
            ? `0 8px 24px ${entry.hex}80`
            : `0 3px 10px ${entry.hex}50`,
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
            transform: "translateZ(8px)",
            display: "inline-block",
          }}
          aria-hidden="true"
        >
          {entry.symbol}
        </span>
      </div>

      {/* Elegant tooltip with backdrop-blur */}
      <AnimatePresence>
        {tooltipVisible && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.92 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 pointer-events-none"
            role="tooltip"
          >
            <div
              className="rounded-xl px-3 py-1.5 whitespace-nowrap font-body text-xs shadow-lg"
              style={{
                background: "oklch(15% 0.02 60 / 0.9)",
                color: "oklch(95% 0.01 80)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1px solid oklch(30% 0.02 60 / 0.4)",
              }}
            >
              <span className="font-semibold">{entry.name}</span>
              <span
                className="ml-1.5"
                style={{ color: "oklch(65% 0.01 80)" }}
              >
                #{index + 1}
              </span>
            </div>
            {/* Arrow */}
            <div
              className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
              style={{
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderTop: "5px solid oklch(15% 0.02 60 / 0.9)",
              }}
              aria-hidden
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ColorSwatchLegend({ legend }: ColorSwatchLegendProps) {
  const count = legend.length;
  const label = `Nuancier — ${count} couleur${count > 1 ? "s" : ""}`;

  return (
    <div
      className="card-amber p-5"
      style={{ backgroundColor: "oklch(98% 0.01 80)" }}
    >
      {/* Header */}
      <p
        className="font-display font-semibold uppercase tracking-wide text-xs mb-1"
        style={{ color: "oklch(60% 0.12 70)" }}
      >
        Palette de couleurs
      </p>
      <p
        className="font-display font-semibold text-sm mb-4"
        style={{ color: "oklch(18% 0.02 60)" }}
      >
        {label}
      </p>

      {/* Swatches grid — stagger animation */}
      <div
        className="flex flex-wrap gap-3"
        role="list"
        aria-label="Nuancier des couleurs"
      >
        {legend.map((entry, index) => (
          <SwatchCard
            key={`${entry.symbol}-${index}`}
            entry={entry}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
