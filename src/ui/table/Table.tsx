"use client";

import { useGameStore } from "@/store";
import { Board } from "./Board";
import { Pot } from "./Pot";
import { Seat } from "./Seat";

/** Seat positions around an oval, percentages of container. */
const POSITIONS: { left: string; top: string }[] = [
  { left: "50%", top: "88%" }, // hero bottom
  { left: "12%", top: "70%" },
  { left: "12%", top: "28%" },
  { left: "50%", top: "10%" },
  { left: "88%", top: "28%" },
  { left: "88%", top: "70%" },
];

export function Table() {
  const gameState = useGameStore((s) => s.gameState);
  const heroId = useGameStore((s) => s.heroId);
  const botConfigs = useGameStore((s) => s.botConfigs);

  if (!gameState) return null;

  const players = gameState.players;
  const heroIndex = players.findIndex((p) => p.id === heroId);
  // Rotate so hero is at bottom (index 0 in POSITIONS)
  const ordered = players.map((_, i) => players[(heroIndex + i) % players.length]!);

  const funded = players.filter((p) => p.stack > 0 || p.committed > 0);
  const isHu = funded.length === 2;
  const sbSeat = isHu
    ? gameState.buttonSeat
    : (() => {
        const sorted = [...players].sort((a, b) => a.seat - b.seat);
        const bi = sorted.findIndex((p) => p.seat === gameState.buttonSeat);
        return sorted[(bi + 1) % sorted.length]!.seat;
      })();
  const bbSeat = (() => {
    const sorted = [...players].sort((a, b) => a.seat - b.seat);
    const si = sorted.findIndex((p) => p.seat === sbSeat);
    return sorted[(si + 1) % sorted.length]!.seat;
  })();

  const actingId =
    gameState.actingIndex !== null
      ? gameState.players[gameState.actingIndex]?.id
      : null;

  return (
    <div className="relative mx-auto aspect-[16/10] w-full max-w-4xl">
      <div
        className="absolute inset-[8%] rounded-[50%] border-8 shadow-card"
        style={{
          borderColor: "var(--table-rail)",
          background: "var(--felt-texture)",
        }}
      />
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3">
        <Pot amount={gameState.pot} />
        <Board cards={gameState.board} />
        <div className="text-xs uppercase tracking-wide text-text-muted">
          {gameState.street}
        </div>
      </div>
      {ordered.map((player, i) => {
        const pos = POSITIONS[i] ?? POSITIONS[0]!;
        const showCards =
          player.id === heroId ||
          gameState.street === "showdown" ||
          gameState.handOver;
        const cfg = botConfigs[player.id];
        return (
          <div
            key={player.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: pos.left, top: pos.top }}
          >
            <Seat
              player={player}
              isHero={player.id === heroId}
              isActing={player.id === actingId}
              isButton={player.seat === gameState.buttonSeat}
              isSB={player.seat === sbSeat}
              isBB={player.seat === bbSeat}
              showCards={showCards && player.holeCards.length > 0}
              styleLabel={cfg ? `${cfg.style} · ${cfg.difficulty}` : undefined}
            />
          </div>
        );
      })}
    </div>
  );
}
