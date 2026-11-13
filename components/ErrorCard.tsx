import Mascot from "./Mascot";

export default function ErrorCard({ message, onReset }: { message?: string | null; onReset: () => void }) {
  return (
    <div className="pop rise flex max-w-2xl flex-col gap-4 bg-warn-soft p-6 sm:flex-row sm:p-8">
      <Mascot agent="clerk" mood="error" size={88} className="shrink-0" />
      <div>
        <h2 className="display text-3xl">Something went wrong reading that statement.</h2>
        {message && <p className="mt-3 text-lg text-muted">{message}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="?demo=1" className="btn-pop bg-accent px-6 py-3 text-lg font-extrabold">
            Try demo mode
          </a>
          <button onClick={onReset} className="btn-pop bg-white px-6 py-3 text-lg font-extrabold">
            Start over
          </button>
        </div>
      </div>
    </div>
  );
}
