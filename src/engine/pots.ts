export type Pot = {
  amount: number;
  /** Player ids eligible to win this pot (not folded, contributed). */
  eligible: string[];
};

/**
 * Build main + side pots from per-player contributions this hand
 * (sum of all bets committed, including folded players' chips).
 */
export function computePots(
  contributions: { playerId: string; amount: number; folded: boolean }[],
): Pot[] {
  const active = contributions.filter((c) => c.amount > 0);
  if (active.length === 0) return [];

  const levels = [...new Set(active.map((c) => c.amount))].sort((a, b) => a - b);
  const pots: Pot[] = [];
  let prev = 0;

  for (const level of levels) {
    const contributors = active.filter((c) => c.amount >= level);
    const layer = level - prev;
    const amount = layer * contributors.length;
    if (amount > 0) {
      pots.push({
        amount,
        eligible: contributors.filter((c) => !c.folded).map((c) => c.playerId),
      });
    }
    prev = level;
  }

  // Merge consecutive pots with identical eligible sets
  const merged: Pot[] = [];
  for (const pot of pots) {
    const last = merged[merged.length - 1];
    if (
      last &&
      last.eligible.length === pot.eligible.length &&
      last.eligible.every((id, i) => id === pot.eligible[i])
    ) {
      last.amount += pot.amount;
    } else {
      merged.push({ ...pot, eligible: [...pot.eligible] });
    }
  }
  return merged;
}

/** Distribute pot amount among winners; odd chip to first winner in order. */
export function distributePot(
  amount: number,
  winners: string[],
  oddChipOrder: string[],
): { playerId: string; amount: number }[] {
  if (winners.length === 0 || amount <= 0) return [];
  const share = Math.floor(amount / winners.length);
  let remainder = amount - share * winners.length;
  const payouts = winners.map((playerId) => ({ playerId, amount: share }));

  for (const id of oddChipOrder) {
    if (remainder <= 0) break;
    if (!winners.includes(id)) continue;
    const row = payouts.find((p) => p.playerId === id)!;
    row.amount += 1;
    remainder -= 1;
  }

  return payouts.filter((p) => p.amount > 0);
}
