"use client";

import { useEffect, useMemo, useState } from "react";
import { evaluateHand, getLegalActions, type Card } from "@/engine";
import {
  defaultAmountInGoodZone,
  getBetZones,
  zoneAt,
  type BetZonesInput,
} from "@/coach";
import { effectiveStack, getOuts, spr } from "@/odds";
import { useGameStore } from "@/store";
import { PlayingCard, cardKey } from "@/ui/cards/PlayingCard";
import { useEquity } from "@/ui/hooks/useEquity";
import { useVocab } from "@/ui/hooks/useVocab";
import { formatChips } from "@/lib/format";
import { ui, primaryLabel, terms } from "@/content/wording";
import {
  BetZoneSlider,
  amountWithStackPct,
  potFractionApprox,
} from "./BetZoneSlider";

const RANK_FR_PLURAL: Record<string, string> = {
  "2": "Deux",
  "3": "Trois",
  "4": "Quatre",
  "5": "Cinq",
  "6": "Six",
  "7": "Sept",
  "8": "Huit",
  "9": "Neuf",
  T: "Dix",
  J: "Valets",
  Q: "Dames",
  K: "Rois",
  A: "As",
};

function pocketLabel(hole: Card[]): string | null {
  if (hole.length < 2) return null;
  const a = hole[0]!;
  const b = hole[1]!;
  if (a.rank === b.rank) {
    return `Paire de ${RANK_FR_PLURAL[a.rank] ?? a.rank}`;
  }
  return null;
}

function ActionBtn({
  tone,
  onClick,
  children,
  shortcut,
}: {
  tone: "fold" | "check" | "bet" | "allin";
  onClick: () => void;
  children: React.ReactNode;
  shortcut?: string;
}) {
  const bg =
    tone === "fold"
      ? "var(--btn-fold-bg)"
      : tone === "check"
        ? "var(--btn-check-bg)"
        : tone === "allin"
          ? "var(--btn-allin-bg)"
          : "var(--btn-bet-bg)";
  const fg =
    tone === "fold"
      ? "var(--btn-fold-text)"
      : tone === "check"
        ? "var(--btn-check-text)"
        : tone === "allin"
          ? "var(--btn-allin-text)"
          : "var(--btn-bet-text)";
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative inline-flex min-h-12 min-w-[7.5rem] items-center justify-center rounded-lg px-4 text-base font-bold shadow-card transition-opacity hover:opacity-90 active:opacity-80"
      style={{ background: bg, color: fg }}
    >
      {children}
      {shortcut && (
        <kbd className="absolute right-1.5 top-1 rounded bg-black/20 px-1 text-[10px] font-semibold opacity-80">
          {shortcut}
        </kbd>
      )}
    </button>
  );
}

function HeroCards({
  hole,
  board,
  handId,
}: {
  hole: Card[];
  board: Card[];
  handId: number;
}) {
  const name =
    board.length >= 3
      ? evaluateHand([...hole, ...board]).labelFr
      : pocketLabel(hole);

  return (
    <div className="flex shrink-0 items-center gap-3">
      <div className="flex gap-1.5">
        {hole.map((card, i) => (
          <PlayingCard
            key={`${handId}-hero-${cardKey(card, false)}-${i}`}
            card={card}
            size="md"
          />
        ))}
      </div>
      <div className="min-w-0">
        {name && (
          <p className="text-sm font-semibold leading-tight text-text">{name}</p>
        )}
      </div>
    </div>
  );
}

