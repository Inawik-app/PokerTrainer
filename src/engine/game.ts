import type { Rng } from "@/lib/rng";
import { type Card } from "./cards";
import { createDeck, draw, type Deck } from "./deck";
import { evaluateHand } from "./evaluator";
import type { GameEvent, PlayerActionType, Street } from "./events";
import {
  type Action,
  type LegalActions,
  minRaiseTo,
} from "./betting";
import { computePots, distributePot } from "./pots";

export type PlayerStatus = "active" | "folded" | "allIn";

export type PlayerState = {
  id: string;
  name: string;
  stack: number;
  holeCards: Card[];
  /** Chips committed on the current street. */
  betStreet: number;
  /** Total chips committed this hand. */
  committed: number;
  status: PlayerStatus;
  seat: number;
  hasActed: boolean;
};

export type GameConfig = {
  smallBlind: number;
  bigBlind: number;
};

export type GameState = {
  players: PlayerState[];
  buttonSeat: number;
  config: GameConfig;
  board: Card[];
  street: Street;
  deck: Deck;
  /** Highest bet on current street. */
  currentBet: number;
  /** Size of the last raise (or BB preflop). */
  lastRaiseSize: number;
  actingIndex: number | null;
  pot: number;
  handNumber: number;
  events: GameEvent[];
  /** True when hand is over and stacks already awarded. */
  handOver: boolean;
  /** Seats still to act after a raise (full reopen). */
  lastAggressorIndex: number | null;
};

export type PlayerView = Omit<GameState, "deck" | "players"> & {
  players: (Omit<PlayerState, "holeCards"> & {
    holeCards: Card[] | null;
  })[];
  heroId: string;
};

function clonePlayers(players: PlayerState[]): PlayerState[] {
  return players.map((p) => ({
    ...p,
    holeCards: [...p.holeCards],
  }));
}

function nextOccupiedSeat(
  players: PlayerState[],
  fromSeat: number,
  predicate: (p: PlayerState) => boolean = () => true,
): number {
  const sorted = [...players].sort((a, b) => a.seat - b.seat);
  const n = sorted.length;
  const start = sorted.findIndex((p) => p.seat === fromSeat);
  for (let i = 1; i <= n; i += 1) {
    const p = sorted[(start + i) % n]!;
    if (predicate(p)) return p.seat;
  }
  return fromSeat;
}

function playerAtSeat(players: PlayerState[], seat: number): PlayerState {
  return players.find((p) => p.seat === seat)!;
}

function indexOfSeat(players: PlayerState[], seat: number): number {
  return players.findIndex((p) => p.seat === seat);
}

function alive(p: PlayerState): boolean {
  return p.status !== "folded";
}

function canAct(p: PlayerState): boolean {
  return p.status === "active" && p.stack > 0;
}

function seatsInHand(players: PlayerState[]): PlayerState[] {
  return players.filter((p) => p.stack > 0 || p.committed > 0 || p.status !== "folded");
}

export function createInitialState(
  players: { id: string; name: string; stack: number }[],
  config: GameConfig,
  buttonSeat = 0,
): GameState {
  if (players.length < 2 || players.length > 6) {
    throw new Error("Texas Hold'em supports 2 to 6 players");
  }
  return {
    players: players.map((p, seat) => ({
      id: p.id,
      name: p.name,
      stack: p.stack,
      holeCards: [],
      betStreet: 0,
      committed: 0,
      status: "active",
      seat,
      hasActed: false,
    })),
    buttonSeat,
    config,
    board: [],
    street: "preflop",
    deck: [],
    currentBet: 0,
    lastRaiseSize: config.bigBlind,
    actingIndex: null,
    pot: 0,
    handNumber: 0,
    events: [],
    handOver: true,
    lastAggressorIndex: null,
  };
}

function postBlind(state: GameState, playerIndex: number, amount: number): void {
  const p = state.players[playerIndex]!;
  const pay = Math.min(amount, p.stack);
  p.stack -= pay;
  p.betStreet += pay;
  p.committed += pay;
  state.pot += pay;
  if (p.stack === 0) p.status = "allIn";
}

