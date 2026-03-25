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
    <main className="min-h-screen bg-gradient-to-br from-amber-100 via-purple-100 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            🎨 Coloriage Magique
          </h1>
          <p className="mt-2 text-gray-600">
            Transformez n&apos;importe quelle photo en coloriage imprimable.
          </p>
        </div>

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl shadow-xl p-6 flex flex-col gap-6"
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
            <div className="mt-3 flex gap-3">
              {(["a4", "a3"] as Format[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  aria-pressed={format === f}
                  className={`
                    flex-1 rounded-xl border-2 py-3 font-semibold text-sm uppercase
                    transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500
                    ${
                      format === f
                        ? "border-purple-500 bg-violet-50 text-purple-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-purple-300"
                    }
                  `}
                >
                  {f.toUpperCase()}
                  {f === "a3" && (
                    <span className="ml-1 text-xs text-purple-500">(grand)</span>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Error */}
          {error && (
            <p
              className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2 flex items-center gap-2"
              role="alert"
            >
              <span>⚠️</span> {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className={`
              w-full rounded-2xl py-4 font-bold text-lg text-white shadow-md
              transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500
              ${
                canSubmit
                  ? "bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 active:scale-95"
                  : "bg-gray-300 cursor-not-allowed"
              }
            `}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner /> Envoi en cours…
              </span>
            ) : (
              "✨ Générer mon coloriage"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          Vos images sont traitées de façon sécurisée et supprimées sous 24h.
        </p>
      </div>
    </main>
  );
}

function StepLabel({ number, label }: { number: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">
        {number}
      </span>
      <span className="font-semibold text-gray-800">{label}</span>
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
