import { describe, expect, it } from "vitest";
import { createRng } from "../rng";

describe("createRng", () => {
  it("is deterministic for the same seed", () => {
    const a = createRng(42);
    const b = createRng(42);
    const valuesA = Array.from({ length: 10 }, () => a.next());
    const valuesB = Array.from({ length: 10 }, () => b.next());
    expect(valuesA).toEqual(valuesB);
  });

  it("int returns values in [0, max)", () => {
    const rng = createRng(7);
    for (let i = 0; i < 100; i += 1) {
      const n = rng.int(5);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(5);
    }
  });

  it("shuffle permutes without losing elements", () => {
    const rng = createRng(99);
    const input = [1, 2, 3, 4, 5];
    const shuffled = rng.shuffle(input);
    expect(shuffled).toHaveLength(input.length);
    expect([...shuffled].sort()).toEqual(input);
    expect(input).toEqual([1, 2, 3, 4, 5]);
  });
});
