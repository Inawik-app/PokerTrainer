"use client";

import type { Card } from "@/engine";
import { PlayingCard } from "@/ui/cards/PlayingCard";

export function Board({ cards }: { cards: Card[] }) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <PlayingCard key={i} card={cards[i] ?? null} faceDown={!cards[i]} />
      ))}
    </div>
  );
}
