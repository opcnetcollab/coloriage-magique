"use client";

import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import type { Difficulty } from "@/lib/api";

interface DifficultyOption {
  value: Difficulty;
  emoji: string;
  label: string;
  description: string;
  range: string;
  popularBadge?: boolean;
  a3Badge?: string;
}

const OPTIONS: DifficultyOption[] = [
  {
    value: "beginner",
    emoji: "🌱",
    label: "Débutant",
    description: "Parfait pour les petits",
    range: "5-8 couleurs",
  },
  {
    value: "intermediate",
    emoji: "🎨",
    label: "Confirmé",
    description: "Pour les amateurs éclairés",
    range: "8-14 couleurs",
    popularBadge: true,
  },
  {
    value: "expert",
    emoji: "🖼️",
    label: "Expert",
    description: "Pour les passionnés du détail",
    range: "14-25 couleurs",
    a3Badge: "A3 recommandé",
  },
];

interface DifficultySelectorProps {
  value: Difficulty;
  onChange: (difficulty: Difficulty) => void;
}

export default function DifficultySelector({ value, onChange }: DifficultySelectorProps) {
  return (
    <LayoutGroup>
      <div
        className="flex flex-col gap-3"
        role="radiogroup"
        aria-label="Niveau de complexité"
      >
        <p
          className="text-sm font-display font-semibold"
          style={{ color: "oklch(18% 0.02 60)" }}
        >
          Niveau de complexité
        </p>

        <div className="grid grid-cols-3 gap-3">
          {OPTIONS.map((opt) => {
            const isSelected = value === opt.value;

            return (
              <motion.button
                key={opt.value}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onChange(opt.value)}
                layout
                initial={false}
                animate={{
                  scale: isSelected ? 1.02 : 1,
                  y: isSelected ? -2 : 0,
                }}
                whileHover={{ scale: isSelected ? 1.02 : 1.01, y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="relative flex flex-col items-center gap-2 rounded-3xl px-3 py-5 text-center focus-visible:outline-none overflow-hidden"
                style={{
                  background: isSelected
                    ? "oklch(99% 0.005 80)"
                    : "oklch(99% 0.005 80)",
                  border: isSelected
                    ? "2px solid oklch(75% 0.15 70)"
                    : "1px solid oklch(85% 0.04 70)",
                  boxShadow: isSelected
                    ? "0 0 0 4px oklch(75% 0.15 70 / 0.12), 0 12px 40px oklch(75% 0.15 70 / 0.22)"
                    : "0 4px 16px oklch(18% 0.02 60 / 0.05)",
                  cursor: "pointer",
                }}
              >
                {/* Selected inner glow */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 pointer-events-none rounded-3xl"
                      style={{
                        background:
                          "radial-gradient(ellipse at top, oklch(75% 0.15 70 / 0.08) 0%, transparent 70%)",
                      }}
                      aria-hidden
                    />
                  )}
                </AnimatePresence>

                {/* Shared layout selected indicator */}
                {isSelected && (
                  <motion.div
                    layoutId="difficulty-selected-ring"
                    className="absolute inset-0 rounded-3xl pointer-events-none"
                    style={{
                      border: "2px solid oklch(75% 0.15 70)",
                      borderRadius: "1.5rem",
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    aria-hidden
                  />
                )}

                {/* "Populaire" badge */}
                {opt.popularBadge && (
                  <span
                    className="absolute top-3 right-3 rounded-full px-2 py-0.5 text-[10px] font-display font-bold z-10"
                    style={{ backgroundColor: "oklch(45% 0.22 300)", color: "white" }}
                  >
                    Populaire
                  </span>
                )}

                {/* "A3 recommandé" pill */}
                {opt.a3Badge && (
                  <span
                    className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[10px] font-display font-bold whitespace-nowrap shadow-sm z-10"
                    style={{ backgroundColor: "oklch(75% 0.15 70)", color: "white" }}
                  >
                    {opt.a3Badge}
                  </span>
                )}

                {/* Emoji with float animation */}
                <motion.span
                  animate={{ y: [0, -5, 0] }}
                  transition={{
                    duration: 2.5 + OPTIONS.indexOf(opt) * 0.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="leading-none z-10"
                  aria-hidden="true"
                  style={{ fontSize: "3.5rem", display: "inline-block" }}
                >
                  {opt.emoji}
                </motion.span>

                {/* Label */}
                <span
                  className="font-display font-bold text-base leading-tight z-10"
                  style={{ color: "oklch(18% 0.02 60)" }}
                >
                  {opt.label}
                </span>

                {/* Range badge */}
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-display font-semibold z-10"
                  style={{
                    backgroundColor: "oklch(96% 0.06 80)",
                    color: "oklch(50% 0.14 70)",
                  }}
                >
                  {opt.range}
                </span>

                {/* Description */}
                <span
                  className="text-xs font-body leading-relaxed z-10"
                  style={{ color: "oklch(45% 0.02 60)" }}
                >
                  {opt.description}
                </span>

                {/* Selected checkmark */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.7 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      className="mt-1 rounded-full px-2 py-0.5 text-[10px] font-display font-bold z-10"
                      style={{
                        backgroundColor: "oklch(96% 0.06 80)",
                        color: "oklch(60% 0.12 70)",
                      }}
                      aria-hidden="true"
                    >
                      ✓ Sélectionné
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>
    </LayoutGroup>
  );
}
