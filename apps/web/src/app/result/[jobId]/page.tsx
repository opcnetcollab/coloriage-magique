"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { getJob, getDownloadUrl } from "@/lib/api";
import type { Job } from "@/lib/api";
import ColorSwatchLegend from "@/components/ColorSwatchLegend";

const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ATTEMPTS = 60; // 90s max

const PROCESSING_MESSAGES = [
  "Analyse de votre photo en cours…",
  "Identification des zones de couleurs…",
  "Génération du coloriage magique…",
  "Optimisation pour l'impression…",
  "Création du nuancier…",
  "Presque prêt ! Touches finales…",
];

// Confetti pieces for the done screen
const CONFETTI_COLORS = ["#F59E0B", "#A78BFA", "#F472B6", "#22C55E", "#f8a010"];
const CONFETTI_COUNT = 30;

function ConfettiPiece({ color, delay, left }: { color: string; delay: number; left: number }) {
  return (
    <div
      className="absolute top-0 w-2 h-3 rounded-sm animate-confetti-fall pointer-events-none"
      style={{
        backgroundColor: color,
        left: `${left}%`,
        animationDelay: `${delay}ms`,
        animationDuration: `${900 + Math.random() * 600}ms`,
      }}
      aria-hidden="true"
    />
  );
}

function ConfettiOverlay() {
  const pieces = Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: i * 40,
    left: (i * (100 / CONFETTI_COUNT) + Math.random() * 5),
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-4xl">
      {pieces.map((p) => (
        <ConfettiPiece key={p.id} color={p.color} delay={p.delay} left={p.left} />
      ))}
    </div>
  );
}

/** Shimmer progress bar with crayon aesthetic */
function CrayonProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full">
      <div className="h-3 rounded-full bg-[#eee7de] overflow-hidden">
        <div
          className="h-full rounded-full shimmer-bar transition-all duration-500"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

/** Crayon/wand SVG icon with magic wand animation */
function MagicWandIcon() {
  return (
    <div className="text-5xl animate-magic-wand" aria-hidden="true">
      🪄
    </div>
  );
}

