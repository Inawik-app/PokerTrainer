"use client";

import type { Card } from "@/engine";
import { formatCard } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  card: Card | null;
  faceDown?: boolean;
  /** xs≈18×26, sm≈32×46, md hero bar, lg/xl board */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
};

const SIZE_CLASS = {
  xs: "h-[26px] w-[18px] text-[8px] rounded",
  sm: "h-[46px] w-[32px] text-[11px] rounded-md",
  md: "h-16 w-11 text-sm rounded-md",
  lg: "h-[80px] w-[58px] text-sm rounded-lg",
  xl: "h-[88px] w-[64px] text-base rounded-lg",
} as const;

export function PlayingCard({ card, faceDown, size = "md" }: Props) {
  const dims = SIZE_CLASS[size];
  if (faceDown || !card) {
    return (
      <div
        className={cn(dims, "border border-border bg-card-back shadow-card")}
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, var(--card-back-pattern) 0 2px, var(--card-back) 2px 6px)",
        }}
      />
    );
  }
  const red = card.suit === "h" || card.suit === "d";
  return (
    <div
      className={cn(
        dims,
        "flex items-center justify-center border border-border bg-card-face font-semibold shadow-card",
        red ? "text-danger" : "text-surface",
      )}
    >
      {formatCard(card.rank, card.suit)}
    </div>
  );
}

export function cardKey(card: Card | null, faceDown: boolean): string {
  if (faceDown || !card) return "back";
  return `${card.rank}${card.suit}`;
}
