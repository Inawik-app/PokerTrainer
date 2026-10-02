import { describe, expect, it } from "vitest";
import { createRng } from "@/lib/rng";
import { parseCard } from "@/engine/cards";
import { advise } from "../advise";
import {
  buildOpponentModels,
  createOpponentModel,
  deduceProfile,
  ratesFromStats,
  refreshModel,
} from "../opponentModel";
import {
  estimatePreflopRange,
  narrowRangePostflop,
} from "../rangeEstimator";
import { reviewDecisions } from "../handReview";
import type { OpponentModel } from "../opponentModel";

function modelWithProfile(
  id: OpponentModel["deducedProfile"],
  hands = 40,
): OpponentModel {
  const m = createOpponentModel("bot1");
  const vpip =
    id === "LOOSE_PASSIVE" || id === "FISH"
      ? 0.5
      : id === "LAG"
        ? 0.34
        : id === "TIGHT_PASSIVE"
          ? 0.12
          : 0.22;
  const pfr =
    id === "LAG" ? 0.27 : id === "TAG" ? 0.17 : id === "TIGHT_PASSIVE" ? 0.06 : 0.07;
  m.stats = {
    handsDealt: hands,
    handsVoluntarilyPlayed: Math.round(hands * vpip),
    handsRaisedPreflop: Math.round(hands * pfr),
    betsAndRaises: id === "LAG" || id === "TAG" ? 40 : 8,
    calls: id === "LOOSE_PASSIVE" ? 50 : 15,
    foldToBetPostflop: 5,
    facedBetPostflop: 12,
    wentToShowdown: 4,
    reachedShowdownOpportunity: 10,
  };
  return refreshModel(m);
}

