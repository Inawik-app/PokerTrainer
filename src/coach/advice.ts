import { callVerdict, type CallVerdict } from "@/odds";

export type Advice = {
  level: "good" | "careful" | "bad";
  message: string;
};

export type HandDecisionReview = {
  street: string;
  action: string;
  amount: number;
  estimatedEV: number;
  level: CallVerdict;
  note: string;
};

export function getAdvice(
  equity: number,
  toCall: number,
  pot: number,
  outsCount: number,
): Advice {
  if (toCall <= 0) {
    return {
      level: "good",
      message: `Équité estimée ${(equity * 100).toFixed(0)} %. Pas de mise à suivre — parole ou valeur.`,
    };
  }
  const required = toCall / (pot + toCall);
  const verdict = callVerdict(equity, required);
  const outsPart =
    outsCount > 0 ? `Tu as ${outsCount} outs, environ ${(equity * 100).toFixed(0)} %. ` : "";
  if (verdict === "good") {
    return {
      level: "good",
      message: `${outsPart}Le pot demande ${(required * 100).toFixed(0)} %, suivre est rentable.`,
    };
  }
  if (verdict === "marginal") {
    return {
      level: "careful",
      message: `${outsPart}Cote du pot ${(required * 100).toFixed(0)} % vs équité ${(equity * 100).toFixed(0)} % — décision limite.`,
    };
  }
  return {
    level: "bad",
    message: `${outsPart}Il faudrait ${(required * 100).toFixed(0)} % et tu n'as que ${(equity * 100).toFixed(0)} % — suivre est cher.`,
  };
}

export function reviewHand(
  decisions: {
    street: string;
    action: string;
    amount: number;
    equity: number;
    pot: number;
    toCall: number;
  }[],
): HandDecisionReview[] {
  return decisions.map((d) => {
    const required = d.toCall > 0 ? d.toCall / (d.pot + d.toCall) : 0;
    const ev =
      d.toCall > 0
        ? d.equity * (d.pot + d.toCall) - (1 - d.equity) * d.toCall
        : 0;
    const level = d.toCall > 0 ? callVerdict(d.equity, required) : "good";
    return {
      street: d.street,
      action: d.action,
      amount: d.amount,
      estimatedEV: Math.round(ev),
      level,
      note:
        level === "bad"
          ? "EV négative probable"
          : level === "marginal"
            ? "Décision limite"
            : "Correct",
    };
  });
}

export function biggestMistake(
  reviews: HandDecisionReview[],
): HandDecisionReview | null {
  const bad = reviews.filter((r) => r.level === "bad");
  if (bad.length === 0) return null;
  return bad.reduce((a, b) => (a.estimatedEV < b.estimatedEV ? a : b));
}
