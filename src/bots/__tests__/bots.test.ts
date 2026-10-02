import { describe, expect, it } from "vitest";
import { createRng } from "@/lib/rng";
import { decideAction, type BotConfig } from "../decide";
import { PROFILES } from "../profiles";
import { isInPfr, isInVpip, preflopStrength } from "../preflop";
import { parseCard, fullDeck } from "@/engine/cards";
import type { LegalActions, PlayerView } from "@/engine";

function mockView(hole: string[]): PlayerView {
  const cards = hole.map(parseCard);
  return {
    players: [
      {
        id: "bot",
        name: "Bot",
        stack: 1000,
        holeCards: cards,
        betStreet: 0,
        committed: 0,
        status: "active",
        seat: 0,
        hasActed: false,
      },
      {
        id: "villain",
        name: "V",
        stack: 1000,
        holeCards: null,
        betStreet: 10,
        committed: 10,
        status: "active",
        seat: 1,
        hasActed: true,
      },
    ],
    buttonSeat: 0,
    config: { smallBlind: 5, bigBlind: 10 },
    board: [],
    street: "preflop",
    currentBet: 10,
    lastRaiseSize: 10,
    actingIndex: 0,
    pot: 15,
    handNumber: 1,
    events: [],
    handOver: false,
    lastAggressorIndex: null,
    heroId: "bot",
  };
}

const legalOpen: LegalActions = {
  fold: true,
  check: false,
  call: { amount: 10 },
  bet: null,
  raise: { min: 20, max: 1000 },
};

describe("bots", () => {
  it("TAG folds more trash than LOOSE_PASSIVE", () => {
    const rng = createRng(1);
    const trash = mockView(["2c", "7d"]);
    let tagFolds = 0;
    let looseCalls = 0;
    for (let i = 0; i < 80; i += 1) {
      const tag = decideAction(
        trash,
        legalOpen,
        { style: "TAG", difficulty: "MEDIUM" },
        rng,
      );
      const loose = decideAction(
        trash,
        legalOpen,
        { style: "LOOSE_PASSIVE", difficulty: "MEDIUM" },
        rng,
      );
      if (tag.type === "fold") tagFolds += 1;
      if (loose.type === "call" || loose.type === "raise") looseCalls += 1;
    }
    expect(tagFolds).toBeGreaterThan(40);
    expect(looseCalls).toBeGreaterThan(20);
  });

  it("profile targets exist", () => {
    expect(PROFILES.TAG.vpip).toBeCloseTo(0.2, 2);
    expect(PROFILES.FISH.vpip).toBeGreaterThan(0.5);
  });

  it("preflop ranking puts AA above 72o", () => {
    expect(
      preflopStrength([parseCard("As"), parseCard("Ad")]),
    ).toBeGreaterThan(preflopStrength([parseCard("7c"), parseCard("2d")]));
    expect(isInVpip([parseCard("As"), parseCard("Ad")], 0.2)).toBe(true);
    expect(isInPfr([parseCard("7c"), parseCard("2d")], 0.16)).toBe(false);
  });

  it("decideAction usually under 50ms", () => {
    const view = mockView(["Ah", "Kd"]);
    view.board = [parseCard("2c"), parseCard("7d"), parseCard("9h")];
    view.street = "flop";
    const cfg: BotConfig = { style: "TAG", difficulty: "HARD" };
    const rng = createRng(9);
    const t0 = performance.now();
    for (let i = 0; i < 20; i += 1) {
      decideAction(view, legalOpen, cfg, rng);
    }
    const avg = (performance.now() - t0) / 20;
    expect(avg).toBeLessThan(50);
  });

  it("deck has 52 cards for smoke", () => {
    expect(fullDeck()).toHaveLength(52);
  });
});
