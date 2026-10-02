"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { computePots, type GameEvent } from "@/engine";
import { useGameStore } from "@/store";
import { Board } from "./Board";
import { Pot } from "./Pot";
import { Seat, type SeatVisualState } from "./Seat";
import { ChipStack } from "@/ui/cards/ChipStack";
import { formatAction, formatChips, streetLabel } from "@/lib/format";
import { ui } from "@/content/wording";
import { useVocab } from "@/ui/hooks/useVocab";
import { TermInline } from "@/ui/primitives/Term";
import type { PlayerState, GameState } from "@/engine";

const POSITIONS: { left: string; top: string }[] = [
  { left: "50%", top: "88%" },
  { left: "12%", top: "70%" },
  { left: "12%", top: "28%" },
  { left: "50%", top: "10%" },
  { left: "88%", top: "28%" },
  { left: "88%", top: "70%" },
];

function betPosition(seat: { left: string; top: string }) {
  const lx = parseFloat(seat.left);
  const ty = parseFloat(seat.top);
  return {
    left: `${(lx + 50) / 2}%`,
    top: `${(ty + 50) / 2}%`,
  };
}

function actionsForCurrentHand(events: GameEvent[]): Record<string, string> {
  const text: Record<string, string> = {};
  let start = 0;
  for (let i = 0; i < events.length; i += 1) {
    if (events[i]!.type === "HAND_STARTED") start = i;
  }
  for (let i = start; i < events.length; i += 1) {
    const e = events[i]!;
    if (e.type === "PLAYER_ACTED") {
      text[e.playerId] = formatAction(e.action, e.amount);
    }
  }
  return text;
}

function resolveVisualState(
  player: PlayerState,
  gameState: GameState,
  actingId: string | null,
  winnerAmount: number | undefined,
): SeatVisualState {
  const eliminated =
    player.stack === 0 &&
    player.status !== "allIn" &&
    player.committed === 0 &&
    player.holeCards.length === 0;

  if (eliminated) return "eliminated";
  if (gameState.handOver && winnerAmount) return "winner";
  if (actingId === player.id && !gameState.handOver) return "acting";
  if (player.status === "folded") return "folded";
  if (player.status === "allIn") return "allIn";
  if (player.stack === 0) return "eliminated";
  return "active";
}

