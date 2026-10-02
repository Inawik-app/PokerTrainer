"use client";

import { useMemo, useState, useEffect } from "react";
import { getLegalActions } from "@/engine";
import { useGameStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { formatChips } from "@/lib/format";

export function ActionBar() {
  const gameState = useGameStore((s) => s.gameState);
  const heroId = useGameStore((s) => s.heroId);
  const phase = useGameStore((s) => s.phase);
  const humanAction = useGameStore((s) => s.humanAction);
  const nextHand = useGameStore((s) => s.nextHand);

  const legal = useMemo(() => {
    if (!gameState) return null;
    return getLegalActions(gameState, heroId);
  }, [gameState, heroId]);

  const isHeroTurn =
    phase === "playing" &&
    gameState &&
    gameState.actingIndex !== null &&
    gameState.players[gameState.actingIndex]?.id === heroId;

  const raiseOrBet = legal?.raise ?? legal?.bet ?? null;
  const [raiseTo, setRaiseTo] = useState(0);

  useEffect(() => {
    if (raiseOrBet) setRaiseTo(raiseOrBet.min);
  }, [raiseOrBet?.min, raiseOrBet?.max, gameState?.actingIndex]);

  if (phase === "handOver") {
    return (
      <div className="flex justify-center gap-3 border-t border-border bg-surface-2 p-4">
        <Button size="lg" onClick={nextHand}>
          Main suivante
        </Button>
      </div>
    );
  }

  if (!isHeroTurn || !legal || !gameState) {
    return (
      <div className="border-t border-border bg-surface-2 p-4 text-center text-sm text-text-muted">
        En attente des bots…
      </div>
    );
  }

  const pot = gameState.pot;
  const hero = gameState.players.find((p) => p.id === heroId)!;

  const setFraction = (frac: number) => {
    if (!raiseOrBet) return;
    const target = Math.floor(gameState.currentBet + pot * frac);
    setRaiseTo(Math.min(raiseOrBet.max, Math.max(raiseOrBet.min, target)));
  };

  return (
    <div className="flex flex-col gap-3 border-t border-border bg-surface-2 p-4">
      {raiseOrBet && (
        <div className="mx-auto flex w-full max-w-xl flex-col gap-2">
          <div className="flex items-center justify-between text-sm text-text-muted">
            <span>{legal.raise ? "Relancer à" : "Miser"}</span>
            <span className="font-mono tabular-nums text-text">
              {formatChips(raiseTo)}
            </span>
          </div>
          <Slider
            min={raiseOrBet.min}
            max={raiseOrBet.max}
            value={[raiseTo]}
            onValueChange={(v) => {
              const n = Array.isArray(v) ? v[0] : v;
              if (typeof n === "number") setRaiseTo(n);
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setFraction(0.5)}>
              ½ pot
            </Button>
            <Button variant="outline" size="sm" onClick={() => setFraction(0.75)}>
              ¾ pot
            </Button>
            <Button variant="outline" size="sm" onClick={() => setFraction(1)}>
              Pot
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRaiseTo(raiseOrBet.max)}
            >
              Tapis ({formatChips(hero.stack)})
            </Button>
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {legal.fold && (
          <Button variant="destructive" onClick={() => humanAction({ type: "fold" })}>
            Se coucher
          </Button>
        )}
        {legal.check && (
          <Button variant="secondary" onClick={() => humanAction({ type: "check" })}>
            Parole
          </Button>
        )}
        {legal.call && (
          <Button
            variant="secondary"
            onClick={() => humanAction({ type: "call" })}
          >
            Suivre {formatChips(legal.call.amount)}
          </Button>
        )}
        {legal.bet && (
          <Button
            onClick={() => humanAction({ type: "bet", amount: raiseTo })}
          >
            Miser {formatChips(raiseTo)}
          </Button>
        )}
        {legal.raise && (
          <Button
            onClick={() => humanAction({ type: "raise", amount: raiseTo })}
          >
            Relancer à {formatChips(raiseTo)}
          </Button>
        )}
      </div>
    </div>
  );
}
