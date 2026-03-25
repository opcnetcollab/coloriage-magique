"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useInView, AnimatePresence } from "framer-motion";
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
    <main className="min-h-screen" style={{ backgroundColor: "oklch(98% 0.01 80)" }}>
      {/* ── Navbar ── */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <a
          href="/"
          className="font-display font-bold text-xl flex items-center gap-2"
          style={{ color: "oklch(18% 0.02 60)" }}
        >
          <motion.span
            animate={{ rotate: [-15, 10, -15] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{ display: "inline-block" }}
            aria-hidden="true"
          >
            ✏️
          </motion.span>
          Coloriage Magique
        </a>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="font-display font-semibold text-sm px-4 py-2 rounded-full transition-colors"
            style={{ color: "oklch(45% 0.02 60)" }}
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

      {/* ── Hero split layout ── */}
      <section className="relative z-10 grid lg:grid-cols-2 gap-16 max-w-6xl mx-auto px-6 py-12 lg:py-16">
        {/* LEFT — Form */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col gap-8"
        >
          {/* Headline — strong typography, no gradient text */}
          <div>
            <h1
              className="font-display font-extrabold leading-tight"
              style={{
                fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
                color: "oklch(18% 0.02 60)",
                letterSpacing: "-0.03em",
              }}
            >
              Transformez vos photos
              <br />
              en œuvres à colorier
            </h1>
            <p
              className="font-body text-lg mt-5 leading-relaxed"
              style={{ color: "oklch(45% 0.02 60)" }}
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

            {/* Step 3 — Format */}
            <section>
              <StepLabel number={3} label="Format d&apos;impression" />
              <div
                className="mt-3 flex gap-3"
                role="radiogroup"
                aria-label="Format d'impression"
              >
                {(["a4", "a3"] as Format[]).map((f) => (
                  <motion.button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    role="radio"
                    aria-checked={format === f}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    animate={{
                      borderColor:
                        format === f
                          ? "oklch(75% 0.15 70)"
                          : "oklch(85% 0.04 70)",
                      backgroundColor:
                        format === f ? "oklch(97% 0.04 80)" : "oklch(99% 0.005 80)",
                      color:
                        format === f
                          ? "oklch(50% 0.14 70)"
                          : "oklch(45% 0.02 60)",
                      boxShadow:
                        format === f
                          ? "0 8px 30px oklch(75% 0.15 70 / 0.2)"
                          : "none",
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="flex-1 rounded-full border-2 py-3 font-display font-bold text-sm uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    style={{ cursor: "pointer" }}
                  >
                    {f.toUpperCase()}
                    {f === "a3" && (
                      <span
                        className="ml-1 text-xs font-body font-normal normal-case"
                        style={{ color: "oklch(60% 0.12 70)" }}
                      >
                        (grand)
                      </span>
                    )}
                  </motion.button>
                ))}
              </div>
            </section>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm rounded-2xl px-4 py-2 flex items-center gap-2 font-body"
                  style={{ color: "#b91c1c", backgroundColor: "#fef2f2" }}
                  role="alert"
                >
                  <span aria-hidden="true">⚠️</span> {error}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={!canSubmit}
              whileHover={canSubmit ? { scale: 1.02, y: -1 } : {}}
              whileTap={canSubmit ? { scale: 0.98 } : {}}
              className="w-full rounded-full py-4 font-display font-bold text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              style={
                canSubmit
                  ? {
                      background: "linear-gradient(135deg, oklch(65% 0.15 70), oklch(45% 0.22 300))",
                      color: "white",
                      boxShadow: "0 8px 30px oklch(65% 0.15 70 / 0.35)",
                      cursor: "pointer",
                    }
                  : {
                      backgroundColor: "oklch(88% 0.01 70)",
                      color: "oklch(70% 0.01 70)",
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
                  <motion.span
                    animate={canSubmit ? { scale: [1, 1.2, 1], rotate: [0, 10, 0] } : {}}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    style={{ display: "inline-block" }}
                    aria-hidden
                  >
                    ✨
                  </motion.span>
                  Générer mon coloriage
                </span>
              )}
            </motion.button>

            <p
              className="text-center text-sm font-body"
              style={{ color: "oklch(70% 0.01 70)" }}
            >
              3 conversions gratuites · Sans inscription
            </p>
          </form>
        </motion.div>

        {/* RIGHT — Interactive preview stack */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
          className="relative hidden lg:flex items-center justify-center"
        >
          <PreviewStack />
        </motion.div>
      </section>

      {/* ── How it works — scroll-driven reveals ── */}
      <HowItWorks />

      {/* ── Features strip ── */}
      <FeaturesStrip />

      {/* ── Footer ── */}
      <Footer />
    </main>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Preview Stack Component
// ────────────────────────────────────────────────────────────────────────────

const PREVIEW_CARDS = [
  {
    label: "Photo originale",
    emoji: "🖼️",
    bg: "oklch(96% 0.04 80)",
    rotation: "3deg",
    y: "20px",
    z: 1,
  },
  {
    label: "Zones numérotées",
    emoji: "✏️",
    bg: "oklch(94% 0.04 300)",
    rotation: "-2deg",
    y: "-10px",
    z: 2,
  },
  {
    label: "Coloriage prêt !",
    emoji: "🎨",
    bg: "oklch(97% 0.04 80)",
    rotation: "0deg",
    y: "0px",
    z: 3,
    isFront: true,
  },
];

function PreviewStack() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="relative w-80 h-80">
      {PREVIEW_CARDS.map((card, i) => (
        <motion.div
          key={i}
          className="absolute w-72 rounded-3xl p-4 cursor-pointer"
          style={{
            zIndex: hovered === i ? 10 : card.z,
            left: "50%",
            top: "50%",
            transformOrigin: "center",
            border: "1px solid oklch(85% 0.04 70)",
            backgroundColor: "white",
            boxShadow:
              card.isFront
                ? "0 20px 60px oklch(65% 0.15 70 / 0.28)"
                : "0 8px 32px oklch(18% 0.02 60 / 0.08)",
          }}
          initial={{
            x: "-50%",
            y: `calc(-50% + ${card.y})`,
            rotate: parseFloat(card.rotation),
          }}
          animate={{
            x: "-50%",
            y:
              hovered === i
                ? "calc(-50% - 12px)"
                : `calc(-50% + ${card.y})`,
            rotate: hovered === i ? 0 : parseFloat(card.rotation),
            scale: hovered === i ? 1.04 : 1,
            boxShadow:
              hovered === i
                ? "0 28px 72px oklch(65% 0.15 70 / 0.35)"
                : card.isFront
                ? "0 20px 60px oklch(65% 0.15 70 / 0.28)"
                : "0 8px 32px oklch(18% 0.02 60 / 0.08)",
          }}
          transition={{ type: "spring", stiffness: 350, damping: 26 }}
          onHoverStart={() => setHovered(i)}
          onHoverEnd={() => setHovered(null)}
        >
          <div
            className="w-full h-36 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: card.bg }}
          >
            <span className="text-5xl" aria-hidden>
              {card.emoji}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p
              className="font-display font-bold text-sm"
              style={{ color: "oklch(18% 0.02 60)" }}
            >
              {card.label}
            </p>
            {card.isFront && (
              <span
                className="rounded-full px-2 py-0.5 text-xs font-display font-bold"
                style={{ backgroundColor: "oklch(65% 0.15 70)", color: "white" }}
              >
                PDF
              </span>
            )}
          </div>
          {card.isFront && (
            <div className="flex gap-1.5 mt-2">
              {[
                "oklch(55% 0.18 25)",
                "oklch(70% 0.15 70)",
                "oklch(55% 0.18 145)",
                "oklch(55% 0.18 240)",
                "oklch(55% 0.14 300)",
              ].map((c) => (
                <div
                  key={c}
                  className="w-5 h-5 rounded-full"
                  style={{ backgroundColor: c }}
                  aria-hidden
                />
              ))}
            </div>
          )}
        </motion.div>
      ))}

      {/* Ambient glow */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, oklch(75% 0.15 70 / 0.06) 0%, transparent 70%)",
          width: "420px",
          height: "420px",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
        aria-hidden
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// How It Works
// ────────────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    num: "01",
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect width="48" height="48" rx="14" fill="oklch(96% 0.04 80)" />
        <path
          d="M16 32l6-6 4 4 8-10"
          stroke="oklch(65% 0.15 70)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M20 20h-4v12h12v-4"
          stroke="oklch(45% 0.22 300)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    title: "Importez votre photo",
    desc: "Glissez-déposez n'importe quelle photo — famille, animaux, paysages. JPEG, PNG, WEBP ou HEIC.",
  },
  {
    num: "02",
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect width="48" height="48" rx="14" fill="oklch(96% 0.04 80)" />
        <circle cx="24" cy="24" r="10" stroke="oklch(65% 0.15 70)" strokeWidth="2.5" />
        <path
          d="M24 14v4M24 30v4M14 24h4M30 24h4"
          stroke="oklch(45% 0.22 300)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="24" cy="24" r="3" fill="oklch(65% 0.15 70)" />
      </svg>
    ),
    title: "L'IA génère le coloriage",
    desc: "Notre algorithme identifie les zones de couleur et crée un coloriage numéroté avec nuancier en 15-30 secondes.",
  },
  {
    num: "03",
    icon: (
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect width="48" height="48" rx="14" fill="oklch(96% 0.04 80)" />
        <path
          d="M18 32l-4 4h20l-4-4"
          stroke="oklch(65% 0.15 70)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M24 12v16M24 28l-5-5M24 28l5-5"
          stroke="oklch(45% 0.22 300)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    title: "Téléchargez et imprimez",
    desc: "Récupérez le PDF haute résolution et le modèle coloré. Imprimez en A4 ou A3 et coloriez !",
  },
];

function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <section
      ref={ref}
      className="relative z-10 max-w-6xl mx-auto px-6 py-20"
    >
      <div className="text-center mb-14">
        <p
          className="font-display font-semibold uppercase tracking-widest text-sm mb-3"
          style={{ color: "oklch(60% 0.12 70)" }}
        >
          Comment ça marche
        </p>
        <h2
          className="font-display font-extrabold"
          style={{
            fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
            color: "oklch(18% 0.02 60)",
            letterSpacing: "-0.02em",
          }}
        >
          Trois étapes. Une magie.
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {STEPS.map((step, i) => (
          <StepCard key={step.num} step={step} index={i} />
        ))}
      </div>
    </section>
  );
}

function StepCard({
  step,
  index,
}: {
  step: (typeof STEPS)[number];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{
        delay: index * 0.12,
        type: "spring",
        stiffness: 280,
        damping: 24,
      }}
      className="flex flex-col items-start gap-5"
    >
      {/* Big step number */}
      <span
        className="font-display font-extrabold"
        style={{
          fontSize: "5rem",
          lineHeight: 1,
          color: "oklch(88% 0.04 70)",
          letterSpacing: "-0.04em",
        }}
        aria-hidden
      >
        {step.num}
      </span>

      {/* SVG illustration */}
      <div>{step.icon}</div>

      {/* Text */}
      <div>
        <h3
          className="font-display font-bold text-lg mb-2"
          style={{ color: "oklch(18% 0.02 60)" }}
        >
          {step.title}
        </h3>
        <p
          className="font-body text-sm leading-relaxed"
          style={{ color: "oklch(45% 0.02 60)" }}
        >
          {step.desc}
        </p>
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Features Strip
// ────────────────────────────────────────────────────────────────────────────

function FeaturesStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  const features = [
    { icon: "⚡", title: "Rapide", desc: "Résultat en moins de 30 secondes" },
    { icon: "🎯", title: "Précis", desc: "Zones numérotées avec nuancier" },
    { icon: "🖨️", title: "Imprimable", desc: "PDF haute résolution A4/A3" },
  ];

  return (
    <section
      ref={ref}
      className="relative z-10 max-w-6xl mx-auto px-6 pb-20"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {features.map((feat, i) => (
          <motion.div
            key={feat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.1, type: "spring", stiffness: 300, damping: 22 }}
            className="card-amber p-6 flex gap-4 items-start"
          >
            <span className="text-3xl" aria-hidden>
              {feat.icon}
            </span>
            <div>
              <p
                className="font-display font-bold text-base"
                style={{ color: "oklch(18% 0.02 60)" }}
              >
                {feat.title}
              </p>
              <p
                className="font-body text-sm mt-1"
                style={{ color: "oklch(45% 0.02 60)" }}
              >
                {feat.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Footer
// ────────────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer
      className="relative z-10 max-w-7xl mx-auto px-6 py-8 flex items-center justify-between"
      style={{
        borderTop: "1px solid oklch(88% 0.02 70)",
        color: "oklch(65% 0.01 70)",
      }}
    >
      <span className="font-display font-semibold text-sm flex items-center gap-1.5">
        <span aria-hidden>✏️</span> Coloriage Magique
      </span>
      <p className="font-body text-xs">
        © {new Date().getFullYear()} · Fait avec ❤️ pour les créatifs
      </p>
    </footer>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Step label
// ────────────────────────────────────────────────────────────────────────────

function StepLabel({ number, label }: { number: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-display font-bold text-white"
        style={{
          background: "linear-gradient(135deg, oklch(65% 0.15 70), oklch(45% 0.22 300))",
        }}
      >
        {number}
      </span>
      <span
        className="font-display font-semibold text-sm"
        style={{ color: "oklch(18% 0.02 60)" }}
      >
        {label}
      </span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Spinner
// ────────────────────────────────────────────────────────────────────────────

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
