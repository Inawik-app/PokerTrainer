import { describe, expect, it } from "vitest";
import { parseCard } from "@/engine/cards";
import { createRng } from "@/lib/rng";
import { computeEquity } from "../equity";
import { getOuts } from "../outs";
import { callEV, potOdds, requiredEquity } from "../potOdds";

describe("computeEquity", () => {
  it("AA vs 1 random opponent ≈ 85% (±3%)", () => {
    const result = computeEquity({
      hero: [parseCard("As"), parseCard("Ad")],
      board: [],
      opponents: 1,
      iterations: 5000,
      rng: createRng(7),
    });
    expect(result.equity).toBeGreaterThan(0.82);
    expect(result.equity).toBeLessThan(0.88);
  });
});

describe("getOuts", () => {
  it("flush draw on flop has 9 outs", () => {
    const outs = getOuts(
      [parseCard("Ah"), parseCard("Kh")],
      [parseCard("2h"), parseCard("7h"), parseCard("9d")],
    );
    const flushOuts = outs.filter((o) => o.drawTypes.includes("flush"));
    expect(flushOuts.length).toBe(9);
  });
});

describe("potOdds", () => {
  it("computes pot odds and EV", () => {
    expect(potOdds(25, 75)).toBeCloseTo(0.25, 5);
    expect(requiredEquity(25, 75)).toBeCloseTo(0.25, 5);
    // 40% equity, pot 75, call 25 → EV = 0.4*100 - 0.6*25 = 40-15 = 25
    expect(callEV(0.4, 75, 25)).toBeCloseTo(25, 5);
  });
});
