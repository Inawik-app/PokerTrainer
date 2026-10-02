export type BotProfile = {
  id: string;
  vpip: number;
  pfr: number;
  threeBet: number;
  cbet: number;
  aggression: number;
  bluffFreq: number;
  foldToBet: number;
  betSizing: number[];
};

export const PROFILES: Record<string, BotProfile> = {
  TAG: {
    id: "TAG",
    vpip: 0.2,
    pfr: 0.16,
    threeBet: 0.08,
    cbet: 0.65,
    aggression: 2.5,
    bluffFreq: 0.25,
    foldToBet: 0.55,
    betSizing: [0.5, 0.66, 0.75],
  },
  LAG: {
    id: "LAG",
    vpip: 0.32,
    pfr: 0.26,
    threeBet: 0.12,
    cbet: 0.75,
    aggression: 3.5,
    bluffFreq: 0.4,
    foldToBet: 0.4,
    betSizing: [0.66, 0.75, 1],
  },
  TIGHT_PASSIVE: {
    id: "TIGHT_PASSIVE",
    vpip: 0.12,
    pfr: 0.05,
    threeBet: 0.03,
    cbet: 0.35,
    aggression: 0.8,
    bluffFreq: 0.05,
    foldToBet: 0.7,
    betSizing: [0.5, 0.66],
  },
  LOOSE_PASSIVE: {
    id: "LOOSE_PASSIVE",
    vpip: 0.45,
    pfr: 0.06,
    threeBet: 0.02,
    cbet: 0.3,
    aggression: 0.7,
    bluffFreq: 0.08,
    foldToBet: 0.25,
    betSizing: [0.33, 0.5],
  },
  FISH: {
    id: "FISH",
    vpip: 0.55,
    pfr: 0.1,
    threeBet: 0.05,
    cbet: 0.5,
    aggression: 1.2,
    bluffFreq: 0.35,
    foldToBet: 0.2,
    betSizing: [0.25, 0.5, 1.5, 2],
  },
};