export function startHand(state: GameState, rng: Rng): GameState {
  const next: GameState = {
    ...state,
    players: clonePlayers(state.players),
    board: [],
    events: [],
    handOver: false,
    street: "preflop",
    currentBet: 0,
    lastRaiseSize: state.config.bigBlind,
    pot: 0,
    lastAggressorIndex: null,
  };

  // Eliminate busted players from future hands (keep in array but skip)
  const funded = next.players.filter((p) => p.stack > 0);
  if (funded.length < 2) {
    next.handOver = true;
    return next;
  }

  next.handNumber += 1;
  next.buttonSeat = nextOccupiedSeat(
    next.players,
    next.buttonSeat,
    (p) => p.stack > 0,
  );

  for (const p of next.players) {
    p.holeCards = [];
    p.betStreet = 0;
    p.committed = 0;
    p.hasActed = false;
    p.status = p.stack > 0 ? "active" : "folded";
  }

  next.events.push({
    type: "HAND_STARTED",
    handNumber: next.handNumber,
    buttonSeat: next.buttonSeat,
  });

  const isHeadsUp = funded.length === 2;
  const sbSeat = isHeadsUp
    ? next.buttonSeat
    : nextOccupiedSeat(next.players, next.buttonSeat, (p) => p.stack > 0);
  const bbSeat = nextOccupiedSeat(next.players, sbSeat, (p) => p.stack > 0);

  const sbIndex = indexOfSeat(next.players, sbSeat);
  const bbIndex = indexOfSeat(next.players, bbSeat);

  postBlind(next, sbIndex, next.config.smallBlind);
  postBlind(next, bbIndex, next.config.bigBlind);

  next.currentBet = Math.max(
    next.players[sbIndex]!.betStreet,
    next.players[bbIndex]!.betStreet,
  );
  next.lastRaiseSize = next.config.bigBlind;

  next.events.push({
    type: "BLINDS_POSTED",
    smallBlindId: next.players[sbIndex]!.id,
    bigBlindId: next.players[bbIndex]!.id,
    smallBlind: next.players[sbIndex]!.betStreet,
    bigBlind: next.players[bbIndex]!.betStreet,
  });

  let deck = createDeck(rng);
  for (const p of next.players) {
    if (p.stack > 0 || p.committed > 0) {
      if (p.status === "folded" && p.committed === 0) continue;
    }
    if (p.status === "folded") continue;
    const drawn = draw(deck, 2);
    deck = drawn.deck;
    p.holeCards = drawn.cards;
    next.events.push({
      type: "CARDS_DEALT",
      playerId: p.id,
      cardCount: 2,
    });
  }
  next.deck = deck;

  // First to act preflop
  const firstSeat = isHeadsUp
    ? next.buttonSeat // SB / button acts first HU
    : nextOccupiedSeat(next.players, bbSeat, (p) => canAct(p) || p.status === "allIn");

  // Prefer someone who can act
  let actSeat = firstSeat;
  if (!canAct(playerAtSeat(next.players, actSeat))) {
    actSeat = nextOccupiedSeat(next.players, firstSeat, canAct);
  }
  next.actingIndex = indexOfSeat(next.players, actSeat);

  // If everyone all-in already (bizarre short stacks), run out board
  if (next.players.filter(canAct).length <= 1 && next.players.filter(alive).length >= 2) {
    return runOutBoard(settleIfNeeded(next));
  }

  return next;
}

