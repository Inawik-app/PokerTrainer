"use client";

import { getAdvice } from "@/coach";
import { ui } from "@/content/wording";
import { cn } from "@/lib/utils";

type Props = {
  equity: number;
  toCall: number;
  pot: number;
  outsCount: number;
};

export function CoachPanel({ equity, toCall, pot, outsCount }: Props) {
  const advice = getAdvice(equity, toCall, pot, outsCount);
  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-text">{ui.coachTitle}</h2>
      <div
        className={cn(
          "rounded-lg border border-border p-3 text-sm",
          advice.level === "good" && "bg-success/15 text-text",
          advice.level === "careful" && "bg-warning/15 text-text",
          advice.level === "bad" && "bg-danger/15 text-text",
        )}
      >
        {advice.message}
      </div>
    </div>
  );
}
