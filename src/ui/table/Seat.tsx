"use client";

import { useEffect, useState } from "react";
import type { Card, PlayerState } from "@/engine";
import { PlayingCard } from "@/ui/cards/PlayingCard";
import { AnimatedChips } from "@/ui/cards/AnimatedChips";
import { TermInline } from "@/ui/primitives/Term";
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
  isButton: boolean;
  isSB: boolean;
  isBB: boolean;
  showCards: boolean;
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
  isButton,
  isSB,
  isBB,
  showCards,
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
  }, [visualState, winnerAmount, player.id]);

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

  return (
    <div className="relative flex flex-col items-center">
      <AnimatePresence>
        {actionBubble && (
          <motion.div
            key={actionBubble + String(actionBubbleFresh)}
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

      <motion.div
        animate={
          acting && !reduce
            ? {
                boxShadow: [
                  "0 0 0 0 var(--seat-acting-glow)",
                  "0 0 0 10px transparent",
                ],
              }
            : winner && !reduce
              ? {
                  boxShadow: [
                    "0 0 0 0 var(--seat-winner-halo)",
                    "0 0 24px 4px var(--seat-winner-halo)",
                    "0 0 0 0 var(--seat-winner-halo)",
                  ],
                }
              : undefined
        }
        transition={
          acting && !reduce
            ? { repeat: Infinity, duration: 1.35, ease: "easeInOut" }
            : winner && !reduce
              ? { duration: 1.2, repeat: 1 }
              : undefined
        }
        className={cn(
          "flex min-w-[7.5rem] flex-col items-center gap-1 rounded-xl bg-surface-2/90 px-3 py-2 text-center shadow-card transition-[filter,opacity]",
          acting && "ring-2",
          allIn && "ring-2",
          winner && "ring-2",
          folded && "grayscale",
          eliminated && "grayscale",
        )}
        style={{
          opacity: eliminated
            ? "var(--seat-eliminated-opacity)"
            : folded
              ? "var(--seat-folded-opacity)"
              : 1,
          ...(acting
            ? { ["--tw-ring-color" as string]: "var(--seat-acting-ring)" }
            : {}),
          ...(allIn && !acting
            ? { ["--tw-ring-color" as string]: "var(--seat-badge-allin)" }
            : {}),
          ...(winner
            ? { ["--tw-ring-color" as string]: "var(--seat-acting-ring)" }
            : {}),
        }}
      >
        <div className="flex flex-wrap items-center justify-center gap-1 text-[10px]">
          {isButton && (
            <span className="rounded bg-gold px-1 font-bold text-surface">
              <TermInline id="button">D</TermInline>
            </span>
          )}
          {isSB && (
            <span className="rounded bg-surface px-1 text-text-muted">
              <TermInline id="smallBlind">SB</TermInline>
            </span>
          )}
          {isBB && (
            <span className="rounded bg-surface px-1 text-text-muted">
              <TermInline id="bigBlind">BB</TermInline>
            </span>
          )}
          {folded && (
            <span
              className="rounded px-1.5 py-0.5 font-semibold uppercase tracking-wide text-text"
              style={{ background: "var(--seat-badge-folded)" }}
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
            <span className="rounded bg-surface px-1.5 py-0.5 font-semibold text-text-muted">
              {ui.labelEliminated}
            </span>
          )}
          {acting && (
            <span
              className="rounded px-1.5 py-0.5 font-semibold text-surface"
              style={{ background: "var(--seat-badge-turn)" }}
            >
              {turnLabel}
            </span>
          )}
        </div>

        {acting && (
          <div className="h-1 w-full overflow-hidden rounded-full bg-surface">
            <motion.div
              className="h-full origin-left rounded-full"
              style={{ background: "var(--seat-timer)" }}
              initial={reduce ? { scaleX: 1 } : { scaleX: 1 }}
              animate={reduce ? { scaleX: 1 } : { scaleX: 0 }}
              transition={
                reduce ? { duration: 0 } : { duration: 1.2, ease: "linear", repeat: Infinity }
              }
            />
          </div>
        )}

        <div className="text-sm font-medium text-text">
          {player.name}
          {isHero ? ui.youSuffix : ""}
        </div>
        {styleText && difficulty && (
          <div className="text-[10px] text-text-muted">
            {ui.styleLabel(styleText, difficulty)}
          </div>
        )}
        <AnimatedChips
          value={player.stack}
          className="text-lg font-semibold text-gold"
        />

        <div className="relative mt-1 flex h-14 items-center justify-center gap-1">
          <AnimatePresence mode="popLayout">
            {!folded &&
              !eliminated &&
              (showCards ? player.holeCards : [null, null]).map((card, i) => (
                <motion.div
                  key={`card-${player.id}-${i}`}
                  initial={false}
                  exit={
                    reduce
                      ? { opacity: 0 }
                      : {
                          opacity: 0,
                          x: (1 - 2 * i) * 8,
                          y: -40,
                          scale: 0.4,
                        }
                  }
                  transition={{ duration: 0.35 }}
                >
                  <PlayingCard
                    card={(card as Card | null) ?? null}
                    faceDown={!showCards}
                  />
                </motion.div>
              ))}
          </AnimatePresence>
        </div>

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
      </motion.div>
    </div>
  );
}
