import type { ProfileId } from "@/content/playerProfiles";
import type { Card } from "@/engine/cards";
import { RANK_VALUES } from "@/engine/cards";
import type { Street } from "@/engine";
import { evaluateHand } from "@/engine/evaluator";
import { callVerdict } from "@/odds";
import { effectiveProfile, type OpponentModel } from "./opponentModel";

export type AdviceConfidence = "sure" | "leaning" | "borderline";

export type RecommendedAction =
  | { type: "fold" }
  | { type: "check" }
  | { type: "call" }
  | { type: "bet"; amount: number }
  | { type: "raise"; amount: number };

export type CoachAdvice = {
  action: RecommendedAction;
  /** Human-readable primary line, e.g. "Relance à 120". */
  headline: string;
  confidence: AdviceConfidence;
  reasons: string[];
  trap?: string;
};

export type BoardTexture = "dry" | "wet" | "paired";

export function classifyBoard(board: Card[]): BoardTexture {
  if (board.length < 3) return "dry";
  const suits = board.map((c) => c.suit);
  const ranks = board.map((c) => c.rank);
  const suitCounts = new Map<string, number>();
  for (const s of suits) suitCounts.set(s, (suitCounts.get(s) ?? 0) + 1);
  const maxSuit = Math.max(...suitCounts.values());
  const uniqueRanks = new Set(ranks);
  if (uniqueRanks.size < ranks.length) return "paired";

  const vals = ranks.map((r) => RANK_VALUES[r]).sort((a, b) => a - b);
  let connected = false;
  for (let i = 1; i < vals.length; i += 1) {
    if (vals[i]! - vals[i - 1]! <= 2) connected = true;
  }
  if (maxSuit >= 2 || connected) return "wet";
  return "dry";
}

function profileAdjustments(profile: ProfileId): {
  bluffLess: boolean;
  valueBigger: boolean;
  respectRaises: boolean;
  callLighter: boolean;
  bluffMore: boolean;
} {
  switch (profile) {
    case "LOOSE_PASSIVE":
      return {
        bluffLess: true,
        valueBigger: true,
        respectRaises: false,
        callLighter: false,
        bluffMore: false,
      };
    case "TIGHT_PASSIVE":
      return {
        bluffLess: false,
        valueBigger: false,
        respectRaises: true,
        callLighter: false,
        bluffMore: true,
      };
    case "LAG":
      return {
        bluffLess: false,
        valueBigger: false,
        respectRaises: false,
        callLighter: true,
        bluffMore: false,
      };
    case "TAG":
      return {
        bluffLess: false,
        valueBigger: false,
        respectRaises: true,
        callLighter: false,
        bluffMore: false,
      };
    case "FISH":
      return {
        bluffLess: true,
        valueBigger: true,
        respectRaises: false,
        callLighter: false,
        bluffMore: false,
      };
    default:
      return {
        bluffLess: false,
        valueBigger: false,
        respectRaises: false,
        callLighter: false,
        bluffMore: false,
      };
  }
}

function handStrengthLabel(hero: Card[], board: Card[]): "strong" | "medium" | "draw" | "weak" {
  if (board.length < 3) {
    const ranks = hero.map((c) => c.rank);
    if (ranks[0] === ranks[1] && "AKQJT".includes(ranks[0]!)) return "strong";
    if (ranks[0] === ranks[1] || ranks.includes("A")) return "medium";
    return "weak";
  }
  const cat = evaluateHand([...hero, ...board]).category;
  if (
    cat === "TWO_PAIR" ||
    cat === "THREE_OF_A_KIND" ||
    cat === "STRAIGHT" ||
    cat === "FLUSH" ||
    cat === "FULL_HOUSE" ||
    cat === "FOUR_OF_A_KIND" ||
    cat === "STRAIGHT_FLUSH" ||
    cat === "ROYAL_FLUSH"
  ) {
    return "strong";
  }
  if (cat === "PAIR") return "medium";
  return "weak";
}

export type AdviseInput = {
  equityVsRange: number;
  equityVsRandom: number;
  toCall: number;
  pot: number;
  heroStack: number;
  canCheck: boolean;
  minBet: number;
  minRaiseTo: number;
  maxBet: number;
  heroCards: Card[];
  board: Card[];
  street: Street;
  inPosition: boolean;
  opponentsInHand: number;
  outsCount: number;
  /** Primary villain model (most relevant opponent). */
  villain: OpponentModel | null;
  villainName?: string;
  /** Observed VPIP for messaging. */
  villainVpip?: number;
  villainHands?: number;
};