export function getLegalActions(state: GameState, playerId: string): LegalActions {
  const empty: LegalActions = {
    fold: false,
    check: false,
    call: null,
    bet: null,
    raise: null,
  };
  if (state.handOver || state.actingIndex === null) return empty;
  const player = state.players[state.actingIndex]!;
  if (player.id !== playerId || !canAct(player)) return empty;

  const toCall = state.currentBet - player.betStreet;
  const canCheck = toCall <= 0;
  const result: LegalActions = {
    fold: !canCheck,
    check: canCheck,
    call: null,
    bet: null,
    raise: null,
  };

  if (!canCheck) {
    const callAmount = Math.min(toCall, player.stack);
    result.call = { amount: callAmount };
    result.fold = true;
  }

  if (state.currentBet === 0) {
    // Bet
    const min = Math.min(state.config.bigBlind, player.stack);
    const max = player.stack;
    if (max > 0) result.bet = { min, max };
  } else {
    // Raise (or all-in short)
    const minTo = minRaiseTo(
      state.currentBet,
      state.lastRaiseSize,
      state.config.bigBlind,
    );
    const maxTo = player.betStreet + player.stack;
    if (maxTo > state.currentBet) {
      const min = Math.min(minTo, maxTo);
      result.raise = { min, max: maxTo };
    }
  }

  return result;
}

function emitAct(
  events: GameEvent[],
  player: PlayerState,
  action: PlayerActionType,
  amount: number,
): void {
  events.push({
    type: "PLAYER_ACTED",
    playerId: player.id,
    action,
    amount,
    totalBet: player.betStreet,
  });
}

function commit(state: GameState, player: PlayerState, chips: number): number {
  const pay = Math.min(chips, player.stack);
  player.stack -= pay;
  player.betStreet += pay;
  player.committed += pay;
  state.pot += pay;
  if (player.stack === 0) player.status = "allIn";
  return pay;
}

function bettingRoundComplete(state: GameState): boolean {
  const actors = state.players.filter(alive);
  if (actors.length <= 1) return true;

  const needAct = state.players.filter(canAct);
  if (needAct.length === 0) return true;

  // Everyone who can act has matched currentBet and hasActed
  return needAct.every((p) => p.hasActed && p.betStreet === state.currentBet);
}

function nextActorIndex(state: GameState, fromIndex: number): number | null {
  const n = state.players.length;
  for (let i = 1; i <= n; i += 1) {
    const idx = (fromIndex + i) % n;
    if (canAct(state.players[idx]!)) return idx;
  }
  return null;
}

function resetStreet(state: GameState): void {
  for (const p of state.players) {
    p.betStreet = 0;
    p.hasActed = false;
  }
  state.currentBet = 0;
  state.lastRaiseSize = state.config.bigBlind;
  state.lastAggressorIndex = null;
}

function firstToActPostflop(state: GameState): number | null {
  const seat = nextOccupiedSeat(
    state.players,
    state.buttonSeat,
    (p) => canAct(p),
  );
  const idx = indexOfSeat(state.players, seat);
  return canAct(state.players[idx]!) ? idx : nextActorIndex(state, idx);
}

function dealStreet(
  state: GameState,
  street: "flop" | "turn" | "river",
  count: number,
): GameState {
  const burn = draw(state.deck, 1);
  const dealt = draw(burn.deck, count);
  state.deck = dealt.deck;
  state.board = [...state.board, ...dealt.cards];
  state.street = street;
  state.events.push({ type: "STREET_DEALT", street, cards: dealt.cards });
  resetStreet(state);
  state.actingIndex = firstToActPostflop(state);
  return state;
}

function runOutBoard(state: GameState): GameState {
  while (state.board.length < 5) {
    if (state.board.length === 0) dealStreet(state, "flop", 3);
    else if (state.board.length === 3) dealStreet(state, "turn", 1);
    else dealStreet(state, "river", 1);
  }
  return showdown(state);
}

function onlyOneAlive(state: GameState): PlayerState | null {
  const alivePlayers = state.players.filter(alive);
  return alivePlayers.length === 1 ? alivePlayers[0]! : null;
}

function awardUncontested(state: GameState, winner: PlayerState): GameState {
  winner.stack += state.pot;
  state.events.push({
    type: "POT_AWARDED",
    potIndex: 0,
    winners: [winner.id],
    amount: state.pot,
  });
  state.pot = 0;
  state.handOver = true;
  state.actingIndex = null;
  state.street = "showdown";
  state.events.push({ type: "HAND_ENDED", handNumber: state.handNumber });
  return state;
}

