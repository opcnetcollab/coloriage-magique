"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";

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
  if (!typeOk) {
    return "Format non supporté. Utilisez JPEG, PNG, WEBP ou HEIC.";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `Image trop lourde (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum : ${MAX_SIZE_MB} MB.`;
  }
  return null;
}

/** Floating crayon particle — absolutely positioned background decoration */
function CrayonParticle({
  emoji,
  style,
}: {
  emoji: string;
  style: React.CSSProperties;
}) {
  return (
    <span
      className="absolute select-none pointer-events-none text-2xl animate-drift"
      style={style}
      aria-hidden="true"
    >
      {emoji}
    </span>
  );
}

const PARTICLES: Array<{ emoji: string; style: React.CSSProperties }> = [
  { emoji: "🖍️", style: { top: "12%", left: "8%",  animationDelay: "0s",    animationDuration: "4s"   } },
  { emoji: "✏️", style: { top: "20%", right: "10%", animationDelay: "1.2s",  animationDuration: "5s"   } },
  { emoji: "🖍️", style: { bottom: "18%", left: "12%", animationDelay: "0.6s", animationDuration: "4.5s" } },
  { emoji: "✏️", style: { bottom: "10%", right: "8%", animationDelay: "1.8s", animationDuration: "3.8s" } },
  { emoji: "🎨", style: { top: "50%", left: "4%",   animationDelay: "0.9s",  animationDuration: "4.2s" } },
];

export default function UploadZone({ onFile, file }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<State>(file ? "preview" : "idle");
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    file ? URL.createObjectURL(file) : null
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
      setState("idle");
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile]
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

  // ── Preview state ──────────────────────────────────────────────────────────
  if (state === "preview" && previewUrl) {
    return (
      <div className="flex flex-col items-center gap-3 animate-screen-enter">
        <div
          className="card-amber relative w-full aspect-video overflow-hidden"
          style={{ padding: 0 }}
        >
          <Image
            src={previewUrl}
            alt="Aperçu de votre image"
            fill
            className="object-contain"
            style={{ backgroundColor: "#fef3e2" }}
            unoptimized
          />
        </div>
        <button
          type="button"
          onClick={reset}
          className="text-sm font-body text-amber-600 underline hover:text-amber-700 transition-colors"
        >
          Changer d&apos;image
        </button>
      </div>
    );
  }

  // ── Idle / Dragging state ──────────────────────────────────────────────────
  const isDragging = state === "dragging";

  return (
    <div className="flex flex-col gap-2">
      {/* Drop zone */}
      <div
        className={`
          relative flex flex-col items-center justify-center gap-5
          rounded-3xl border-2 border-dashed p-10 text-center min-h-[260px]
          transition-all duration-200 cursor-pointer select-none overflow-hidden
          ${isDragging
            ? "border-amber-500 bg-amber-50 scale-[1.01] shadow-amber-md"
            : "border-amber-400/50 hover:border-amber-500/70 hover:shadow-amber-sm animate-pulse-border"
          }
        `}
        style={{ backgroundColor: isDragging ? undefined : "#fffbf5" }}
        onDragOver={(e) => { e.preventDefault(); setState("dragging"); }}
        onDragEnter={(e) => { e.preventDefault(); setState("dragging"); }}
        onDragLeave={() => setState("idle")}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Zone de dépôt photo — activez pour sélectionner un fichier"
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
      >
        {/* Floating crayon particles */}
        {PARTICLES.map((p, i) => (
          <CrayonParticle key={i} emoji={p.emoji} style={p.style} />
        ))}

        {/* Pencil icon with drift animation */}
        <div
          className={`text-5xl z-10 transition-all duration-300 ${
            isDragging ? "scale-125" : "animate-float"
          }`}
          aria-hidden="true"
        >
          {isDragging ? "📂" : "✏️"}
        </div>

        {/* Headline + subtext */}
        <div className="flex flex-col gap-1.5 z-10">
          <p className="font-display font-bold text-lg text-warm-900" style={{ color: "#1c1917" }}>
            {isDragging ? "Relâchez pour uploader" : "Glissez votre photo ici"}
          </p>
          <p className="font-body text-sm" style={{ color: "#5f5b55" }}>
            ou cliquez pour parcourir vos fichiers
          </p>
        </div>

        {/* CTA button */}
        <button
          type="button"
          className="btn-primary z-10 text-sm pointer-events-none"
          style={{ padding: "0.625rem 1.75rem" }}
          tabIndex={-1}
          aria-hidden="true"
        >
          Choisir une photo
        </button>

        {/* Format hint — single element so regex /JPEG.*PNG.*WEBP.*HEIC/i matches */}
        <p
          className="text-xs z-10 font-body"
          style={{ color: "#7b7670" }}
        >
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
      </div>

      {/* Error message */}
      {error && (
        <p
          className="text-sm rounded-2xl px-4 py-2 flex items-center gap-1.5 font-body"
          style={{
            color: "#b91c1c",
            backgroundColor: "#fef2f2",
            border: "1px solid rgba(239,68,68,0.15)",
          }}
          role="alert"
          aria-describedby="upload-error"
        >
          <span aria-hidden="true">⚠️</span>
          <span id="upload-error">{error}</span>
        </p>
      )}
    </div>
  );
}
