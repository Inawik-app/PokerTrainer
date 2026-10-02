export type DifficultyTuning = {
  noise: number;
  equityIterations: number;
  usePotOdds: boolean;
};

export function difficultyTuning(
  level: "EASY" | "MEDIUM" | "HARD",
): DifficultyTuning {
  switch (level) {
    case "EASY":
      return { noise: 0.3, equityIterations: 0, usePotOdds: false };
    case "MEDIUM":
      return { noise: 0.1, equityIterations: 200, usePotOdds: true };
    case "HARD":
      return { noise: 0.03, equityIterations: 400, usePotOdds: true };
  }
}
