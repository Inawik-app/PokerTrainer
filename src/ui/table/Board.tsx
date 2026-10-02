"use client";

import type { Card } from "@/engine";
import { PlayingCard, cardKey } from "@/ui/cards/PlayingCard";

export function Board({
  cards,
  handId,
}: {
  cards: Card[];
  handId: number;
}) {
  return (
    <div className="flex gap-2.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const card = cards[i] ?? null;
        const faceDown = !card;
        return (
          <PlayingCard
            key={`${handId}-board-${cardKey(card, faceDown)}-${i}`}
            card={card}
            faceDown={faceDown}
            size="xl"
          />
        );
      })}
    </div>
  );
}
