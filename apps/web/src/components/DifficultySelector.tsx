"use client";

import type { Difficulty } from "@/lib/api";

interface DifficultyOption {
  value: Difficulty;
  color: string;          // badge circle color
  label: string;
  description: string;
  range: string;
  badge?: string;
}

const OPTIONS: DifficultyOption[] = [
  {
    value: "beginner",
    color: "#22C55E",
    label: "Débutant",
    description: "Parfait pour les petits",
    range: "5-8 couleurs",
  },
  {
    value: "intermediate",
    color: "#EAB308",
    label: "Confirmé",
    description: "Pour les amateurs éclairés",
    range: "8-14 couleurs",
  },
  {
    value: "expert",
    color: "#EF4444",
    label: "Expert",
    description: "Pour les passionnés",
    range: "14-25 couleurs",
    badge: "A3 recommandé",
  },
];

interface DifficultySelectorProps {
  value: Difficulty;
  onChange: (difficulty: Difficulty) => void;
}

export default function DifficultySelector({
  value,
  onChange,
}: DifficultySelectorProps) {
  return (
    <div
      className="flex flex-col gap-2"
      role="radiogroup"
      aria-label="Niveau de complexité"
    >
      <p className="text-sm font-display font-semibold text-[#312e29]">
        Niveau de complexité
      </p>

      <div className="grid grid-cols-3 gap-3">
        {OPTIONS.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(opt.value)}
              className={`
                relative flex flex-col items-center gap-2 rounded-3xl px-3 py-5
                text-center shadow-card transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f8a010]
                active:scale-[0.97]
                ${
                  isSelected
                    ? "border-2 border-[#f8a010] bg-amber-50/60 shadow-glow-amber"
                    : "border border-[rgba(178,172,165,0.3)] bg-white hover:bg-[#eee7de]/40 hover:border-[rgba(167,139,250,0.4)]"
                }
              `}
            >
              {/* A3 recommended badge */}
              {opt.badge && (
                <span
                  className="
                    absolute -top-2.5 left-1/2 -translate-x-1/2
                    rounded-full bg-amber-400 text-white
                    px-2 py-0.5 text-[10px] font-display font-bold
                    whitespace-nowrap shadow-sm
                  "
                >
                  {opt.badge}
                </span>
              )}

              {/* Difficulty circle */}
              <span
                className="h-8 w-8 rounded-full shadow-sm flex-shrink-0"
                style={{ backgroundColor: opt.color }}
                aria-hidden="true"
              />

              {/* Label */}
              <span className="font-display font-semibold text-sm text-[#312e29] leading-tight">
                {opt.label}
              </span>

              {/* Color count chip */}
              <span
                className="
                  rounded-full px-2 py-0.5 text-[11px] font-display font-semibold
                  bg-[#ff8bc5]/20 text-[#a02d70]
                "
              >
                {opt.range}
              </span>

              {/* Description */}
              <span className="text-xs text-[#5f5b55] font-body leading-tight">
                {opt.description}
              </span>

              {/* Selected checkmark */}
              {isSelected && (
                <span
                  className="
                    absolute top-2 right-2 h-5 w-5 rounded-full
                    bg-[#f8a010] text-white flex items-center justify-center
                    text-xs font-bold shadow-sm
                  "
                  aria-hidden="true"
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
