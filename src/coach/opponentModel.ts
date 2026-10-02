import type { ProfileId } from "@/content/playerProfiles";
import type { GameEvent } from "@/engine";

export type Confidence = "low" | "medium" | "high";

export type ObservedStats = {
  handsDealt: number;
  handsVoluntarilyPlayed: number;
  handsRaisedPreflop: number;
  betsAndRaises: number;
  calls: number;
  foldToBetPostflop: number;
  facedBetPostflop: number;
  wentToShowdown: number;
  reachedShowdownOpportunity: number;
};

export type OpponentModel = {
  playerId: string;
  stats: ObservedStats;
  /** Deduced profile from observed stats (or revealed override). */
  deducedProfile: ProfileId;
  confidence: Confidence;
  /** True when reveal mode exposes the real bot style. */
  revealedProfile: ProfileId | null;
};

export type DeducedRates = {
  vpip: number;
  pfr: number;
  af: number;
  foldToBetPostflop: number;
  wentToShowdown: number;
};

const EMPTY_STATS: ObservedStats = {
  handsDealt: 0,
  handsVoluntarilyPlayed: 0,
  handsRaisedPreflop: 0,
  betsAndRaises: 0,
  calls: 0,
  foldToBetPostflop: 0,
  facedBetPostflop: 0,
  wentToShowdown: 0,
  reachedShowdownOpportunity: 0,
};

/** Baseline “average player” when sample is tiny. */
export const AVERAGE_PROFILE: ProfileId = "TAG";

const PROFILE_TARGETS: Record<
  ProfileId,
  { vpip: number; pfr: number; af: number }
> = {
  TAG: { vpip: 0.22, pfr: 0.17, af: 2.4 },
  LAG: { vpip: 0.34, pfr: 0.27, af: 3.4 },
  TIGHT_PASSIVE: { vpip: 0.12, pfr: 0.06, af: 0.8 },
  LOOSE_PASSIVE: { vpip: 0.48, pfr: 0.07, af: 0.7 },
  FISH: { vpip: 0.55, pfr: 0.12, af: 1.2 },
};

export function emptyStats(): ObservedStats {
  return { ...EMPTY_STATS };
}

export function createOpponentModel(
  playerId: string,
  revealedProfile: ProfileId | null = null,
): OpponentModel {
  return {
    playerId,
    stats: emptyStats(),
    deducedProfile: AVERAGE_PROFILE,
    confidence: "low",
    revealedProfile,
  };
}

export function ratesFromStats(stats: ObservedStats): DeducedRates {
  const hands = Math.max(1, stats.handsDealt);
  const calls = Math.max(0, stats.calls);
  const aggressionDenom = Math.max(1, calls);
  return {
    vpip: stats.handsVoluntarilyPlayed / hands,
    pfr: stats.handsRaisedPreflop / hands,
    af: stats.betsAndRaises / aggressionDenom,
    foldToBetPostflop:
      stats.facedBetPostflop > 0
        ? stats.foldToBetPostflop / stats.facedBetPostflop
        : 0.45,
    wentToShowdown:
      stats.reachedShowdownOpportunity > 0
        ? stats.wentToShowdown / stats.reachedShowdownOpportunity
        : 0.25,
  };
}

export function confidenceFromHands(hands: number): Confidence {
  if (hands < 15) return "low";
  if (hands <= 40) return "medium";
  return "high";
}

function distanceToProfile(
  rates: DeducedRates,
  id: ProfileId,
): number {
  const t = PROFILE_TARGETS[id];
  const afNorm = Math.min(rates.af, 5) / 5;
  const tAf = Math.min(t.af, 5) / 5;
  return (
    Math.abs(rates.vpip - t.vpip) * 2 +
    Math.abs(rates.pfr - t.pfr) * 2.5 +
    Math.abs(afNorm - tAf) * 1.2
  );
}

export function deduceProfile(rates: DeducedRates): ProfileId {
  let best: ProfileId = AVERAGE_PROFILE;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const id of Object.keys(PROFILE_TARGETS) as ProfileId[]) {
    const d = distanceToProfile(rates, id);
    if (d < bestDist) {
      bestDist = d;
      best = id;
    }
  }
  return best;
}

/**
 * Blend toward average when confidence is low.
 * With few hands, deduced profile stays close to AVERAGE_PROFILE.
 */
