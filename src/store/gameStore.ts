"use client";

import { create } from "zustand";
import {
  applyAction,
  createInitialState,
  getLegalActions,
  startHand,
  type Action,
  type GameEvent,
  type GameState,
} from "@/engine";
import { createRng, type Rng } from "@/lib/rng";
import {
  decideAction,
  type BotConfig,
  type BotDifficulty,
  type BotStyle,
} from "@/bots";

export type GamePhase = "idle" | "playing" | "handOver";

export type GameSettings = {
  botCount: number;
  startingStack: number;
  smallBlind: number;
  bigBlind: number;
  botDelayMin: number;
  botDelayMax: number;
  seed: number;
};

const STYLES: BotStyle[] = [
  "TAG",
  "LAG",
  "TIGHT_PASSIVE",
  "LOOSE_PASSIVE",
  "FISH",
];
const DIFFS: BotDifficulty[] = ["EASY", "MEDIUM", "HARD"];

type Store = {
  settings: GameSettings;
  gameState: GameState | null;
  events: GameEvent[];
  phase: GamePhase;
  botConfigs: Record<string, BotConfig>;
  heroId: string;
  rng: Rng;
  botTimer: ReturnType<typeof setTimeout> | null;
  setSettings: (partial: Partial<GameSettings>) => void;
  startGame: () => void;
  humanAction: (action: Action) => void;
  nextHand: () => void;
  clearBotTimer: () => void;
};

function scheduleBot(get: () => Store, set: (p: Partial<Store>) => void) {
  const { gameState, settings, botConfigs, heroId, clearBotTimer } = get();
  clearBotTimer();
  if (!gameState || gameState.handOver || gameState.actingIndex === null) {
    if (gameState?.handOver) set({ phase: "handOver" });
    return;
  }
  const actor = gameState.players[gameState.actingIndex]!;
  if (actor.id === heroId) return;

  const delay =
    settings.botDelayMin +
    Math.floor(
      Math.random() * (settings.botDelayMax - settings.botDelayMin + 1),
    );

  const timer = setTimeout(() => {
    const current = get();
    const state = current.gameState;
    if (!state || state.handOver || state.actingIndex === null) return;
    const bot = state.players[state.actingIndex]!;
    if (bot.id === current.heroId) return;

    const legal = getLegalActions(state, bot.id);
    const config = current.botConfigs[bot.id] ?? {
      style: "TAG" as const,
      difficulty: "MEDIUM" as const,
    };
    const view = {
      ...state,
      deck: [],
      heroId: bot.id,
      players: state.players.map((p) => ({
        ...p,
        holeCards: p.id === bot.id ? p.holeCards : null,
      })),
    };
    const action = decideAction(view, legal, config, current.rng);
    try {
      const { state: next, events } = applyAction(state, action);
      set({
        gameState: next,
        events: [...current.events, ...events],
        phase: next.handOver ? "handOver" : "playing",
      });
      scheduleBot(get, set);
    } catch {
      // Try safe fallback
      try {
        const fallback = legal.check
          ? ({ type: "check" } as Action)
          : legal.call
            ? ({ type: "call" } as Action)
            : ({ type: "fold" } as Action);
        const { state: next, events } = applyAction(state, fallback);
        set({
          gameState: next,
          events: [...current.events, ...events],
          phase: next.handOver ? "handOver" : "playing",
        });
        scheduleBot(get, set);
      } catch {
        /* ignore */
      }
    }
  }, delay);

  set({ botTimer: timer });
}

export const useGameStore = create<Store>((set, get) => ({
  settings: {
    botCount: 3,
    startingStack: 1000,
    smallBlind: 5,
    bigBlind: 10,
    botDelayMin: 600,
    botDelayMax: 1200,
    seed: 42,
  },
  gameState: null,
  events: [],
  phase: "idle",
  botConfigs: {},
  heroId: "hero",
  rng: createRng(42),
  botTimer: null,

  clearBotTimer: () => {
    const t = get().botTimer;
    if (t) clearTimeout(t);
    set({ botTimer: null });
  },

  setSettings: (partial) =>
    set({ settings: { ...get().settings, ...partial } }),

  startGame: () => {
    const { settings, heroId, clearBotTimer } = get();
    clearBotTimer();
    const rng = createRng(settings.seed);
    const configs: Record<string, BotConfig> = {};
    const players = [
      { id: heroId, name: "Vous", stack: settings.startingStack },
    ];
    for (let i = 1; i <= settings.botCount; i += 1) {
      const id = `bot${i}`;
      players.push({
        id,
        name: `Bot ${i}`,
        stack: settings.startingStack,
      });
      configs[id] = {
        style: STYLES[rng.int(STYLES.length)]!,
        difficulty: DIFFS[rng.int(DIFFS.length)]!,
      };
    }
    let state = createInitialState(
      players,
      { smallBlind: settings.smallBlind, bigBlind: settings.bigBlind },
      0,
    );
    state = startHand(state, rng);
    set({
      gameState: state,
      events: [...state.events],
      phase: state.handOver ? "handOver" : "playing",
      botConfigs: configs,
      rng,
    });
    scheduleBot(get, set);
  },

  humanAction: (action) => {
    const { gameState, heroId, events, clearBotTimer } = get();
    if (!gameState || gameState.handOver || gameState.actingIndex === null) {
      return;
    }
    const actor = gameState.players[gameState.actingIndex]!;
    if (actor.id !== heroId) return;
    clearBotTimer();
    const { state: next, events: newEvents } = applyAction(gameState, action);
    set({
      gameState: next,
      events: [...events, ...newEvents],
      phase: next.handOver ? "handOver" : "playing",
    });
    scheduleBot(get, set);
  },

  nextHand: () => {
    const { gameState, rng, clearBotTimer, events } = get();
    if (!gameState) return;
    clearBotTimer();
    const next = startHand(gameState, rng);
    set({
      gameState: next,
      events: [...events, ...next.events],
      phase: next.handOver ? "handOver" : "playing",
    });
    scheduleBot(get, set);
  },
}));