export function Table() {
  const gameState = useGameStore((s) => s.gameState);
  const heroId = useGameStore((s) => s.heroId);
  const botConfigs = useGameStore((s) => s.botConfigs);
  const events = useGameStore((s) => s.events);
  const reduce = useReducedMotion();
  const { mode } = useVocab();
  const [, setTick] = useState(0);

  const actionText = useMemo(() => actionsForCurrentHand(events), [events]);
  const prevAction = useRef<Record<string, string>>({});
  const freshUntil = useRef<Record<string, number>>({});

  useEffect(() => {
    const now = Date.now();
    for (const [id, text] of Object.entries(actionText)) {
      if (prevAction.current[id] !== text) {
        freshUntil.current[id] = now + 1500;
        prevAction.current[id] = text;
      }
    }
  }, [actionText]);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 400);
    return () => clearInterval(id);
  }, []);

  const sidePots = useMemo(() => {
    if (!gameState?.handOver) return [];
    const pots = computePots(
      gameState.players.map((p) => ({
        playerId: p.id,
        amount: p.committed,
        folded: p.status === "folded",
      })),
    );
    if (pots.length <= 1) return [];
    return pots.map((p, i) => ({
      amount: p.amount,
      label:
        i === 0
          ? ui.potLabel(formatChips(p.amount))
          : ui.sidePotLabel(i, formatChips(p.amount)),
    }));
  }, [gameState]);

  const winnerPayouts = useMemo(() => {
    const map: Record<string, number> = {};
    if (!gameState?.handOver) return map;
    for (const e of gameState.events) {
      if (e.type !== "POT_AWARDED") continue;
      const share = Math.floor(e.amount / Math.max(1, e.winners.length));
      for (const id of e.winners) {
        map[id] = (map[id] ?? 0) + share;
      }
    }
    return map;
  }, [gameState]);

  if (!gameState) return null;

  const players = gameState.players;
  const heroIndex = players.findIndex((p) => p.id === heroId);
  const ordered = players.map(
    (_, i) => players[(heroIndex + i) % players.length]!,
  );

  const funded = players.filter((p) => p.stack > 0 || p.committed > 0);
  const isHu = funded.length === 2;
  const sbSeat = isHu
    ? gameState.buttonSeat
    : (() => {
        const sorted = [...players].sort((a, b) => a.seat - b.seat);
        const bi = sorted.findIndex((p) => p.seat === gameState.buttonSeat);
        return sorted[(bi + 1) % sorted.length]!.seat;
      })();
  const bbSeat = (() => {
    const sorted = [...players].sort((a, b) => a.seat - b.seat);
    const si = sorted.findIndex((p) => p.seat === sbSeat);
    return sorted[(si + 1) % sorted.length]!.seat;
  })();

  const actingId =
    gameState.actingIndex !== null
      ? gameState.players[gameState.actingIndex]?.id ?? null
      : null;

  const inHandCount = players.filter((p) => p.status !== "folded").length;
  const now = Date.now();

  const streetTermId =
    gameState.street === "preflop"
      ? "preflop"
      : gameState.street === "flop"
        ? "flop"
        : gameState.street === "turn"
          ? "turn"
          : gameState.street === "river"
            ? "river"
            : "showdown";

  return (
    <div className="relative mx-auto aspect-[16/10] w-full max-w-4xl">
      <div
        className="absolute inset-[8%] rounded-[50%] border-8 shadow-card"
        style={{
          borderColor: "var(--table-rail)",
          background: "var(--felt-texture)",
        }}
      />
      <motion.div
        className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
        layout
      >
        <Pot
          amount={gameState.pot}
          pots={sidePots.length > 0 ? sidePots : undefined}
        />
        <p className="text-xs font-medium text-text-muted">
          {ui.playersInHand(inHandCount)}
        </p>
        <Board cards={gameState.board} />
        <div className="text-xs text-text-muted">
          <TermInline id={streetTermId}>
            {streetLabel(gameState.street, mode)}
          </TermInline>
        </div>
      </motion.div>

      {ordered.map((player, i) => {
        const pos = POSITIONS[i] ?? POSITIONS[0]!;
        const betPos = betPosition(pos);
        const faceUp =
          player.id === heroId ||
          gameState.street === "showdown" ||
          gameState.handOver;
        const cfg = botConfigs[player.id];
        const visualState = resolveVisualState(
          player,
          gameState,
          actingId,
          winnerPayouts[player.id],
        );
        const bubble = actionText[player.id] ?? null;
        const fresh = (freshUntil.current[player.id] ?? 0) > now;

        return (
          <div key={player.id}>
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: pos.left, top: pos.top }}
            >
              <Seat
                player={player}
                isHero={player.id === heroId}
                visualState={visualState}
                isButton={player.seat === gameState.buttonSeat}
                isSB={player.seat === sbSeat}
                isBB={player.seat === bbSeat}
                showCards={
                  faceUp &&
                  player.holeCards.length > 0 &&
                  visualState !== "folded" &&
                  visualState !== "eliminated"
                }
                styleCode={cfg?.style}
                difficulty={cfg?.difficulty}
                actionBubble={bubble}
                actionBubbleFresh={fresh}
                winnerAmount={winnerPayouts[player.id] ?? null}
              />
            </div>

            <AnimatePresence>
              {player.betStreet > 0 && visualState !== "eliminated" && (
                <motion.div
                  key={`bet-${player.id}-${player.betStreet}`}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: betPos.left, top: betPos.top }}
                  initial={
                    reduce
                      ? false
                      : { left: pos.left, top: pos.top, opacity: 0, scale: 0.6 }
                  }
                  animate={{
                    left: betPos.left,
                    top: betPos.top,
                    opacity: 1,
                    scale: 1,
                  }}
                  exit={
                    reduce
                      ? undefined
                      : { left: "50%", top: "50%", opacity: 0, scale: 0.5 }
                  }
                  transition={{ type: "spring", stiffness: 320, damping: 26 }}
                >
                  <ChipStack amount={player.betStreet} size="sm" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
