import type { AdviceConfidence, CoachAdvice, RecommendedAction } from "./advise";

export type PlayerDecision = {
  street: string;
  action: RecommendedAction;
  /** Estimated EV of the recommended action at decision time. */
  recommendedEv: number;
  /** Estimated EV of what the player actually did. */
  actualEv: number;
  recommendation: CoachAdvice;
};

export type DecisionGap = {
  street: string;
  label: string;
  /** actualEv - recommendedEv (negative = mistake cost). */
  evDelta: number;
  playerAction: string;
  recommendedAction: string;
};

export type HandReviewSummary = {
  decisions: DecisionGap[];
  biggestMistake: DecisionGap | null;
  bestDecision: DecisionGap | null;
};

function actionLabel(a: RecommendedAction): string {
  switch (a.type) {
    case "fold":
      return "se coucher";
    case "check":
      return "parole";
    case "call":
      return "suivre";
    case "bet":
      return `miser ${a.amount}`;
    case "raise":
      return `relancer à ${a.amount}`;
    default:
      return "?";
  }
}

export function reviewDecisions(decisions: PlayerDecision[]): HandReviewSummary {
  const gaps: DecisionGap[] = decisions.map((d) => ({
    street: d.street,
    label: `${d.street}: ${actionLabel(d.action)}`,
    evDelta: Math.round(d.actualEv - d.recommendedEv),
    playerAction: actionLabel(d.action),
    recommendedAction: actionLabel(d.recommendation.action),
  }));

  const biggestMistake =
    gaps.length === 0
      ? null
      : gaps.reduce((a, b) => (a.evDelta < b.evDelta ? a : b));

  const bestDecision =
    gaps.length === 0
      ? null
      : gaps.reduce((a, b) => (a.evDelta > b.evDelta ? a : b));

  return {
    decisions: gaps,
    biggestMistake:
      biggestMistake && biggestMistake.evDelta < -1 ? biggestMistake : null,
    bestDecision:
      bestDecision && bestDecision.evDelta >= -5 ? bestDecision : null,
  };
}

export function formatAdviceBlock(advice: CoachAdvice): string {
  const lines = [advice.headline, ...advice.reasons];
  if (advice.trap) lines.push(`Piège : ${advice.trap}`);
  return lines.join(" ");
}

export function confidenceToUi(
  c: AdviceConfidence,
): "good" | "careful" | "bad" {
  if (c === "sure") return "good";
  if (c === "leaning") return "careful";
  return "bad";
}
