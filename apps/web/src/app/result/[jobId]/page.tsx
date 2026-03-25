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
  "Analyse de votre image…",
  "Détection des zones de couleur…",
  "Génération des contours…",
  "Optimisation pour l'impression…",
  "Création du nuancier…",
  "Finalisation en cours…",
];

export default function ResultPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.jobId as string;

  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msgIndex, setMsgIndex] = useState(0);
  const pollCount = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Rotate processing messages every 3s
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % PROCESSING_MESSAGES.length);
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

        if (data.status === "done" || data.status === "failed") {
          return; // Stop polling
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
    <main className="min-h-screen bg-gradient-to-br from-amber-100 via-purple-100 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Back button */}
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-4 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← Faire un autre coloriage
        </button>

        <div className="bg-white rounded-3xl shadow-xl p-6 flex flex-col gap-6">
          {/* ── PROCESSING ───────────────────────────── */}
          {isProcessing && !error && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div
                className="h-16 w-16 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin"
                aria-label="Chargement"
              />
              <div className="text-center">
                <p className="font-semibold text-gray-800 text-lg">
                  Magie en cours…
                </p>
                <p className="text-sm text-gray-500 mt-1 transition-all">
                  {PROCESSING_MESSAGES[msgIndex]}
                </p>
              </div>
              <div className="flex gap-1 mt-2">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-2 w-2 rounded-full bg-purple-300 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── ERROR ────────────────────────────────── */}
          {(error || status === "failed") && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <span className="text-5xl">😕</span>
              <p className="font-semibold text-gray-800">
                La génération a échoué
              </p>
              <p className="text-sm text-red-600">
                {error ?? "Une erreur est survenue lors du traitement."}
              </p>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="mt-2 px-5 py-2 rounded-xl bg-purple-600 text-white font-semibold text-sm
                           hover:bg-purple-700 active:scale-95 transition-all"
              >
                Réessayer
              </button>
            </div>
          )}

          {/* ── DONE ─────────────────────────────────── */}
          {status === "done" && job && (
            <>
              <div className="text-center">
                <h1 className="text-2xl font-extrabold text-gray-900">
                  🎉 Votre coloriage est prêt !
                </h1>
                {job.processing_ms && (
                  <p className="text-xs text-gray-400 mt-1">
                    Généré en {(job.processing_ms / 1000).toFixed(1)}s
                  </p>
                )}
              </div>

              {/* Preview PNG */}
              {job.preview_url && (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                  <Image
                    src={getDownloadUrl(job.preview_url)}
                    alt="Aperçu du coloriage"
                    fill
                    className="object-contain bg-gray-50"
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
                    className="flex flex-col items-center gap-1 rounded-2xl border-2 border-purple-500
                               bg-purple-600 px-4 py-3 text-white font-semibold text-sm text-center
                               hover:bg-purple-700 active:scale-95 transition-all shadow-md"
                  >
                    <span className="text-xl">🖨️</span>
                    <span>Coloriage PDF</span>
                    <span className="text-xs font-normal opacity-80">
                      Zones numérotées
                    </span>
                  </a>
                )}
                {job.reference_pdf_url && (
                  <a
                    href={getDownloadUrl(job.reference_pdf_url)}
                    download="reference.pdf"
                    className="flex flex-col items-center gap-1 rounded-2xl border-2 border-gray-300
                               bg-white px-4 py-3 text-gray-800 font-semibold text-sm text-center
                               hover:border-purple-400 hover:bg-violet-50 active:scale-95 transition-all shadow-sm"
                  >
                    <span className="text-xl">🎨</span>
                    <span>Référence PDF</span>
                    <span className="text-xs font-normal text-gray-500">
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
