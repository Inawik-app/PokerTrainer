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
import { formatChips, formatStackPercent } from "@/lib/format";
import { ui, primaryLabel, terms } from "@/content/wording";
import {
  BetZoneSlider,
  amountWithStackPct,
  potFractionApprox,
  zoneKindColor,
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
  className,
}: {
  tone: "fold" | "check" | "bet";
  onClick: () => void;
  children: React.ReactNode;
  shortcut?: string;
  className?: string;
}) {
  const bg =
    tone === "fold"
      ? "var(--btn-fold-bg)"
      : tone === "check"
        ? "var(--btn-check-bg)"
        : "var(--btn-bet-bg)";
  const fg =
    tone === "fold"
      ? "var(--btn-fold-text)"
      : tone === "check"
        ? "var(--btn-check-text)"
        : "var(--btn-bet-text)";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex min-h-12 flex-1 items-center justify-center rounded-lg px-3 text-sm font-bold shadow-card transition-opacity hover:opacity-90 active:opacity-80 sm:text-base ${className ?? ""}`}
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
    gameState &&
    hero &&
    gameState.board.length >= 3 &&
    gameState.board.length < 5
      ? getOuts(hero.holeCards, gameState.board)
      : [];

  const zonesInput: BetZonesInput | null = useMemo(() => {
    if (!gameState || !raiseOrBet || !hero) return null;
    const bb = gameState.config.bigBlind;
    const isReRaise = Boolean(legal?.raise) && gameState.currentBet > bb;
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
    setRaiseTo(defaultAmountInGoodZone(z, raiseOrBet.min, raiseOrBet.max));
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
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
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
    minHeight: "var(--action-bar-height, 9.5rem)",
  } as const;

  const handName =
    hero && hero.holeCards.length === 2
      ? gameState && gameState.board.length >= 3
        ? evaluateHand([...hero.holeCards, ...gameState.board]).labelFr
        : pocketLabel(hero.holeCards)
      : null;

  const leftZone = (
    <div className="flex w-[11rem] shrink-0 flex-col items-center gap-1 sm:w-[12.5rem]">
      {hero && hero.holeCards.length === 2 ? (
        <>
          <div className="flex gap-1.5">
            {hero.holeCards.map((card, i) => (
              <PlayingCard
                key={`${gameState?.handNumber ?? 0}-hero-${cardKey(card, false)}-${i}`}
                card={card}
                size="md"
              />
            ))}
          </div>
          {handName && (
            <p className="text-center text-xs font-semibold text-text">
              {handName}
            </p>
          )}
        </>
      ) : (
        <div className="h-16" />
      )}
      {hero && (
        <div className="text-center">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
            Ton tapis
          </div>
          <div
            className="font-display text-2xl font-bold tabular-nums"
            style={{ color: "var(--action-bar-stack)" }}
          >
            {formatChips(hero.stack)}
          </div>
        </div>
      )}
    </div>
  );

  if (phase === "handOver") {
    return (
      <div
        className="flex items-center gap-3 border-t px-3 py-2"
        style={barStyle}
      >
        {leftZone}
        <div className="flex flex-1 justify-center">
          <ActionBtn tone="bet" onClick={nextHand} className="max-w-xs">
            {ui.nextHand}
          </ActionBtn>
        </div>
        <div className="hidden w-44 shrink-0 sm:block" />
      </div>
    );
  }

  if (!isHeroTurn || !legal || !gameState || !hero) {
    return (
      <div
        className="flex items-center gap-3 border-t px-3 py-2"
        style={barStyle}
      >
        {leftZone}
        <p className="flex-1 text-center text-sm text-text-muted">
          {ui.waitingBots}
        </p>
        <div className="hidden w-44 shrink-0 sm:block" />
      </div>
    );
  }

  const currentZone = zoneAt(zones, raiseTo);
  const putIn = Math.max(0, raiseTo - hero.betStreet);
  const potFrac = potFractionApprox(putIn, Math.max(1, gameState.pot));
  const stackPct = formatStackPercent(putIn, hero.stack);

  const midZone = (
    <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
      <div className="flex w-full gap-2">
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
            {ui.callAmountPct(
              formatChips(legal.call.amount),
              formatStackPercent(legal.call.amount, hero.stack),
            )}
          </ActionBtn>
        )}
        {legal.bet && raiseOrBet && (
          <ActionBtn
            tone="bet"
            shortcut="R"
            onClick={() => humanAction({ type: "bet", amount: raiseTo })}
          >
            {ui.betToAmount(amountWithStackPct(putIn, hero.stack))}
          </ActionBtn>
        )}
        {legal.raise && raiseOrBet && (
          <ActionBtn
            tone="bet"
            shortcut="R"
            onClick={() => humanAction({ type: "raise", amount: raiseTo })}
          >
            {ui.raiseToAmount(amountWithStackPct(putIn, hero.stack))}
          </ActionBtn>
        )}
      </div>

      {raiseOrBet ? (
        <BetZoneSlider
          min={raiseOrBet.min}
          max={raiseOrBet.max}
          value={raiseTo}
          zones={zones}
          pot={gameState.pot}
          currentBet={gameState.currentBet}
          street={gameState.street}
          bigBlind={gameState.config.bigBlind}
          onChange={setRaiseTo}
        />
      ) : (
        <div className="h-10" />
      )}
    </div>
  );

  const rightZone = raiseOrBet ? (
    <aside
      className="hidden w-44 shrink-0 flex-col justify-center gap-0.5 rounded-lg border border-border px-3 py-2 sm:flex"
      style={{ background: "var(--slider-bubble-bg)" }}
    >
      <p className="text-sm font-bold tabular-nums text-text">
        {ui.chipsAmount(formatChips(raiseTo))}
      </p>
      <p className="text-xs text-text-muted">{ui.stackPercentOf(stackPct)}</p>
      <p className="text-xs text-text-muted">{potFrac}</p>
      {currentZone && (
        <>
          <p
            className="mt-1 text-sm font-bold"
            style={{ color: zoneKindColor(currentZone.kind) }}
          >
            {currentZone.label}
          </p>
          <p className="line-clamp-2 text-[11px] leading-snug text-text-muted">
            {currentZone.reason}
          </p>
        </>
      )}
    </aside>
  ) : (
    <div className="hidden w-44 shrink-0 sm:block" />
  );

  return (
    <div className="flex items-stretch gap-3 border-t px-3 py-2" style={barStyle}>
      {leftZone}
      {midZone}
      {rightZone}
    </div>
  );
}
