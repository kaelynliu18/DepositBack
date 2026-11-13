"use client";

import { useCallback, useState } from "react";
import type { FileInput } from "@/lib/types";

const MAX_EDGE = 1568;

export interface PickedFile {
  file: FileInput;
  previewUrl: string;
  name: string;
}

/** Reads a File into base64 (no data: prefix). */
function readBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

/** Resizes an image to MAX_EDGE on its long edge and re-encodes as JPEG 0.85. */
async function shrinkImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.85));
  if (!blob) throw new Error("Could not encode image");
  return readBase64(blob);
}

export async function fileToInput(file: File): Promise<PickedFile> {
  if (file.type === "application/pdf") {
    return { file: { mediaType: "application/pdf", data: await readBase64(file) }, previewUrl: "", name: file.name };
  }
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image or PDF.");
  const data = await shrinkImage(file);
  return { file: { mediaType: "image/jpeg", data }, previewUrl: `data:image/jpeg;base64,${data}`, name: file.name };
}

/** State wrapper: pick a File (or set a ready FileInput) and get back base64 + preview URL. */
export function useFileInput() {
  const [picked, setPicked] = useState<PickedFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = useCallback(async (file: File | undefined | null) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      setPicked(await fileToInput(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that file.");
    } finally {
      setBusy(false);
    }
  }, []);

  /** For sample files that are already base64. */
  const setFile = useCallback((file: FileInput, name = "sample") => {
    setError(null);
    setPicked({
      file,
      name,
      previewUrl: file.mediaType === "application/pdf" ? "" : `data:${file.mediaType};base64,${file.data}`,
    });
  }, []);

  const clear = useCallback(() => setPicked(null), []);

  return { picked, busy, error, pick, setFile, clear };
}
