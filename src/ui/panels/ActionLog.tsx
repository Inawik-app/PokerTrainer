"use client";

import { useEffect, useMemo, useRef } from "react";
import { useGameStore } from "@/store";
import { formatAction, formatChips, streetLabel } from "@/lib/format";
import { PlayingCard, cardKey } from "@/ui/cards/PlayingCard";
import type { GameEvent } from "@/engine";
import { Button } from "@/components/ui/button";
import { ui, primaryLabel, terms } from "@/content/wording";
import { useVocab } from "@/ui/hooks/useVocab";

function playerName(id: string, names: Record<string, string>): string {
  return names[id] ?? id;
}

export function ActionLog() {
  const events = useGameStore((s) => s.events);
  const gameState = useGameStore((s) => s.gameState);
  const heroId = useGameStore((s) => s.heroId);
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const { mode } = useVocab();

  const names = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of gameState?.players ?? []) map[p.id] = p.name;
    return map;
  }, [gameState?.players]);

  const handId = gameState?.handNumber ?? 0;

  useEffect(() => {
    const el = listRef.current;
    if (!el || !stickToBottom.current) return;
    el.scrollTop = el.scrollHeight;
  }, [events.length]);

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottom.current = dist < 48;
  };

  const textExport = useMemo(
    () => formatHandText(events, names, mode, heroId),
    [events, names, mode, heroId],
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex shrink-0 items-center justify-between">
        <h2 className="text-sm font-semibold text-text">{ui.historyTitle}</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigator.clipboard?.writeText(textExport)}
        >
          {ui.copy}
        </Button>
      </div>
      <div
        ref={listRef}
        onScroll={onScroll}
        className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain text-sm"
      >
        {events.map((e, i) => (
          <LogLine
            key={`${handId}-${e.type}-${i}`}
            event={e}
            names={names}
            mode={mode}
            handId={handId}
            heroId={heroId}
          />
        ))}
      </div>
    </div>
  );
}

function LogLine({
  event,
  names,
  mode,
  handId,
  heroId,
}: {
  event: GameEvent;
  names: Record<string, string>;
  mode: "simple" | "poker";
  handId: number;
  heroId: string;
}) {
  switch (event.type) {
    case "HAND_STARTED":
      return (
        <div className="pt-2 text-xs font-semibold uppercase tracking-wide text-gold">
          {ui.handNumber(event.handNumber)}
        </div>
      );
    case "BLINDS_POSTED":
      return (
        <div className="text-text-muted">
          {ui.blindsPosted(
            formatChips(event.smallBlind),
            formatChips(event.bigBlind),
          )}
        </div>
      );
    case "STREET_DEALT":
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium text-text">
            {streetLabel(event.street, mode)}
          </span>
          <div className="flex gap-1">
            {event.cards.map((c, i) => (
              <PlayingCard
                key={`${handId}-${event.street}-${cardKey(c, false)}-${i}`}
                card={c}
                size="sm"
              />
            ))}
          </div>
        </div>
      );
    case "PLAYER_ACTED": {
      const isHero = event.playerId === heroId;
      const action = formatAction(event.action, event.amount, { isHero });
      if (isHero) {
        return <div className="text-text">{action}</div>;
      }
      return (
        <div className="text-text">
          <span className="font-medium">
            {playerName(event.playerId, names)}
          </span>{" "}
          {action}
        </div>
      );
    }
    case "SHOWDOWN":
      return (
        <div className="font-medium text-text">
          {primaryLabel(terms.showdown, mode)}
        </div>
      );
    case "POT_AWARDED":
      return (
        <div className="text-success">
          {ui.winsWith(
            event.winners.map((id) => playerName(id, names)).join(", "),
            formatChips(event.amount),
            event.handLabel,
          )}
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
  mode: "simple" | "poker",
  heroId: string,
): string {
  return events
    .map((e) => {
      switch (e.type) {
        case "HAND_STARTED":
          return `--- ${ui.handNumber(e.handNumber)} ---`;
        case "PLAYER_ACTED": {
          const isHero = e.playerId === heroId;
          const action = formatAction(e.action, e.amount, { isHero });
          return isHero
            ? action
            : `${playerName(e.playerId, names)} ${action}`;
        }
        case "STREET_DEALT":
          return `${streetLabel(e.street, mode)}: ${e.cards.map((c) => c.rank + c.suit).join(" ")}`;
        case "POT_AWARDED":
          return ui.winsWith(
            e.winners.map((id) => playerName(id, names)).join(","),
            formatChips(e.amount),
          );
        default:
          return null;
      }
    })
    .filter(Boolean)
    .join("\n");
}
