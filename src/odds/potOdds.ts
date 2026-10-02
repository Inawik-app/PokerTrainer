export function potOdds(toCall: number, pot: number): number {
  if (toCall <= 0) return 0;
  return toCall / (pot + toCall);
}

export function requiredEquity(toCall: number, pot: number): number {
  return potOdds(toCall, pot);
}

/** Simple call EV in chips: equity * (pot+toCall) - (1-equity)*toCall, ignoring ties split. */
export function callEV(equity: number, pot: number, toCall: number): number {
  if (toCall <= 0) return 0;
  const winAmount = pot + toCall;
  return equity * winAmount - (1 - equity) * toCall;
}

export function effectiveStack(
  heroStack: number,
  opponentStacks: number[],
): number {
  if (opponentStacks.length === 0) return heroStack;
  const maxOpp = Math.max(...opponentStacks);
  return Math.min(heroStack, maxOpp);
}

export function spr(effectiveStackSize: number, pot: number): number {
  if (pot <= 0) return Number.POSITIVE_INFINITY;
  return effectiveStackSize / pot;
}

export type CallVerdict = "good" | "marginal" | "bad";

export function callVerdict(equity: number, required: number): CallVerdict {
  if (equity >= required + 0.03) return "good";
  if (equity >= required - 0.02) return "marginal";
  return "bad";
}
