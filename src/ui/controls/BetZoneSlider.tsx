"use client";

import { useMemo, useState } from "react";
import type { BetZone, BetZoneKind } from "@/coach";
import { formatChips, formatStackPercent } from "@/lib/format";
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
  currentBet: number;
  street: string;
  bigBlind: number;
  onChange: (n: number) => void;
};

/**
 * Map an absolute raise-to amount onto the track [0, 100].
 * min (legal) = 0 %, max (all-in) = 100 %.
 */
export function amountToTrackPct(
  amount: number,
  min: number,
  max: number,
): number {
  const span = Math.max(1, max - min);
  return ((Math.min(max, Math.max(min, amount)) - min) / span) * 100;
}

/** Segments for the colored track; covers [min, max] contiguously. */
export function zoneTrackSegments(
  zones: BetZone[],
  min: number,
  max: number,
): { left: number; width: number; kind: BetZoneKind }[] {
  const span = Math.max(1, max - min);
  return zones
    .map((z) => {
      const from = Math.max(min, Math.min(max, z.from));
      const to = Math.max(min, Math.min(max, z.to));
      if (to < from) return null;
      // Position of the start edge; width to the start of the next chip after `to`.
      const left = ((from - min) / span) * 100;
      const right = ((Math.min(max, to + 1) - min) / span) * 100;
      const width = Math.max(right - left, 0.15);
      return { left, width: Math.min(width, 100 - left), kind: z.kind };
    })
    .filter((s): s is { left: number; width: number; kind: BetZoneKind } =>
      Boolean(s),
    );
}

export function BetZoneSlider({
  min,
  max,
  value,
  zones,
  pot,
  currentBet,
  street,
  bigBlind,
  onChange,
}: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  const segments = useMemo(
    () => zoneTrackSegments(zones, min, max),
    [zones, min, max],
  );

  const presets = useMemo(() => {
    const items: { label: string; to: number }[] = [];
    const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n)));
    if (street === "preflop") {
      items.push({ label: "2,5 GB", to: clamp(bigBlind * 2.5) });
      items.push({ label: "3 GB", to: clamp(bigBlind * 3) });
    }
    items.push(
      { label: "1/2 pot", to: clamp(currentBet + pot / 2) },
      { label: "2/3 pot", to: clamp(currentBet + (pot * 2) / 3) },
      { label: "3/4 pot", to: clamp(currentBet + pot * 0.75) },
      { label: "Pot", to: clamp(currentBet + pot) },
      { label: "Tapis", to: max },
    );
    const seen = new Set<number>();
    return items.filter((it) => {
      if (seen.has(it.to)) return false;
      seen.add(it.to);
      return true;
    });
  }, [street, bigBlind, currentBet, pot, min, max]);

  const commitDraft = () => {
    if (draft === null) return;
    const parsed = Number(String(draft).replace(/\s/g, "").replace(",", "."));
    if (Number.isFinite(parsed)) {
      onChange(Math.min(max, Math.max(min, Math.round(parsed))));
    }
    setDraft(null);
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="relative h-3 min-w-0 flex-1">
          <div
            className="absolute inset-0 overflow-hidden rounded-full"
            style={{ background: "var(--zone-cautious)" }}
          >
            {segments.map((s, i) => (
              <div
                key={`${s.kind}-${s.left}-${i}`}
                className="absolute top-0 h-full"
                style={{
                  left: `${s.left}%`,
                  width: `${s.width}%`,
                  background: ZONE_COLOR[s.kind],
                }}
              />
            ))}
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
        <input
          type="text"
          inputMode="numeric"
          className="h-9 w-[5.5rem] shrink-0 rounded-md border border-border bg-surface px-2 text-center text-sm font-bold tabular-nums text-text"
          value={draft ?? formatChips(value)}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          aria-label="Montant de la mise"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
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

export function potFractionApprox(putIn: number, pot: number): string {
  if (pot <= 0) return "";
  const r = putIn / pot;
  if (r < 0.2) return "≈ ⅕ du pot";
  if (r < 0.4) return "≈ ⅓ du pot";
  if (r < 0.55) return "≈ ½ du pot";
  if (r < 0.7) return "≈ ⅔ du pot";
  if (r < 0.85) return "≈ ¾ du pot";
  if (r < 1.15) return "≈ 1 pot";
  return `≈ ${formatNumberFr(r, 1)} pots`;
}

function formatNumberFr(n: number, maxFrac: number): string {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: maxFrac,
    minimumFractionDigits: 0,
  }).format(n);
}

export function amountWithStackPct(amount: number, stack: number): string {
  return `${formatChips(amount)} (${formatStackPercent(amount, stack)})`;
}

export function zoneKindColor(kind: BetZoneKind | undefined): string {
  if (!kind) return "var(--text-muted)";
  return ZONE_COLOR[kind];
}
