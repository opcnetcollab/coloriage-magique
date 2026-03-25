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
    // HEIC sometimes has no mime type
    file.name.toLowerCase().endsWith(".heic");
  if (!typeOk) {
    return "Format non supporté. Utilisez JPEG, PNG, WEBP ou HEIC.";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return `Image trop lourde (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum : ${MAX_SIZE_MB} MB.`;
  }
  return null;
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
      // reset input so same file can be re-selected
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

  // ── Preview state ──────────────────────────────────────────
  if (state === "preview" && previewUrl) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-purple-300 shadow">
          <Image
            src={previewUrl}
            alt="Aperçu de votre image"
            fill
            className="object-contain bg-gray-50"
            unoptimized
          />
        </div>
        <button
          type="button"
          onClick={reset}
          className="text-sm text-gray-500 underline hover:text-gray-700 transition-colors"
        >
          Changer d&apos;image
        </button>
      </div>
    );
  }

  // ── Idle / Dragging state ──────────────────────────────────
  const isDragging = state === "dragging";

  return (
    <div className="flex flex-col gap-2">
      <div
        className={`
          relative flex flex-col items-center justify-center gap-3
          rounded-2xl border-2 border-dashed p-10 text-center
          transition-colors cursor-pointer
          ${isDragging
            ? "border-purple-500 bg-purple-50"
            : "border-gray-300 bg-gray-50 hover:border-purple-400 hover:bg-purple-50/40"
          }
        `}
        onDragOver={(e) => { e.preventDefault(); setState("dragging"); }}
        onDragEnter={(e) => { e.preventDefault(); setState("dragging"); }}
        onDragLeave={() => setState("idle")}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Zone de dépôt d'image"
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      >
        <span className="text-4xl">{isDragging ? "📂" : "🖼️"}</span>
        <p className="text-gray-600 font-medium">
          {isDragging
            ? "Relâchez pour uploader"
            : "Glissez votre photo ici"}
        </p>
        <p className="text-xs text-gray-400">
          JPEG · PNG · WEBP · HEIC — max {MAX_SIZE_MB} MB
        </p>

        <button
          type="button"
          className="mt-1 px-4 py-2 rounded-lg bg-purple-600 text-white text-sm
                     font-semibold hover:bg-purple-700 active:scale-95 transition-all
                     shadow-sm pointer-events-none"
        >
          Choisir depuis mon appareil
        </button>

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
        <p className="text-sm text-red-600 flex items-center gap-1" role="alert">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  );
}