export function ActionBar() {
  const gameState = useGameStore((s) => s.gameState);
  const heroId = useGameStore((s) => s.heroId);
  const phase = useGameStore((s) => s.phase);
  const humanAction = useGameStore((s) => s.humanAction);
  const nextHand = useGameStore((s) => s.nextHand);
  const { mode } = useVocab();

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

  const outs =
    gameState && hero && gameState.board.length >= 3 && gameState.board.length < 5
      ? getOuts(hero.holeCards, gameState.board)
      : [];

  const zonesInput: BetZonesInput | null = useMemo(() => {
    if (!gameState || !raiseOrBet || !hero) return null;
    const bb = gameState.config.bigBlind;
    const isReRaise =
      Boolean(legal?.raise) && gameState.currentBet > bb;
    const callers = gameState.players.filter(
      (p) =>
        p.id !== heroId &&
        p.status !== "folded" &&
        p.betStreet === bb &&
        gameState.currentBet === bb,
    ).length;
    const oppStacks = gameState.players
      .filter((p) => p.id !== heroId && p.status !== "folded")
      .map((p) => p.stack);
    const eff = effectiveStack(hero.stack, oppStacks);
    const sprVal = spr(eff, Math.max(gameState.pot, 1));
    return {
      street: gameState.street,
      bigBlind: bb,
      pot: gameState.pot,
      min: raiseOrBet.min,
      max: raiseOrBet.max,
      isReRaise,
      facingTotal: gameState.currentBet,
      callers,
      spr: sprVal,
      hasDraw: outs.length >= 8,
    };
  }, [gameState, raiseOrBet, hero, heroId, legal?.raise, outs.length]);

  const eq = equity?.equity ?? 0.5;
  const zones = useMemo(
    () => (zonesInput ? getBetZones(zonesInput, eq) : []),
    [zonesInput, eq],
  );

  useEffect(() => {
    if (!raiseOrBet || !zonesInput) return;
    const z = getBetZones(zonesInput, eq);
    setRaiseTo(
      defaultAmountInGoodZone(z, raiseOrBet.min, raiseOrBet.max),
    );
    // Reset only when the decision context changes, not on equity refine.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    raiseOrBet?.min,
    raiseOrBet?.max,
    gameState?.actingIndex,
    gameState?.handNumber,
  ]);

  useEffect(() => {
    if (!isHeroTurn || !legal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
        return;
      const k = e.key.toLowerCase();
      if (k === "f" && legal.fold) {
        e.preventDefault();
        humanAction({ type: "fold" });
      } else if (k === "c") {
        e.preventDefault();
        if (legal.check) humanAction({ type: "check" });
        else if (legal.call) humanAction({ type: "call" });
      } else if (k === "r" && raiseOrBet) {
        e.preventDefault();
        if (legal.bet) humanAction({ type: "bet", amount: raiseTo });
        else if (legal.raise) humanAction({ type: "raise", amount: raiseTo });
      } else if (k === "a" && raiseOrBet) {
        e.preventDefault();
        const max = raiseOrBet.max;
        if (legal.bet) humanAction({ type: "bet", amount: max });
        else if (legal.raise) humanAction({ type: "raise", amount: max });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isHeroTurn, legal, raiseOrBet, raiseTo, humanAction]);

  const barStyle = {
    background: "var(--action-bar-bg)",
    borderColor: "var(--action-bar-border)",
  } as const;

  const heroBlock =
    hero && hero.holeCards.length === 2 && phase !== "idle" ? (
      <HeroCards
        hole={hero.holeCards}
        board={gameState?.board ?? []}
        handId={gameState?.handNumber ?? 0}
      />
    ) : null;

  const stackBlock = hero ? (
    <div className="flex shrink-0 flex-col items-center px-2">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
        Ton tapis
      </span>
      <span
        className="font-display text-2xl font-bold tabular-nums sm:text-3xl"
        style={{ color: "var(--action-bar-stack)" }}
      >
        {formatChips(hero.stack)}
      </span>
    </div>
  ) : null;

  if (phase === "handOver") {
    return (
      <div
        className="flex flex-wrap items-center justify-between gap-4 border-t px-4 py-3"
        style={barStyle}
      >
        {heroBlock}
        {stackBlock}
        <div className="flex flex-1 justify-center">
          <ActionBtn tone="bet" onClick={nextHand}>
            {ui.nextHand}
          </ActionBtn>
        </div>
      </div>
    );
  }

  if (!isHeroTurn || !legal || !gameState || !hero) {
    return (
      <div
        className="flex flex-wrap items-center justify-between gap-4 border-t px-4 py-3"
        style={barStyle}
      >
        {heroBlock}
        {stackBlock}
        <p className="flex-1 text-center text-sm text-text-muted">
          {ui.waitingBots}
        </p>
      </div>
    );
  }

  const currentZone = zoneAt(zones, raiseTo);
  const putIn = Math.max(0, raiseTo - hero.betStreet);
  const potFrac = potFractionApprox(putIn, Math.max(1, gameState.pot));

  return (
    <div className="border-t px-3 py-3 sm:px-4" style={barStyle}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {heroBlock}
          {stackBlock}

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {raiseOrBet && (
              <BetZoneSlider
                min={raiseOrBet.min}
                max={raiseOrBet.max}
                value={raiseTo}
                zones={zones}
                pot={gameState.pot}
                stack={hero.stack}
                currentBet={gameState.currentBet}
                heroBetStreet={hero.betStreet}
                street={gameState.street}
                bigBlind={gameState.config.bigBlind}
                onChange={setRaiseTo}
                zoneLabel={currentZone?.label ?? ""}
                zoneReason={currentZone?.reason ?? ""}
                potFractionText={potFrac}
              />
            )}

            <div className="flex flex-wrap items-center justify-center gap-2">
              {legal.fold && (
                <ActionBtn
                  tone="fold"
                  shortcut="F"
                  onClick={() => humanAction({ type: "fold" })}
                >
                  {primaryLabel(terms.fold, mode)}
                </ActionBtn>
              )}
              {legal.check && (
                <ActionBtn
                  tone="check"
                  shortcut="C"
                  onClick={() => humanAction({ type: "check" })}
                >
                  {primaryLabel(terms.check, mode)}
                </ActionBtn>
              )}
              {legal.call && (
                <ActionBtn
                  tone="check"
                  shortcut="C"
                  onClick={() => humanAction({ type: "call" })}
                >
                  {`Suivre ${amountWithStackPct(legal.call.amount, hero.stack)}`}
                </ActionBtn>
              )}
              {legal.bet && (
                <ActionBtn
                  tone={raiseTo >= raiseOrBet!.max ? "allin" : "bet"}
                  shortcut="R"
                  onClick={() =>
                    humanAction({ type: "bet", amount: raiseTo })
                  }
                >
                  {raiseTo >= raiseOrBet!.max
                    ? `Tapis ${amountWithStackPct(hero.stack, hero.stack)}`
                    : `Miser ${amountWithStackPct(putIn, hero.stack)}`}
                </ActionBtn>
              )}
              {legal.raise && (
                <ActionBtn
                  tone={raiseTo >= raiseOrBet!.max ? "allin" : "bet"}
                  shortcut="R"
                  onClick={() =>
                    humanAction({ type: "raise", amount: raiseTo })
                  }
                >
                  {raiseTo >= raiseOrBet!.max
                    ? `Tapis ${amountWithStackPct(hero.stack, hero.stack)}`
                    : `Relancer ${amountWithStackPct(putIn, hero.stack)}`}
                </ActionBtn>
              )}
              {raiseOrBet && raiseTo < raiseOrBet.max && (
                <ActionBtn
                  tone="allin"
                  shortcut="A"
                  onClick={() => {
                    const max = raiseOrBet.max;
                    if (legal.bet) humanAction({ type: "bet", amount: max });
                    else if (legal.raise)
                      humanAction({ type: "raise", amount: max });
                  }}
                >
                  {`Tapis ${amountWithStackPct(hero.stack, hero.stack)}`}
                </ActionBtn>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
