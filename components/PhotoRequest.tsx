"use client";

import { useFileInput } from "@/hooks/useFileInput";
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

  const ready = moveIn.picked && moveOut.picked;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <div className="slide-in max-h-[95vh] w-full max-w-2xl space-y-5 overflow-y-auto pop rounded-b-none p-5 sm:rounded-[20px] sm:p-8 sm:p-8">
        <p className="text-2xl font-black leading-snug tracking-tight sm:text-3xl">
          🔍 The Inspector thinks photos could beat the {formatMoney(item.amount)} &lsquo;{item.description}&rsquo; charge. Got
          move-in and move-out shots of that spot?
        </p>

        <p className="rounded-xl bg-sun/60 px-3 py-2 text-base">Photos are optional but powerful: they can turn a &ldquo;maybe&rdquo; into a win. If you skip, the Clerk&apos;s verdict stands.</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="font-semibold">Move-in</p>
            <DropZone compact label="Add photo" accept="image/*" picked={moveIn.picked} busy={moveIn.busy} onFile={moveIn.pick} onClear={moveIn.clear} />
          </div>
          <div className="space-y-1">
            <p className="font-semibold">Move-out</p>
            <DropZone compact label="Add photo" accept="image/*" picked={moveOut.picked} busy={moveOut.busy} onFile={moveOut.pick} onClear={moveOut.clear} />
          </div>
        </div>
        {(moveIn.error || moveOut.error) && <p className="text-warn">{moveIn.error || moveOut.error}</p>}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            disabled={!ready}
            onClick={() => ready && onDone({ moveIn: moveIn.picked!.file, moveOut: moveOut.picked!.file })}
            className="flex-1 btn-pop bg-accent px-5 py-3 text-lg font-extrabold disabled:opacity-40"
          >
            Send to Inspector
          </button>
        </div>
        <div className="text-center">
          <button onClick={() => onDone(null)} className="text-base font-medium text-muted underline">
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
