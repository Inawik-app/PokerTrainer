import { describe, expect, it } from "vitest";
import { parseCard, type Card } from "../cards";
import {
  compareHands,
  evaluateHand,
  findWinners,
  type HandCategory,
} from "../evaluator";
import { createDeck } from "../deck";
import { createRng } from "@/lib/rng";

function c(...codes: string[]): Card[] {
  return codes.map(parseCard);
}

function expectCategory(cards: Card[], category: HandCategory) {
  expect(evaluateHand(cards).category).toBe(category);
}

describe("evaluateHand categories", () => {
  it("detects each category", () => {
    expectCategory(c("As", "Ks", "Qs", "Js", "Ts"), "ROYAL_FLUSH");
    expectCategory(c("9h", "8h", "7h", "6h", "5h"), "STRAIGHT_FLUSH");
    expectCategory(c("Ah", "Ad", "Ac", "As", "2h"), "FOUR_OF_A_KIND");
    expectCategory(c("Kh", "Kd", "Kc", "2s", "2h"), "FULL_HOUSE");
    expectCategory(c("Ah", "Jh", "9h", "5h", "2h"), "FLUSH");
    expectCategory(c("9c", "8d", "7h", "6s", "5c"), "STRAIGHT");
    expectCategory(c("Qh", "Qd", "Qc", "9s", "2h"), "THREE_OF_A_KIND");
    expectCategory(c("Jh", "Jd", "8c", "8s", "3h"), "TWO_PAIR");
    expectCategory(c("Th", "Td", "Ac", "9s", "2h"), "PAIR");
    expectCategory(c("Ah", "Kd", "Qc", "9s", "2h"), "HIGH_CARD");
  });

  it("handles the wheel straight A-5", () => {
    const result = evaluateHand(c("Ah", "2d", "3c", "4s", "5h"));
    expect(result.category).toBe("STRAIGHT");
    expect(result.labelFr).toContain("5");
  });

  it("handles wheel straight flush", () => {
    expectCategory(c("Ah", "2h", "3h", "4h", "5h"), "STRAIGHT_FLUSH");
  });

  it("compares kickers on pairs", () => {
    const a = evaluateHand(c("Ah", "Ad", "Kc", "9s", "2h"));
    const b = evaluateHand(c("Ah", "Ad", "Qc", "9s", "2h"));
    expect(compareHands(a, b)).toBeGreaterThan(0);
  });

  it("flush beats straight", () => {
    const flush = evaluateHand(c("Ah", "Jh", "9h", "5h", "2h"));
    const straight = evaluateHand(c("9c", "8d", "7h", "6s", "5c"));
    expect(compareHands(flush, straight)).toBeGreaterThan(0);
  });

  it("two pair uses kicker", () => {
    const a = evaluateHand(c("Kh", "Kd", "8c", "8s", "Ah"));
    const b = evaluateHand(c("Kh", "Kd", "8c", "8s", "Qh"));
    expect(compareHands(a, b)).toBeGreaterThan(0);
  });

  it("exact ties", () => {
    const a = evaluateHand(c("Ah", "Kd", "Qc", "9s", "2h"));
    const b = evaluateHand(c("As", "Kc", "Qd", "9h", "2c"));
    expect(compareHands(a, b)).toBe(0);
  });

  it("selects best five among seven", () => {
    // board + hole makes flush available
    const result = evaluateHand(c("Ah", "Kh", "Qh", "Jh", "2c", "3d", "9h"));
    expect(result.category).toBe("FLUSH");
    expect(result.bestFive).toHaveLength(5);
  });

  it("findWinners handles split pots", () => {
    const { winners } = findWinners([
      { playerId: "p1", cards: c("Ah", "Kd", "Qc", "9s", "2h", "3c", "4d") },
      { playerId: "p2", cards: c("As", "Kc", "Qd", "9h", "2c", "3c", "4d") },
    ]);
    expect(winners).toEqual(["p1", "p2"]);
  });
});

describe("deck", () => {
  it("creates a shuffled 52-card deck", () => {
    const deck = createDeck(createRng(1));
    expect(deck).toHaveLength(52);
  });
});

describe("evaluateHand performance", () => {
  it("evaluates 100_000 seven-card hands in under 1s", () => {
    const rng = createRng(123);
    const deck = createDeck(rng);
    const hands: Card[][] = [];
    for (let i = 0; i < 1000; i += 1) {
      const start = (i * 7) % 45;
      hands.push(deck.slice(start, start + 7));
    }

    const t0 = performance.now();
    for (let i = 0; i < 100_000; i += 1) {
      evaluateHand(hands[i % hands.length]!);
    }
    const elapsed = performance.now() - t0;
    expect(elapsed).toBeLessThan(1000);
  });
});
