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

  // Hero cards live in the action bar — bots keep mini cards in the seat.
  const showSeatCards = !isHero && !folded && !eliminated;
  const revealed = showCards && player.holeCards.length > 0;
  const slots: (Card | null)[] = showSeatCards
    ? revealed
      ? player.holeCards
      : [null, null]
    : [];

  return (
    <div className="relative flex flex-col items-center">
      <AnimatePresence>
        {actionBubble && (
          <motion.div
            key={`${handId}-${actionBubble}-${actionBubbleFresh}`}
            initial={reduce ? false : { opacity: 0, y: 6, scale: 0.9 }}
            animate={{
              opacity: actionBubbleFresh ? 1 : 0.75,
              y: 0,
              scale: actionBubbleFresh ? 1 : 0.92,
            }}
            exit={reduce ? undefined : { opacity: 0, y: -4 }}
            className={cn(
              "absolute -top-8 z-20 max-w-[9rem] truncate rounded-full px-2.5 py-0.5 text-center text-xs font-medium shadow-card",
              actionBubbleFresh ? "text-sm" : "text-[11px]",
            )}
            style={{
              background: "var(--seat-action-bubble-bg)",
              color: "var(--seat-action-bubble-text)",
            }}
          >
            {actionBubble}
          </motion.div>
        )}
      </AnimatePresence>

      {acting && (
        <span
          className="absolute -top-3 z-10 rounded-full px-2 py-0.5 text-[10px] font-bold text-surface shadow-card"
          style={{ background: "var(--seat-badge-turn)" }}
        >
          {turnLabel}
        </span>
      )}

      <div
        className="relative flex min-w-[7.5rem] flex-col items-center gap-1 rounded-xl px-3 py-2 text-center shadow-card"
        style={{
          background: bg,
          color: fg,
          opacity: eliminated
            ? "var(--seat-eliminated-opacity)"
            : folded
              ? "var(--seat-folded-opacity)"
              : 1,
          borderWidth: acting ? 3 : 1,
          borderStyle: "solid",
          borderColor: acting
            ? "var(--seat-acting-ring)"
            : isHero
              ? "var(--seat-hero-rim)"
              : "var(--seat-idle-border)",
          boxShadow: acting
            ? "0 0 0 3px var(--seat-acting-glow), var(--shadow-seat)"
            : winner
              ? "0 0 18px 2px var(--seat-winner-halo)"
              : "var(--shadow-seat)",
          filter: folded || eliminated ? "grayscale(0.35)" : undefined,
        }}
      >
        <div className="flex flex-wrap items-center justify-center gap-1 text-[10px]">
          {folded && (
            <span
              className="rounded px-1.5 py-0.5 font-semibold uppercase tracking-wide"
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
              className="rounded px-1.5 py-0.5 font-bold tracking-wide text-surface"
              style={{ background: "var(--seat-badge-allin)" }}
            >
              {ui.labelAllIn}
            </span>
          )}
          {eliminated && (
            <span className="rounded bg-surface/30 px-1.5 py-0.5 font-semibold">
              {ui.labelEliminated}
            </span>
          )}
        </div>

        <div className="text-sm font-medium">{player.name}</div>
        {isHero && (
          <div
            className="text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: "var(--seat-hero-rim)" }}
          >
            {ui.youMarker}
          </div>
        )}
        {styleText && difficulty && (
          <div className="text-[10px] opacity-70">
            {ui.styleLabel(styleText, difficulty)}
          </div>
        )}
        <AnimatedChips
          value={player.stack}
          className="text-lg font-semibold text-gold"
        />

        {showSeatCards && (
          <div
            key={`cards-${handId}-${player.id}`}
            className="relative mt-1 flex items-center justify-center gap-1"
            style={{ minHeight: revealed ? 46 : 26 }}
          >
            <AnimatePresence mode="popLayout">
              {slots.map((card, i) => {
                const faceDown = !revealed;
                const ck = cardKey(card, faceDown);
                return (
                  <motion.div
                    key={`${handId}-${player.id}-${ck}-${i}`}
                    initial={reduce ? false : { opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, y: -20, scale: 0.5 }}
                    transition={{ duration: 0.25 }}
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

        <AnimatePresence>
          {showWinner && winnerAmount != null && (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute -bottom-7 rounded-full bg-gold px-2.5 py-0.5 text-xs font-semibold text-surface shadow-card"
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
