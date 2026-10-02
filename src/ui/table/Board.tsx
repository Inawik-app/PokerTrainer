"use client";

import type { Card } from "@/engine";
import { PlayingCard, cardKey } from "@/ui/cards/PlayingCard";
import { cn } from "@/lib/utils";

export function Board({
  cards,
  handId,
}: {
  cards: Card[];
  handId: number;
}) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: 5 }).map((_, i) => {
        const card = cards[i] ?? null;
        if (!card) {
          return (
            <div
              key={`${handId}-board-empty-${i}`}
              className={cn(
                "h-[72px] w-[52px] rounded-lg border-2 border-dashed",
              )}
              style={{
                borderColor: "var(--board-slot-empty)",
                background: "var(--board-slot-empty-bg)",
              }}
              aria-hidden
            />
          );
        }
        return (
          <PlayingCard
            key={`${handId}-board-${cardKey(card, false)}-${i}`}
            card={card}
            size="lg"
          />
        );
      })}
    </div>
  );
}
