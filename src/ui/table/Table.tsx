"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { computePots, evaluateHand, type GameEvent } from "@/engine";
import { useGameStore } from "@/store";
import { Board } from "./Board";
import { Pot } from "./Pot";
import { Seat, type SeatVisualState } from "./Seat";
import { SeatBotCards } from "./SeatBotCards";
import { TableBet } from "./TableBet";
import { TableMarker } from "./TableMarker";
import {
  getSeatLayout,
  markerBoxForCount,
  rectStyle,
} from "./seatLayout";
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

  const centerStyle = rectStyle(layout.center);

  return (
    <LayoutGroup id="table-markers">
      <div
        className="relative mx-auto h-full w-full max-h-full"
        style={{ aspectRatio: "2 / 1", maxWidth: "min(100%, 1100px)" }}
      >
        <div
          className="absolute inset-[4%] border-8 shadow-card"
          style={{
            borderColor: "var(--table-rail)",
            background: "var(--felt-texture)",
            borderRadius: "var(--table-stadium-radius)",
          }}
        />

        <div
          className="absolute z-[5] flex flex-col items-center justify-center gap-1.5 overflow-hidden"
          style={centerStyle}
        >
          {handName && (
            <p className="text-center text-[11px] font-medium text-text-muted">
              {ui.yourHand(handName)}
            </p>
          )}
          <Board cards={gameState.board} handId={gameState.handNumber} />
          <Pot
            amount={gameState.pot}
            pots={sidePots.length > 0 ? sidePots : undefined}
          />
          <p className="text-center text-[11px] text-text-muted">
            {streetLabel(gameState.street, mode)}
            <span className="mx-1.5 opacity-40">·</span>
            {ui.playersInHand(inHandCount)}
          </p>
        </div>

        {ordered.map((player, i) => {
          const slot = layout.seats[i]!;
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
          const isHero = player.id === heroId;
          const showBotCards =
            !isHero &&
            visualState !== "folded" &&
            visualState !== "eliminated";
          const revealed =
            faceUp &&
            player.holeCards.length > 0 &&
            visualState !== "folded" &&
            visualState !== "eliminated";

          const markerCount =
            (isBtn ? 1 : 0) + (isSB ? 1 : 0) + (isBB ? 1 : 0);
          const markerRect =
            markerCount > 0
              ? markerBoxForCount(
                  slot.plate,
                  markerCount >= 2 ? 2 : 1,
                  slot.bet,
                )
              : null;

          return (
            <div key={player.id}>
              {showBotCards && slot.cards && (
                <div
                  className="absolute z-[7] overflow-visible"
                  style={rectStyle(slot.cards)}
                >
                  <SeatBotCards
                    cards={
                      revealed
                        ? player.holeCards
                        : [null, null]
                    }
                    revealed={revealed}
                    handId={gameState.handNumber}
                    playerId={player.id}
                  />
                </div>
              )}

              <div
                className="absolute z-[8]"
                style={rectStyle(slot.plate)}
              >
                <Seat
                  player={player}
                  isHero={isHero}
                  visualState={visualState}
                  handId={gameState.handNumber}
                  styleCode={cfg?.style}
                  difficulty={cfg?.difficulty}
                  actionBubble={bubble}
                  actionBubbleFresh={fresh}
                  winnerAmount={winnerPayouts[player.id] ?? null}
                />
              </div>

              {markerRect && markerCount > 0 && (
                <div
                  className="absolute z-[9] flex items-end justify-start gap-0.5"
                  style={rectStyle(markerRect)}
                >
                  {isBtn && <TableMarker kind="dealer" />}
                  {isSB && (
                    <TableMarker kind="sb" amount={sbAmount} />
                  )}
                  {isBB && (
                    <TableMarker kind="bb" amount={bbAmount} />
                  )}
                </div>
              )}

              <AnimatePresence>
                {player.betStreet > 0 && visualState !== "eliminated" && (
                  <motion.div
                    key={`bet-${player.id}-${player.betStreet}`}
                    className="absolute z-[6]"
                    style={rectStyle(slot.bet)}
                    initial={
                      reduce ? false : { opacity: 0, scale: 0.85 }
                    }
                    animate={{ opacity: 1, scale: 1 }}
                    exit={
                      reduce ? undefined : { opacity: 0, scale: 0.6 }
                    }
                    transition={{ type: "spring", stiffness: 320, damping: 26 }}
                  >
                    <TableBet amount={player.betStreet} />
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
