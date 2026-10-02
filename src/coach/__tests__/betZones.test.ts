import { describe, expect, it } from "vitest";
import { defaultAmountInGoodZone, getBetZones, zoneAt } from "../betZones";

describe("getBetZones", () => {
  it("preflop open: 2–3 BB is Conseillé", () => {
    const bb = 10;
    const zones = getBetZones(
      {
        street: "preflop",
        bigBlind: bb,
        pot: 15,
        min: 10,
        max: 1000,
        isReRaise: false,
        facingTotal: 10,
        callers: 0,
        spr: 50,
        hasDraw: false,
      },
      0.5,
    );
    const mid = zoneAt(zones, 25);
    expect(mid?.kind).toBe("good");
    expect(mid?.label).toBe("Conseillé");
    expect(zoneAt(zones, 15)?.kind).toBe("cautious");
    expect(zoneAt(zones, 50)?.kind).toBe("aggressive");
  });

  it("preflop 3-bet ~3× facing is Conseillé", () => {
    const zones = getBetZones(
      {
        street: "preflop",
        bigBlind: 10,
        pot: 70,
        min: 90,
        max: 1000,
        isReRaise: true,
        facingTotal: 30,
        callers: 0,
        spr: 30,
        hasDraw: false,
      },
      0.6,
    );
    expect(zoneAt(zones, 90)?.kind).toBe("good");
  });

  it("postflop strong: half to 3/4 pot is Conseillé", () => {
    const pot = 100;
    const zones = getBetZones(
      {
        street: "flop",
        bigBlind: 10,
        pot,
        min: 10,
        max: 500,
        isReRaise: false,
        facingTotal: 0,
        callers: 0,
        spr: 8,
        hasDraw: false,
      },
      0.75,
    );
    expect(zoneAt(zones, 60)?.kind).toBe("good");
    expect(zoneAt(zones, 90)?.kind).toBe("aggressive");
    expect(zoneAt(zones, 20)?.kind).toBe("cautious");
  });

  it("postflop medium: 1/3–1/2 pot Conseillé", () => {
    const zones = getBetZones(
      {
        street: "turn",
        bigBlind: 10,
        pot: 120,
        min: 10,
        max: 400,
        isReRaise: false,
        facingTotal: 0,
        callers: 0,
        spr: 5,
        hasDraw: false,
      },
      0.5,
    );
    expect(zoneAt(zones, 50)?.kind).toBe("good");
    expect(zoneAt(zones, 100)?.kind).toBe("aggressive");
  });

  it("weak hand: all bets Risqué", () => {
    const zones = getBetZones(
      {
        street: "river",
        bigBlind: 10,
        pot: 200,
        min: 20,
        max: 400,
        isReRaise: false,
        facingTotal: 0,
        callers: 0,
        spr: 4,
        hasDraw: false,
      },
      0.25,
    );
    expect(zones.every((z) => z.kind === "risky")).toBe(true);
    expect(zones[0]?.reason).toMatch(/Parole ou coucher/i);
  });

  it("low SPR + strong: all-in lands in Conseillé", () => {
    const zones = getBetZones(
      {
        street: "flop",
        bigBlind: 10,
        pot: 200,
        min: 20,
        max: 180,
        isReRaise: false,
        facingTotal: 0,
        callers: 0,
        spr: 1.5,
        hasDraw: false,
      },
      0.8,
    );
    expect(zoneAt(zones, 180)?.kind).toBe("good");
    const def = defaultAmountInGoodZone(zones, 20, 180);
    expect(def).toBeGreaterThanOrEqual(20);
    expect(def).toBeLessThanOrEqual(180);
  });
});
