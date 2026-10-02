"use client";

import type { Card, PlayerState } from "@/engine";
import { PlayingCard } from "@/ui/cards/PlayingCard";
import { formatChips } from "@/lib/format";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";

type Props = {
  player: PlayerState;
  isHero: boolean;
  isActing: boolean;
  isButton: boolean;
  isSB: boolean;
  isBB: boolean;
  showCards: boolean;
  styleLabel?: string;
};

export function Seat({
  player,
  isHero,
  isActing,
  isButton,
  isSB,
  isBB,
  showCards,
  styleLabel,
}: Props) {
  const folded = player.status === "folded";
  const reduce = useReducedMotion();
  return (
    <motion.div
      animate={
        isActing && !reduce
          ? { boxShadow: ["0 0 0 0 var(--gold-soft)", "0 0 0 8px transparent"] }
          : undefined
      }
      transition={
        isActing && !reduce
          ? { repeat: Infinity, duration: 1.4, ease: "easeInOut" }
          : undefined
      }
      className={cn(
        "flex min-w-[7.5rem] flex-col items-center gap-1 rounded-xl bg-surface-2/90 px-3 py-2 text-center shadow-card",
        isActing && "ring-2 ring-gold",
        folded && "opacity-50",
      )}
    >
      <div className="flex items-center gap-1 text-xs text-text-muted">
        {isButton && (
          <span className="rounded bg-gold px-1 font-bold text-surface">D</span>
        )}
        {isSB && <span className="rounded bg-surface px-1">SB</span>}
        {isBB && <span className="rounded bg-surface px-1">BB</span>}
        {player.status === "allIn" && (
          <span className="rounded bg-danger px-1 text-text">Tapis</span>
        )}
      </div>
      <div className="text-sm font-medium text-text">
        {player.name}
        {isHero ? " (vous)" : ""}
      </div>
      {styleLabel && (
        <div className="text-[10px] text-text-muted">{styleLabel}</div>
      )}
      <div className="font-mono text-sm tabular-nums text-gold">
        {formatChips(player.stack)}
      </div>
      {player.betStreet > 0 && (
        <div className="text-xs text-text-muted">
          Mise {formatChips(player.betStreet)}
        </div>
      )}
      <div className="mt-1 flex gap-1">
        {(showCards ? player.holeCards : [null, null]).map((card, i) => (
          <PlayingCard
            key={i}
            card={(card as Card | null) ?? null}
            faceDown={!showCards}
          />
        ))}
      </div>
    </motion.div>
  );
}
