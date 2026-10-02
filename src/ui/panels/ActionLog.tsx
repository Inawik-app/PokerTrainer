"use client";

import { useEffect, useMemo, useRef } from "react";
import { useGameStore } from "@/store";
import { formatAction, formatChips, streetLabel } from "@/lib/format";
import { PlayingCard } from "@/ui/cards/PlayingCard";
import type { GameEvent } from "@/engine";
import { Button } from "@/components/ui/button";

function playerName(
  id: string,
  names: Record<string, string>,
): string {
  return names[id] ?? id;
}

export function ActionLog() {
  const events = useGameStore((s) => s.events);
  const gameState = useGameStore((s) => s.gameState);
  const bottomRef = useRef<HTMLDivElement>(null);

  const names = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of gameState?.players ?? []) map[p.id] = p.name;
    return map;
  }, [gameState?.players]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  const textExport = useMemo(() => formatHandText(events, names), [events, names]);

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text">Historique</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigator.clipboard?.writeText(textExport)}
        >
          Copier
        </Button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto text-sm">
        {events.map((e, i) => (
          <LogLine key={i} event={e} names={names} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function LogLine({
  event,
  names,
}: {
  event: GameEvent;
  names: Record<string, string>;
}) {
  switch (event.type) {
    case "HAND_STARTED":
      return (
        <div className="pt-2 text-xs font-semibold uppercase tracking-wide text-gold">
          Main #{event.handNumber}
        </div>
      );
    case "BLINDS_POSTED":
      return (
        <div className="text-text-muted">
          Blinds {formatChips(event.smallBlind)} / {formatChips(event.bigBlind)}
        </div>
      );
    case "STREET_DEALT":
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium text-text">
            {streetLabel(event.street)}
          </span>
          <div className="flex gap-1">
            {event.cards.map((c, i) => (
              <PlayingCard key={i} card={c} size="sm" />
            ))}
          </div>
        </div>
      );
    case "PLAYER_ACTED":
      return (
        <div className="text-text">
          <span className="font-medium">
            {playerName(event.playerId, names)}
          </span>{" "}
          {formatAction(event.action, event.amount)}
        </div>
      );
    case "SHOWDOWN":
      return <div className="font-medium text-text">Showdown</div>;
    case "POT_AWARDED":
      return (
        <div className="text-success">
          {event.winners.map((id) => playerName(id, names)).join(", ")} gagne{" "}
          {formatChips(event.amount)}
          {event.handLabel ? ` (${event.handLabel})` : ""}
        </div>
      );
    case "HAND_ENDED":
      return <div className="mb-2 border-b border-border pb-2" />;
    default:
      return null;
  }
}

function formatHandText(
  events: GameEvent[],
  names: Record<string, string>,
): string {
  return events
    .map((e) => {
      switch (e.type) {
        case "HAND_STARTED":
          return `--- Main #${e.handNumber} ---`;
        case "PLAYER_ACTED":
          return `${playerName(e.playerId, names)} ${formatAction(e.action, e.amount)}`;
        case "STREET_DEALT":
          return `${streetLabel(e.street)}: ${e.cards.map((c) => c.rank + c.suit).join(" ")}`;
        case "POT_AWARDED":
          return `Pot → ${e.winners.map((id) => playerName(id, names)).join(",")} +${e.amount}`;
        default:
          return null;
      }
    })
    .filter(Boolean)
    .join("\n");
}
