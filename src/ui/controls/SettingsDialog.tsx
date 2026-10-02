"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { setTheme, type Theme } from "@/theme/theme";
import { ui, type VocabMode } from "@/content/wording";
import { useVocab } from "@/ui/hooks/useVocab";

export type AidSettings = {
  showEquity: boolean;
  showOuts: boolean;
  showPotOdds: boolean;
  showCoach: boolean;
  showLog: boolean;
  revealStyles: boolean;
  fourColor: boolean;
  reducedMotion: boolean;
  theme: Theme;
  vocabMode: VocabMode;
};

const DEFAULT_AIDS: AidSettings = {
  showEquity: true,
  showOuts: true,
  showPotOdds: true,
  showCoach: true,
  showLog: true,
  revealStyles: true,
  fourColor: true,
  reducedMotion: false,
  theme: "dark",
  vocabMode: "simple",
};

const STORAGE_KEY = "poker-trainer-settings";

export function loadAidSettings(): AidSettings {
  if (typeof window === "undefined") return DEFAULT_AIDS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AIDS;
    return { ...DEFAULT_AIDS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_AIDS;
  }
}

export function saveAidSettings(settings: AidSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

export function SettingsDialog() {
  const settings = useGameStore((s) => s.settings);
  const gameSeed = useGameStore((s) => s.gameSeed);
  const setSettings = useGameStore((s) => s.setSettings);
  const { mode, setMode } = useVocab();
  const [aids, setAids] = useState<AidSettings>(DEFAULT_AIDS);
  const [open, setOpen] = useState(false);
  const [seedInput, setSeedInput] = useState("");

  useEffect(() => {
    const loaded = loadAidSettings();
    setAids(loaded);
    setTheme(loaded.theme);
    setMode(loaded.vocabMode);
  }, [setMode]);

  useEffect(() => {
    setSeedInput(
      settings.manualSeed != null ? String(settings.manualSeed) : "",
    );
  }, [settings.manualSeed]);

  const updateAids = (partial: Partial<AidSettings>) => {
    const next = { ...aids, ...partial };
    setAids(next);
    saveAidSettings(next);
    if (partial.theme) setTheme(partial.theme);
    if (partial.vocabMode) setMode(partial.vocabMode);
    window.dispatchEvent(new CustomEvent("poker-aids", { detail: next }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            {ui.settings}
          </Button>
        }
      />
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{ui.settings}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <label className="flex items-center justify-between gap-4">
            <span>{ui.botCount}</span>
            <select
              className="rounded border border-border bg-surface px-2 py-1"
              value={settings.botCount}
              onChange={(e) =>
                setSettings({ botCount: Number(e.target.value) })
              }
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center justify-between gap-4">
            <span>{ui.vocabMode}</span>
            <select
              className="rounded border border-border bg-surface px-2 py-1"
              value={mode}
              onChange={(e) =>
                updateAids({ vocabMode: e.target.value as VocabMode })
              }
            >
              <option value="simple">{ui.vocabSimple}</option>
              <option value="poker">{ui.vocabPoker}</option>
            </select>
          </label>

          <div className="space-y-1.5 rounded-lg border border-border bg-surface/60 p-3">
            <label className="flex flex-col gap-1">
              <span className="text-text-muted">{ui.manualSeed}</span>
              <input
                className="rounded border border-border bg-surface px-2 py-1 font-mono tabular-nums text-text"
                placeholder={ui.manualSeedPlaceholder}
                value={seedInput}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  setSeedInput(v);
                  if (v === "") {
                    setSettings({ manualSeed: null });
                    return;
                  }
                  const n = Number(v);
                  if (Number.isFinite(n)) setSettings({ manualSeed: n >>> 0 });
                }}
              />
            </label>
            <p className="text-xs text-text-muted">
              {ui.gameSeed(
                gameSeed ?? "—",
                settings.manualSeed != null,
              )}
            </p>
          </div>

          {(
            [
              ["showEquity", ui.showEquity],
              ["showOuts", ui.showOuts],
              ["showPotOdds", ui.showPotOdds],
              ["showCoach", ui.showCoach],
              ["showLog", ui.showLog],
              ["revealStyles", ui.revealStyles],
              ["fourColor", ui.fourColor],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex items-center justify-between gap-4"
            >
              <span>{label}</span>
              <Switch
                checked={aids[key]}
                onCheckedChange={(v) => updateAids({ [key]: v })}
              />
            </label>
          ))}
          <label className="flex items-center justify-between gap-4">
            <span>{ui.theme}</span>
            <select
              className="rounded border border-border bg-surface px-2 py-1"
              value={aids.theme}
              onChange={(e) =>
                updateAids({ theme: e.target.value as Theme })
              }
            >
              <option value="dark">{ui.themeDark}</option>
              <option value="light">{ui.themeLight}</option>
            </select>
          </label>
        </div>
      </DialogContent>
    </Dialog>
  );
}
