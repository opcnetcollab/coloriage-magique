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

/** Cloud upload icon with float animation */
function UploadIcon({ dragging }: { dragging: boolean }) {
  return (
    <div
      className={`text-5xl transition-all duration-300 ${
        dragging ? "scale-125" : "animate-float"
      }`}
      aria-hidden="true"
    >
      {dragging ? "📂" : "☁️"}
    </div>
  );
}

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

  // ── Preview state ───────────────────────────────────────────
  if (state === "preview" && previewUrl) {
    return (
      <div className="flex flex-col items-center gap-3 animate-screen-enter">
        <div
          className="relative w-full aspect-video rounded-3xl overflow-hidden
                     border-2 border-primary-purple/40 shadow-card"
        >
          <Image
            src={previewUrl}
            alt="Aperçu de votre image"
            fill
            className="object-contain bg-surface-low"
            unoptimized
          />
        </div>
        <button
          type="button"
          onClick={reset}
          className="text-sm text-on-surface-variant underline hover:text-on-surface
                     transition-colors font-body"
        >
          Changer d&apos;image
        </button>
      </div>
    );
  }

  // ── Idle / Dragging state ───────────────────────────────────
  const isDragging = state === "dragging";

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`
          relative flex flex-col items-center justify-center gap-4
          rounded-5xl border-2 border-dashed p-12 text-center min-h-[280px]
          transition-all duration-200 cursor-pointer select-none
          ${
            isDragging
              ? "border-[#A78BFA] bg-purple-50 shadow-glow-purple scale-[1.01]"
              : "border-[rgba(167,139,250,0.4)] bg-[#FFF8F0] hover:border-[rgba(167,139,250,0.7)] hover:shadow-glow-purple hover:scale-[1.005]"
          }
        `}
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
        {/* Floating upload icon */}
        <UploadIcon dragging={isDragging} />

        {/* Text */}
        <div className="flex flex-col gap-1">
          <p className="font-display font-semibold text-base text-[#312e29]">
            {isDragging ? "Relâchez pour uploader" : "Glissez votre photo ici"}
          </p>
          <p className="text-sm text-[#5f5b55]">ou</p>
        </div>

        {/* CTA button — gradient amber → pink, pill shape */}
        <button
          type="button"
          className="
            px-6 py-2.5 rounded-full
            bg-gradient-to-r from-amber-400 to-pink-400
            text-white font-display font-semibold text-sm
            shadow-md hover:shadow-lg hover:scale-105
            transition-all duration-150 pointer-events-none
          "
        >
          Choisir une photo
        </button>

        <p className="text-xs text-[#5f5b55]">
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

      {error && (
        <p
          className="text-sm text-red-600 bg-red-50 rounded-2xl px-4 py-2 flex items-center gap-1"
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
