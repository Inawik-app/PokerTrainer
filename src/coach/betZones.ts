export type BetZoneKind = "good" | "aggressive" | "risky" | "cautious";

export type BetZone = {
  from: number;
  to: number;
  kind: BetZoneKind;
  label: string;
  reason: string;
};

export type BetZonesInput = {
  street: "preflop" | "flop" | "turn" | "river" | "showdown";
  bigBlind: number;
  pot: number;
  /** Absolute max the hero can put in (raise-to / bet-to). */
  min: number;
  max: number;
  /** True when facing a raise (3-bet / re-raise sizing). */
  isReRaise: boolean;
  /** Size of the bet/raise we face, for 3× sizing (absolute total). */
  facingTotal: number;
  /** Players who only called an open (limp/call count), for open sizing. */
  callers: number;
  /** Approximate SPR = effective stack / pot. */
  spr: number;
  /** Many outs / draw (coach hint). */
  hasDraw: boolean;
};

function clampZone(from: number, to: number, min: number, max: number): BetZone | null {
  const a = Math.max(min, Math.min(max, Math.round(from)));
  const b = Math.max(min, Math.min(max, Math.round(to)));
  if (b < a) return null;
  if (b === a && a > min && a < max) {
    // keep degenerate mid points as 1-chip wide if possible
    return { from: a, to: Math.min(max, a), kind: "good", label: "", reason: "" };
  }
  return { from: a, to: b, kind: "good", label: "", reason: "" };
}

function fillGaps(
  pieces: BetZone[],
  min: number,
  max: number,
): BetZone[] {
  const sorted = [...pieces]
    .filter((z) => z.to >= z.from)
    .sort((a, b) => a.from - b.from);
  const out: BetZone[] = [];
  let cursor = min;
  for (const z of sorted) {
    if (z.from > cursor) {
      out.push({
        from: cursor,
        to: z.from - 1,
        kind: "cautious",
        label: "Trop petit",
        reason: "En dessous de la taille conseillée.",
      });
    }
    out.push(z);
    cursor = z.to + 1;
  }
  if (cursor <= max) {
    out.push({
      from: cursor,
      to: max,
      kind: "risky",
      label: "Excessif",
      reason: "Beaucoup trop gros par rapport à la situation.",
    });
  }
  return out.filter((z) => z.to >= z.from);
}

/**
 * Build contiguous bet/raise-to zones from legal min to all-in.
 * Amounts are absolute "bet/raise to" totals (same as the slider).
 */
export function getBetZones(input: BetZonesInput, equity: number): BetZone[] {
  const { min, max, street, bigBlind, pot, isReRaise, facingTotal, callers, spr, hasDraw } =
    input;
  if (max < min || max <= 0) return [];

  const bb = Math.max(1, bigBlind);
  const stackLeft = max; // raise-to max ≈ stack commitment capacity in our UI

  if (street === "preflop") {
    return preflopZones({ min, max, bb, isReRaise, facingTotal, callers, equity, spr });
  }

  return postflopZones({ min, max, pot, equity, spr, hasDraw, stackLeft });
}

