"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UploadZone from "@/components/UploadZone";
import DifficultySelector from "@/components/DifficultySelector";
import { createJob } from "@/lib/api";
import type { Difficulty, Format } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [format, setFormat] = useState<Format>("a4");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = file !== null && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const { job_id } = await createJob(file, difficulty, format);
      router.push(`/result/${job_id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Une erreur est survenue.";
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <main
      className="
        min-h-screen
        bg-gradient-to-br from-amber-50 via-purple-50 to-pink-50
        flex items-center justify-center p-4
      "
    >
      <div className="w-full max-w-lg animate-screen-enter">
        {/* ── Hero ──────────────────────────────────────── */}
        <div className="text-center mb-8">
          <h1 className="font-display font-extrabold text-4xl tracking-tight text-[#312e29]">
            🎨 Coloriage Magique
          </h1>
          <p className="mt-3 font-body text-base text-[#5f5b55] leading-relaxed">
            Transformez n&apos;importe quelle photo en coloriage imprimable.
          </p>
        </div>

        {/* ── Main Card — glass effect ────────────────── */}
        <form
          onSubmit={handleSubmit}
          className="
            bg-white/80 backdrop-blur-sm rounded-4xl shadow-xl
            p-7 flex flex-col gap-7
          "
        >
          {/* Step 1 — Upload */}
          <section>
            <StepLabel number={1} label="Choisissez une photo" />
            <div className="mt-3">
              <UploadZone file={file} onFile={setFile} />
            </div>
          </section>

          {/* Step 2 — Difficulty */}
          <section>
            <StepLabel number={2} label="Choisissez le niveau" />
            <div className="mt-3">
              <DifficultySelector value={difficulty} onChange={setDifficulty} />
            </div>
          </section>

          {/* Step 3 — Format */}
          <section>
            <StepLabel number={3} label="Format d&apos;impression" />
            <div
              className="mt-3 flex gap-3"
              role="radiogroup"
              aria-label="Format d'impression"
            >
              {(["a4", "a3"] as Format[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  role="radio"
                  aria-checked={format === f}
                  className={`
                    flex-1 rounded-3xl border-2 py-3 font-display font-semibold text-sm uppercase
                    transition-all duration-200
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f8a010]
                    active:scale-[0.97]
                    ${
                      format === f
                        ? "border-[#f8a010] bg-amber-50/60 text-amber-700 shadow-glow-amber"
                        : "border-[rgba(178,172,165,0.3)] bg-white text-[#5f5b55] hover:border-[rgba(167,139,250,0.4)]"
                    }
                  `}
                >
                  {f.toUpperCase()}
                  {f === "a3" && (
                    <span className="ml-1 text-xs text-amber-500 font-body font-normal normal-case">
                      (grand)
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Error */}
          {error && (
            <p
              className="text-sm text-red-700 bg-red-50 rounded-2xl px-4 py-2 flex items-center gap-2"
              role="alert"
            >
              <span aria-hidden="true">⚠️</span> {error}
            </p>
          )}

          {/* Submit — gradient amber → pink with sparkle on hover */}
          <button
            type="submit"
            disabled={!canSubmit}
            className={`
              w-full rounded-full py-4 font-display font-bold text-lg shadow-md
              transition-all duration-150
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f8a010]
              group
              ${
                canSubmit
                  ? "bg-gradient-to-r from-amber-400 to-pink-400 text-white hover:shadow-glow-amber hover:-translate-y-0.5 active:scale-95"
                  : "bg-[#e3dcd2] text-[#b2aca5] cursor-not-allowed"
              }
            `}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner /> Envoi en cours…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span
                  className={canSubmit ? "group-hover:animate-sparkle inline-block" : "inline-block"}
                  aria-hidden="true"
                >
                  ✨
                </span>
                Générer mon coloriage
              </span>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-[#b2aca5] font-body mt-4">
          Vos images sont traitées de façon sécurisée et supprimées sous 24h.
        </p>
      </div>
    </main>
  );
}

function StepLabel({ number, label }: { number: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="
          flex h-6 w-6 items-center justify-center rounded-full
          bg-gradient-to-br from-amber-400 to-pink-400
          text-xs font-display font-bold text-white shadow-sm
        "
      >
        {number}
      </span>
      <span className="font-display font-semibold text-sm text-[#312e29]">
        {label}
      </span>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8H4z"
      />
    </svg>
  );
}
