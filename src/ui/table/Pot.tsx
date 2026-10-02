"use client";

import { formatChips } from "@/lib/format";

export function Pot({ amount }: { amount: number }) {
  return (
    <div className="rounded-full bg-surface/80 px-4 py-1.5 text-sm font-medium text-text shadow-card">
      Pot{" "}
      <span className="font-mono tabular-nums text-gold">
        {formatChips(amount)}
      </span>
    </div>
  );
}
