export type ActionKind = "fold" | "check" | "call" | "bet" | "raise";

export type Action =
  | { type: "fold" }
  | { type: "check" }
  | { type: "call" }
  | { type: "bet"; amount: number }
  | { type: "raise"; amount: number };

export type LegalActions = {
  fold: boolean;
  check: boolean;
  call: { amount: number } | null;
  bet: { min: number; max: number } | null;
  raise: { min: number; max: number } | null;
};

export function minRaiseTo(
  currentBet: number,
  lastRaiseSize: number,
  bigBlind: number,
): number {
  const raiseBy = Math.max(lastRaiseSize, bigBlind);
  return currentBet + raiseBy;
}
