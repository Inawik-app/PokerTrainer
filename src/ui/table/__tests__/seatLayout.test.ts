import { describe, expect, it } from "vitest";
import { getSeatLayout } from "../seatLayout";
import { zoneTrackSegments } from "@/ui/controls/BetZoneSlider";
import { getBetZones } from "@/coach";

describe("getSeatLayout", () => {
  it("places hero (index 0) at bottom center", () => {
    for (const n of [2, 4, 6]) {
      const layout = getSeatLayout(n);
      expect(layout).toHaveLength(n);
      const hero = layout[0]!;
      expect(hero.seat.left).toBeCloseTo(50, 0);
      expect(hero.seat.top).toBeGreaterThan(70);
    }
  });

  it("keeps bet between seat and center", () => {
    const layout = getSeatLayout(6);
    for (const slot of layout) {
      const seatDist = Math.hypot(slot.seat.left - 50, slot.seat.top - 50);
      const betDist = Math.hypot(slot.bet.left - 50, slot.bet.top - 50);
      expect(betDist).toBeLessThan(seatDist);
    }
  });
});

describe("zoneTrackSegments", () => {
  it("covers full range from min to max without gap", () => {
    const zones = getBetZones(
      {
        street: "preflop",
        bigBlind: 10,
        pot: 15,
        min: 20,
        max: 1000,
        isReRaise: false,
        facingTotal: 10,
        callers: 0,
        spr: 50,
        hasDraw: false,
      },
      0.5,
    );
    const segs = zoneTrackSegments(zones, 20, 1000);
    expect(segs.length).toBeGreaterThan(0);
    expect(segs[0]!.left).toBeCloseTo(0, 0);
    const last = segs[segs.length - 1]!;
    expect(last.left + last.width).toBeGreaterThan(99);
    const good = segs.find((s) => s.kind === "good");
    expect(good).toBeTruthy();
    expect(good!.width).toBeGreaterThan(0);
  });
});
