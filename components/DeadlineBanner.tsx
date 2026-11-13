export default function DeadlineBanner({ days }: { days: number }) {
  return (
    <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-lg leading-relaxed text-red-900">
      Your landlord sent this {days} days after you moved out — past California&apos;s 21-day deadline. That can count as bad
      faith, which can mean up to twice your deposit in penalties.
    </div>
  );
}
