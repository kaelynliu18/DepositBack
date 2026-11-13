"use client";

import { useRef, useState } from "react";
import type { PickedFile } from "@/hooks/useFileInput";

interface Props {
  label: string;
  hint?: string;
  accept: string;
  picked: PickedFile | null;
  busy?: boolean;
  onFile: (f: File) => void;
  onClear?: () => void;
  compact?: boolean;
}

/** Click / drag-and-drop file target with a preview. */
export default function DropZone({ label, hint, accept, picked, busy, onFile, onClear, compact }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      className={`relative flex flex-col items-center justify-center rounded-2xl border-[2.5px] border-dashed text-center transition-colors ${
        over ? "border-ink bg-sun/40" : "border-ink/50 bg-white hover:border-ink hover:bg-sun/20"
      } ${compact ? "min-h-40 p-3" : "min-h-56 p-5"}`}
    >
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      {picked ? (
        <div className="flex w-full flex-col items-center gap-2">
          {picked.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={picked.previewUrl} alt={`${label} preview`} className={`${compact ? "max-h-32" : "max-h-48"} rounded-lg object-contain shadow`} />
          ) : (
            <div className="text-5xl">📄</div>
          )}
          <p className="max-w-full truncate text-sm font-medium text-muted">{picked.name}</p>
          <div className="flex gap-4 text-sm font-medium">
            <button type="button" onClick={() => ref.current?.click()} className="text-ink underline">
              Replace
            </button>
            {onClear && (
              <button type="button" onClick={onClear} className="text-muted underline">
                Remove
              </button>
            )}
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()} className="flex h-full w-full flex-col items-center justify-center gap-2">
          <span className="text-4xl">{busy ? "⏳" : "📤"}</span>
          <span className={`${compact ? "text-base" : "text-lg"} font-extrabold text-ink`}>{busy ? "Reading…" : label}</span>
          {hint && <span className="text-sm text-muted">{hint}</span>}
        </button>
      )}
    </div>
  );
}