function preflopZones(args: {
  min: number;
  max: number;
  bb: number;
  isReRaise: boolean;
  facingTotal: number;
  callers: number;
  equity: number;
  spr: number;
}): BetZone[] {
  const { min, max, bb, isReRaise, facingTotal, callers, equity, spr } = args;
  const shortStack = max / bb <= 15 || spr < 2;
  const strong = equity >= 0.55;

  if (isReRaise) {
    const target = Math.max(min, Math.round(facingTotal * 3));
    const goodLo = Math.max(min, Math.round(target * 0.85));
    const goodHi = Math.min(max, Math.round(target * 1.15));
    const zones: BetZone[] = [];
    if (goodLo > min) {
      zones.push({
        from: min,
        to: goodLo - 1,
        kind: "cautious",
        label: "Trop petit",
        reason: "Une sur-relance trop petite n'élimine personne.",
      });
    }
    zones.push({
      from: goodLo,
      to: Math.max(goodLo, goodHi),
      kind: "good",
      label: "Conseillé",
      reason: "Environ 3 fois la relance adverse.",
    });
    if (goodHi < max) {
      zones.push({
        from: goodHi + 1,
        to: max,
        kind: shortStack && strong ? "good" : "risky",
        label: shortStack && strong ? "Conseillé" : "Excessif",
        reason:
          shortStack && strong
            ? "Tapis court : pousser fort avec une belle main."
            : "Beaucoup plus que 3× : trop lourd sans raison.",
      });
    }
    return mergeAdjacent(zones);
  }

  // Open / raise sizing in BB
  const openBb = 2 + Math.max(0, callers);
  const goodLo = Math.max(min, Math.round(bb * Math.max(2, openBb)));
  const goodHi = Math.min(max, Math.round(bb * (openBb + 1))); // 2–3 BB (+callers)
  const aggHi = Math.min(max, Math.round(bb * 6));

  const zones: BetZone[] = [];
  if (goodLo > min) {
    zones.push({
      from: min,
      to: goodLo - 1,
      kind: "cautious",
      label: "Trop petit",
      reason: "Une ouverture trop petite invite tout le monde à suivre.",
    });
  }
  zones.push({
    from: goodLo,
    to: Math.max(goodLo, goodHi),
    kind: "good",
    label: "Conseillé",
    reason: `Environ ${openBb} à ${openBb + 1} grosses blindes.`,
  });
  if (goodHi < aggHi && goodHi < max) {
    zones.push({
      from: goodHi + 1,
      to: Math.min(aggHi, max),
      kind: "aggressive",
      label: "Agressif",
      reason: "Plus gros que l'ouverture standard — pression forte.",
    });
  }
  const afterAgg = Math.min(aggHi, max);
  if (afterAgg < max) {
    const allInGood = shortStack && strong;
    zones.push({
      from: afterAgg + 1,
      to: max,
      kind: allInGood ? "good" : "risky",
      label: allInGood ? "Conseillé" : "Excessif",
      reason: allInGood
        ? "Moins de 15 grosses blindes : le tapis avec une belle main est correct."
        : "Trop gros avant le flop sans tapis très court.",
    });
  }
  return mergeAdjacent(fillMissing(zones, min, max));
}

