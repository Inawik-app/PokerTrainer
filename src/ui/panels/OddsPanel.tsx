"use client";

import { useState } from "react";
import { evaluateHand, getLegalActions } from "@/engine";
import {
  callEV,
  callVerdict,
  effectiveStack,
  getOuts,
  potOdds,
  requiredEquity,
  spr,
} from "@/odds";
import { useGameStore } from "@/store";
import { useEquity } from "@/ui/hooks/useEquity";
import { PlayingCard } from "@/ui/cards/PlayingCard";
import { Term } from "@/ui/primitives/Term";
import { formatChips, formatNumber, formatPercent } from "@/lib/format";
import { ui } from "@/content/wording";
import { cn } from "@/lib/utils";
import { CoachPanel } from "./CoachPanel";

function startingCategory(ranks: string[]): string {
  if (ranks[0] === ranks[1] && "AKQJT".includes(ranks[0]!)) return ui.handPremium;
  if (ranks[0] === "A" || (ranks[0] === ranks[1] && "9876".includes(ranks[0]!)))
    return ui.handStrong;
  if (ranks[0] === ranks[1] || ranks.includes("A")) return ui.handPlayable;
  return ui.handMarginal;
}

export function OddsPanel() {
  const gameState = useGameStore((s) => s.gameState);
  const heroId = useGameStore((s) => s.heroId);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const hero = gameState?.players.find((p) => p.id === heroId);
  const opponents =
    gameState?.players.filter(
      (p) => p.id !== heroId && p.status !== "folded",
    ).length ?? 0;

  const equity = useEquity({
    hero: hero?.holeCards?.length === 2 ? hero.holeCards : null,
    board: gameState?.board ?? [],
    opponents: Math.max(1, opponents),
    enabled: Boolean(gameState && hero && !gameState.handOver && opponents > 0),
  });

  if (!gameState || !hero || hero.holeCards.length < 2) {
    return <p className="text-sm text-text-muted">{ui.oddsIdle}</p>;
  }

  const hand =
    gameState.board.length >= 3
      ? evaluateHand([...hero.holeCards, ...gameState.board])
      : null;
  const outs =
    gameState.board.length >= 3 && gameState.board.length < 5
      ? getOuts(hero.holeCards, gameState.board)
      : [];

  const legal = getLegalActions(gameState, heroId);
  const toCall = legal.call?.amount ?? 0;
  const pot = gameState.pot;
  const odds = potOdds(toCall, pot);
  const req = requiredEquity(toCall, pot);
  const eq = equity?.equity ?? 0;
  const ev = callEV(eq, pot, toCall);
  const oppStacks = gameState.players
    .filter((p) => p.id !== heroId && p.status !== "folded")
    .map((p) => p.stack);
  const eff = effectiveStack(hero.stack, oppStacks);
  const sprVal = spr(eff, Math.max(pot, 1));
  const verdict = toCall > 0 ? callVerdict(eq, req) : "good";
  const potWin = formatChips(pot + toCall);
  const toCallStr = formatChips(toCall);
  const eqPct = formatPercent(eq, 0);

  const preflopCat =
    gameState.board.length === 0
      ? startingCategory(hero.holeCards.map((c) => c.rank))
      : null;

  return (
    <div className="space-y-2.5">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          {ui.oddsTitle}
        </h2>
        <p className="text-base font-medium text-text">
          {hand?.labelFr ??
            (preflopCat ? ui.startingHand(preflopCat) : null)}
        </p>
      </div>

      <div>
        <div className="flex items-start justify-between gap-2">
          <Term id="equity" />
          <span className="font-display text-2xl font-semibold tabular-nums text-gold">
            {equity ? formatPercent(eq, 0) : "…"}
          </span>
        </div>
        <p className="text-[11px] text-text-muted">{ui.vsOpponents(opponents)}</p>
        {equity && (
          <div className="mt-1.5 space-y-1">
            <div className="flex h-1.5 overflow-hidden rounded-full bg-surface">
              <div
                className="bg-success"
                style={{ width: `${equity.win * 100}%` }}
              />
              <div
                className="bg-warning"
                style={{ width: `${equity.tie * 100}%` }}
              />
              <div
                className="bg-danger"
                style={{ width: `${equity.lose * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-text-muted">
              <Term id="win" showSecondary={false} />
              <Term id="tie" showSecondary={false} />
              <Term id="lose" showSecondary={false} />
            </div>
          </div>
        )}
      </div>

      {outs.length > 0 && (
        <div>
          <Term id="outs" />
          <p className="mb-1 text-xs text-text-muted">
            {ui.outsCount(outs.length)}
          </p>
          <div className="flex flex-wrap gap-1">
            {outs.slice(0, 12).map((o, i) => (
              <PlayingCard key={i} card={o.card} size="sm" />
            ))}
          </div>
        </div>
      )}

      {toCall > 0 && (
        <div className="space-y-1.5 text-sm">
          <div className="flex items-start justify-between gap-2">
            <Term id="potOdds" />
            <span className="shrink-0 tabular-nums">{formatPercent(odds, 0)}</span>
          </div>
          <div className="flex items-start justify-between gap-2">
            <Term id="requiredEquity" />
            <span className="shrink-0 tabular-nums">{formatPercent(req, 0)}</span>
          </div>
          <div className="flex items-start justify-between gap-2">
            <Term id="ev" />
            <span className="shrink-0 tabular-nums">
              {ev >= 0 ? "+" : ""}
              {formatChips(ev)}
            </span>
          </div>
        </div>
      )}

      <div>
        <button
          type="button"
          className="text-xs font-semibold text-text-muted underline-offset-2 hover:underline"
          onClick={() => setDetailsOpen((o) => !o)}
          aria-expanded={detailsOpen}
        >
          {ui.moreDetails}
          {detailsOpen ? " ▾" : " ▸"}
        </button>
        {detailsOpen && (
          <div className="mt-1.5 space-y-1.5 text-sm">
            <div className="flex items-start justify-between gap-2">
              <Term id="spr" />
              <span className="shrink-0 tabular-nums">
                {formatNumber(sprVal, 1)}
              </span>
            </div>
            <div className="flex items-start justify-between gap-2">
              <Term id="effectiveStack" />
              <span className="shrink-0 tabular-nums">{formatChips(eff)}</span>
            </div>
          </div>
        )}
      </div>

      <div
        className={cn(
          "space-y-0.5 rounded-lg px-2.5 py-1.5 text-sm",
          verdict === "good" && "bg-success/20 text-success",
          verdict === "marginal" && "bg-warning/20 text-warning",
          verdict === "bad" && "bg-danger/20 text-danger",
        )}
      >
        <p className="font-medium">
          {toCall <= 0
            ? ui.noCallNeeded
            : verdict === "good"
              ? ui.verdictGood
              : verdict === "marginal"
                ? ui.verdictMarginal
                : ui.verdictBad}
        </p>
        {toCall > 0 && (
          <p className="text-xs opacity-90">
            {verdict === "good"
              ? ui.verdictReasonGood(toCallStr, potWin, eqPct)
              : verdict === "marginal"
                ? ui.verdictReasonMarginal(toCallStr, potWin, eqPct)
                : ui.verdictReasonBad(toCallStr, potWin, eqPct)}
          </p>
        )}
      </div>

      <CoachPanel
        equityVsRandom={eq}
        toCall={toCall}
        pot={pot}
        outsCount={outs.length}
      />
    </div>
  );
}
