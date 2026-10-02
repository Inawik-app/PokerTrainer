"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { formatChips } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  className?: string;
};

/** Animated tally for stack amounts. */
export function AnimatedChips({ value, className }: Props) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (reduce || display === value) {
      setDisplay(value);
      return;
    }
    const start = display;
    const delta = value - start;
    const t0 = performance.now();
    const dur = 450;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - (1 - p) ** 3;
      setDisplay(Math.round(start + delta * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // intentionally only react to value changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reduce]);

  return (
    <span className={cn("font-display tabular-nums", className)}>
      {formatChips(display)}
    </span>
  );
}