/** Floating sparkle particles around the spinner */
function SparkleParticles() {
  const positions = [
    { top: "10%", left: "15%", delay: "0s" },
    { top: "20%", right: "10%", delay: "0.4s" },
    { bottom: "15%", left: "20%", delay: "0.8s" },
    { bottom: "10%", right: "15%", delay: "1.2s" },
    { top: "50%", left: "5%", delay: "0.6s" },
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
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(8);
  const [showConfetti, setShowConfetti] = useState(false);
  const pollCount = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rotate processing messages every 3s and advance progress
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % PROCESSING_MESSAGES.length);
      setProgress((p) => Math.min(p + 14, 90));
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
          // Trigger confetti after short delay
          setTimeout(() => setShowConfetti(true), 200);
          return;
        }

        if (data.status === "failed") {
          return;
        }

        timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur réseau.";
        setError(msg);
      }
    }

    poll();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const status = job?.status ?? "pending";
  const isProcessing = status === "pending" || status === "processing";

  return (
    <main
      className="
        min-h-screen
        bg-gradient-to-br from-amber-50 via-purple-50 to-pink-50
        flex items-center justify-center p-4
      "
    >
      <div className="w-full max-w-xl animate-screen-enter">
        {/* Back button */}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="
            mb-5 flex items-center gap-1.5 text-sm font-body
            text-[#5f5b55] hover:text-[#312e29] transition-colors
          "
        >
          ← Faire un autre coloriage
        </button>

        <div
          className="
            relative bg-white/80 backdrop-blur-sm rounded-4xl shadow-xl
            p-7 flex flex-col gap-6
          "
        >
          {/* ── PROCESSING ──────────────────────────────── */}
          {isProcessing && !error && (
            <div
              className="flex flex-col items-center gap-6 py-8"
              role="status"
              aria-live="polite"
              aria-label="Traitement en cours"
            >
              {/* Wand + sparkles */}
              <div className="relative flex items-center justify-center h-24 w-24">
                <MagicWandIcon />
                <SparkleParticles />
              </div>

              {/* Title */}
              <div className="text-center">
                <p className="font-display font-bold text-xl text-[#312e29]">
                  Magie en cours…
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-sm">
                <CrayonProgressBar progress={progress} />
              </div>

              {/* Progressive messages list */}
              <div className="flex flex-col gap-2 w-full max-w-sm">
                {PROCESSING_MESSAGES.map((msg, i) => {
                  const isDone = i < msgIndex;
                  const isActive = i === msgIndex;
                  return (
                    <div
                      key={i}
                      className={`
                        flex items-center gap-2 text-sm transition-all duration-300
                        ${isDone ? "text-[#b2aca5]" : isActive ? "text-[#312e29] font-display font-semibold" : "text-[#e3dcd2]"}
                      `}
                    >
                      <span
                        className="flex-shrink-0 w-5 text-center"
                        aria-hidden="true"
                      >
                        {isDone ? "✅" : isActive ? "▶" : "○"}
                      </span>
                      <span>{msg}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── ERROR ──────────────────────────────────── */}
          {(error || status === "failed") && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <span className="text-5xl" aria-hidden="true">😕</span>
              <p className="font-display font-semibold text-lg text-[#312e29]">
                La génération a échoué
              </p>
              <p className="text-sm text-red-600 font-body">
                {error ?? "Une erreur est survenue lors du traitement."}
              </p>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="
                  mt-2 px-6 py-2.5 rounded-full
                  bg-gradient-to-r from-amber-400 to-pink-400
                  text-white font-display font-semibold text-sm shadow-md
                  hover:shadow-glow-amber hover:-translate-y-0.5 active:scale-95
                  transition-all duration-150
                "
              >
                Réessayer
              </button>
            </div>
          )}

          {/* ── DONE ───────────────────────────────────── */}
          {status === "done" && job && (
            <>
              {/* Confetti overlay */}
              {showConfetti && <ConfettiOverlay />}

              {/* Header */}
              <div className="text-center pt-2">
                <h1 className="font-display font-extrabold text-2xl text-[#312e29]">
                  🎉 Votre coloriage est prêt !
                </h1>
                {job.processing_ms && (
                  <p className="text-xs text-[#b2aca5] font-body mt-1">
                    Généré en {(job.processing_ms / 1000).toFixed(1)}s
                  </p>
                )}
              </div>

              {/* Preview PNG */}
              {job.preview_url && (
                <div
                  className="
                    relative w-full aspect-video rounded-3xl overflow-hidden
                    border border-[rgba(178,172,165,0.2)] shadow-card
                  "
                >
                  <Image
                    src={getDownloadUrl(job.preview_url)}
                    alt="Aperçu du coloriage"
                    fill
                    className="object-contain bg-[#f7f0e7]"
                    unoptimized
                  />
                </div>
              )}

              {/* Color swatch legend */}
              {job.color_legend && job.color_legend.length > 0 && (
                <ColorSwatchLegend legend={job.color_legend} />
              )}

              {/* Download buttons */}
              <div className="grid grid-cols-2 gap-3">
                {job.coloring_pdf_url && (
                  <a
                    href={getDownloadUrl(job.coloring_pdf_url)}
                    download="coloriage.pdf"
                    aria-label="Télécharger mon coloriage en PDF — zones numérotées"
                    className="
                      flex flex-col items-center gap-1.5 rounded-full border-0
                      bg-gradient-to-r from-[#815100] to-[#f8a010]
                      px-4 py-3.5 text-[#fff0e3] font-display font-semibold text-sm text-center
                      shadow-md hover:shadow-glow-amber hover:-translate-y-0.5
                      active:scale-95 transition-all duration-150
                    "
                  >
                    <span className="text-xl" aria-hidden="true">🖨️</span>
                    <span>Coloriage PDF</span>
                    <span className="text-xs font-body font-normal opacity-80">
                      Zones numérotées
                    </span>
                  </a>
                )}
                {job.reference_pdf_url && (
                  <a
                    href={getDownloadUrl(job.reference_pdf_url)}
                    download="reference.pdf"
                    aria-label="Télécharger le modèle coloré en PDF"
                    className="
                      flex flex-col items-center gap-1.5 rounded-full
                      bg-[#d8caff] px-4 py-3.5
                      text-[#4f329d] font-display font-semibold text-sm text-center
                      shadow-card hover:bg-[#c4b0ff] hover:-translate-y-0.5
                      active:scale-95 transition-all duration-150
                    "
                  >
                    <span className="text-xl" aria-hidden="true">🎨</span>
                    <span>Référence PDF</span>
                    <span className="text-xs font-body font-normal opacity-70">
                      Image colorée
                    </span>
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