function showdown(state: GameState): GameState {
  state.street = "showdown";
  const contenders = state.players.filter(alive);
  state.events.push({
    type: "SHOWDOWN",
    playerIds: contenders.map((p) => p.id),
  });

  const contributions = state.players.map((p) => ({
    playerId: p.id,
    amount: p.committed,
    folded: p.status === "folded",
  }));
  const pots = computePots(contributions);

  // Odd chip order: first after button
  const order: string[] = [];
  let seat = state.buttonSeat;
  for (let i = 0; i < state.players.length; i += 1) {
    seat = nextOccupiedSeat(state.players, seat);
    order.push(playerAtSeat(state.players, seat).id);
  }

  pots.forEach((pot, potIndex) => {
    const eligible = contenders.filter((p) => pot.eligible.includes(p.id));
    if (eligible.length === 0 || pot.amount <= 0) return;

    const evaluated = eligible.map((p) => ({
      player: p,
      result: evaluateHand([...p.holeCards, ...state.board]),
    }));
    const best = Math.max(...evaluated.map((e) => e.result.score));
    const winners = evaluated.filter((e) => e.result.score === best);
    const winnerIds = winners.map((w) => w.player.id);
    const payouts = distributePot(pot.amount, winnerIds, order);

    for (const pay of payouts) {
      const pl = state.players.find((p) => p.id === pay.playerId)!;
      pl.stack += pay.amount;
    }

    state.events.push({
      type: "POT_AWARDED",
      potIndex,
      winners: winnerIds,
      amount: pot.amount,
      handLabel: winners[0]!.result.labelFr,
    });
  });

  state.pot = 0;
  state.handOver = true;
  state.actingIndex = null;
  state.events.push({ type: "HAND_ENDED", handNumber: state.handNumber });
  return state;
}

function settleIfNeeded(state: GameState): GameState {
  const winner = onlyOneAlive(state);
  if (winner) return awardUncontested(state, winner);
  return state;
}

function advanceAfterAction(state: GameState): GameState {
  const winner = onlyOneAlive(state);
  if (winner) return awardUncontested(state, winner);

  if (!bettingRoundComplete(state)) {
    state.actingIndex = nextActorIndex(state, state.actingIndex!);
    return state;
  }

  // Street done
  const activeStacks = state.players.filter((p) => alive(p) && p.stack > 0);
  const allInSituation =
    state.players.filter(canAct).length <= 1 &&
    state.players.filter(alive).length >= 2;

  if (state.street === "preflop") {
    if (allInSituation || activeStacks.length <= 1) return runOutBoard(state);
    return continueStreet(dealStreet(state, "flop", 3));
  }
  if (state.street === "flop") {
    if (allInSituation || activeStacks.length <= 1) return runOutBoard(state);
    return continueStreet(dealStreet(state, "turn", 1));
  }
  if (state.street === "turn") {
    if (allInSituation || activeStacks.length <= 1) return runOutBoard(state);
    return continueStreet(dealStreet(state, "river", 1));
  }
  // river
  return showdown(state);
}

function continueStreet(state: GameState): GameState {
  if (state.actingIndex === null || state.players.filter(canAct).length === 0) {
    return advanceAfterAction({ ...state, actingIndex: state.actingIndex ?? 0 });
  }
  // If only one can act and others all-in, still need them to check or go all-in path
  if (state.players.filter(canAct).length <= 1 && state.players.filter(alive).length > 1) {
    // no betting needed
    return advanceAfterAction({
      ...state,
      players: state.players.map((p) =>
        canAct(p) ? { ...p, hasActed: true } : p,
      ),
    });
  }
  return state;
}

