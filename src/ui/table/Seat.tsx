"use client";

import { useEffect, useState } from "react";
import type { Card, PlayerState } from "@/engine";
import { PlayingCard, cardKey } from "@/ui/cards/PlayingCard";
import { AnimatedChips } from "@/ui/cards/AnimatedChips";
import { ui, primaryLabel, terms, styleWordingKey } from "@/content/wording";
import { useVocab } from "@/ui/hooks/useVocab";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export type SeatVisualState =
  | "active"
  | "acting"
  | "folded"
  | "allIn"
  | "eliminated"
  | "winner";

type Props = {
  player: PlayerState;
  isHero: boolean;
  visualState: SeatVisualState;
  showCards: boolean;
  handId: number;
  styleCode?: string;
  difficulty?: string;
  actionBubble?: string | null;
  actionBubbleFresh?: boolean;
  winnerAmount?: number | null;
};

export function Seat({
  player,
  isHero,
  visualState,
  showCards,
  handId,
  styleCode,
  difficulty,
  actionBubble,
  actionBubbleFresh = false,
  winnerAmount,
}: Props) {
  const reduce = useReducedMotion();
  const { mode } = useVocab();
  const [showWinner, setShowWinner] = useState(false);

  useEffect(() => {
    if (visualState === "winner" && winnerAmount != null) {
      setShowWinner(true);
      const t = window.setTimeout(() => setShowWinner(false), 2000);
      return () => clearTimeout(t);
    }
    setShowWinner(false);
  }, [visualState, winnerAmount, player.id, handId]);

  const folded = visualState === "folded";
  const eliminated = visualState === "eliminated";
  const acting = visualState === "acting";
  const allIn = visualState === "allIn";
  const winner = visualState === "winner" || showWinner;

  const styleKey = styleCode ? styleWordingKey(styleCode) : null;
  const styleText = styleKey
    ? primaryLabel(terms[styleKey], mode)
    : styleCode;

  const turnLabel = isHero ? ui.labelYourTurn : ui.labelTheirTurn;

  const bg = eliminated
    ? "var(--seat-eliminated-bg)"
    : folded
      ? "var(--seat-folded-bg)"
      : "var(--seat-active-bg)";
  const fg = eliminated
    ? "var(--seat-eliminated-text)"
    : folded
      ? "var(--seat-folded-text)"
      : "var(--seat-active-text)";

  const showSeatCards = !isHero && !folded && !eliminated;
  const revealed = showCards && player.holeCards.length > 0;
  const slots: (Card | null)[] = showSeatCards
    ? revealed
      ? player.holeCards
      : [null, null]
    : [];

  const showActionInPlate = Boolean(actionBubble && actionBubbleFresh);
  const metaLine = showActionInPlate
    ? actionBubble
    : styleText && difficulty
      ? ui.styleLabel(styleText, difficulty)
      : isHero
        ? ui.youMarker
        : null;

  return (
    <div className="relative flex w-[7.25rem] flex-col items-center">
      {acting && (
        <span
          className="absolute -top-2.5 z-20 rounded-full px-2 py-0.5 text-[10px] font-bold text-surface shadow-card"
          style={{ background: "var(--seat-badge-turn)" }}
        >
          {turnLabel}
        </span>
      )}

      {showSeatCards && (
        <div
          key={`cards-${handId}-${player.id}`}
          className="relative z-0 mb-[-10px] flex items-end justify-center gap-0.5"
          style={{ minHeight: revealed ? 36 : 22 }}
        >
          <AnimatePresence mode="popLayout">
            {slots.map((card, i) => {
              const faceDown = !revealed;
              const ck = cardKey(card, faceDown);
              return (
                <motion.div
                  key={`${handId}-${player.id}-${ck}-${i}`}
                  initial={reduce ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    reduce ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.6 }
                  }
                  transition={{ duration: 0.2 }}
                  className="relative"
                  style={{ zIndex: i }}
                >
                  <PlayingCard
                    card={card}
                    faceDown={faceDown}
                    size={revealed ? "sm" : "xs"}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <div
        className="relative z-10 flex w-full flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-center shadow-card"
        style={{
          background: bg,
          color: fg,
          opacity: eliminated
            ? "var(--seat-eliminated-opacity)"
            : folded
              ? "var(--seat-folded-opacity)"
              : 1,
          borderWidth: acting ? 2 : 1,
          borderStyle: "solid",
          borderColor: acting
            ? "var(--seat-acting-ring)"
            : isHero
              ? "var(--seat-hero-rim)"
              : "var(--seat-idle-border)",
          boxShadow: acting
            ? "0 0 0 2px var(--seat-acting-glow), var(--shadow-seat)"
            : winner
              ? "0 0 14px 2px var(--seat-winner-halo)"
              : "var(--shadow-seat)",
          filter: folded || eliminated ? "grayscale(0.35)" : undefined,
        }}
      >
        <div className="flex flex-wrap items-center justify-center gap-1 text-[9px]">
          {folded && (
            <span
              className="rounded px-1 font-semibold uppercase tracking-wide"
              style={{
                background: "var(--seat-badge-folded)",
                color: "var(--seat-active-text)",
              }}
            >
              {ui.labelFolded}
            </span>
          )}
          {allIn && !folded && (
            <span
              className="rounded px-1 font-bold tracking-wide text-surface"
              style={{ background: "var(--seat-badge-allin)" }}
            >
              {ui.labelAllIn}
            </span>
          )}
          {eliminated && (
            <span className="rounded bg-surface/30 px-1 font-semibold">
              {ui.labelEliminated}
            </span>
          )}
        </div>

        <div className="flex w-full min-w-0 items-baseline justify-center gap-1">
          <span className="truncate text-xs font-semibold leading-tight">
            {isHero ? ui.youMarker : player.name}
          </span>
        </div>

        <div
          className={cn(
            "min-h-[14px] w-full truncate text-[10px] leading-tight",
            showActionInPlate ? "font-semibold" : "opacity-70",
          )}
          style={
            showActionInPlate
              ? {
                  color: "var(--seat-action-bubble-text)",
                }
              : undefined
          }
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={showActionInPlate ? `act-${actionBubble}` : `meta-${metaLine}`}
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="block truncate"
            >
              {metaLine}
            </motion.span>
          </AnimatePresence>
        </div>

        <AnimatedChips
          value={player.stack}
          className="text-base font-bold tabular-nums text-gold"
        />

        <AnimatePresence>
          {showWinner && winnerAmount != null && (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute -bottom-6 rounded-full bg-gold px-2 py-0.5 text-[10px] font-semibold text-surface shadow-card"
            >
              {ui.winsAmount(
                new Intl.NumberFormat("fr-FR").format(winnerAmount),
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
