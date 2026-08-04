"use client";

import { useEffect, useRef, useState } from "react";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";

type Props = {
  file: File | null;
  onChange: (file: File | null) => void;
};

export function ConcertPhotoPicker({ file, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function onPick(selected: File | null) {
    setLocalError(null);
    if (!selected) {
      onChange(null);
      return;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(selected.type)) {
      setLocalError("Please choose a JPEG, PNG, or WebP image.");
      onChange(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    if (selected.size > MAX_BYTES) {
      setLocalError("That photo is too big. Please use an image under 5 MB.");
      onChange(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    onChange(selected);
  }

  function clear() {
    onChange(null);
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="form-control w-full">
      <div className="label py-1">
        <span className="label-text font-medium">Add a photo (optional)</span>
      </div>
      <p className="text-sm opacity-70 mb-2">
        JPEG, PNG, or WebP · max 5 MB. A concert selfie or stage shot works great.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="file-input file-input-bordered w-full max-w-md"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <button type="button" className="btn btn-ghost btn-sm" onClick={clear}>
            Clear photo
          </button>
        ) : null}
      </div>

      {localError ? <p className="text-error text-sm mt-2">{localError}</p> : null}

      {previewUrl ? (
        <div className="mt-3 rounded-box overflow-hidden border border-base-300 max-w-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Concert photo preview"
            className="w-full max-h-64 object-cover"
          />
        </div>
      ) : null}
    </div>
  );
}

export function safePhotoFileName(name: string): string {
  const base = name.replace(/\.[^.]+$/, "");
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "jpg";
  const safeBase = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
  return `${safeBase || "photo"}.${safeExt === "jpeg" ? "jpg" : safeExt}`;
}
