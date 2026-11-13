export default function DeadlineBanner({ days }: { days: number }) {
  return (
    <div role="alert" className="rise rounded-2xl bg-bad p-5 text-lg font-medium leading-relaxed text-white sm:p-6 sm:text-xl">
      Your landlord sent this {days} days after you moved out — past California&apos;s 21-day deadline. That can count as bad
      faith, which can mean up to twice your deposit in penalties.
    </div>
  );
}