function confidenceLabel(
  equity: number,
  required: number,
): AdviceConfidence {
  const edge = equity - required;
  if (edge >= 0.08) return "sure";
  if (edge >= -0.03) return "leaning";
  if (edge >= -0.08) return "borderline";
  return "sure"; // sure about folding
}

function confWord(c: AdviceConfidence): string {
  if (c === "sure") return "sûr";
  if (c === "leaning") return "plutôt";
  return "limite";
}

/**
 * Structured coaching recommendation from hero-visible info only.
 */
export function advise(input: AdviseInput): CoachAdvice {
  const {
    equityVsRange,
    toCall,
    pot,
    heroStack,
    canCheck,
    minBet,
    minRaiseTo,
    maxBet,
    heroCards,
    board,
    inPosition,
    opponentsInHand,
    outsCount,
    villain,
  } = input;

  const profile = villain ? effectiveProfile(villain) : "TAG";
  const adj = profileAdjustments(profile);
  const texture = classifyBoard(board);
  const strength = handStrengthLabel(heroCards, board);
  const required = toCall > 0 ? toCall / (pot + toCall) : 0;
  const spr = heroStack / Math.max(pot, 1);
  const reasons: string[] = [];
  let trap: string | undefined;

  const sizeValue = (base: number) => {
    let mult = adj.valueBigger ? 0.85 : 0.55;
    if (texture === "wet") mult = Math.min(1, mult + 0.1);
    if (opponentsInHand > 2) mult = Math.min(1, mult + 0.05);
    const amount = Math.round(Math.min(maxBet, Math.max(minBet, pot * mult)));
    return Math.max(base, amount);
  };

  const sizeBluff = () => {
    const amount = Math.round(
      Math.min(maxBet, Math.max(minBet, pot * (inPosition ? 0.45 : 0.55))),
    );
    return amount;
  };

  // Facing a bet
  if (toCall > 0) {
    let eq = equityVsRange;
    if (adj.callLighter) eq += 0.04;
    if (adj.respectRaises && toCall > pot * 0.6) eq -= 0.06;

    // Implied odds bump for draws vs calling station
    if (outsCount >= 8 && adj.valueBigger === false && profile === "LOOSE_PASSIVE") {
      eq += 0.05;
      reasons.push(
        "Tirage prometteur : cet adversaire paiera encore souvent si tu touches.",
      );
    } else if (outsCount >= 8 && toCall / (pot + toCall) < 0.28) {
      reasons.push(
        `Tu as ${outsCount} cartes qui peuvent t'aider — le prix pour suivre est correct.`,
      );
    }

    const verdict = callVerdict(eq, required);
    const conf =
      verdict === "good"
        ? confidenceLabel(eq, required)
        : verdict === "marginal"
          ? "borderline"
          : "sure";

    if (adj.respectRaises && strength !== "strong" && toCall >= pot * 0.75) {
      reasons.push(
        `${input.villainName ?? "Ce joueur"} est très prudent : sa grosse mise signifie souvent une main très forte.`,
      );
      return {
        action: { type: "fold" },
        headline: `Se coucher — ${confWord("sure")}`,
        confidence: "sure",
        reasons: reasons.slice(0, 3),
        trap: "Ne paye pas « pour voir » contre un profil très serré.",
      };
    }

    if (verdict === "bad" && !(adj.callLighter && strength === "medium")) {
      reasons.push(
        `Tes chances contre ses mains probables (${Math.round(eq * 100)} %) sont trop faibles face au prix (${Math.round(required * 100)} %).`,
      );
      return {
        action: { type: "fold" },
        headline: `Se coucher — ${confWord(conf)}`,
        confidence: conf,
        reasons: reasons.slice(0, 3),
        trap:
          texture === "wet"
            ? "Sur un board dangereux, ne force pas avec une main fragile."
            : undefined,
      };
    }

    // Strong hand facing bet → raise for value vs calling station
    if (strength === "strong" && (adj.valueBigger || eq > required + 0.12)) {
      const raiseTo = Math.min(
        maxBet,
        Math.max(minRaiseTo, toCall + sizeValue(minRaiseTo)),
      );
      if (adj.valueBigger) {
        reasons.push(
          `${input.villainName ?? "L'adversaire"} suit trop : fais-le payer avec ta main forte.`,
        );
      } else {
        reasons.push("Ta main est assez forte pour relancer et faire grossir le pot.");
      }
      if (input.villainVpip != null && input.villainHands != null && input.villainHands >= 15) {
        reasons.push(
          `${input.villainName ?? "Bot"} joue ${Math.round(input.villainVpip * 100)} % des mains (sur ${input.villainHands} observées).`,
        );
      }
      trap =
        texture === "dry" && adj.valueBigger
          ? "Ne ralentis pas sur ce board sec."
          : undefined;
      return {
        action: { type: "raise", amount: raiseTo },
        headline: `Relance à ${raiseTo} — ${confWord("sure")}`,
        confidence: "sure",
        reasons: reasons.slice(0, 3),
        trap,
      };
    }

    reasons.push(
      `Tes chances (~${Math.round(eq * 100)} %) couvrent le prix pour suivre (~${Math.round(required * 100)} %).`,
    );
    if (!inPosition) {
      reasons.push("Tu n'as pas la position : suis plutôt que d'inventer une relance.");
    }
    return {
      action: { type: "call" },
      headline: `Suivre ${toCall} — ${confWord(verdict === "marginal" ? "borderline" : "leaning")}`,
      confidence: verdict === "marginal" ? "borderline" : "leaning",
      reasons: reasons.slice(0, 3),
    };
  }

  // No bet to face
  if (strength === "strong") {
    const amount = sizeValue(minBet);
    if (adj.bluffLess || adj.valueBigger) {
      reasons.push("Main forte : mise pour la valeur, surtout si l'adversaire paie trop.");
    } else {
      reasons.push("Tu as une main solide — mise pour faire grossir le pot.");
    }
    if (adj.valueBigger) {
      trap = "Ne parle pas pour « piéger » un joueur qui suit tout : il paie de toute façon.";
    }
    return {
      action: { type: "bet", amount },
      headline: `Miser ${amount} — ${confWord("sure")}`,
      confidence: "sure",
      reasons: reasons.slice(0, 3),
      trap,
    };
  }

  if (strength === "medium") {
    if (canCheck && !inPosition && texture === "wet") {
      reasons.push("Board dangereux et hors position : parole pour contrôler le pot.");
      return {
        action: { type: "check" },
        headline: `Parole — ${confWord("leaning")}`,
        confidence: "leaning",
        reasons: reasons.slice(0, 3),
      };
    }
    const amount = sizeValue(minBet);
    reasons.push("Paire moyenne : une mise de valeur petite ou moyenne suffit.");
    return {
      action: { type: "bet", amount },
      headline: `Miser ${amount} — ${confWord("leaning")}`,
      confidence: "leaning",
      reasons: reasons.slice(0, 3),
    };
  }

  // Weak / draw — bluff vs rock in position on dry board
  if (adj.bluffMore && inPosition && strength === "weak" && texture === "dry") {
    const amount = sizeBluff();
    reasons.push(
      "Adversaire très prudent sur un board sec : un petit bluff en position peut marcher.",
    );
    return {
      action: { type: "bet", amount },
      headline: `Miser ${amount} — ${confWord("borderline")}`,
      confidence: "borderline",
      reasons: reasons.slice(0, 3),
      trap: "Ne bluffe pas trop gros : il se couche déjà facilement.",
    };
  }

  if (adj.bluffLess && strength === "weak") {
    reasons.push("Contre un joueur qui paie trop, évite de bluffer.");
    if (canCheck) {
      return {
        action: { type: "check" },
        headline: `Parole — ${confWord("sure")}`,
        confidence: "sure",
        reasons: reasons.slice(0, 3),
        trap: "Ne bluffe pas : il paie.",
      };
    }
  }

  if (canCheck) {
    reasons.push(
      spr > 8
        ? "Main faible et tapis confortable : pas besoin de forcer."
        : "Sans prise sur le board, la parole est le choix le plus sûr.",
    );
    return {
      action: { type: "check" },
      headline: `Parole — ${confWord("leaning")}`,
      confidence: "leaning",
      reasons: reasons.slice(0, 3),
    };
  }

  return {
    action: { type: "check" },
    headline: `Parole — ${confWord("borderline")}`,
    confidence: "borderline",
    reasons: ["Sans information claire, joue simple."],
  };
}
