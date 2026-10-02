import type { BotConfig, BotDifficulty, BotStyle } from "@/bots";
import type { DifficultyPresetId, StylePresetId } from "@/content/botLevels";
import type { Rng } from "@/lib/rng";

export type BotSetupSettings = {
  difficultyPreset: DifficultyPresetId;
  stylePreset: StylePresetId;
  /** Used when stylePreset === "all_same". */
  globalStyle: BotStyle;
  /** Per-bot overrides when difficulty or style preset is custom. Keys: bot1, bot2… */
  customConfigs: Record<string, BotConfig>;
  revealBotProfiles: boolean;
};

export const DEFAULT_BOT_SETUP: BotSetupSettings = {
  difficultyPreset: "mixed",
  stylePreset: "mixed",
  globalStyle: "TAG",
  customConfigs: {},
  revealBotProfiles: false,
};

const SETUP_STORAGE_KEY = "poker-trainer-bot-setup";

export function loadBotSetup(): BotSetupSettings {
  if (typeof window === "undefined") return DEFAULT_BOT_SETUP;
  try {
    const raw = localStorage.getItem(SETUP_STORAGE_KEY);
    if (!raw) return DEFAULT_BOT_SETUP;
    return { ...DEFAULT_BOT_SETUP, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_BOT_SETUP;
  }
}

export function saveBotSetup(setup: BotSetupSettings): void {
  try {
    localStorage.setItem(SETUP_STORAGE_KEY, JSON.stringify(setup));
  } catch {
    /* ignore */
  }
}

const STYLES: BotStyle[] = [
  "TAG",
  "LAG",
  "TIGHT_PASSIVE",
  "LOOSE_PASSIVE",
  "FISH",
];
const DIFFS: BotDifficulty[] = ["EASY", "MEDIUM", "HARD"];

function pickStyle(
  setup: BotSetupSettings,
  botId: string,
  rng: Rng,
): BotStyle {
  if (setup.stylePreset === "all_same") return setup.globalStyle;
  if (setup.stylePreset === "custom" && setup.customConfigs[botId]?.style) {
    return setup.customConfigs[botId]!.style;
  }
  return STYLES[rng.int(STYLES.length)]!;
}

function pickDifficulty(
  setup: BotSetupSettings,
  botId: string,
  index: number,
  count: number,
  rng: Rng,
): BotDifficulty {
  if (setup.difficultyPreset === "all_easy") return "EASY";
  if (setup.difficultyPreset === "all_medium") return "MEDIUM";
  if (setup.difficultyPreset === "all_hard") return "HARD";
  if (setup.difficultyPreset === "custom" && setup.customConfigs[botId]?.difficulty) {
    return setup.customConfigs[botId]!.difficulty;
  }
  if (setup.difficultyPreset === "mixed") {
    // ~1/3 each, assigned by shuffled buckets
    const buckets: BotDifficulty[] = [];
    for (let i = 0; i < count; i += 1) {
      buckets.push(DIFFS[i % 3]!);
    }
    const shuffled = rng.shuffle(buckets);
    return shuffled[index]!;
  }
  return DIFFS[rng.int(DIFFS.length)]!;
}

/** Assign bot configs from setup presets — does not change decideAction logic. */
export function assignBotConfigs(
  botCount: number,
  setup: BotSetupSettings,
  rng: Rng,
): Record<string, BotConfig> {
  const configs: Record<string, BotConfig> = {};
  for (let i = 1; i <= botCount; i += 1) {
    const id = `bot${i}`;
    configs[id] = {
      style: pickStyle(setup, id, rng),
      difficulty: pickDifficulty(setup, id, i - 1, botCount, rng),
    };
  }
  return configs;
}

export { STYLES as BOT_STYLES, DIFFS as BOT_DIFFICULTIES };
