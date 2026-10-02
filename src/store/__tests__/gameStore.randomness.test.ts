import { describe, expect, it, beforeEach } from "vitest";
import { cardToString } from "@/engine/cards";
import { useGameStore } from "../gameStore";

function heroHoleKey(): string {
  const state = useGameStore.getState().gameState;
  if (!state) return "";
  const hero = state.players.find((p) => p.id === "hero");
  return (hero?.holeCards ?? []).map(cardToString).join("");
}

function allHolesKey(): string {
  const state = useGameStore.getState().gameState;
  if (!state) return "";
  return state.players
    .map((p) => p.holeCards.map(cardToString).join(""))
    .join("|");
}

describe("gameStore randomness", () => {
  beforeEach(() => {
    useGameStore.setState({
      settings: {
        botCount: 2,
        startingStack: 1000,
        smallBlind: 5,
        bigBlind: 10,
        botDelayMin: 600,
        botDelayMax: 600,
        manualSeed: null,
      },
      gameSeed: null,
      gameState: null,
      events: [],
      phase: "idle",
      botConfigs: {},
      rng: null,
      botTimer: null,
    });
    useGameStore.getState().clearBotTimer();
  });

  it("two startGame without manual seed deal different cards", () => {
    const store = useGameStore.getState();
    store.setSettings({ manualSeed: null });
    store.startGame();
    const seedA = useGameStore.getState().gameSeed;
    const holesA = allHolesKey();
    store.clearBotTimer();
    store.startGame();
    const seedB = useGameStore.getState().gameSeed;
    const holesB = allHolesKey();
    expect(seedA).not.toEqual(seedB);
    expect(holesA).not.toEqual(holesB);
    expect(holesA.length).toBeGreaterThan(0);
  });

  it("same manual seed reproduces the same first hand", () => {
    const store = useGameStore.getState();
    store.setSettings({ manualSeed: 424242 });
    store.startGame();
    const first = allHolesKey();
    const seed1 = useGameStore.getState().gameSeed;
    store.clearBotTimer();
    store.startGame();
    const second = allHolesKey();
    const seed2 = useGameStore.getState().gameSeed;
    expect(seed1).toBe(424242);
    expect(seed2).toBe(424242);
    expect(first).toEqual(second);
  });

  it("nextHand on the same RNG deals a different hand", () => {
    const store = useGameStore.getState();
    store.setSettings({ manualSeed: 777001 });
    store.startGame();
    const hand1 = heroHoleKey();
    // Force hand over so nextHand is meaningful without waiting bots
    const gs = useGameStore.getState().gameState!;
    useGameStore.setState({
      gameState: { ...gs, handOver: true, actingIndex: null },
      phase: "handOver",
    });
    useGameStore.getState().clearBotTimer();
    useGameStore.getState().nextHand();
    const hand2 = heroHoleKey();
    expect(hand1).not.toEqual(hand2);
  });
});