export function applyAction(
  state: GameState,
  action: Action,
): { state: GameState; events: GameEvent[] } {
  if (state.handOver || state.actingIndex === null) {
    throw new Error("No action expected");
  }

  const actingIndex = state.actingIndex;

  const next: GameState = {
    ...state,
    players: clonePlayers(state.players),
    board: [...state.board],
    events: [...state.events],
    deck: [...state.deck],
    actingIndex,
  };

  const player = next.players[actingIndex]!;
  const legal = getLegalActions(state, player.id);
  const eventStart = next.events.length;

  switch (action.type) {
    case "fold": {
      if (!legal.fold) throw new Error("Fold not legal");
      player.status = "folded";
      player.hasActed = true;
      emitAct(next.events, player, "fold", 0);
      break;
    }
    case "check": {
      if (!legal.check) throw new Error("Check not legal");
      player.hasActed = true;
      emitAct(next.events, player, "check", 0);
      break;
    }
    case "call": {
      if (!legal.call) throw new Error("Call not legal");
      const paid = commit(next, player, legal.call.amount);
      player.hasActed = true;
      emitAct(
        next.events,
        player,
        player.status === "allIn" ? "all-in" : "call",
        paid,
      );
      break;
    }
    case "bet": {
      if (!legal.bet) throw new Error("Bet not legal");
      const to = action.amount;
      if (to < legal.bet.min || to > legal.bet.max) {
        throw new Error("Bet amount out of range");
      }
      const paid = commit(next, player, to - player.betStreet);
      next.lastRaiseSize = player.betStreet - next.currentBet;
      next.currentBet = player.betStreet;
      next.lastAggressorIndex = next.actingIndex;
      // reopen action
      for (const p of next.players) {
        if (p.id !== player.id && canAct(p)) p.hasActed = false;
      }
      player.hasActed = true;
      emitAct(
        next.events,
        player,
        player.status === "allIn" ? "all-in" : "bet",
        paid,
      );
      break;
    }
    case "raise": {
      if (!legal.raise) throw new Error("Raise not legal");
      const to = action.amount;
      if (to < legal.raise.min - 0 || to > legal.raise.max) {
        // allow short all-in below min
        if (!(to === legal.raise.max && to < legal.raise.min)) {
          if (to < legal.raise.min || to > legal.raise.max) {
            throw new Error("Raise amount out of range");
          }
        }
      }
      const prevBet = next.currentBet;
      const paid = commit(next, player, to - player.betStreet);
      const raiseSize = player.betStreet - prevBet;
      const isFullRaise = raiseSize >= next.lastRaiseSize;
      if (isFullRaise) {
        next.lastRaiseSize = raiseSize;
        for (const p of next.players) {
          if (p.id !== player.id && canAct(p)) p.hasActed = false;
        }
      } else {
        // short all-in: does not reopen for players who already acted
        for (const p of next.players) {
          if (
            p.id !== player.id &&
            canAct(p) &&
            !p.hasActed
          ) {
            // still need to act if not matched
          }
        }
      }
      next.currentBet = Math.max(next.currentBet, player.betStreet);
      next.lastAggressorIndex = next.actingIndex;
      player.hasActed = true;
      emitAct(
        next.events,
        player,
        player.status === "allIn" ? "all-in" : "raise",
        paid,
      );
      break;
    }
  }

  const advanced = advanceAfterAction(next);
  return {
    state: advanced,
    events: advanced.events.slice(eventStart),
  };
}

export function getPlayerView(state: GameState, playerId: string): PlayerView {
  const {
    deck: _deck,
    players: _players,
    ...rest
  } = state;
  return {
    ...rest,
    heroId: playerId,
    players: state.players.map((p) => ({
      ...p,
      holeCards:
        p.id === playerId || state.street === "showdown" || state.handOver
          ? [...p.holeCards]
          : null,
    })),
  };
}

// helper export for tests
export function totalChips(state: GameState): number {
  return state.players.reduce((s, p) => s + p.stack, 0) + 
    // chips in pot are already taken from stacks; during hand pot holds them
    (state.handOver ? 0 : 0);
}

export function chipsInPlay(state: GameState): number {
  return state.players.reduce((s, p) => s + p.stack, 0) + 
    (state.handOver ? 0 : state.players.reduce((s, p) => s + 0, 0));
}

/** Sum of stacks; during a hand the pot is already deducted from stacks. */
export function sumStacks(state: GameState): number {
  return state.players.reduce((sum, p) => sum + p.stack, 0);
}

void seatsInHand;
