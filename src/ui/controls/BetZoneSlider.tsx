"use client";

import { useMemo } from "react";
import type { BetZone, BetZoneKind } from "@/coach";
import { formatChips } from "@/lib/format";
import { cn } from "@/lib/utils";

const ZONE_COLOR: Record<BetZoneKind, string> = {
  good: "var(--zone-good)",
  aggressive: "var(--zone-aggressive)",
  risky: "var(--zone-risky)",
  cautious: "var(--zone-cautious)",
};

type Props = {
  min: number;
  max: number;
  value: number;
  zones: BetZone[];
  pot: number;
  stack: number;
  currentBet: number;
  heroBetStreet: number;
  street: string;
  bigBlind: number;
  onChange: (n: number) => void;
  zoneLabel: string;
  zoneReason: string;
  potFractionText: string;
};

function pctOfStack(amount: number, stack: number): number {
  if (stack <= 0) return 0;
  return Math.round((amount / stack) * 100);
}

export function BetZoneSlider({
  min,
  max,
  value,
  zones,
  pot,
  stack,
  currentBet,
  heroBetStreet,
  street,
  bigBlind,
  onChange,
  zoneLabel,
  zoneReason,
  potFractionText,
}: Props) {
  const span = Math.max(1, max - min);
  const thumbPct = ((value - min) / span) * 100;
  const putIn = Math.max(0, value - heroBetStreet);
  const stackPct = pctOfStack(putIn, stack);

  const presets = useMemo(() => {
    const items: { label: string; to: number }[] = [];
    const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n)));
    if (street === "preflop") {
      items.push({ label: "2,5 GB", to: clamp(bigBlind * 2.5) });
      items.push({ label: "3 GB", to: clamp(bigBlind * 3) });
    }
    items.push(
      { label: "⅓", to: clamp(currentBet + pot / 3) },
      { label: "½", to: clamp(currentBet + pot / 2) },
      { label: "¾", to: clamp(currentBet + pot * 0.75) },
      { label: "Pot", to: clamp(currentBet + pot) },
      { label: "Tapis", to: max },
    );
    // de-dupe by target
    const seen = new Set<number>();
    return items.filter((it) => {
      if (seen.has(it.to)) return false;
      seen.add(it.to);
      return true;
    });
  }, [street, bigBlind, currentBet, pot, min, max]);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-2">
      <div className="relative pt-10">
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-md px-2.5 py-1.5 text-center shadow-card"
          style={{
            left: `clamp(3rem, ${thumbPct}%, calc(100% - 3rem))`,
            top: 0,
            background: "var(--slider-bubble-bg)",
            color: "var(--slider-bubble-text)",
          }}
        >
          <div className="text-sm font-bold tabular-nums">
            {formatChips(value)} · {stackPct} % de ton tapis
          </div>
          <div className="text-[11px] text-text-muted">
            {potFractionText} · {zoneLabel}
          </div>
        </div>

        <div className="relative h-3 w-full">
          <div className="absolute inset-0 flex overflow-hidden rounded-full">
            {zones.map((z) => {
              const left = ((z.from - min) / span) * 100;
              const width = ((z.to - z.from + 0.001) / span) * 100;
              return (
                <div
                  key={`${z.from}-${z.to}-${z.kind}`}
                  className="absolute top-0 h-full"
                  style={{
                    left: `${left}%`,
                    width: `${Math.max(width, 0.5)}%`,
                    background: ZONE_COLOR[z.kind],
                  }}
                />
              );
            })}
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={1}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="absolute inset-0 z-10 h-3 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[var(--gold)] [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--gold)] [&::-webkit-slider-thumb]:bg-white"
            aria-label="Taille de mise"
          />
        </div>
      </div>

      <p className="min-h-[1.25rem] text-center text-xs text-text-muted">
        {zoneReason}
      </p>

      <div className="flex flex-wrap justify-center gap-1.5">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => onChange(p.to)}
            className={cn(
              "rounded-md border border-border px-2 py-1 text-xs font-semibold text-text transition-colors hover:bg-surface-3",
              value === p.to && "ring-2 ring-[var(--gold)]",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function potFractionApprox(
  putIn: number,
  pot: number,
): string {
  if (pot <= 0) return "";
  const r = putIn / pot;
  if (r < 0.2) return "≈ ⅕ du pot";
  if (r < 0.4) return "≈ ⅓ du pot";
  if (r < 0.6) return "≈ ½ du pot";
  if (r < 0.85) return "≈ ¾ du pot";
  if (r < 1.15) return "≈ 1 pot";
  return `≈ ${r.toFixed(1)} pots`;
}

export function amountWithStackPct(amount: number, stack: number): string {
  const pct = pctOfStack(amount, stack);
  return `${formatChips(amount)} (${pct} %)`;
}
