"use client";

import type { Difficulty } from "@/lib/api";

interface DifficultyOption {
  value: Difficulty;
  emoji: string;
  label: string;
  description: string;
  range: string;
  popularBadge?: boolean;    // purple "Populaire" badge
  a3Badge?: string;          // amber pill badge (e.g. "A3 recommandé")
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

export default function DifficultySelector({
  value,
  onChange,
}: DifficultySelectorProps) {
  return (
    <div
      className="flex flex-col gap-3"
      role="radiogroup"
      aria-label="Niveau de complexité"
    >
      <p className="text-sm font-display font-semibold" style={{ color: "#1c1917" }}>
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
                text-center transition-all duration-200
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500
                active:scale-[0.97]
                ${isSelected
                  ? "border-2 border-amber-500 shadow-amber-lg"
                  : "border border-amber-200/50 hover:border-amber-400/50 hover:shadow-amber-sm"
                }
              `}
              style={{
                background: isSelected
                  ? "linear-gradient(145deg, #fff, #fffbeb)"
                  : "white",
                boxShadow: isSelected
                  ? "0 20px 60px rgba(217,119,6,0.22)"
                  : "0 8px 40px rgba(49,46,41,0.06)",
              }}
            >
              {/* "Populaire" badge — purple, top-right */}
              {opt.popularBadge && (
                <span
                  className="absolute top-3 right-3 rounded-full px-2 py-0.5 text-[10px] font-display font-bold"
                  style={{ backgroundColor: "#7c3aed", color: "white" }}
                >
                  Populaire
                </span>
              )}

              {/* "A3 recommandé" pill — amber, top-center */}
              {opt.a3Badge && (
                <span
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[10px] font-display font-bold whitespace-nowrap shadow-sm"
                  style={{ backgroundColor: "#d97706", color: "white" }}
                >
                  {opt.a3Badge}
                </span>
              )}

              {/* Emoji large */}
              <span className="text-5xl leading-none" aria-hidden="true">
                {opt.emoji}
              </span>

              {/* Label */}
              <span
                className="font-display font-bold text-base leading-tight"
                style={{ color: "#1c1917" }}
              >
                {opt.label}
              </span>

              {/* Range badge */}
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-display font-semibold"
                style={{ backgroundColor: "#fef3c7", color: "#b45309" }}
              >
                {opt.range}
              </span>

              {/* Description */}
              <span
                className="text-xs font-body leading-relaxed"
                style={{ color: "#5f5b55" }}
              >
                {opt.description}
              </span>

              {/* Selected checkmark badge */}
              {isSelected && (
                <span
                  className="mt-1 rounded-full px-2 py-0.5 text-[10px] font-display font-bold"
                  style={{ backgroundColor: "#fef3c7", color: "#d97706" }}
                  aria-hidden="true"
                >
                  ✓ Sélectionné
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
