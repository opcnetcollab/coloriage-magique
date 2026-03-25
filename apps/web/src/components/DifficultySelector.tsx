"use client";

import type { Difficulty } from "@/lib/api";

interface DifficultyOption {
  value: Difficulty;
  emoji: string;
  label: string;
  description: string;
  range: string;
  badge?: string;
}

const OPTIONS: DifficultyOption[] = [
  {
    value: "beginner",
    emoji: "🟢",
    label: "Débutant",
    description: "Parfait pour les petits",
    range: "5-8 couleurs",
  },
  {
    value: "intermediate",
    emoji: "🟡",
    label: "Confirmé",
    description: "Pour les amateurs éclairés",
    range: "8-14 couleurs",
  },
  {
    value: "expert",
    emoji: "🔴",
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
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-gray-700">
        Niveau de complexité
      </p>

      <div className="grid grid-cols-3 gap-3">
        {OPTIONS.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={isSelected}
              className={`
                relative flex flex-col items-center gap-1 rounded-xl border-2 p-3
                text-center transition-all focus-visible:outline-none
                focus-visible:ring-2 focus-visible:ring-purple-500
                ${
                  isSelected
                    ? "border-purple-500 bg-violet-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-purple-300 hover:bg-violet-50/40"
                }
              `}
            >
              {/* Badge */}
              {opt.badge && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-purple-600 px-2 py-0.5 text-[10px] font-bold text-white whitespace-nowrap shadow">
                  {opt.badge}
                </span>
              )}

              <span className="text-xl">{opt.emoji}</span>
              <span className="font-semibold text-sm text-gray-800">
                {opt.label}
              </span>
              <span className="text-xs text-purple-600 font-medium">
                {opt.range}
              </span>
              <span className="text-xs text-gray-500 leading-tight">
                {opt.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
