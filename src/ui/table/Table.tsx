"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "framer-motion";
import { computePots, evaluateHand, type GameEvent } from "@/engine";
import { useGameStore } from "@/store";
import { Board } from "./Board";
import { Pot } from "./Pot";
import { Seat, type SeatVisualState } from "./Seat";
import { TableMarker } from "./TableMarker";
import { getSeatLayout, pct } from "./seatLayout";
import { ChipStack } from "@/ui/cards/ChipStack";
import { formatAction, formatChips, streetLabel } from "@/lib/format";
import { ui } from "@/content/wording";
import { useVocab } from "@/ui/hooks/useVocab";
import type { PlayerState, GameState, Card } from "@/engine";

const RANK_FR_PLURAL: Record<string, string> = {
  "2": "Deux",
  "3": "Trois",
  "4": "Quatre",
  "5": "Cinq",
  "6": "Six",
  "7": "Sept",
  "8": "Huit",
  "9": "Neuf",
  T: "Dix",
  J: "Valets",
  Q: "Dames",
  K: "Rois",
  A: "As",
};

function pocketLabel(hole: Card[]): string | null {
  if (hole.length < 2) return null;
  if (hole[0]!.rank === hole[1]!.rank) {
    return `Paire de ${RANK_FR_PLURAL[hole[0]!.rank] ?? hole[0]!.rank}`;
  }
  return null;
}

function heroHandLabel(hole: Card[], board: Card[]): string | null {
  if (hole.length < 2) return null;
  if (board.length >= 3) return evaluateHand([...hole, ...board]).labelFr;
  return pocketLabel(hole);
}

function actionsForCurrentHand(
  events: GameEvent[],
  heroId: string,
): Record<string, string> {
  const text: Record<string, string> = {};
  let start = 0;
  for (let i = 0; i < events.length; i += 1) {
    if (events[i]!.type === "HAND_STARTED") start = i;
  }
  for (let i = start; i < events.length; i += 1) {
    const e = events[i]!;
    if (e.type === "PLAYER_ACTED") {
      text[e.playerId] = formatAction(e.action, e.amount, {
        isHero: e.playerId === heroId,
      });
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

  const actionText = useMemo(
    () => actionsForCurrentHand(events, heroId),
    [events, heroId],
  );
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
  const layout = getSeatLayout(ordered.length);

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
  const sbAmount = gameState.config.smallBlind;
  const bbAmount = gameState.config.bigBlind;

  const hero = players.find((p) => p.id === heroId);
  const handName =
    hero && hero.holeCards.length === 2
      ? heroHandLabel(hero.holeCards, gameState.board)
      : null;

  return (
    <LayoutGroup id="table-markers">
      <div
        className="relative mx-auto h-full w-full max-h-full"
        style={{ aspectRatio: "2 / 1", maxWidth: "min(100%, 1100px)" }}
      >
        {/* Stadium felt */}
        <div
          className="absolute inset-[4%] border-8 shadow-card"
          style={{
            borderColor: "var(--table-rail)",
            background: "var(--felt-texture)",
            borderRadius: "var(--table-stadium-radius)",
          }}
        />

        {/* Center column */}
        <div className="absolute left-1/2 top-[18%] z-[5] flex w-[70%] max-w-lg -translate-x-1/2 flex-col items-center gap-1.5">
          {handName && (
            <p className="text-[11px] font-medium text-text-muted">
              {ui.yourHand(handName)}
            </p>
          )}
          <Board cards={gameState.board} handId={gameState.handNumber} />
          <Pot
            amount={gameState.pot}
            pots={sidePots.length > 0 ? sidePots : undefined}
          />
          <p className="text-[11px] text-text-muted">
            {streetLabel(gameState.street, mode)}
            <span className="mx-1.5 opacity-40">·</span>
            {ui.playersInHand(inHandCount)}
          </p>
        </div>

        {ordered.map((player, i) => {
          const slot = layout[i]!;
          const seatPos = pct(slot.seat);
          const betPos = pct(slot.bet);
          const markPos = pct(slot.marker);
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
          const isBtn = player.seat === gameState.buttonSeat;
          const isSB = player.seat === sbSeat;
          const isBB = player.seat === bbSeat;

          return (
            <div key={player.id}>
              <div
                className="absolute z-[8] -translate-x-1/2 -translate-y-1/2"
                style={{ left: seatPos.left, top: seatPos.top }}
              >
                <Seat
                  player={player}
                  isHero={player.id === heroId}
                  visualState={visualState}
                  handId={gameState.handNumber}
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

              {(isBtn || isSB || isBB) && (
                <div
                  className="absolute z-[9] -translate-x-1/2 -translate-y-1/2"
                  style={{ left: markPos.left, top: markPos.top }}
                >
                  <div className="flex items-center gap-0.5">
                    {isBtn && <TableMarker kind="dealer" />}
                    {isSB && <TableMarker kind="sb" amount={sbAmount} />}
                    {isBB && <TableMarker kind="bb" amount={bbAmount} />}
                  </div>
                </div>
              )}

              <AnimatePresence>
                {player.betStreet > 0 && visualState !== "eliminated" && (
                  <motion.div
                    key={`bet-${player.id}-${player.betStreet}`}
                    className="absolute z-[7] -translate-x-1/2 -translate-y-1/2"
                    style={{ left: betPos.left, top: betPos.top }}
                    initial={
                      reduce
                        ? false
                        : {
                            left: seatPos.left,
                            top: seatPos.top,
                            opacity: 0,
                            scale: 0.6,
                          }
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
    </LayoutGroup>
  );
}
