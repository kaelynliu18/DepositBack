export default function ErrorCard({ message, onReset }: { message?: string | null; onReset: () => void }) {
  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-amber-900">Something went wrong reading that statement.</h2>
      {message && <p className="mt-2 text-base text-amber-800">{message}</p>}
      <div className="mt-5 flex flex-wrap gap-3">
        <a href="?demo=1" className="rounded-xl bg-teal-800 px-5 py-3 text-lg font-semibold text-white hover:bg-teal-900">
          Try demo mode
        </a>
        <button onClick={onReset} className="rounded-xl border border-slate-300 px-5 py-3 text-lg font-semibold text-slate-700 hover:bg-white">
          Start over
        </button>
      </div>
    </div>
  );
}
