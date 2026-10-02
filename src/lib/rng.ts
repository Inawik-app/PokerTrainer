export type Rng = {
  next: () => number;
  int: (max: number) => number;
  shuffle: <T>(array: T[]) => T[];
};

/** Cryptographically random uint32 for game seeds. Only place Math/crypto randomness is allowed. */
export function randomSeed(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0]!;
}

/** Use a manual seed when provided, otherwise crypto. */
export function resolveGameSeed(manualSeed: number | null | undefined): number {
  if (
    manualSeed != null &&
    typeof manualSeed === "number" &&
    Number.isFinite(manualSeed)
  ) {
    return manualSeed >>> 0;
  }
  return randomSeed();
}

/** Mulberry32 seeded PRNG. Fisher-Yates shuffle from end to start. */
export function createRng(seed: number): Rng {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (max: number): number => {
    if (max <= 0) return 0;
    return Math.floor(next() * max);
  };

  const shuffle = <T>(array: T[]): T[] => {
    const result = array.slice();
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = int(i + 1);
      const tmp = result[i]!;
      result[i] = result[j]!;
      result[j] = tmp;
    }
    return result;
  };

  return { next, int, shuffle };
}
