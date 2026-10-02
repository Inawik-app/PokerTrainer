"use client";

import { useEffect, useState } from "react";
import type { Card } from "@/engine";
import { computeEquity, type EquityResult } from "@/odds";
import { createRng } from "@/lib/rng";

type Args = {
  hero: Card[] | null;
  board: Card[];
  opponents: number;
  enabled: boolean;
};

export function useEquity({
  hero,
  board,
  opponents,
  enabled,
}: Args): EquityResult | null {
  const [result, setResult] = useState<EquityResult | null>(null);

  useEffect(() => {
    if (!enabled || !hero || hero.length < 2 || opponents < 1) {
      setResult(null);
      return;
    }

    let cancelled = false;
    const key = `${hero.map((c) => c.rank + c.suit).join("")}|${board.map((c) => c.rank + c.suit).join("")}|${opponents}`;

    const run = (iterations: number, seed: number) => {
      if (cancelled) return;
      const next = computeEquity({
        hero,
        board,
        opponents,
        iterations,
        rng: createRng(seed),
      });
      if (!cancelled) setResult(next);
    };

    // Progressive refine
    run(800, hash(key));
    const t = window.setTimeout(() => run(6000, hash(key) + 1), 50);
    const t2 = window.setTimeout(() => run(15000, hash(key) + 2), 200);

    return () => {
      cancelled = true;
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [
    enabled,
    opponents,
    hero?.map((c) => c.rank + c.suit).join(""),
    board.map((c) => c.rank + c.suit).join(""),
  ]);

  return result;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