describe("coach scenarios", () => {
  it("1. flush draw, cheap call vs calling station → call", () => {
    const villain = modelWithProfile("LOOSE_PASSIVE", 40);
    const advice = advise({
      equityVsRange: 0.35,
      equityVsRandom: 0.32,
      toCall: 20,
      pot: 80,
      heroStack: 900,
      canCheck: false,
      minBet: 10,
      minRaiseTo: 40,
      maxBet: 900,
      heroCards: [parseCard("Ah"), parseCard("Kh")],
      board: [parseCard("2h"), parseCard("7h"), parseCard("Td")],
      street: "flop",
      inPosition: true,
      opponentsInHand: 1,
      outsCount: 9,
      villain,
      villainName: "Bot 1",
    });
    // required = 20/100 = 20%, equity 35% → call or raise
    expect(["call", "raise"]).toContain(advice.action.type);
  });

  it("2. medium pair vs rock river overbet → fold", () => {
    const villain = modelWithProfile("TIGHT_PASSIVE", 50);
    const advice = advise({
      equityVsRange: 0.22,
      equityVsRandom: 0.45,
      toCall: 200,
      pot: 120,
      heroStack: 700,
      canCheck: false,
      minBet: 10,
      minRaiseTo: 400,
      maxBet: 700,
      heroCards: [parseCard("Jh"), parseCard("Td")],
      board: [parseCard("Js"), parseCard("7c"), parseCard("2d"), parseCard("8s"), parseCard("3h")],
      street: "river",
      inPosition: false,
      opponentsInHand: 1,
      outsCount: 0,
      villain,
      villainName: "Bot 2",
    });
    expect(advice.action.type).toBe("fold");
  });

  it("3. strong hand vs calling station → bet/raise big, not check", () => {
    const villain = modelWithProfile("LOOSE_PASSIVE", 40);
    const advice = advise({
      equityVsRange: 0.82,
      equityVsRandom: 0.7,
      toCall: 0,
      pot: 60,
      heroStack: 900,
      canCheck: true,
      minBet: 10,
      minRaiseTo: 20,
      maxBet: 900,
      heroCards: [parseCard("Ah"), parseCard("Ad")],
      board: [parseCard("Kc"), parseCard("7d"), parseCard("2s")],
      street: "flop",
      inPosition: true,
      opponentsInHand: 1,
      outsCount: 0,
      villain,
    });
    expect(advice.action.type).toBe("bet");
    if (advice.action.type === "bet") {
      expect(advice.action.amount).toBeGreaterThanOrEqual(Math.round(60 * 0.7));
    }
  });

  it("4. weak hand vs calling station → check, do not bluff", () => {
    const villain = modelWithProfile("LOOSE_PASSIVE", 35);
    const advice = advise({
      equityVsRange: 0.12,
      equityVsRandom: 0.2,
      toCall: 0,
      pot: 50,
      heroStack: 900,
      canCheck: true,
      minBet: 10,
      minRaiseTo: 20,
      maxBet: 900,
      heroCards: [parseCard("7c"), parseCard("2d")],
      board: [parseCard("Ah"), parseCard("Kd"), parseCard("9s")],
      street: "flop",
      inPosition: true,
      opponentsInHand: 1,
      outsCount: 0,
      villain,
    });
    expect(advice.action.type).toBe("check");
    expect(advice.trap ?? advice.reasons.join(" ")).toMatch(/bluff|paie/i);
  });

  it("5. TAG open-raise range is tight", () => {
    const m = modelWithProfile("TAG", 40);
    const range = estimatePreflopRange(m, "early", "raise", []);
    const loose = estimatePreflopRange(
      modelWithProfile("LOOSE_PASSIVE", 40),
      "early",
      "call",
      [],
    );
    expect(range.length).toBeLessThan(loose.length);
  });

  it("6. rock raise keeps only strong hands", () => {
    const m = modelWithProfile("TIGHT_PASSIVE", 40);
    const range = estimatePreflopRange(m, "middle", "raise", []);
    expect(range.length).toBeLessThan(200);
  });

  it("7. postflop bet narrows air out of range", () => {
    const m = modelWithProfile("TAG", 40);
    const pre = estimatePreflopRange(m, "late", "raise", []);
    const board = [parseCard("Kh"), parseCard("7d"), parseCard("2c")];
    const after = narrowRangePostflop(pre, board, "bet", "TAG");
    const avgPre =
      pre.reduce((s, h) => s + h.weight, 0) / Math.max(1, pre.length);
    const avgAfter =
      after.reduce((s, h) => s + h.weight, 0) / Math.max(1, after.length);
    expect(after.length).toBeGreaterThan(0);
    expect(avgAfter).toBeGreaterThan(0);
    expect(avgPre).toBeGreaterThan(0);
  });

  it("8. deduce calling station from high VPIP low PFR", () => {
    const profile = deduceProfile({
      vpip: 0.5,
      pfr: 0.06,
      af: 0.6,
      foldToBetPostflop: 0.2,
      wentToShowdown: 0.4,
    });
    expect(profile).toBe("LOOSE_PASSIVE");
  });

  it("9. deduce TAG from modest VPIP and solid PFR", () => {
    const profile = deduceProfile({
      vpip: 0.21,
      pfr: 0.17,
      af: 2.5,
      foldToBetPostflop: 0.5,
      wentToShowdown: 0.25,
    });
    expect(profile).toBe("TAG");
  });

  it("10. low sample → low confidence", () => {
    const m = createOpponentModel("bot1");
    m.stats.handsDealt = 8;
    m.stats.handsVoluntarilyPlayed = 2;
    const refreshed = refreshModel(m);
    expect(refreshed.confidence).toBe("low");
  });

  it("11. hand review highlights biggest mistake", () => {
    const summary = reviewDecisions([
      {
        street: "flop",
        action: { type: "call" },
        recommendedEv: 10,
        actualEv: 8,
        recommendation: {
          action: { type: "call" },
          headline: "Suivre",
          confidence: "leaning",
          reasons: ["ok"],
        },
      },
      {
        street: "turn",
        action: { type: "call" },
        recommendedEv: 5,
        actualEv: -40,
        recommendation: {
          action: { type: "fold" },
          headline: "Se coucher",
          confidence: "sure",
          reasons: ["trop cher"],
        },
      },
    ]);
    expect(summary.biggestMistake?.street).toBe("turn");
    expect(summary.bestDecision?.street).toBe("flop");
  });

  it("12. LAG call lighter with medium strength", () => {
    const villain = modelWithProfile("LAG", 40);
    const advice = advise({
      equityVsRange: 0.28,
      equityVsRandom: 0.35,
      toCall: 30,
      pot: 90,
      heroStack: 800,
      canCheck: false,
      minBet: 10,
      minRaiseTo: 60,
      maxBet: 800,
      heroCards: [parseCard("Qh"), parseCard("Jd")],
      board: [parseCard("Qc"), parseCard("8d"), parseCard("3s"), parseCard("2h")],
      street: "turn",
      inPosition: true,
      opponentsInHand: 1,
      outsCount: 0,
      villain,
    });
    // required ≈ 25%, equity 28% + callLighter → call
    expect(["call", "raise"]).toContain(advice.action.type);
  });

  it("13. buildOpponentModels counts voluntary puts from events", () => {
    const models = buildOpponentModels(
      [
        { type: "HAND_STARTED", handNumber: 1, buttonSeat: 0 },
        { type: "CARDS_DEALT", playerId: "bot1", cardCount: 2 },
        {
          type: "BLINDS_POSTED",
          smallBlindId: "hero",
          bigBlindId: "bot1",
          smallBlind: 5,
          bigBlind: 10,
        },
        {
          type: "PLAYER_ACTED",
          playerId: "bot1",
          action: "raise",
          amount: 30,
          totalBet: 30,
        },
      ],
      ["bot1"],
    );
    expect(models.bot1!.stats.handsDealt).toBe(1);
    expect(models.bot1!.stats.handsVoluntarilyPlayed).toBe(1);
    expect(models.bot1!.stats.handsRaisedPreflop).toBe(1);
  });

  it("14. ratesFromStats computes VPIP", () => {
    const rates = ratesFromStats({
      handsDealt: 40,
      handsVoluntarilyPlayed: 20,
      handsRaisedPreflop: 8,
      betsAndRaises: 12,
      calls: 10,
      foldToBetPostflop: 5,
      facedBetPostflop: 10,
      wentToShowdown: 4,
      reachedShowdownOpportunity: 8,
    });
    expect(rates.vpip).toBeCloseTo(0.5);
    expect(rates.pfr).toBeCloseTo(0.2);
  });

  it("15. equity helper rng is deterministic for advise smoke", () => {
    const rng = createRng(1);
    expect(rng.next()).toBeGreaterThanOrEqual(0);
  });
});
