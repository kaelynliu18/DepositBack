import type { Tip } from "@/hooks/useTour";
import Mascot from "./Mascot";

/** A pop-up tip from the Case Manager. Appears once per key moment. */
export default function Coach({ tip, onDismiss, onTurnOff }: { tip: Tip | null; onDismiss: () => void; onTurnOff: () => void }) {
  if (!tip) return null;
  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-40 flex justify-center sm:inset-x-auto sm:bottom-6 sm:right-6 sm:justify-end" role="status" aria-live="polite">
      <div key={tip.id} className="pop pop-in pointer-events-auto flex w-full max-w-md items-start gap-3 bg-sun p-4">
        <Mascot agent="case_manager" mood="idle" size={52} className="shrink-0" />
        <div className="min-w-0">
          <p className="text-lg font-black leading-tight">{tip.title}</p>
          <p className="mt-1 text-base leading-snug">{tip.body}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button onClick={onDismiss} className="btn-pop bg-white px-4 py-1.5 text-base font-extrabold">
              Got it
            </button>
            <button onClick={onTurnOff} className="text-sm font-bold underline">
              Turn off tips
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
