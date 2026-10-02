"use client";

import { useMemo } from "react";
import type { ProfileId } from "@/content/playerProfiles";
import {
  advise,
  buildOpponentModels,
  computeEquityVsRanges,
  estimateRangeForOpponent,
  formatAdviceBlock,
  ratesFromStats,
  type CoachAdvice,
  type PositionBucket,
  type PreflopAction,
} from "@/coach";
import { createRng } from "@/lib/rng";
import { useGameStore } from "@/store";
import { formatPercent } from "@/lib/format";
import { ui } from "@/content/wording";
import { cn } from "@/lib/utils";
import { getLegalActions } from "@/engine";

function positionForSeat(
  seat: number,
  buttonSeat: number,
  playerCount: number,
): PositionBucket {
  const rel = (seat - buttonSeat + playerCount) % playerCount;
  if (rel === 0) return "late";
  if (rel === 1 || rel === 2) return "blinds";
  if (rel <= Math.ceil(playerCount / 2)) return "early";
  if (rel >= playerCount - 2) return "late";
  return "middle";
}

function lastPreflopAction(
  events: { type: string; playerId?: string; action?: string }[],
  playerId: string,
): PreflopAction {
  let street: "preflop" | "post" = "preflop";
  let last: PreflopAction = "unknown";
  for (const ev of events) {
    if (ev.type === "HAND_STARTED") {
      street = "preflop";
      last = "unknown";
    } else if (ev.type === "STREET_DEALT") {
      street = "post";
    } else if (
      street === "preflop" &&
      ev.type === "PLAYER_ACTED" &&
      ev.playerId === playerId
    ) {
      if (ev.action === "fold") last = "fold";
      else if (ev.action === "raise" || ev.action === "bet") last = "raise";
      else if (ev.action === "call") last = "call";
    }
  }
  return last;
}

function lastPostAction(
  events: { type: string; playerId?: string; action?: string }[],
  playerId: string,
): "check" | "bet" | "raise" | "call" | "fold" | undefined {
  let last: "check" | "bet" | "raise" | "call" | "fold" | undefined;
  let post = false;
  for (const ev of events) {
    if (ev.type === "STREET_DEALT") post = true;
    if (ev.type === "HAND_STARTED") {
      post = false;
      last = undefined;
    }
    if (post && ev.type === "PLAYER_ACTED" && ev.playerId === playerId) {
      if (
        ev.action === "check" ||
        ev.action === "bet" ||
        ev.action === "raise" ||
        ev.action === "call" ||
        ev.action === "fold"
      ) {
        last = ev.action;
      }
    }
  }
  return last;
}

type Props = {
  equityVsRandom: number;
  toCall: number;
  pot: number;
  outsCount: number;
};

export function CoachPanel({
  equityVsRandom,
  toCall,
  pot,
  outsCount,
}: Props) {
  const gameState = useGameStore((s) => s.gameState);
  const events = useGameStore((s) => s.events);
  const heroId = useGameStore((s) => s.heroId);
  const botConfigs = useGameStore((s) => s.botConfigs);
  const botSetup = useGameStore((s) => s.botSetup);
  const gameSeed = useGameStore((s) => s.gameSeed);

  const result = useMemo(() => {
    if (!gameState) return null;
    const hero = gameState.players.find((p) => p.id === heroId);
    if (!hero || hero.holeCards.length < 2) return null;

    const opponents = gameState.players.filter(
      (p) => p.id !== heroId && p.status !== "folded",
    );
    if (opponents.length === 0) return null;

    const revealed: Record<string, ProfileId | null> = {};
    if (botSetup.revealBotProfiles) {
      for (const p of opponents) {
        const style = botConfigs[p.id]?.style;
        revealed[p.id] = (style as ProfileId) ?? null;
      }
    }

    const models = buildOpponentModels(
      events,
      opponents.map((p) => p.id),
      revealed,
    );

    const dead = [...hero.holeCards, ...gameState.board];
    const ranges = opponents.map((p) => {
      const model = models[p.id]!;
      return estimateRangeForOpponent({
        model,
        position: positionForSeat(
          p.seat,
          gameState.buttonSeat,
          gameState.players.length,
        ),
        preflopAction: lastPreflopAction(events, p.id),
        street: gameState.street,
        board: gameState.board,
        deadCards: dead,
        lastPostflopAction: lastPostAction(events, p.id),
      });
    });

    const rng = createRng((gameSeed ?? 1) ^ (gameState.handNumber * 9973));
    const vsRange = computeEquityVsRanges({
      hero: hero.holeCards,
      board: gameState.board,
      ranges,
      iterations: 800,
      rng,
    });

    const legal = getLegalActions(gameState, heroId);
    const villain = opponents[0] ? models[opponents[0].id]! : null;
    const rates = villain ? ratesFromStats(villain.stats) : null;

    const actingSeat =
      gameState.actingIndex != null
        ? gameState.players[gameState.actingIndex]?.seat
        : hero.seat;
    const inPosition =
      actingSeat != null &&
      (() => {
        // Hero acts after villain if closer to button going forward… simplify: button is IP postflop
        return hero.seat === gameState.buttonSeat;
      })();

    const advice: CoachAdvice = advise({
      equityVsRange: vsRange.equity,
      equityVsRandom,
      toCall,
      pot,
      heroStack: hero.stack,
      canCheck: Boolean(legal.check),
      minBet: legal.bet?.min ?? legal.raise?.min ?? gameState.config.bigBlind,
      minRaiseTo:
        legal.raise?.min ?? (legal.bet?.min ?? gameState.config.bigBlind),
      maxBet: hero.stack + hero.betStreet,
      heroCards: hero.holeCards,
      board: gameState.board,
      street: gameState.street,
      inPosition,
      opponentsInHand: opponents.length,
      outsCount,
      villain,
      villainName: opponents[0]?.name,
      villainVpip: rates?.vpip,
      villainHands: villain?.stats.handsDealt,
    });

    return {
      advice,
      equityVsRange: vsRange.equity,
      equityVsRandom,
    };
  }, [
    gameState,
    events,
    heroId,
    botConfigs,
    botSetup.revealBotProfiles,
    gameSeed,
    equityVsRandom,
    toCall,
    pot,
    outsCount,
  ]);

  if (!result) {
    return (
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-text">{ui.coachTitle}</h2>
        <p className="text-sm text-text-muted">{ui.oddsIdle}</p>
      </div>
    );
  }

  const level =
    result.advice.confidence === "sure"
      ? "good"
      : result.advice.confidence === "leaning"
        ? "careful"
        : "bad";

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-text">{ui.coachTitle}</h2>
      <p className="text-xs text-text-muted">
        {formatPercent(result.equityVsRange, 0)} contre ses mains probables,{" "}
        {formatPercent(result.equityVsRandom, 0)} contre une main au hasard
      </p>
      <div
        className={cn(
          "rounded-lg border border-border p-3 text-sm",
          level === "good" && "bg-success/15 text-text",
          level === "careful" && "bg-warning/15 text-text",
          level === "bad" && "bg-danger/15 text-text",
        )}
      >
        <p className="font-medium">{result.advice.headline}</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs opacity-90">
          {result.advice.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        {result.advice.trap && (
          <p className="mt-2 text-xs font-medium">
            Piège : {result.advice.trap}
          </p>
        )}
      </div>
      <p className="sr-only">{formatAdviceBlock(result.advice)}</p>
    </div>
  );
}
