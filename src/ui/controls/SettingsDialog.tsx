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
  const setSettings = useGameStore((s) => s.setSettings);
  const [aids, setAids] = useState<AidSettings>(DEFAULT_AIDS);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const loaded = loadAidSettings();
    setAids(loaded);
    setTheme(loaded.theme);
  }, []);

  const updateAids = (partial: Partial<AidSettings>) => {
    const next = { ...aids, ...partial };
    setAids(next);
    saveAidSettings(next);
    if (partial.theme) setTheme(partial.theme);
    window.dispatchEvent(new CustomEvent("poker-aids", { detail: next }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            Réglages
          </Button>
        }
      />
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Réglages</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <label className="flex items-center justify-between gap-4">
            <span>Nombre de bots</span>
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
          {(
            [
              ["showEquity", "Équité"],
              ["showOuts", "Outs"],
              ["showPotOdds", "Cote du pot"],
              ["showCoach", "Coach"],
              ["showLog", "Log"],
              ["revealStyles", "Révéler les styles"],
              ["fourColor", "Cartes 4 couleurs"],
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
            <span>Thème</span>
            <select
              className="rounded border border-border bg-surface px-2 py-1"
              value={aids.theme}
              onChange={(e) =>
                updateAids({ theme: e.target.value as Theme })
              }
            >
              <option value="dark">Sombre</option>
              <option value="light">Clair</option>
            </select>
          </label>
        </div>
      </DialogContent>
    </Dialog>
  );
}
