"use client";

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
import { formatChips, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CoachPanel } from "./CoachPanel";

function startingCategory(labelHint: string, ranks: string[]): string {
  const sorted = [...ranks].sort().join("");
  const premiums = ["AA", "KK", "QQ", "JJ", "AKs", "AKo"];
  // simplified
  if (ranks[0] === ranks[1] && "AKQJT".includes(ranks[0]!)) return "Premium";
  if (ranks[0] === "A" || (ranks[0] === ranks[1] && "9876".includes(ranks[0]!)))
    return "Forte";
  if (ranks[0] === ranks[1] || ranks.includes("A")) return "Jouable";
  void labelHint;
  void sorted;
  void premiums;
  return "Marginale";
}

export function OddsPanel() {
  const gameState = useGameStore((s) => s.gameState);
  const heroId = useGameStore((s) => s.heroId);

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
    return (
      <p className="text-sm text-text-muted">
        Les probabilités s&apos;affichent pendant une main.
      </p>
    );
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

  const preflopCat =
    gameState.board.length === 0
      ? startingCategory(
          "",
          hero.holeCards.map((c) => c.rank),
        )
      : null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-text">Probabilités</h2>
        <p className="mt-1 text-lg font-medium text-text">
          {hand?.labelFr ??
            (preflopCat ? `Départ : ${preflopCat}` : "Préflop")}
        </p>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <Term id="equity">Équité</Term>
          <span className="font-display text-3xl font-semibold tabular-nums text-gold">
            {equity ? formatPercent(eq, 0) : "…"}
          </span>
        </div>
        <p className="text-xs text-text-muted">
          vs {opponents} adversaire{opponents > 1 ? "s" : ""}
        </p>
        {equity && (
          <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-surface">
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
        )}
      </div>

      {outs.length > 0 && (
        <div>
          <Term id="outs">Outs</Term>
          <p className="mb-1 text-sm text-text-muted">{outs.length} cartes</p>
          <div className="flex flex-wrap gap-1">
            {outs.slice(0, 12).map((o, i) => (
              <PlayingCard key={i} card={o.card} size="sm" />
            ))}
          </div>
        </div>
      )}

      {toCall > 0 && (
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <Term id="potOdds">Cote du pot</Term>
            <span className="tabular-nums">{formatPercent(odds, 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Équité requise</span>
            <span className="tabular-nums">{formatPercent(req, 0)}</span>
          </div>
          <div className="flex justify-between">
            <Term id="ev">EV du call</Term>
            <span className="tabular-nums">
              {ev >= 0 ? "+" : ""}
              {formatChips(ev)}
            </span>
          </div>
        </div>
      )}

      <div className="flex justify-between text-sm">
        <Term id="spr">SPR</Term>
        <span className="tabular-nums">{sprVal.toFixed(1)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-text-muted">Tapis effectif</span>
        <span className="tabular-nums">{formatChips(eff)}</span>
      </div>

      <div
        className={cn(
          "rounded-lg px-3 py-2 text-sm font-medium",
          verdict === "good" && "bg-success/20 text-success",
          verdict === "marginal" && "bg-warning/20 text-warning",
          verdict === "bad" && "bg-danger/20 text-danger",
        )}
      >
        {toCall <= 0
          ? "Pas de mise à suivre"
          : verdict === "good"
            ? "Suivre est rentable"
            : verdict === "marginal"
              ? "Décision limite"
              : "Suivre n'est pas rentable"}
      </div>

      <CoachPanel
        equity={eq}
        toCall={toCall}
        pot={pot}
        outsCount={outs.length}
      />
    </div>
  );
}
