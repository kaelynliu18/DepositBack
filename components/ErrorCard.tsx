export default function ErrorCard({ message, onReset }: { message?: string | null; onReset: () => void }) {
  return (
    <div className="rise max-w-2xl rounded-3xl border-2 border-warn bg-warn-soft p-6 sm:p-8">
      <h2 className="font-display text-3xl font-bold text-ink">Something went wrong reading that statement.</h2>
      {message && <p className="mt-3 text-lg text-muted">{message}</p>}
      <div className="mt-6 flex flex-wrap gap-3">
        <a href="?demo=1" className="rounded-xl bg-accent px-6 py-3 text-lg font-semibold text-white hover:bg-accent-dark">
          Try demo mode
        </a>
        <button onClick={onReset} className="rounded-xl border-2 border-ink px-6 py-3 text-lg font-semibold hover:bg-white">
          Start over
        </button>
      </div>
    </div>
  );
}
