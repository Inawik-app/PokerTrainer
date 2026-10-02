import { describe, expect, it } from "vitest";
import {
  forbiddenOverlaps,
  getSeatLayout,
  layoutHasOverlaps,
  rectsOverlap,
} from "../seatLayout";

describe("getSeatLayout", () => {
  it("places hero (index 0) plate at bottom center", () => {
    for (const n of [2, 4, 6]) {
      const layout = getSeatLayout(n);
      expect(layout.seats).toHaveLength(n);
      const hero = layout.seats[0]!.plate;
      expect(hero.x + hero.w / 2).toBeCloseTo(50, 0);
      expect(hero.y + hero.h / 2).toBeGreaterThan(62);
    }
  });

  it("keeps street bets outside the center zone", () => {
    for (const n of [2, 3, 4, 5, 6]) {
      const layout = getSeatLayout(n);
      for (const seat of layout.seats) {
        expect(rectsOverlap(seat.bet, layout.center, 0)).toBe(false);
      }
    }
  });

  it("has no forbidden overlapping boxes for 2–6 players", () => {
    for (const n of [2, 3, 4, 5, 6]) {
      const layout = getSeatLayout(n);
      expect(layoutHasOverlaps(layout), `n=${n}`).toBe(false);
      expect(forbiddenOverlaps(layout)).toEqual([]);
    }
  });
});
