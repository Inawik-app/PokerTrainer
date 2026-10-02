"use client";

import { useEffect } from "react";
import type { BotDifficulty, BotStyle } from "@/bots";
import {
  botLevelCards,
  botLevelSummary,
  setupCopy,
  stylePresetCards,
  type DifficultyPresetId,
  type StylePresetId,
} from "@/content/botLevels";
import { playerProfiles } from "@/content/playerProfiles";
import { ui } from "@/content/wording";
import { cn } from "@/lib/utils";
import {
  BOT_DIFFICULTIES,
  BOT_STYLES,
  loadBotSetup,
  saveBotSetup,
  useGameStore,
} from "@/store";
import { Switch } from "@/components/ui/switch";
import {
  loadAidSettings,
  saveAidSettings,
} from "@/ui/controls/SettingsDialog";

const DIFF_LABEL: Record<BotDifficulty, string> = {
  EASY: setupCopy.easy,
  MEDIUM: setupCopy.medium,
  HARD: setupCopy.hard,
};

const STYLE_LABEL: Record<BotStyle, string> = Object.fromEntries(
  playerProfiles.map((p) => [p.id, `${p.simpleName} (${p.pokerName})`]),
) as Record<BotStyle, string>;

export function GameSetupPanel() {
  const settings = useGameStore((s) => s.settings);
  const setSettings = useGameStore((s) => s.setSettings);
  const botSetup = useGameStore((s) => s.botSetup);
  const setBotSetup = useGameStore((s) => s.setBotSetup);

  useEffect(() => {
    const loaded = loadBotSetup();
    setBotSetup(loaded);
  }, [setBotSetup]);

  const updateSetup = (partial: Parameters<typeof setBotSetup>[0]) => {
    const next = { ...botSetup, ...partial };
    setBotSetup(partial);
    saveBotSetup(next);
  };

  const showCustom =
    botSetup.difficultyPreset === "custom" || botSetup.stylePreset === "custom";

  return (
    <div className="w-full max-w-3xl space-y-6 text-left">
      <label className="flex items-center justify-between gap-4 text-sm">
        <span className="text-text">{ui.botCount}</span>
        <select
          className="rounded border border-border bg-surface px-2 py-1 text-text"
          value={settings.botCount}
          onChange={(e) => setSettings({ botCount: Number(e.target.value) })}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-text">
          {setupCopy.difficultyTitle}
        </h2>
        <div className="grid gap-2 sm:grid-cols-2">
          {botLevelCards.map((card) => {
            const selected = botSetup.difficultyPreset === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() =>
                  updateSetup({ difficultyPreset: card.id as DifficultyPresetId })
                }
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors",
                  selected
                    ? "border-gold bg-gold/10"
                    : "border-border bg-surface-2 hover:border-gold/50",
                )}
              >
                <p className="text-sm font-semibold text-text">{card.title}</p>
                {card.body.map((line) => (
                  <p key={line} className="mt-1 text-xs text-text-muted">
                    {line}
                  </p>
                ))}
              </button>
            );
          })}
        </div>

        {botSetup.difficultyPreset !== "custom" && (
          <div className="overflow-x-auto rounded-lg border border-border">
            <p className="border-b border-border bg-surface-2 px-3 py-2 text-xs font-medium text-text">
              {setupCopy.summaryUnderCard}
            </p>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-text-muted">
                  <th className="px-3 py-2 font-medium">Niveau</th>
                  <th className="px-3 py-2 font-medium">
                    Ce qu&apos;il prend en compte
                  </th>
                  <th className="px-3 py-2 font-medium">Erreurs</th>
                </tr>
              </thead>
              <tbody>
                {botLevelSummary.map((row) => (
                  <tr key={row.level} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 font-medium text-text">{row.level}</td>
                    <td className="px-3 py-2 text-text-muted">{row.considers}</td>
                    <td className="px-3 py-2 text-text-muted">{row.errorRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-text">{setupCopy.styleTitle}</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {stylePresetCards.map((card) => {
            const selected = botSetup.stylePreset === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() =>
                  updateSetup({ stylePreset: card.id as StylePresetId })
                }
                className={cn(
                  "rounded-lg border p-3 text-left transition-colors",
                  selected
                    ? "border-gold bg-gold/10"
                    : "border-border bg-surface-2 hover:border-gold/50",
                )}
              >
                <p className="text-sm font-semibold text-text">{card.title}</p>
                <p className="mt-1 text-xs text-text-muted">{card.body}</p>
              </button>
            );
          })}
        </div>

        {botSetup.stylePreset === "all_same" && (
          <label className="flex items-center justify-between gap-4 text-sm">
            <span>{setupCopy.globalStyleLabel}</span>
            <select
              className="rounded border border-border bg-surface px-2 py-1"
              value={botSetup.globalStyle}
              onChange={(e) =>
                updateSetup({ globalStyle: e.target.value as BotStyle })
              }
            >
              {BOT_STYLES.map((s) => (
                <option key={s} value={s}>
                  {STYLE_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
        )}
      </section>

      {showCustom && (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-text">
            {setupCopy.perSeatTitle}
          </h3>
          {Array.from({ length: settings.botCount }, (_, i) => {
            const id = `bot${i + 1}`;
            const cfg = botSetup.customConfigs[id] ?? {
              style: "TAG" as BotStyle,
              difficulty: "MEDIUM" as BotDifficulty,
            };
            return (
              <div
                key={id}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-2 p-2 text-xs"
              >
                <span className="w-14 font-medium text-text">Bot {i + 1}</span>
                {(botSetup.difficultyPreset === "custom" ||
                  botSetup.stylePreset === "custom") && (
                  <>
                    {botSetup.difficultyPreset === "custom" && (
                      <label className="flex items-center gap-1">
                        <span className="text-text-muted">{setupCopy.levelLabel}</span>
                        <select
                          className="rounded border border-border bg-surface px-1 py-0.5"
                          value={cfg.difficulty}
                          onChange={(e) => {
                            const customConfigs = {
                              ...botSetup.customConfigs,
                              [id]: {
                                ...cfg,
                                difficulty: e.target.value as BotDifficulty,
                              },
                            };
                            updateSetup({ customConfigs });
                          }}
                        >
                          {BOT_DIFFICULTIES.map((d) => (
                            <option key={d} value={d}>
                              {DIFF_LABEL[d]}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    {botSetup.stylePreset === "custom" && (
                      <label className="flex items-center gap-1">
                        <span className="text-text-muted">{setupCopy.styleLabel}</span>
                        <select
                          className="max-w-[180px] rounded border border-border bg-surface px-1 py-0.5"
                          value={cfg.style}
                          onChange={(e) => {
                            const customConfigs = {
                              ...botSetup.customConfigs,
                              [id]: {
                                ...cfg,
                                style: e.target.value as BotStyle,
                              },
                            };
                            updateSetup({ customConfigs });
                          }}
                        >
                          {BOT_STYLES.map((s) => (
                            <option key={s} value={s}>
                              {STYLE_LABEL[s]}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </section>
      )}

      <label className="flex items-start justify-between gap-4 rounded-lg border border-border bg-surface-2 p-3 text-sm">
        <span>
          <span className="font-medium text-text">{setupCopy.revealTitle}</span>
          <span className="mt-1 block text-xs text-text-muted">
            {setupCopy.revealHint}
          </span>
        </span>
        <Switch
          checked={botSetup.revealBotProfiles}
          onCheckedChange={(v) => {
            updateSetup({ revealBotProfiles: v });
            const aids = loadAidSettings();
            saveAidSettings({ ...aids, revealStyles: v });
            window.dispatchEvent(
              new CustomEvent("poker-aids", {
                detail: { ...aids, revealStyles: v },
              }),
            );
          }}
        />
      </label>
    </div>
  );
}
