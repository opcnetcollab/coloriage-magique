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
    <main className="min-h-screen" style={{ backgroundColor: "#fffbf5" }}>
      {/* ── Floating background particles ─────────────────────────────────── */}
      <div aria-hidden className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {[
          { e: "🖍️", top: "8%",  left: "3%",  delay: "0s",   dur: "5s"   },
          { e: "✏️", top: "15%", right: "5%", delay: "1.3s", dur: "4.5s" },
          { e: "🎨", top: "70%", left: "2%",  delay: "0.7s", dur: "6s"   },
          { e: "🖍️", top: "80%", right: "3%", delay: "2s",   dur: "5.5s" },
          { e: "✏️", top: "45%", right: "8%", delay: "0.4s", dur: "4.8s" },
          { e: "🎨", top: "55%", left: "6%",  delay: "1.6s", dur: "5.2s" },
        ].map((p, i) => (
          <span
            key={i}
            className="absolute text-3xl select-none animate-drift"
            style={{
              top: p.top,
              left: "left" in p ? p.left : undefined,
              right: "right" in p ? p.right : undefined,
              animationDelay: p.delay,
              animationDuration: p.dur,
            }}
          >
            {p.e}
          </span>
        ))}
      </div>

      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <nav
        className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto"
      >
        <a
          href="/"
          className="font-display font-bold text-xl flex items-center gap-2"
          style={{ color: "#1c1917" }}
        >
          <span aria-hidden="true">✏️</span>
          Coloriage Magique
        </a>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="font-display font-semibold text-sm px-4 py-2 rounded-full transition-colors"
            style={{ color: "#5f5b55" }}
          >
            Connexion
          </button>
          <button
            type="button"
            className="btn-primary text-sm"
            style={{ padding: "0.5rem 1.25rem" }}
          >
            S&apos;inscrire
          </button>
        </div>
      </nav>

      {/* ── Hero — split layout ───────────────────────────────────────────── */}
      <section className="relative z-10 grid lg:grid-cols-2 gap-16 max-w-6xl mx-auto px-6 py-16">
        {/* ── LEFT — Form ──────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-8">
          {/* Headline */}
          <div>
            <h1
              className="font-display font-extrabold leading-tight"
              style={{ fontSize: "clamp(2.5rem, 5vw, 3.5rem)", color: "#1c1917" }}
            >
              Transformez vos photos
              <br />
              <span className="gradient-text">en œuvres à colorier</span>
            </h1>
            <p
              className="font-body text-lg mt-5 leading-relaxed"
              style={{ color: "#5f5b55" }}
            >
              Importez n&apos;importe quelle photo et obtenez un coloriage
              imprimable avec nuancier en quelques secondes. Parfait pour les
              enfants et les passionnés d&apos;art.
            </p>
          </div>

          {/* Form card */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-7">
            {/* Step 1 — Upload */}
            <section>
              <StepLabel number={1} label="Choisissez une photo" />
              <div className="mt-3">
                <UploadZone file={file} onFile={setFile} />
              </div>
            </section>

            {/* Step 2 — Difficulty */}
            <section>
              <StepLabel number={2} label="Niveau de complexité" />
              <div className="mt-3">
                <DifficultySelector value={difficulty} onChange={setDifficulty} />
              </div>
            </section>

            {/* Step 3 — Format toggle */}
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
                      flex-1 rounded-full border-2 py-3 font-display font-bold text-sm uppercase
                      transition-all duration-200
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500
                      active:scale-[0.97]
                    `}
                    style={
                      format === f
                        ? {
                            borderColor: "#d97706",
                            backgroundColor: "#fffbeb",
                            color: "#b45309",
                            boxShadow: "0 10px 40px rgba(217,119,6,0.18)",
                          }
                        : {
                            borderColor: "rgba(217,119,6,0.2)",
                            backgroundColor: "white",
                            color: "#5f5b55",
                          }
                    }
                  >
                    {f.toUpperCase()}
                    {f === "a3" && (
                      <span
                        className="ml-1 text-xs font-body font-normal normal-case"
                        style={{ color: "#d97706" }}
                      >
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
                className="text-sm rounded-2xl px-4 py-2 flex items-center gap-2 font-body"
                style={{ color: "#b91c1c", backgroundColor: "#fef2f2" }}
                role="alert"
              >
                <span aria-hidden="true">⚠️</span> {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className={`
                w-full rounded-full py-4 font-display font-bold text-lg
                transition-all duration-150 group
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500
              `}
              style={
                canSubmit
                  ? {
                      background: "linear-gradient(135deg, #d97706, #7c3aed)",
                      color: "white",
                      boxShadow: "0 8px 30px rgba(217,119,6,0.35)",
                    }
                  : {
                      backgroundColor: "#e3dcd2",
                      color: "#b2aca5",
                      cursor: "not-allowed",
                    }
              }
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner /> Envoi en cours…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span className={canSubmit ? "animate-sparkle inline-block" : "inline-block"} aria-hidden>
                    ✨
                  </span>
                  Générer mon coloriage
                </span>
              )}
            </button>

            <p className="text-center text-sm font-body" style={{ color: "#b2aca5" }}>
              3 conversions gratuites · Sans inscription
            </p>
          </form>
        </div>

        {/* ── RIGHT — Stacked preview cards ──────────────────────────────── */}
        <div className="relative hidden lg:flex items-center justify-center">
          {/* Background card — rotate +3° */}
          <div
            className="absolute card-amber p-4 w-72"
            style={{
              transform: "rotate(3deg) translateY(20px)",
              zIndex: 1,
            }}
          >
            <div
              className="w-full h-48 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "#fef3e2" }}
            >
              <span className="text-4xl" aria-hidden>🖼️</span>
            </div>
            <p className="font-display font-semibold text-xs mt-2" style={{ color: "#b2aca5" }}>
              Photo originale
            </p>
          </div>

          {/* Middle card — rotate -2° */}
          <div
            className="absolute card-amber p-4 w-72"
            style={{
              transform: "rotate(-2deg) translateY(-10px)",
              zIndex: 2,
            }}
          >
            <div
              className="w-full h-48 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "#ede9fe" }}
            >
              <span className="text-4xl" aria-hidden>✏️</span>
            </div>
            <p className="font-display font-semibold text-xs mt-2" style={{ color: "#b2aca5" }}>
              Coloriage en cours…
            </p>
          </div>

          {/* Front card — no rotation */}
          <div
            className="relative card-amber p-4 w-72"
            style={{ zIndex: 3, boxShadow: "0 20px 60px rgba(217,119,6,0.28)" }}
          >
            <div
              className="w-full h-48 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "#fffbeb" }}
            >
              <span className="text-5xl" aria-hidden>🎨</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="font-display font-bold text-sm" style={{ color: "#1c1917" }}>
                Coloriage prêt !
              </p>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-display font-bold"
                style={{ backgroundColor: "#d97706", color: "white" }}
              >
                PDF
              </span>
            </div>

            {/* Color swatches preview */}
            <div className="flex gap-1.5 mt-2">
              {["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a78bfa"].map((c) => (
                <div
                  key={c}
                  className="w-5 h-5 rounded-full"
                  style={{ backgroundColor: c }}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>

          {/* Decorative gradient blob */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at center, rgba(217,119,6,0.06) 0%, transparent 70%)",
              width: "400px",
              height: "400px",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
            aria-hidden
          />
        </div>
      </section>

      {/* ── Features strip ────────────────────────────────────────────────── */}
      <section
        className="relative z-10 max-w-6xl mx-auto px-6 pb-20"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: "⚡", title: "Rapide", desc: "Résultat en moins de 30 secondes" },
            { icon: "🎯", title: "Précis", desc: "Zones numérotées avec nuancier" },
            { icon: "🖨️", title: "Imprimable", desc: "PDF haute résolution A4/A3" },
          ].map((feat) => (
            <div key={feat.title} className="card-amber p-6 flex gap-4 items-start">
              <span className="text-3xl" aria-hidden>{feat.icon}</span>
              <div>
                <p className="font-display font-bold text-base" style={{ color: "#1c1917" }}>
                  {feat.title}
                </p>
                <p className="font-body text-sm mt-1" style={{ color: "#5f5b55" }}>
                  {feat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function StepLabel({ number, label }: { number: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-display font-bold text-white shadow-amber-sm"
        style={{ background: "linear-gradient(135deg, #d97706, #7c3aed)" }}
      >
        {number}
      </span>
      <span className="font-display font-semibold text-sm" style={{ color: "#1c1917" }}>
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
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}
