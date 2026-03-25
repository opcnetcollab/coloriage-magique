"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { getJob, getDownloadUrl } from "@/lib/api";
import type { Job } from "@/lib/api";
import ColorSwatchLegend from "@/components/ColorSwatchLegend";

const POLL_INTERVAL_MS = 1500;
const MAX_POLL_ATTEMPTS = 60;

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

// ────────────────────────────────────────────────────────────────────────────
// Crayon Canvas — draws progressively during processing
// ────────────────────────────────────────────────────────────────────────────

function CrayonCanvas({ progress }: { progress: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Draw a colouring-book style outline (grid of zones)
    const zones = [
      { x: 20, y: 20, w: 60, h: 60, color: "oklch(85% 0.10 70)", num: "1" },
      { x: 90, y: 15, w: 80, h: 70, color: "oklch(75% 0.14 145)", num: "2" },
      { x: 180, y: 20, w: 55, h: 60, color: "oklch(80% 0.12 25)", num: "3" },
      { x: 25, y: 100, w: 70, h: 80, color: "oklch(75% 0.16 240)", num: "4" },
      { x: 105, y: 95, w: 90, h: 90, color: "oklch(80% 0.12 300)", num: "5" },
      { x: 205, y: 95, w: 55, h: 80, color: "oklch(85% 0.10 70)", num: "6" },
    ];

    const filled = Math.floor((progress / 100) * zones.length);

    zones.forEach((z, i) => {
      // Fill up to current progress
      if (i < filled) {
        ctx.fillStyle = z.color;
        ctx.beginPath();
        ctx.roundRect(z.x, z.y, z.w, z.h, 8);
        ctx.fill();
      }

      // Always draw outline
      ctx.strokeStyle = "oklch(55% 0.04 70)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(z.x, z.y, z.w, z.h, 8);
      ctx.stroke();

      // Number
      ctx.fillStyle = i < filled ? "oklch(18% 0.02 60)" : "oklch(65% 0.04 70)";
      ctx.font = "bold 14px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(z.num, z.x + z.w / 2, z.y + z.h / 2);
    });
  }, [progress]);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={200}
      className="rounded-2xl"
      style={{
        border: "1px solid oklch(85% 0.04 70)",
        backgroundColor: "oklch(99% 0.005 80)",
      }}
      aria-hidden="true"
    />
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Canvas-confetti — only imported client-side
// ────────────────────────────────────────────────────────────────────────────

function useConfetti(trigger: boolean) {
  useEffect(() => {
    if (!trigger) return;
    import("canvas-confetti").then(({ default: confetti }) => {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.55 },
        colors: [
          "oklch(75% 0.15 70)",
          "oklch(45% 0.22 300)",
          "oklch(75% 0.18 25)",
          "oklch(55% 0.18 145)",
          "oklch(85% 0.12 70)",
        ],
        scalar: 1.1,
        gravity: 0.9,
      });
      // Second burst
      setTimeout(() => {
        confetti({
          particleCount: 60,
          spread: 120,
          origin: { x: 0.2, y: 0.6 },
          colors: ["oklch(75% 0.15 70)", "oklch(45% 0.22 300)"],
          scalar: 0.85,
        });
      }, 300);
    });
  }, [trigger]);
}

// ────────────────────────────────────────────────────────────────────────────
// Progress bar
// ────────────────────────────────────────────────────────────────────────────

function ShimmerProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full">
      <div
        className="h-3 rounded-full overflow-hidden"
        style={{ backgroundColor: "oklch(94% 0.04 80)" }}
      >
        <motion.div
          className="h-full rounded-full shimmer-bar"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <p
        className="text-right font-body text-xs mt-1"
        style={{ color: "oklch(70% 0.01 70)" }}
      >
        {progress}%
      </p>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────────────────────────────────

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
  const [zoomOpen, setZoomOpen] = useState(false);
  const pollCount = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Trigger confetti via hook
  useConfetti(showConfetti);

  // Rotate steps + progress
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
          setTimeout(() => setShowConfetti(true), 400);
          return;
        }
        if (data.status === "failed") return;
        timerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur réseau.");
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
      className="min-h-screen p-4 sm:p-8"
      style={{ backgroundColor: "oklch(98% 0.01 80)" }}
    >
      {/* Navbar */}
      <nav className="relative z-10 max-w-6xl mx-auto mb-8 flex items-center justify-between">
        <a
          href="/"
          className="font-display font-bold text-lg flex items-center gap-2"
          style={{ color: "oklch(18% 0.02 60)" }}
        >
          <span aria-hidden>✏️</span> Coloriage Magique
        </a>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="font-body text-sm flex items-center gap-1.5 transition-colors"
          style={{ color: "oklch(60% 0.12 70)" }}
        >
          ← Créer un autre coloriage
        </button>
      </nav>

      {/* ── PROCESSING ── */}
      <AnimatePresence mode="wait">
        {isProcessing && !error && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 max-w-2xl mx-auto"
          >
            <div
              className="card-amber p-10 flex flex-col items-center gap-8"
              role="status"
              aria-live="polite"
              aria-label="Traitement en cours"
            >
              {/* Animated crayon canvas */}
              <div className="flex flex-col items-center gap-3">
                <CrayonCanvas progress={progress} />
                <p
                  className="font-body text-xs"
                  style={{ color: "oklch(65% 0.01 70)" }}
                >
                  Coloriage en cours de génération…
                </p>
              </div>

              {/* Title */}
              <AnimatePresence mode="wait">
                <motion.h1
                  key={msgIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="font-display font-extrabold text-center"
                  style={{ fontSize: "1.75rem", color: "oklch(18% 0.02 60)" }}
                >
                  {ENCOURAGING_MESSAGES[msgIndex]}
                </motion.h1>
              </AnimatePresence>
              <p className="font-body text-sm" style={{ color: "oklch(70% 0.01 70)" }}>
                Temps estimé : 15-30 secondes
              </p>

              {/* Progress bar */}
              <div className="w-full max-w-sm">
                <ShimmerProgressBar progress={progress} />
              </div>

              {/* Steps list */}
              <div className="flex flex-col gap-2.5 w-full max-w-sm">
                {PROCESSING_STEPS.map((step, i) => {
                  const isDone = i < stepIndex;
                  const isActive = i === stepIndex;
                  return (
                    <motion.div
                      key={i}
                      animate={{
                        opacity: isDone ? 0.5 : isActive ? 1 : 0.3,
                        x: isActive ? 4 : 0,
                      }}
                      className="flex items-center gap-3 text-sm font-body"
                      style={{
                        color: isDone
                          ? "oklch(70% 0.01 70)"
                          : isActive
                          ? "oklch(18% 0.02 60)"
                          : "oklch(82% 0.01 70)",
                      }}
                    >
                      <span className="flex-shrink-0 w-5 text-center" aria-hidden>
                        {isDone ? "✅" : isActive ? "▶" : "○"}
                      </span>
                      <span className={isActive ? "font-display font-semibold" : ""}>
                        {step}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── ERROR ── */}
        {(error || status === "failed") && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="relative z-10 max-w-xl mx-auto"
          >
            <div className="card-amber p-10 flex flex-col items-center gap-5 text-center">
              <span className="text-5xl" aria-hidden>😕</span>
              <h1
                className="font-display font-bold text-xl"
                style={{ color: "oklch(18% 0.02 60)" }}
              >
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
          </motion.div>
        )}

        {/* ── DONE ── */}
        {status === "done" && job && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-10 max-w-6xl mx-auto"
          >
            <div className="grid lg:grid-cols-2 gap-10">
              {/* LEFT — Preview with zoom */}
              <div className="flex flex-col gap-4">
                <div
                  className="card-amber p-5 relative cursor-zoom-in"
                  onClick={() => setZoomOpen(true)}
                >
                  <span
                    className="absolute top-4 left-4 rounded-full px-3 py-1 text-xs font-display font-bold z-10"
                    style={{ backgroundColor: "oklch(65% 0.15 70)", color: "white" }}
                  >
                    APERÇU
                  </span>
                  <span
                    className="absolute top-4 right-4 rounded-full px-2 py-1 text-xs font-display font-semibold z-10"
                    style={{
                      backgroundColor: "oklch(15% 0.02 60 / 0.6)",
                      color: "white",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    🔍 Agrandir
                  </span>

                  {job.preview_url ? (
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden">
                      <Image
                        src={getDownloadUrl(job.preview_url)}
                        alt="Aperçu du coloriage"
                        fill
                        className="object-contain"
                        style={{ backgroundColor: "oklch(97% 0.02 80)" }}
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div
                      className="w-full aspect-video rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: "oklch(97% 0.02 80)" }}
                    >
                      <span className="text-5xl" aria-hidden>🎨</span>
                    </div>
                  )}

                  {job.processing_ms && (
                    <p
                      className="font-body text-xs mt-3 text-right"
                      style={{ color: "oklch(70% 0.01 70)" }}
                    >
                      Généré en {(job.processing_ms / 1000).toFixed(1)}s
                    </p>
                  )}
                </div>
              </div>

              {/* RIGHT — Actions */}
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="flex flex-col gap-6"
              >
                {/* Success header */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <motion.span
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 14 }}
                      style={{ display: "inline-block", fontSize: "2.5rem" }}
                    >
                      🎉
                    </motion.span>
                    <h1
                      className="font-display font-extrabold"
                      style={{ fontSize: "1.75rem", color: "oklch(18% 0.02 60)" }}
                    >
                      Votre coloriage est prêt !
                    </h1>
                  </div>
                  <p className="font-body text-sm" style={{ color: "oklch(45% 0.02 60)" }}>
                    Téléchargez votre coloriage et sa référence colorée pour commencer à colorier.
                  </p>
                </div>

                {/* Stats pills */}
                <div className="flex flex-wrap gap-2">
                  {job.color_legend && (
                    <StatPill icon="🎨" label={`${job.color_legend.length} couleurs`} />
                  )}
                  <StatPill icon="📄" label="PDF" />
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
                    style={{ color: "oklch(70% 0.01 70)" }}
                  >
                    Créer un autre coloriage →
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Zoom lightbox ── */}
      <AnimatePresence>
        {zoomOpen && job?.preview_url && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-8"
            style={{ backgroundColor: "oklch(10% 0.02 60 / 0.85)", backdropFilter: "blur(8px)" }}
            onClick={() => setZoomOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 26 }}
              className="relative max-w-4xl w-full aspect-video rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={getDownloadUrl(job.preview_url!)}
                alt="Aperçu du coloriage — agrandi"
                fill
                className="object-contain"
                style={{ backgroundColor: "white" }}
                unoptimized
              />
              <button
                type="button"
                onClick={() => setZoomOpen(false)}
                className="absolute top-3 right-3 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm"
                style={{
                  backgroundColor: "oklch(15% 0.02 60 / 0.8)",
                  color: "white",
                }}
                aria-label="Fermer l'aperçu agrandi"
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function StatPill({ icon, label }: { icon: string; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-display font-semibold"
      style={{ backgroundColor: "oklch(96% 0.06 80)", color: "oklch(50% 0.14 70)" }}
    >
      <span aria-hidden>{icon}</span>
      {label}
    </span>
  );
}
