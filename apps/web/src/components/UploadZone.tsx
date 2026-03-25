"use client";

import { useCallback, useRef, useState, useId } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from "framer-motion";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.webp,.heic";
const MAX_SIZE_MB = 20;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

interface UploadZoneProps {
  onFile: (file: File) => void;
  file: File | null;
}

type State = "idle" | "dragging" | "preview";

function validateFile(file: File): string | null {
  const typeOk =
    ACCEPTED_TYPES.includes(file.type) ||
    file.name.toLowerCase().endsWith(".heic");
  if (!typeOk) return "Format non supporté. Utilisez JPEG, PNG, WEBP ou HEIC.";
  if (file.size > MAX_SIZE_BYTES)
    return `Image trop lourde (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum : ${MAX_SIZE_MB} MB.`;
  return null;
}

/** Animated SVG dashed border that draws itself */
function AnimatedBorder({ isDragging }: { isDragging: boolean }) {
  const strokeColor = isDragging ? "oklch(75% 0.15 70)" : "oklch(75% 0.08 70)";
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect
        x="2" y="2"
        width="calc(100% - 4px)" height="calc(100% - 4px)"
        rx="24" ry="24"
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeDasharray="8 6"
        style={{
          strokeDashoffset: isDragging ? 0 : 200,
          transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease",
          animation: isDragging ? "none" : "dashDraw 3s ease forwards",
        }}
      />
    </svg>
  );
}

export default function UploadZone({ onFile, file }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>(file ? "preview" : "idle");
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    file ? URL.createObjectURL(file) : null
  );
  const errorId = useId();

  // Spring for drag-over scale
  const dragScale = useSpring(1, { stiffness: 400, damping: 25 });
  const dragGlow = useMotionValue(0);
  const boxShadow = useTransform(
    dragGlow,
    [0, 1],
    [
      "0 4px 24px oklch(75% 0.15 70 / 0.1)",
      "0 8px 48px oklch(75% 0.15 70 / 0.35)",
    ]
  );

  const handleFile = useCallback(
    (f: File) => {
      const err = validateFile(f);
      if (err) {
        setError(err);
        setState("idle");
        return;
      }
      setError(null);
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
      setState("preview");
      onFile(f);
    },
    [onFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      dragScale.set(1);
      dragGlow.set(0);
      setState("idle");
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile, dragScale, dragGlow]
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) handleFile(selected);
      e.target.value = "";
    },
    [handleFile]
  );

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setState("idle");
    setError(null);
  };

  // ── Preview state ──────────────────────────────────────────────────
  if (state === "preview" && previewUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-3"
      >
        <div
          className="relative w-full aspect-video rounded-3xl overflow-hidden"
          style={{
            border: "1px solid oklch(85% 0.04 70)",
            boxShadow: "0 8px 32px oklch(75% 0.15 70 / 0.15)",
          }}
        >
          <Image
            src={previewUrl}
            alt="Aperçu de votre image"
            fill
            className="object-contain"
            style={{ backgroundColor: "oklch(98% 0.01 80)" }}
            unoptimized
          />
        </div>
        <button
          type="button"
          onClick={reset}
          className="text-sm font-body underline transition-colors"
          style={{ color: "oklch(60% 0.12 70)" }}
        >
          Changer d&apos;image
        </button>
      </motion.div>
    );
  }

  const isDragging = state === "dragging";

  return (
    <div className="flex flex-col gap-2">
      {/* Drop zone */}
      <motion.div
        style={{ boxShadow }}
        animate={{
          scale: isDragging ? 1.02 : 1,
          backgroundColor: isDragging
            ? "oklch(97% 0.03 80)"
            : "oklch(98% 0.01 80)",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className="relative flex flex-col items-center justify-center gap-5 rounded-3xl p-10 text-center min-h-[260px] cursor-pointer select-none overflow-hidden"
        onDragOver={(e) => {
          e.preventDefault();
          if (state !== "dragging") {
            setState("dragging");
            dragScale.set(1.08);
            dragGlow.set(1);
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setState("dragging");
          dragScale.set(1.08);
          dragGlow.set(1);
        }}
        onDragLeave={() => {
          setState("idle");
          dragScale.set(1);
          dragGlow.set(0);
        }}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Zone de dépôt photo — activez pour sélectionner un fichier"
        onKeyDown={(e) =>
          (e.key === "Enter" || e.key === " ") && inputRef.current?.click()
        }
      >
        {/* Animated SVG dashed border */}
        <AnimatedBorder isDragging={isDragging} />

        {/* Shimmer overlay (idle only) */}
        {!isDragging && (
          <div
            className="absolute inset-0 pointer-events-none rounded-3xl"
            style={{
              background:
                "linear-gradient(105deg, transparent 40%, oklch(95% 0.02 80 / 0.6) 50%, transparent 60%)",
              backgroundSize: "200% 100%",
              animation: "shimmerSlide 3s ease-in-out infinite",
            }}
            aria-hidden
          />
        )}

        {/* Glow on drag-over */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at center, oklch(75% 0.15 70 / 0.12) 0%, transparent 70%)",
              }}
              aria-hidden
            />
          )}
        </AnimatePresence>

        {/* Pencil icon with spring rotate */}
        <motion.div
          animate={{
            rotate: isDragging ? 10 : -15,
            scale: isDragging ? 1.25 : 1,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="text-5xl z-10"
          aria-hidden="true"
          style={{ display: "inline-block" }}
        >
          {isDragging ? "📂" : "✏️"}
        </motion.div>

        {/* Headline + subtext */}
        <div className="flex flex-col gap-1.5 z-10">
          <p
            className="font-display font-extrabold text-xl"
            style={{ color: "oklch(18% 0.02 60)", letterSpacing: "-0.02em" }}
          >
            {isDragging ? "Relâchez pour uploader" : "Glissez votre photo ici"}
          </p>
          <p className="font-body text-sm" style={{ color: "oklch(45% 0.02 60)" }}>
            ou cliquez pour parcourir vos fichiers
          </p>
        </div>

        {/* CTA button — soft pulse */}
        <motion.button
          type="button"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="btn-primary z-10 text-sm pointer-events-none"
          style={{ padding: "0.625rem 1.75rem" }}
          tabIndex={-1}
          aria-hidden="true"
        >
          Choisir une photo
        </motion.button>

        {/* Format hint */}
        <p className="text-xs z-10 font-body" style={{ color: "oklch(55% 0.02 60)" }}>
          JPEG · PNG · WEBP · HEIC — max {MAX_SIZE_MB} MB
        </p>

        {/* Hidden real input */}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          className="sr-only"
          onChange={onInputChange}
          aria-hidden="true"
        />
      </motion.div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-sm rounded-2xl px-4 py-2 flex items-center gap-1.5 font-body"
            style={{
              color: "#b91c1c",
              backgroundColor: "#fef2f2",
              border: "1px solid rgba(239,68,68,0.15)",
            }}
            role="alert"
            id={errorId}
          >
            <span aria-hidden="true">⚠️</span>
            <span>{error}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
