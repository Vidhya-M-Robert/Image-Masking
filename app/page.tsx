"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  MAX_FILE_SIZE_IN_MB,
} from "./constants/common";
import { ImageUploadIcon, TrashBlackIcon } from "./assets/svg";

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState("");
  const [maskedImageUrl, setMaskedImageUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (originalImageUrl) {
        URL.revokeObjectURL(originalImageUrl);
      }

      if (maskedImageUrl) {
        URL.revokeObjectURL(maskedImageUrl);
      }
    };
  }, [originalImageUrl, maskedImageUrl]);

  async function handleImageSelection(selectedFile: File | null) {
    setError("");
    setMaskedImageUrl("");

    if (!selectedFile) {
      handleRemove();
      return;
    }

    const isAllowedType = ALLOWED_IMAGE_TYPES.includes(
      selectedFile.type as (typeof ALLOWED_IMAGE_TYPES)[number],
    );

    if (!isAllowedType) {
      setError("Upload a valid JPG, PNG, or WebP image.");
      return;
    }

    if (selectedFile.size === 0 || selectedFile.size > MAX_FILE_SIZE) {
      setError(
        `Please upload an image smaller than ${MAX_FILE_SIZE_IN_MB} MB.`,
      );
      return;
    }

    setFile(selectedFile);
    setOriginalImageUrl(URL.createObjectURL(selectedFile));
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/image-masking", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error ?? "Unable to process the image.");
      }

      const blob = await response.blob();
      setMaskedImageUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleRemove() {
    setFile(null);
    setOriginalImageUrl("");
    setMaskedImageUrl("");
    setError("");
    setLoading(false);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <main className="min-h-screen bg-[#e0e3e9] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">
              Number Plate Masking
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-gray-600 sm:text-base">
              Automatically detect and mask vehicle registration plates to help
              protect sensitive information in car images.
            </p>
          </div>
        </header>
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-gray-900">
              Upload Car Image
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              PNG, JPG, or WebP · Max file size {MAX_FILE_SIZE_IN_MB} MB
            </p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            className="sr-only"
            onChange={(event) => {
              void handleImageSelection(event.target.files?.[0] ?? null);
              event.target.value = "";
            }}
          />

          <div
            role="button"
            tabIndex={0}
            aria-label={file ? "Replace vehicle image" : "Upload vehicle image"}
            aria-disabled={loading}
            onClick={() => {
              if (!loading) {
                inputRef.current?.click();
              }
            }}
            onKeyDown={(event) => {
              if (loading) return;

              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                inputRef.current?.click();
              }
            }}
            className="relative flex min-h-130 w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-10 h-full w-full"
              preserveAspectRatio="none"
            >
              <rect
                x="1"
                y="1"
                width="calc(100% - 2px)"
                height="calc(100% - 2px)"
                rx="16"
                ry="16"
                fill="none"
                stroke="var(--color-outline, #bfbfbf)"
                strokeWidth="1.5"
                strokeDasharray="5 5"
              />
            </svg>

            {maskedImageUrl ? (
              <>
                <Image
                  src={maskedImageUrl}
                  alt="Vehicle with masked number plate"
                  unoptimized
                  width={1200}
                  height={800}
                  className="absolute inset-0 h-full w-full rounded-2xl object-cover"
                />

                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleRemove();
                  }}
                  className="absolute right-3 top-3 z-30 flex size-9 items-center justify-center rounded-xl bg-white p-2 shadow-sm transition hover:bg-gray-100"
                >
                  <Image src={TrashBlackIcon} alt="" />
                </button>
              </>
            ) : originalImageUrl ? (
              <>
                <Image
                  src={originalImageUrl}
                  alt="Selected vehicle"
                  unoptimized
                  width={1200}
                  height={800}
                  className="absolute inset-0 h-full w-full rounded-2xl object-cover"
                />

                {loading && (
                  <div
                    className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-black/75"
                    aria-live="polite"
                    aria-busy="true"
                  >
                    <span className="size-9 animate-spin rounded-full border-4 border-white/30 border-t-emerald-500" />

                    <p className="mt-3 text-sm font-medium text-white">
                      Processing image...
                    </p>
                  </div>
                )}

                {!loading && (
                  <button
                    type="button"
                    aria-label="Remove image"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleRemove();
                    }}
                    className="absolute right-3 top-3 z-30 flex size-9 items-center justify-center rounded-xl bg-white p-2 shadow-sm transition hover:bg-gray-100"
                  >
                    <Image src={TrashBlackIcon} alt="" />
                  </button>
                )}
              </>
            ) : (
              <div className="pointer-events-none flex flex-col items-center gap-3 px-4 py-10 text-center">
                <Image src={ImageUploadIcon} alt="" />

                <p className="text-xl font-normal text-gray-500">
                  Upload image
                </p>
              </div>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700"
            >
              {error}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
