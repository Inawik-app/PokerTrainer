"use client";

import Link from "next/link";
import { useGameStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Table } from "@/ui/table/Table";
import { ActionBar } from "@/ui/controls/ActionBar";
import { SettingsDialog } from "@/ui/controls/SettingsDialog";
import { OddsPanel } from "@/ui/panels/OddsPanel";
import { ActionLog } from "@/ui/panels/ActionLog";
import { VocabProvider } from "@/ui/hooks/useVocab";
import { ui } from "@/content/wording";

export function GameScreen() {
  return (
    <VocabProvider>
      <GameScreenInner />
    </VocabProvider>
  );
}

function GameScreenInner() {
  const phase = useGameStore((s) => s.phase);
  const startGame = useGameStore((s) => s.startGame);
  const settings = useGameStore((s) => s.settings);

  if (phase === "idle") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-surface px-6">
        <div className="text-center">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-text sm:text-5xl">
            {ui.appTitle}
          </h1>
          <p className="mt-3 max-w-md text-text-muted">
            {ui.appTagline(settings.botCount)}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={startGame}>
            {ui.newGame}
          </Button>
          <SettingsDialog />
          <Link
            href="/regles"
            className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm text-text"
          >
            {ui.rules}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-full flex-1 flex-col bg-surface">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h1 className="font-display text-lg font-semibold text-text">
          {ui.appTitle}
        </h1>
        <div className="flex items-center gap-2">
          <Link
            href="/regles"
            className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-sm text-text"
          >
            {ui.rules}
          </Link>
          <SettingsDialog />
          <Button variant="outline" size="sm" onClick={startGame}>
            {ui.restart}
          </Button>
        </div>
      </header>
      <div className="flex flex-1 flex-col lg:flex-row">
        <div className="flex flex-1 items-center justify-center p-4">
          <Table />
        </div>
        <aside className="flex max-h-[50vh] w-full flex-col gap-4 overflow-y-auto border-t border-border bg-surface-2 p-4 lg:max-h-none lg:w-[360px] lg:shrink-0 lg:border-l lg:border-t-0">
          <section data-panel="odds">
            <OddsPanel />
          </section>
          <section
            data-panel="log"
            className="min-h-[180px] flex-1 border-t border-border pt-4"
          >
            <ActionLog />
          </section>
        </aside>
      </div>
      <ActionBar />
    </main>
  );
}
