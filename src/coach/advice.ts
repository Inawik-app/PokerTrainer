import { callVerdict, type CallVerdict } from "@/odds";
import { ui } from "@/content/wording";
import { formatPercent } from "@/lib/format";

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
  const equityPct = formatPercent(equity, 0);
  if (toCall <= 0) {
    return {
      level: "good",
      message: ui.adviceNoBet(equityPct),
    };
  }
  const required = toCall / (pot + toCall);
  const requiredPct = formatPercent(required, 0);
  const verdict = callVerdict(equity, required);
  const outsPart = ui.outsPart(outsCount, equityPct);
  if (verdict === "good") {
    return {
      level: "good",
      message: ui.adviceGood(outsPart, equityPct, requiredPct),
    };
  }
  if (verdict === "marginal") {
    return {
      level: "careful",
      message: ui.adviceCareful(outsPart, equityPct, requiredPct),
    };
  }
  return {
    level: "bad",
    message: ui.adviceBad(outsPart, equityPct, requiredPct),
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
          ? ui.reviewBad
          : level === "marginal"
            ? ui.reviewMarginal
            : ui.reviewGood,
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
