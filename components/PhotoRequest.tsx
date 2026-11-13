"use client";

import { useState } from "react";
import { useFileInput } from "@/hooks/useFileInput";
import { loadSamplePhotos } from "@/lib/client";
import { formatMoney } from "@/lib/compute";
import type { LineItem, PhotoPair } from "@/lib/types";
import DropZone from "./DropZone";

interface Props {
  item: LineItem;
  onDone: (photos: PhotoPair | null) => void;
}

/** Modal asking for move-in / move-out photos of one charge. Resolves with the pair, or null on Skip. */
export default function PhotoRequest({ item, onDone }: Props) {
  const moveIn = useFileInput();
  const moveOut = useFileInput();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function sample() {
    setBusy(true);
    setErr(null);
    try {
      onDone(await loadSamplePhotos());
    } catch {
      setErr("Couldn't load the sample photos.");
      setBusy(false);
    }
  }

  const ready = moveIn.picked && moveOut.picked;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <div className="slide-in max-h-[95vh] w-full max-w-2xl space-y-5 overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-8">
        <p className="text-xl leading-relaxed text-slate-900 sm:text-2xl">
          🔍 The Inspector thinks photos could beat the {formatMoney(item.amount)} &lsquo;{item.description}&rsquo; charge. Got
          move-in and move-out shots of that spot?
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="font-semibold text-slate-700">Move-in</p>
            <DropZone compact label="Add photo" accept="image/*" picked={moveIn.picked} busy={moveIn.busy} onFile={moveIn.pick} onClear={moveIn.clear} />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-slate-700">Move-out</p>
            <DropZone compact label="Add photo" accept="image/*" picked={moveOut.picked} busy={moveOut.busy} onFile={moveOut.pick} onClear={moveOut.clear} />
          </div>
        </div>
        {(moveIn.error || moveOut.error || err) && <p className="text-amber-700">{moveIn.error || moveOut.error || err}</p>}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            disabled={!ready || busy}
            onClick={() => ready && onDone({ moveIn: moveIn.picked!.file, moveOut: moveOut.picked!.file })}
            className="flex-1 rounded-xl bg-teal-800 px-5 py-3 text-lg font-semibold text-white hover:bg-teal-900 disabled:opacity-40"
          >
            Send to Inspector
          </button>
          <button
            disabled={busy}
            onClick={sample}
            className="flex-1 rounded-xl border border-teal-700 px-5 py-3 text-lg font-semibold text-teal-800 hover:bg-teal-50 disabled:opacity-40"
          >
            {busy ? "Loading…" : "Use sample photos"}
          </button>
        </div>
        <div className="text-center">
          <button onClick={() => onDone(null)} className="text-base text-slate-500 underline">
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
