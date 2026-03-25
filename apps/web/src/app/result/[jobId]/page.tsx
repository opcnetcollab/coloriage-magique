"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { getJob, getDownloadUrl } from "@/lib/api";
import type { Job } from "@/lib/api";
import ColorSwatchLegend from "@/components/ColorSwatchLegend";

const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ATTEMPTS = 60; // 90s max

const PROCESSING_STEPS = [
  "Analyse de votre photo…",
  "Identification des zones de couleurs…",
  "Génération du coloriage magique…",
  "Optimisation pour l'impression…",
  "Création du nuancier…",
  "Touches finales… ✨",
];

const ENCOURAGING_MESSAGES = [
  "Magie en cours…",
  "Votre chef-d'œuvre arrive…",
  "Presque là…",
  "Plus que quelques secondes…",
  "Finalisation des détails…",
];

// Confetti colors — amber/purple palette
const CONFETTI_COLORS = ["#d97706", "#7c3aed", "#f472b6", "#22c55e", "#fbbf24", "#a78bfa"];

interface ConfettiPieceProps {
  color: string;
  delay: number;
  left: number;
  duration: number;
}

function ConfettiPiece({ color, delay, left, duration }: ConfettiPieceProps) {
  return (
    <div
      className="absolute top-0 w-2 h-3 rounded-sm pointer-events-none"
      style={{
        backgroundColor: color,
        left: `${left}%`,
        animation: `confettiFall ${duration}ms ease-in forwards`,
        animationDelay: `${delay}ms`,
      }}
      aria-hidden="true"
    />
  );
}

function ConfettiOverlay() {
  const pieces = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: i * 60,
    left: (i * (100 / 20)),
    duration: 900 + (i % 5) * 150,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl z-10">
      {pieces.map((p) => (
        <ConfettiPiece key={p.id} color={p.color} delay={p.delay} left={p.left} duration={p.duration} />
      ))}
    </div>
  );
}

/** Shimmer progress bar — amber → purple gradient */
function ShimmerProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full">
      <div
        className="h-3 rounded-full overflow-hidden"
        style={{ backgroundColor: "#fef3c7" }}
      >
        <div
          className="h-full rounded-full shimmer-bar transition-all duration-500"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <p
        className="text-right font-body text-xs mt-1"
        style={{ color: "#b2aca5" }}
      >
        {progress}%
      </p>
    </div>
  );
}

