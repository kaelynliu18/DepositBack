import { formatMoney } from "@/lib/compute";
import type { CaseResult } from "@/lib/types";

const SELF_HELP = "https://selfhelp.courts.ca.gov/small-claims-california";

/** Collapsible preview of the key California SC-100 fields, pre-filled from the result. */
export default function SmallClaims({ result, tenantName }: { result: CaseResult; tenantName: string }) {
  const disputed = result.items.filter((i) => i.verdict !== "allowed");
  const reason = disputed.length
    ? `Landlord kept my security deposit for improper deductions (Civil Code §1950.5): ${disputed
        .map((i) => `${i.description} (${formatMoney(i.amount)})`)
        .join("; ")}.`
    : "Landlord withheld my security deposit (Civil Code §1950.5).";

  const fields: [string, string][] = [
    ["Plaintiff (you)", tenantName],
    ["Defendant (landlord)", result.clerk.landlordName ?? ""],
    ["Defendant's address", result.clerk.propertyAddress ?? ""],
    ["Amount claimed", formatMoney(result.strongClaim)],
    ["Why the defendant owes this money", reason],
  ];

  return (
    <details className="pop p-4 sm:p-5">
      <summary className="cursor-pointer text-xl font-black">If they ignore you: small claims</summary>
      <div className="mt-4 space-y-4">
        <p className="text-base text-muted">
          Small claims court is built for this: no lawyer needed. Here is what you&apos;d put on California form SC-100.
        </p>
        <dl className="space-y-3">
          {fields
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="rounded-xl border-2 border-ink bg-paper p-3">
                <dt className="text-sm font-bold text-muted">{k}</dt>
                <dd className="mt-0.5 break-words text-base">{v}</dd>
              </div>
            ))}
        </dl>
        <a
          href={SELF_HELP}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-pop flex min-h-12 items-center justify-center bg-white px-5 py-3 text-lg font-extrabold"
        >
          California courts small-claims help ↗
        </a>
        <p className="text-sm text-muted">Not legal advice. Check filing limits and deadlines with the court.</p>
      </div>
    </details>
  );
}
