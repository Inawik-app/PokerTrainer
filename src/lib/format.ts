import { ui } from "@/content/wording";
import { primaryLabel, terms, type VocabMode } from "@/content/wording";

/** Format helpers for French UI. */

/** Integer chips with thin space thousands (fr-FR). */
export function formatChips(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

/**
 * General number: French grouping, comma decimal, at most `maxFrac` decimals.
 * Trailing zeros are dropped ("66,0" → "66").
 */
export function formatNumber(n: number, maxFrac = 1): string {
  if (!Number.isFinite(n)) return "—";
  const rounded =
    maxFrac <= 0
      ? Math.round(n)
      : Math.round(n * 10 ** maxFrac) / 10 ** maxFrac;
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: maxFrac,
    minimumFractionDigits: 0,
  }).format(rounded);
}

/** Ratio 0–1 → percent string. Integers preferred; "< 1 %" when tiny but positive. */
export function formatPercent(ratio: number, digits = 0): string {
  if (!Number.isFinite(ratio)) return "—";
  const pct = ratio * 100;
  if (pct > 0 && pct < 1 && digits === 0) return "< 1 %";
  if (digits <= 0) return `${Math.round(pct)} %`;
  return `${formatNumber(pct, digits)} %`;
}

/** Amount as % of stack, rounded to integer ("12 %", "< 1 %"). */
export function formatStackPercent(amount: number, stack: number): string {
  if (stack <= 0) return "0 %";
  const pct = (amount / stack) * 100;
  if (amount > 0 && pct < 1) return "< 1 %";
  return `${Math.round(pct)} %`;
}

export function formatCard(rank: string, suit: string): string {
  const rankFr: Record<string, string> = {
    T: "10",
    J: "J",
    Q: "Q",
    K: "K",
    A: "A",
  };
  const suitSym: Record<string, string> = {
    c: "♣",
    d: "♦",
    h: "♥",
    s: "♠",
  };
  return `${rankFr[rank] ?? rank}${suitSym[suit] ?? suit}`;
}

export function formatAction(
  action: string,
  amount: number,
  opts?: { isHero?: boolean },
): string {
  const chips = formatChips(amount);
  if (opts?.isHero) {
    switch (action) {
      case "fold":
        return ui.actionHeroFold;
      case "check":
        return ui.actionHeroCheck;
      case "call":
        return ui.actionHeroCall(chips);
      case "bet":
        return ui.actionHeroBet(chips);
      case "raise":
        return ui.actionHeroRaise(chips);
      case "all-in":
        return ui.actionHeroAllIn(chips);
      default:
        return action;
    }
  }
  switch (action) {
    case "fold":
      return ui.actionFold;
    case "check":
      return ui.actionCheck;
    case "call":
      return ui.actionCall(chips);
    case "bet":
      return ui.actionBet(chips);
    case "raise":
      return ui.actionRaise(chips);
    case "all-in":
      return ui.actionAllIn(chips);
    default:
      return action;
  }
}

export function streetLabel(
  street: string,
  mode: VocabMode = "simple",
): string {
  switch (street) {
    case "preflop":
      return primaryLabel(terms.preflop, mode);
    case "flop":
      return primaryLabel(terms.flop, mode);
    case "turn":
      return primaryLabel(terms.turn, mode);
    case "river":
      return primaryLabel(terms.river, mode);
    case "showdown":
      return primaryLabel(terms.showdown, mode);
    default:
      return street;
  }
}