function postflopZones(args: {
  min: number;
  max: number;
  pot: number;
  equity: number;
  spr: number;
  hasDraw: boolean;
  stackLeft: number;
}): BetZone[] {
  const { min, max, pot, equity, spr, hasDraw } = args;
  const p = Math.max(1, pot);
  const strong = equity > 0.65;
  const medium = equity >= 0.4 && equity <= 0.65;
  const weak = equity < 0.4;
  const short = spr < 2;

  if (weak && !hasDraw) {
    return [
      {
        from: min,
        to: max,
        kind: "risky",
        label: "Risqué",
        reason: "Parole ou coucher est plus sûr.",
      },
    ];
  }

  if (hasDraw && !strong) {
    const lo = Math.max(min, Math.round(p * 0.5));
    const hi = Math.min(max, Math.round(p * (2 / 3)));
    return mergeAdjacent(
      fillMissing(
        [
          {
            from: lo,
            to: Math.max(lo, hi),
            kind: "aggressive",
            label: "Bluff raisonnable",
            reason: "Une mise d'environ la moitié à deux tiers du pot pour semi-bluffer.",
          },
        ],
        min,
        max,
        {
          before: {
            kind: "cautious",
            label: "Trop prudent",
            reason: "Trop petit pour faire foldeer un tirage adverse.",
          },
          after: {
            kind: "risky",
            label: "Risqué",
            reason: "Trop gros pour un simple tirage.",
          },
        },
      ),
    );
  }

  if (strong || (short && equity >= 0.55)) {
    const lo = Math.max(min, Math.round(p * 0.5));
    const mid = Math.min(max, Math.round(p * 0.75));
    const potSize = Math.min(max, Math.round(p));
    const zones: BetZone[] = [];
    if (lo > min) {
      zones.push({
        from: min,
        to: lo - 1,
        kind: "cautious",
        label: "Trop prudent",
        reason: "Avec une main forte, fais payer un peu plus.",
      });
    }
    zones.push({
      from: lo,
      to: Math.max(lo, mid),
      kind: "good",
      label: "Conseillé",
      reason: "La moitié à trois quarts du pot : faire payer les plus mauvaises mains.",
    });
    if (short && mid < max) {
      zones.push({
        from: mid + 1,
        to: max,
        kind: "good",
        label: "Conseillé",
        reason: "SPR bas : le tapis avec une main forte est logique.",
      });
    } else {
      if (mid < potSize) {
        zones.push({
          from: mid + 1,
          to: potSize,
          kind: "aggressive",
          label: "Agressif",
          reason: "Presque un pot : très fort, mais encore jouable.",
        });
      }
      if (potSize < max) {
        zones.push({
          from: potSize + 1,
          to: max,
          kind: "risky",
          label: "Risqué",
          reason: "Plus d'un pot : souvent trop.",
        });
      }
    }
    return mergeAdjacent(zones);
  }

  // medium
  if (medium) {
    const lo = Math.max(min, Math.round(p / 3));
    const hi = Math.min(max, Math.round(p * 0.5));
    return mergeAdjacent(
      fillMissing(
        [
          {
            from: lo,
            to: Math.max(lo, hi),
            kind: "good",
            label: "Conseillé",
            reason: "Un tiers à la moitié du pot suffit avec une main moyenne.",
          },
        ],
        min,
        max,
        {
          before: {
            kind: "cautious",
            label: "Trop prudent",
            reason: "Un peu petit pour protéger ta main.",
          },
          after: {
            kind: "aggressive",
            label: "Trop agressif",
            reason: "Trop gros pour une main seulement moyenne.",
          },
        },
      ),
    );
  }

  // fallback draw-ish weak
  return [
    {
      from: min,
      to: max,
      kind: "risky",
      label: "Risqué",
      reason: "Parole ou coucher est plus sûr.",
    },
  ];
}

function fillMissing(
  core: BetZone[],
  min: number,
  max: number,
  edges?: {
    before: Pick<BetZone, "kind" | "label" | "reason">;
    after: Pick<BetZone, "kind" | "label" | "reason">;
  },
): BetZone[] {
  const sorted = [...core].sort((a, b) => a.from - b.from);
  const out: BetZone[] = [];
  let cursor = min;
  const before = edges?.before ?? {
    kind: "cautious" as const,
    label: "Trop petit",
    reason: "En dessous de la taille conseillée.",
  };
  const after = edges?.after ?? {
    kind: "risky" as const,
    label: "Excessif",
    reason: "Au-dessus de la taille conseillée.",
  };
  for (const z of sorted) {
    if (z.from > cursor) {
      out.push({ from: cursor, to: z.from - 1, ...before });
    }
    out.push(z);
    cursor = z.to + 1;
  }
  if (cursor <= max) {
    out.push({ from: cursor, to: max, ...after });
  }
  return out.filter((z) => z.to >= z.from);
}

function mergeAdjacent(zones: BetZone[]): BetZone[] {
  const sorted = [...zones].sort((a, b) => a.from - b.from);
  const out: BetZone[] = [];
  for (const z of sorted) {
    const last = out[out.length - 1];
    if (
      last &&
      last.kind === z.kind &&
      last.label === z.label &&
      last.to + 1 >= z.from
    ) {
      last.to = Math.max(last.to, z.to);
    } else {
      out.push({ ...z });
    }
  }
  return out;
}

export function zoneAt(zones: BetZone[], amount: number): BetZone | null {
  return zones.find((z) => amount >= z.from && amount <= z.to) ?? null;
}

export function defaultAmountInGoodZone(zones: BetZone[], min: number, max: number): number {
  const good = zones.find((z) => z.kind === "good");
  if (!good) return Math.round((min + max) / 2);
  return Math.round((good.from + good.to) / 2);
}

void clampZone;
void fillGaps;
