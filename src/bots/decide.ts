import type { Rng } from "@/lib/rng";
import type { Action, LegalActions, PlayerView } from "@/engine";
import { evaluateHand } from "@/engine";
import { callEV, computeEquity, potOdds } from "@/odds";
import { createRng } from "@/lib/rng";
import { PROFILES } from "./profiles";
import { handPercentile, isInPfr, isInVpip } from "./preflop";

export type BotStyle =
  | "TAG"
  | "LAG"
  | "TIGHT_PASSIVE"
  | "LOOSE_PASSIVE"
  | "FISH";

export type BotDifficulty = "EASY" | "MEDIUM" | "HARD";

export type BotConfig = {
  style: BotStyle;
  difficulty: BotDifficulty;
};

function noise(difficulty: BotDifficulty): number {
  if (difficulty === "EASY") return 0.3;
  if (difficulty === "MEDIUM") return 0.1;
  return 0.03;
}

function pickSizing(
  profileSizing: number[],
  pot: number,
  min: number,
  max: number,
  currentBet: number,
  rng: Rng,
  fish: boolean,
): number {
  let frac = profileSizing[rng.int(profileSizing.length)] ?? 0.66;
  if (fish && rng.next() < 0.25) frac = rng.next() < 0.5 ? 0.15 : 2.5;
  const target = Math.floor(currentBet + pot * frac);
  return Math.min(max, Math.max(min, target));
}

/**
 * Style + difficulty aware bot. Signature is stable.
 */
export function decideAction(
  view: PlayerView,
  legal: LegalActions,
  config: BotConfig,
  rng: Rng,
): Action {
  const profile = PROFILES[config.style] ?? PROFILES.TAG!;
  const hero = view.players.find((p) => p.id === view.heroId);
  const hole = hero?.holeCards;
  if (!hero || !hole || hole.length < 2) {
    if (legal.check) return { type: "check" };
    if (legal.call) return { type: "call" };
    return { type: "fold" };
  }

  const toCall = legal.call?.amount ?? 0;
  const pot = view.pot;
  const n = noise(config.difficulty);

  // Random override
  if (rng.next() < n) {
    const opts: Action[] = [];
    if (legal.check) opts.push({ type: "check" });
    if (legal.call) opts.push({ type: "call" });
    if (legal.fold) opts.push({ type: "fold" });
    if (opts.length) return opts[rng.int(opts.length)]!;
  }

  const button = view.buttonSeat;
  const seat = hero.seat;
  const posBonus = seat === button ? 0.05 : 0;

  // Preflop
  if (view.street === "preflop") {
    const play = isInVpip(hole, profile.vpip, posBonus);
    const raise = isInPfr(hole, profile.pfr, posBonus);

    if (!play) {
      if (legal.check) return { type: "check" };
      if (legal.fold && rng.next() < profile.foldToBet) return { type: "fold" };
      if (legal.call && config.style === "LOOSE_PASSIVE") return { type: "call" };
      if (legal.fold) return { type: "fold" };
      if (legal.call) return { type: "call" };
    }

    if (raise && (legal.raise || legal.bet)) {
      const band = legal.raise ?? legal.bet!;
      const amount = pickSizing(
        profile.betSizing,
        pot,
        band.min,
        band.max,
        view.currentBet,
        rng,
        config.style === "FISH",
      );
      // Passive styles convert raises to calls often
      if (
        (config.style === "TIGHT_PASSIVE" || config.style === "LOOSE_PASSIVE") &&
        rng.next() < 0.7 &&
        legal.call
      ) {
        return { type: "call" };
      }
      return legal.raise
        ? { type: "raise", amount }
        : { type: "bet", amount };
    }

    if (legal.call) return { type: "call" };
    if (legal.check) return { type: "check" };
  }

  // Postflop
  let equity = handPercentile(hole) * 0.5;
  if (config.difficulty !== "EASY") {
    const oppCount = Math.max(
      1,
      view.players.filter((p) => p.id !== view.heroId && p.status !== "folded")
        .length,
    );
    const iters = config.difficulty === "HARD" ? 400 : 200;
    equity = computeEquity({
      hero: hole,
      board: view.board,
      opponents: oppCount,
      iterations: iters,
      rng: createRng(rng.int(1e9)),
    }).equity;
  } else if (view.board.length >= 3) {
    const cat = evaluateHand([...hole, ...view.board]).category;
    const rank: Record<string, number> = {
      HIGH_CARD: 0.15,
      PAIR: 0.45,
      TWO_PAIR: 0.65,
      THREE_OF_A_KIND: 0.8,
      STRAIGHT: 0.85,
      FLUSH: 0.88,
      FULL_HOUSE: 0.95,
      FOUR_OF_A_KIND: 0.99,
      STRAIGHT_FLUSH: 0.995,
      ROYAL_FLUSH: 1,
    };
    equity = rank[cat] ?? 0.3;
  }

  const required = toCall > 0 ? potOdds(toCall, pot) : 0;
  const ev = toCall > 0 ? callEV(equity, pot, toCall) : 1;

  if (toCall > 0) {
    const shouldFold =
      config.difficulty === "EASY"
        ? equity < 0.25 && rng.next() < profile.foldToBet
        : ev < 0 && rng.next() < profile.foldToBet + 0.2;
    // Calling stations / fish call light
    if (
      (config.style === "LOOSE_PASSIVE" || config.style === "FISH") &&
      legal.call &&
      rng.next() < 0.55
    ) {
      return { type: "call" };
    }
    if (shouldFold && legal.fold) return { type: "fold" };
    if (ev >= 0 && legal.call) return { type: "call" };
  }

  const wantBet =
    equity > 0.55 ||
    (rng.next() < profile.bluffFreq && config.style !== "TIGHT_PASSIVE");

  if (wantBet && (legal.bet || legal.raise)) {
    if (
      (config.style === "TIGHT_PASSIVE" || config.style === "LOOSE_PASSIVE") &&
      rng.next() < 0.6
    ) {
      if (legal.check) return { type: "check" };
      if (legal.call) return { type: "call" };
    }
    const band = legal.raise ?? legal.bet!;
    const amount = pickSizing(
      profile.betSizing,
      pot,
      band.min,
      band.max,
      view.currentBet,
      rng,
      config.style === "FISH",
    );
    return legal.raise
      ? { type: "raise", amount }
      : { type: "bet", amount };
  }

  if (legal.check) return { type: "check" };
  if (legal.call) return { type: "call" };
  if (legal.fold) return { type: "fold" };
  return { type: "check" };
}
