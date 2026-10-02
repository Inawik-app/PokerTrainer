import type { Card } from "./cards";

export type Street = "preflop" | "flop" | "turn" | "river" | "showdown";

export type PlayerActionType =
  | "fold"
  | "check"
  | "call"
  | "bet"
  | "raise"
  | "all-in";

export type GameEvent =
  | { type: "HAND_STARTED"; handNumber: number; buttonSeat: number }
  | {
      type: "BLINDS_POSTED";
      smallBlindId: string;
      bigBlindId: string;
      smallBlind: number;
      bigBlind: number;
    }
  | {
      type: "CARDS_DEALT";
      playerId: string;
      cardCount: number;
    }
  | {
      type: "PLAYER_ACTED";
      playerId: string;
      action: PlayerActionType;
      amount: number;
      totalBet: number;
    }
  | {
      type: "STREET_DEALT";
      street: Exclude<Street, "preflop" | "showdown">;
      cards: Card[];
    }
  | { type: "SHOWDOWN"; playerIds: string[] }
  | {
      type: "POT_AWARDED";
      potIndex: number;
      winners: string[];
      amount: number;
      handLabel?: string;
    }
  | { type: "HAND_ENDED"; handNumber: number };
