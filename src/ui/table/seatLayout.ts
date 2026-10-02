/** Pure seat geometry for the stadium table. Percentages of the table box. */

export type PointPct = { left: number; top: number };

export type SeatLayoutSlot = {
  /** Center of the seat plate. */
  seat: PointPct;
  /** Bet / chip stack zone (~30 % from seat toward table center). */
  bet: PointPct;
  /** D / PB / GB marker, beside the bet (perpendicular offset). */
  marker: PointPct;
};

const CENTER: PointPct = { left: 50, top: 50 };

/** Ellipse radii so seats stay inside the stadium rail. */
const RX = 42;
const RY = 36;

/**
 * Distribute `count` seats evenly on the table perimeter.
 * Index 0 is always the human player at bottom center.
 */
export function getSeatLayout(count: number): SeatLayoutSlot[] {
  const n = Math.max(2, Math.min(6, Math.round(count)));
  const slots: SeatLayoutSlot[] = [];

  for (let i = 0; i < n; i += 1) {
    // Bottom center = π/2 in screen coords (y grows downward).
    // Then counter-clockwise so the next seat is on the hero's left.
    const angle = Math.PI / 2 + (2 * Math.PI * i) / n;
    const seat: PointPct = {
      left: CENTER.left + RX * Math.cos(angle),
      top: CENTER.top + RY * Math.sin(angle),
    };

    const towardCx = CENTER.left - seat.left;
    const towardCy = CENTER.top - seat.top;
    const bet: PointPct = {
      left: seat.left + towardCx * 0.3,
      top: seat.top + towardCy * 0.3,
    };

    // Perpendicular offset so marker doesn't cover the bet pile.
    const len = Math.hypot(towardCx, towardCy) || 1;
    const nx = -towardCy / len;
    const ny = towardCx / len;
    // Alternate side slightly based on seat index for HU symmetry.
    const side = i % 2 === 0 ? 1 : -1;
    const offset = 4.5;
    const marker: PointPct = {
      left: bet.left + nx * offset * side,
      top: bet.top + ny * offset * side,
    };

    slots.push({ seat, bet, marker });
  }

  return slots;
}

export function pct(p: PointPct): { left: string; top: string } {
  return { left: `${p.left}%`, top: `${p.top}%` };
}
