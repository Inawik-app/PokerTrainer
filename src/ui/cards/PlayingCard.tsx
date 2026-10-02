"use client";

import type { Card } from "@/engine";
import { formatCard } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  card: Card | null;
  faceDown?: boolean;
  size?: "sm" | "md";
};

export function PlayingCard({ card, faceDown, size = "md" }: Props) {
  const dims = size === "sm" ? "h-10 w-7 text-[10px]" : "h-14 w-10 text-xs";
  if (faceDown || !card) {
    return (
      <div
        className={cn(
          dims,
          "rounded-md border border-border bg-card-back shadow-card",
        )}
      />
    );
  }
  const red = card.suit === "h" || card.suit === "d";
  return (
    <div
      className={cn(
        dims,
        "flex items-center justify-center rounded-md border border-border bg-card-face font-semibold shadow-card",
        red ? "text-danger" : "text-surface",
      )}
    >
      {formatCard(card.rank, card.suit)}
    </div>
  );
}
