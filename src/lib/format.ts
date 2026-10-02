import { ui } from "@/content/wording";
import { primaryLabel, terms, type VocabMode } from "@/content/wording";

/** Format helpers for French UI. */

export function formatChips(n: number): string {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n));
}

export function formatPercent(ratio: number, digits = 0): string {
  return `${(ratio * 100).toFixed(digits)} %`;
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

export function formatAction(action: string, amount: number): string {
  switch (action) {
    case "fold":
      return ui.actionFold;
    case "check":
      return ui.actionCheck;
    case "call":
      return ui.actionCall(formatChips(amount));
    case "bet":
      return ui.actionBet(formatChips(amount));
    case "raise":
      return ui.actionRaise(formatChips(amount));
    case "all-in":
      return ui.actionAllIn(formatChips(amount));
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
