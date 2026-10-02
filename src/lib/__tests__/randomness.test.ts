import { describe, expect, it } from "vitest";
import { createRng, resolveGameSeed, randomSeed } from "../rng";
import { createDeck } from "@/engine/deck";
import { cardToString, fullDeck } from "@/engine/cards";
import {
  createInitialState,
  startHand,
  applyAction,
  getLegalActions,
  type GameState,
} from "@/engine";
import type { Action } from "@/engine";

function holeKey(state: GameState): string {
  return state.players
    .map((p) => p.holeCards.map(cardToString).join(""))
    .join("|");
}

function autoCheckCall(state: GameState): GameState {
  let s = state;
  let guard = 0;
  while (!s.handOver && s.actingIndex !== null && guard < 80) {
    guard += 1;
    const id = s.players[s.actingIndex]!.id;
    const legal = getLegalActions(s, id);
    const action: Action = legal.check
      ? { type: "check" }
      : legal.call
        ? { type: "call" }
        : { type: "fold" };
    s = applyAction(s, action).state;
  }
  return s;
}

describe("game randomness", () => {
  it("two games without manual seed produce different hands", () => {
    const seeds = [randomSeed(), randomSeed()];
    // Extremely unlikely both crypto seeds collide; if they do, draw again
    if (seeds[0] === seeds[1]) seeds[1] = randomSeed() ^ 0x9e3779b9;

    const hands = seeds.map((seed) => {
      const rng = createRng(seed);
      let state = createInitialState(
        [
          { id: "a", name: "A", stack: 1000 },
          { id: "b", name: "B", stack: 1000 },
        ],
        { smallBlind: 5, bigBlind: 10 },
      );
      state = startHand(state, rng);
      return holeKey(state);
    });

    expect(hands[0]).not.toEqual(hands[1]);
  });

  it("same manual seed produces identical hands (replayability)", () => {
    const run = () => {
      const rng = createRng(resolveGameSeed(123456789));
      let state = createInitialState(
        [
          { id: "a", name: "A", stack: 1000 },
          { id: "b", name: "B", stack: 1000 },
          { id: "c", name: "C", stack: 1000 },
        ],
        { smallBlind: 5, bigBlind: 10 },
      );
      state = startHand(state, rng);
      const hand1 = holeKey(state);
      state = autoCheckCall(state);
      state = startHand(state, rng);
      const hand2 = holeKey(state);
      return { hand1, hand2, board1: state.board.map(cardToString).join("") };
    };

    expect(run()).toEqual(run());
  });

  it("over 100_000 shuffles, each card is first ≈ 1/52 (within 10%)", () => {
    const counts = new Map<string, number>();
    for (const c of fullDeck()) counts.set(cardToString(c), 0);

    const N = 100_000;
    for (let i = 0; i < N; i += 1) {
      const deck = createDeck(createRng(i * 2654435761 + 1));
      const first = cardToString(deck[0]!);
      counts.set(first, (counts.get(first) ?? 0) + 1);
    }

    const expected = N / 52;
    const tol = expected * 0.1;
    for (const [, n] of counts) {
      expect(Math.abs(n - expected)).toBeLessThan(tol);
    }
  });

  it("two successive hands in the same game do not share the same cards", () => {
    const rng = createRng(987654321);
    let state = createInitialState(
      [
        { id: "a", name: "A", stack: 1000 },
        { id: "b", name: "B", stack: 1000 },
      ],
      { smallBlind: 5, bigBlind: 10 },
    );
    state = startHand(state, rng);
    const first = holeKey(state);
    state = autoCheckCall(state);
    state = startHand(state, rng);
    const second = holeKey(state);
    expect(first).not.toEqual(second);
  });

  it("resolveGameSeed keeps a manual seed", () => {
    expect(resolveGameSeed(42)).toBe(42);
    expect(typeof randomSeed()).toBe("number");
    expect(resolveGameSeed(undefined)).toBeTypeOf("number");
  });
});
