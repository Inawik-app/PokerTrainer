import { describe, expect, it } from "vitest";
import { getAdvice, reviewHand, biggestMistake } from "../advice";

describe("coach", () => {
  it("advises call when equity beats pot odds", () => {
    const advice = getAdvice(0.4, 25, 75, 9);
    expect(advice.level).toBe("good");
    expect(advice.message).toMatch(/bon|vaut le coup/i);
  });

  it("flags bad calls", () => {
    const advice = getAdvice(0.1, 50, 50, 2);
    expect(advice.level).toBe("bad");
  });

  it("reviews hand and finds biggest mistake", () => {
    const reviews = reviewHand([
      {
        street: "flop",
        action: "call",
        amount: 20,
        equity: 0.5,
        pot: 80,
        toCall: 20,
      },
      {
        street: "turn",
        action: "call",
        amount: 100,
        equity: 0.1,
        pot: 100,
        toCall: 100,
      },
    ]);
    expect(reviews).toHaveLength(2);
    const mistake = biggestMistake(reviews);
    expect(mistake?.street).toBe("turn");
  });
});
