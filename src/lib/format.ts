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

export function formatAction(
  action: string,
  amount: number,
): string {
  switch (action) {
    case "fold":
      return "se couche";
    case "check":
      return "parole";
    case "call":
      return `suit ${formatChips(amount)}`;
    case "bet":
      return `mise ${formatChips(amount)}`;
    case "raise":
      return `relance à ${formatChips(amount)}`;
    case "all-in":
      return `tapis ${formatChips(amount)}`;
    default:
      return action;
  }
}

export function streetLabel(street: string): string {
  switch (street) {
    case "preflop":
      return "Préflop";
    case "flop":
      return "Flop";
    case "turn":
      return "Turn";
    case "river":
      return "River";
    case "showdown":
      return "Showdown";
    default:
      return street;
  }
}