export function effectiveProfile(model: OpponentModel): ProfileId {
  if (model.revealedProfile) return model.revealedProfile;
  if (model.confidence === "low") {
    // Prefer average until we have a meaningful sample.
    return model.stats.handsDealt < 8
      ? AVERAGE_PROFILE
      : model.deducedProfile;
  }
  return model.deducedProfile;
}

export function refreshModel(model: OpponentModel): OpponentModel {
  const rates = ratesFromStats(model.stats);
  const confidence = confidenceFromHands(model.stats.handsDealt);
  const deducedProfile = deduceProfile(rates);
  return { ...model, confidence, deducedProfile };
}

type HandTracker = {
  street: "preflop" | "postflop";
  facedBetThisStreet: Set<string>;
  voluntaryThisHand: Set<string>;
  raisedPreflop: Set<string>;
  stillInAtShowdown: Set<string>;
  dealt: Set<string>;
};

function newHandTracker(): HandTracker {
  return {
    street: "preflop",
    facedBetThisStreet: new Set(),
    voluntaryThisHand: new Set(),
    raisedPreflop: new Set(),
    stillInAtShowdown: new Set(),
    dealt: new Set(),
  };
}

/**
 * Build opponent models from observable game events only
 * (never uses hole cards of opponents).
 */
export function buildOpponentModels(
  events: GameEvent[],
  opponentIds: string[],
  revealedStyles: Record<string, ProfileId | null> = {},
): Record<string, OpponentModel> {
  const models: Record<string, OpponentModel> = {};
  for (const id of opponentIds) {
    models[id] = createOpponentModel(id, revealedStyles[id] ?? null);
  }

  let tracker = newHandTracker();
  let currentBet = 0;

  const bump = (id: string, patch: Partial<ObservedStats>) => {
    const m = models[id];
    if (!m) return;
    const next = { ...m.stats };
    for (const [k, v] of Object.entries(patch)) {
      const key = k as keyof ObservedStats;
      next[key] = (next[key] as number) + (v as number);
    }
    m.stats = next;
  };

  for (const ev of events) {
    if (ev.type === "HAND_STARTED") {
      tracker = newHandTracker();
      currentBet = 0;
    } else if (ev.type === "CARDS_DEALT") {
      if (models[ev.playerId]) {
        tracker.dealt.add(ev.playerId);
        bump(ev.playerId, { handsDealt: 1 });
      }
    } else if (ev.type === "BLINDS_POSTED") {
      currentBet = ev.bigBlind;
    } else if (ev.type === "STREET_DEALT") {
      tracker.street = "postflop";
      tracker.facedBetThisStreet = new Set();
      currentBet = 0;
    } else if (ev.type === "PLAYER_ACTED") {
      const id = ev.playerId;
      if (!models[id]) continue;
      const { action } = ev;

      if (tracker.street === "preflop") {
        if (action === "call" || action === "bet" || action === "raise" || action === "all-in") {
          if (!tracker.voluntaryThisHand.has(id)) {
            tracker.voluntaryThisHand.add(id);
            bump(id, { handsVoluntarilyPlayed: 1 });
          }
        }
        if (action === "bet" || action === "raise" || (action === "all-in" && ev.amount > currentBet)) {
          if (!tracker.raisedPreflop.has(id)) {
            tracker.raisedPreflop.add(id);
            bump(id, { handsRaisedPreflop: 1 });
          }
        }
      } else {
        if (tracker.facedBetThisStreet.has(id) && action === "fold") {
          bump(id, { foldToBetPostflop: 1 });
        }
        if (action === "bet" || action === "raise") {
          for (const oid of Object.keys(models)) {
            if (oid !== id) tracker.facedBetThisStreet.add(oid);
          }
          for (const oid of Object.keys(models)) {
            if (oid !== id) bump(oid, { facedBetPostflop: 1 });
          }
        }
      }

      if (action === "bet" || action === "raise") {
        bump(id, { betsAndRaises: 1 });
      }
      if (action === "call") {
        bump(id, { calls: 1 });
      }
      if (action !== "fold") {
        tracker.stillInAtShowdown.add(id);
      } else {
        tracker.stillInAtShowdown.delete(id);
      }

      if (ev.totalBet > currentBet) currentBet = ev.totalBet;
    } else if (ev.type === "SHOWDOWN") {
      for (const id of tracker.stillInAtShowdown) {
        if (models[id]) {
          bump(id, {
            reachedShowdownOpportunity: 1,
            wentToShowdown: 1,
          });
        }
      }
    }
  }

  for (const id of Object.keys(models)) {
    models[id] = refreshModel(models[id]!);
  }
  return models;
}