/** Sparkle particles around spinner */
function SparkleParticles() {
  const positions = [
    { top: "5%",  left: "10%",  delay: "0s"   },
    { top: "15%", right: "8%",  delay: "0.4s" },
    { bottom: "15%", left: "12%", delay: "0.8s" },
    { bottom: "8%", right: "10%", delay: "1.2s" },
    { top: "50%", left: "3%",   delay: "0.6s" },
    { top: "40%", right: "3%",  delay: "1s"   },
  ];

  return (
    <>
      {positions.map((pos, i) => (
        <span
          key={i}
          className="absolute text-sm animate-sparkle-float pointer-events-none"
          style={{ ...pos, animationDelay: pos.delay }}
          aria-hidden="true"
        >
          ✨
        </span>
      ))}
    </>
  );
}

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.jobId as string;

  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(8);
  const [showConfetti, setShowConfetti] = useState(false);
  const pollCount = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rotate processing steps + progress
  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, PROCESSING_STEPS.length - 1));
      setMsgIndex((i) => (i + 1) % ENCOURAGING_MESSAGES.length);
      setProgress((p) => Math.min(p + 13, 90));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Polling
  useEffect(() => {
    if (!jobId) return;

    async function poll() {
      pollCount.current += 1;

      if (pollCount.current > MAX_POLL_ATTEMPTS) {
        setError("Délai d'attente dépassé. Veuillez réessayer.");
        return;
      }

      try {
        const data = await getJob(jobId);
        setJob(data);

        if (data.status === "done") {
          setProgress(100);
          setTimeout(() => setShowConfetti(true), 300);
          return;
        }

        if (data.status === "failed") return;

        timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur réseau.");
      }
    }

    poll();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const status = job?.status ?? "pending";
  const isProcessing = status === "pending" || status === "processing";

  return (
    <main
      className="min-h-screen p-4 sm:p-8"
      style={{ backgroundColor: "#fffbf5" }}
    >
      {/* Background particles */}
      <div aria-hidden className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {[
          { e: "🖍️", top: "8%",  left: "3%",  delay: "0s",   dur: "5s"   },
          { e: "✏️", top: "70%", right: "4%", delay: "1.5s", dur: "4.5s" },
          { e: "🎨", bottom: "15%", left: "5%", delay: "0.8s", dur: "6s" },
        ].map((p, i) => (
          <span
            key={i}
            className="absolute text-2xl select-none animate-drift"
            style={{
              top: "top" in p ? p.top : undefined,
              bottom: "bottom" in p ? p.bottom : undefined,
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

      {/* Navbar */}
      <nav className="relative z-10 max-w-6xl mx-auto mb-8 flex items-center justify-between">
        <a
          href="/"
          className="font-display font-bold text-lg flex items-center gap-2"
          style={{ color: "#1c1917" }}
        >
          <span aria-hidden>✏️</span> Coloriage Magique
        </a>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="font-body text-sm flex items-center gap-1.5 transition-colors"
          style={{ color: "#d97706" }}
        >
          ← Créer un autre coloriage
        </button>
      </nav>

      {/* ── PROCESSING ──────────────────────────────────────────────────────── */}
      {isProcessing && !error && (
        <div className="relative z-10 max-w-2xl mx-auto">
          <div
            className="card-amber p-10 flex flex-col items-center gap-8"
            role="status"
            aria-live="polite"
            aria-label="Traitement en cours"
          >
            {/* Pencil icon sparkle */}
            <div className="relative flex items-center justify-center h-28 w-28">
              <div className="text-6xl animate-sparkle" aria-hidden>✏️</div>
              <SparkleParticles />
            </div>

            {/* Title */}
            <div className="text-center">
              <h1
                className="font-display font-extrabold"
                style={{ fontSize: "1.75rem", color: "#1c1917" }}
              >
                {ENCOURAGING_MESSAGES[msgIndex]}
              </h1>
              <p className="font-body text-sm mt-2" style={{ color: "#b2aca5" }}>
                Temps estimé : 15-30 secondes
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-sm">
              <ShimmerProgressBar progress={progress} />
            </div>

            {/* Steps list with animated checkmarks */}
            <div className="flex flex-col gap-2.5 w-full max-w-sm">
              {PROCESSING_STEPS.map((step, i) => {
                const isDone   = i < stepIndex;
                const isActive = i === stepIndex;
                const isPending = i > stepIndex;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 text-sm transition-all duration-300 font-body"
                    style={{
                      color: isDone ? "#b2aca5" : isActive ? "#1c1917" : "#e3dcd2",
                    }}
                  >
                    <span className="flex-shrink-0 w-5 text-center" aria-hidden>
                      {isDone ? "✅" : isActive ? "▶" : "○"}
                    </span>
                    <span className={isActive ? "font-display font-semibold" : ""}>{step}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── ERROR ─────────────────────────────────────────────────────────── */}
      {(error || status === "failed") && (
        <div className="relative z-10 max-w-xl mx-auto">
          <div className="card-amber p-10 flex flex-col items-center gap-5 text-center">
            <span className="text-5xl" aria-hidden>😕</span>
            <h1 className="font-display font-bold text-xl" style={{ color: "#1c1917" }}>
              La génération a échoué
            </h1>
            <p className="font-body text-sm" style={{ color: "#b91c1c" }}>
              {error ?? "Une erreur est survenue lors du traitement."}
            </p>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="btn-primary mt-2"
            >
              ← Réessayer
            </button>
          </div>
        </div>
      )}

      {/* ── DONE — 2-col premium layout ──────────────────────────────────── */}
      {status === "done" && job && (
        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Confetti */}
          {showConfetti && (
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
              {Array.from({ length: 20 }, (_, i) => (
                <ConfettiPiece
                  key={i}
                  color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]}
                  delay={i * 80}
                  left={i * (100 / 20)}
                  duration={900 + (i % 5) * 200}
                />
              ))}
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-10">
            {/* ── LEFT — Preview ─────────────────────────────────────────── */}
            <div className="flex flex-col gap-4">
              {/* Preview card */}
              <div className="card-amber p-5 relative">
                {/* APERÇU badge */}
                <span
                  className="absolute top-4 left-4 rounded-full px-3 py-1 text-xs font-display font-bold z-10"
                  style={{ backgroundColor: "#d97706", color: "white" }}
                >
                  APERÇU
                </span>

                {job.preview_url ? (
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden">
                    <Image
                      src={getDownloadUrl(job.preview_url)}
                      alt="Aperçu du coloriage"
                      fill
                      className="object-contain"
                      style={{ backgroundColor: "#fef3e2" }}
                      unoptimized
                    />
                  </div>
                ) : (
                  <div
                    className="w-full aspect-video rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: "#fef3e2" }}
                  >
                    <span className="text-5xl" aria-hidden>🎨</span>
                  </div>
                )}

                {/* Processing time */}
                {job.processing_ms && (
                  <p
                    className="font-body text-xs mt-3 text-right"
                    style={{ color: "#b2aca5" }}
                  >
                    Généré en {(job.processing_ms / 1000).toFixed(1)}s
                  </p>
                )}
              </div>
            </div>

            {/* ── RIGHT — Actions ────────────────────────────────────────── */}
            <div className="flex flex-col gap-6">
              {/* Success header */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl" aria-hidden>🎉</span>
                  <h1
                    className="font-display font-extrabold"
                    style={{ fontSize: "1.75rem", color: "#1c1917" }}
                  >
                    Votre coloriage est prêt&nbsp;!
                  </h1>
                </div>
                <p className="font-body text-sm" style={{ color: "#5f5b55" }}>
                  Téléchargez votre coloriage et sa référence colorée pour commencer à colorier.
                </p>
              </div>

              {/* Stats pills */}
              <div className="flex flex-wrap gap-2">
                {job.color_legend && (
                  <StatPill icon="🎨" label={`${job.color_legend.length} couleurs`} />
                )}
                <StatPill icon="📄" label={format.toUpperCase()} />
              </div>

              {/* Color swatch legend */}
              {job.color_legend && job.color_legend.length > 0 && (
                <ColorSwatchLegend legend={job.color_legend} />
              )}

              {/* Download buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {job.coloring_pdf_url && (
                  <a
                    href={getDownloadUrl(job.coloring_pdf_url)}
                    download="coloriage.pdf"
                    className="btn-primary flex-1 text-sm"
                    style={{ padding: "0.875rem 1.5rem" }}
                    aria-label="Télécharger le coloriage PDF avec zones numérotées"
                  >
                    <span aria-hidden>🖨️</span>
                    Coloriage PDF
                  </a>
                )}
                {job.reference_pdf_url && (
                  <a
                    href={getDownloadUrl(job.reference_pdf_url)}
                    download="reference.pdf"
                    className="btn-outlined flex-1 text-sm"
                    style={{ padding: "0.875rem 1.5rem" }}
                    aria-label="Télécharger le modèle coloré PDF"
                  >
                    <span aria-hidden>🎨</span>
                    Référence PDF
                  </a>
                )}
              </div>

              {/* Back link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="font-body text-sm transition-colors"
                  style={{ color: "#b2aca5" }}
                >
                  Créer un autre coloriage →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatPill({ icon, label }: { icon: string; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-display font-semibold"
      style={{ backgroundColor: "#fef3c7", color: "#b45309" }}
    >
      <span aria-hidden>{icon}</span>
      {label}
    </span>
  );
}

// Required for StatPill usage in done state where format string needs to exist
const format = "a4";
