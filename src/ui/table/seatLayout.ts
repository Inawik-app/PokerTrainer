/** Layout geometry for the stadium table. All values are % of the table box. */

export type RectPct = { x: number; y: number; w: number; h: number };

export type SeatLayoutSlot = {
  /** Seat name / stack plate. */
  plate: RectPct;
  /** Bot hole cards (hero has none on table). */
  cards: RectPct | null;
  /** Street bet in front of player. */
  bet: RectPct;
  /** D / PB / GB chips on seat corner toward felt. */
  markers: RectPct;
};

export type TableLayout = {
  center: RectPct;
  seats: SeatLayoutSlot[];
};

const TABLE_CENTER = { x: 50, y: 50 };

/** Reserved center — nothing else may overlap this box. */
export const CENTER_BOX: RectPct = { x: 33.5, y: 36, w: 33, h: 28 };

const PLATE = { w: 11, h: 6.8 };
const CARDS = { w: 7.5, h: 5 };
const CARDS_OVERLAP_PLATE = 2;
const BET = { w: 12.5, h: 6.5 };
const MARKER = { w: 4, h: 4 };
const MARKER_PAIR = { w: 8.4, h: 4 };

const GAP = 0.35;

const RX_BY_COUNT: Record<number, number> = {
  2: 38,
  3: 37,
  4: 36,
  5: 35,
  6: 34,
};
const RY_BY_COUNT: Record<number, number> = {
  2: 32,
  3: 31,
  4: 30,
  5: 29,
  6: 28,
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** Axis-aligned overlap; optional minimum gap between boxes. */
export function rectsOverlap(a: RectPct, b: RectPct, gap = GAP): boolean {
  if (gap <= 0) {
    return (
      a.x < b.x + b.w &&
      b.x < a.x + a.w &&
      a.y < b.y + b.h &&
      b.y < a.y + a.h
    );
  }
  return (
    a.x - gap < b.x + b.w &&
    b.x - gap < a.x + a.w &&
    a.y - gap < b.y + b.h &&
    b.y - gap < a.y + a.h
  );
}

export function rectCenter(r: RectPct): { x: number; y: number } {
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}

function plateAt(centerX: number, centerY: number): RectPct {
  return {
    x: centerX - PLATE.w / 2,
    y: centerY - PLATE.h / 2,
    w: PLATE.w,
    h: PLATE.h,
  };
}

function seatGeometryOk(plate: RectPct): boolean {
  if (rectsOverlap(plate, CENTER_BOX, GAP)) return false;
  const bet = refineBet(plate, betBox(plate));
  if (rectsOverlap(bet, CENTER_BOX, 0)) return false;
  if (rectsOverlap(bet, plate, GAP)) return false;
  const betProbe = refineBet(plate, betBox(plate));
  const markers = markersBox(plate, 2, betProbe);
  if (rectsOverlap(markers, CENTER_BOX, GAP)) return false;
  if (rectsOverlap(markers, betProbe, GAP)) return false;
  return true;
}

/** Move seat outward until plate, bet corridor and markers clear the center zone. */
function ensurePlateClearOfCenter(plate: RectPct): RectPct {
  let r = plate;
  let c = rectCenter(r);
  for (let i = 0; i < 100; i += 1) {
    if (seatGeometryOk(r)) return r;
    const vx = c.x - TABLE_CENTER.x;
    const vy = c.y - TABLE_CENTER.y;
    const len = Math.hypot(vx, vy) || 1;
    c = {
      x: c.x + (vx / len) * 0.55,
      y: c.y + (vy / len) * 0.55,
    };
    r = plateAt(c.x, c.y);
  }
  return r;
}

function cardsAbovePlate(plate: RectPct): RectPct {
  const pc = rectCenter(plate);
  const { ux, uy } = unitTowardCenter(pc.x, pc.y);
  const base = {
    x: plate.x + (plate.w - CARDS.w) / 2,
    y: plate.y - CARDS.h + CARDS_OVERLAP_PLATE,
    w: CARDS.w,
    h: CARDS.h,
  };
  const outward = 1.4;
  return {
    ...base,
    x: base.x - ux * outward * 0.35,
    y: base.y - uy * outward * 0.35,
  };
}

function unitTowardCenter(fromX: number, fromY: number): { ux: number; uy: number; dist: number } {
  const dx = TABLE_CENTER.x - fromX;
  const dy = TABLE_CENTER.y - fromY;
  const dist = Math.hypot(dx, dy) || 1;
  return { ux: dx / dist, uy: dy / dist, dist };
}

/** Bet box on seat → center line, between plate and center zone. */
function betBox(plate: RectPct): RectPct {
  const pc = rectCenter(plate);
  const { ux, uy, dist } = unitTowardCenter(pc.x, pc.y);

  const at = (t: number): RectPct => {
    const cx = pc.x + ux * dist * t;
    const cy = pc.y + uy * dist * t;
    return {
      x: cx - BET.w / 2,
      y: cy - BET.h / 2,
      w: BET.w,
      h: BET.h,
    };
  };

  let best: RectPct | null = null;
  for (let t = 0.1; t <= 0.85; t += 0.006) {
    const candidate = at(t);
    if (rectsOverlap(candidate, CENTER_BOX, GAP)) continue;
    if (rectsOverlap(candidate, plate, GAP)) continue;
    best = candidate;
  }

  return best ?? at(0.22);
}

function refineBet(plate: RectPct, bet: RectPct): RectPct {
  const pc = rectCenter(plate);
  const bc = rectCenter(bet);
  const { ux, uy, dist } = unitTowardCenter(pc.x, pc.y);
  let t = clamp(((bc.x - pc.x) * ux + (bc.y - pc.y) * uy) / dist, 0.08, 0.88);
  const at = (tv: number): RectPct => {
    const cx = pc.x + ux * dist * clamp(tv, 0.08, 0.88);
    const cy = pc.y + uy * dist * clamp(tv, 0.08, 0.88);
    return {
      x: cx - BET.w / 2,
      y: cy - BET.h / 2,
      w: BET.w,
      h: BET.h,
    };
  };
  let b = bet;
  for (let i = 0; i < 60; i += 1) {
    const okCenter = !rectsOverlap(b, CENTER_BOX, 0);
    const okPlate = !rectsOverlap(b, plate, GAP);
    if (okCenter && okPlate) return b;
    t = clamp(t - 0.015, 0.08, 0.88);
    b = at(t);
  }
  return b;
}

function plateCorners(plate: RectPct): { x: number; y: number }[] {
  return [
    { x: plate.x, y: plate.y },
    { x: plate.x + plate.w, y: plate.y },
    { x: plate.x + plate.w, y: plate.y + plate.h },
    { x: plate.x, y: plate.y + plate.h },
  ];
}

function distToTableCenter(x: number, y: number): number {
  return Math.hypot(x - TABLE_CENTER.x, y - TABLE_CENTER.y);
}

function markerAtCorner(
  cornerX: number,
  cornerY: number,
  plate: RectPct,
  size: { w: number; h: number },
): RectPct {
  const pc = rectCenter(plate);
  const vx = cornerX - pc.x;
  const vy = cornerY - pc.y;
  const len = Math.hypot(vx, vy) || 1;
  const ox = (vx / len) * size.w * 0.18;
  const oy = (vy / len) * size.h * 0.18;
  return {
    x: cornerX - size.w / 2 + ox,
    y: cornerY - size.h / 2 + oy,
    w: size.w,
    h: size.h,
  };
}

/** Marker(s) on inner seat corner toward felt; avoids bet stack on the same ray. */
function markersBox(
  plate: RectPct,
  markerCount: 1 | 2,
  bet: RectPct,
): RectPct {
  const size = markerCount === 2 ? MARKER_PAIR : MARKER;
  const corners = plateCorners(plate)
    .slice()
    .sort(
      (a, b) =>
        distToTableCenter(a.x, a.y) - distToTableCenter(b.x, b.y),
    );
  const inner = corners.slice(0, 2);
  const { ux, uy } = unitTowardCenter(
    rectCenter(plate).x,
    rectCenter(plate).y,
  );

  const candidates = inner.map((c) => markerAtCorner(c.x, c.y, plate, size));
  const pick =
    candidates.find(
      (r) =>
        !rectsOverlap(r, CENTER_BOX, GAP) &&
        !rectsOverlap(r, bet, GAP),
    ) ?? candidates[0]!;

  let rect = pick;
  for (let i = 0; i < 48; i += 1) {
    const ok =
      !rectsOverlap(rect, CENTER_BOX, GAP) &&
      !rectsOverlap(rect, bet, GAP);
    if (ok) return rect;
    rect = {
      ...rect,
      x: rect.x - ux * 0.35,
      y: rect.y - uy * 0.35,
    };
  }
  return rect;
}

function nudgeCardsClear(
  plate: RectPct,
  cards: RectPct,
  bet: RectPct,
  markers: RectPct,
): RectPct {
  const pc = rectCenter(plate);
  const { ux, uy } = unitTowardCenter(pc.x, pc.y);
  let c = cards;
  for (let i = 0; i < 40; i += 1) {
    const okBet = !rectsOverlap(c, bet, GAP);
    const okMarkers = !rectsOverlap(c, markers, GAP);
    const okCenter = !rectsOverlap(c, CENTER_BOX, GAP);
    if (okBet && okMarkers && okCenter) return c;
    c = {
      ...c,
      x: c.x - ux * 0.45,
      y: c.y - uy * 0.45,
    };
  }
  return c;
}

function seatAngle(index: number, count: number): number {
  return Math.PI / 2 + (2 * Math.PI * index) / count;
}

function layoutForRadii(count: number, rx: number, ry: number): TableLayout {
  const seats: SeatLayoutSlot[] = [];
  for (let i = 0; i < count; i += 1) {
    const a = seatAngle(i, count);
    const cx = TABLE_CENTER.x + rx * Math.cos(a);
    const cy = TABLE_CENTER.y + ry * Math.sin(a);
    let plate = plateAt(cx, cy);
    plate = ensurePlateClearOfCenter(plate);
    const bet = refineBet(plate, betBox(plate));
    const markers = markersBox(plate, 2, bet);
    let cards = i === 0 ? null : cardsAbovePlate(plate);
    if (cards) {
      cards = nudgeCardsClear(plate, cards, bet, markers);
    }
    seats.push({ plate, cards, bet, markers });
  }
  return { center: { ...CENTER_BOX }, seats };
}

type LabeledRect = {
  seatIndex: number;
  kind: "center" | "plate" | "cards" | "bet" | "markers";
  rect: RectPct;
};

function labeledRects(layout: TableLayout): LabeledRect[] {
  const out: LabeledRect[] = [
    { seatIndex: -1, kind: "center", rect: layout.center },
  ];
  layout.seats.forEach((s, i) => {
    out.push({ seatIndex: i, kind: "plate", rect: s.plate });
    out.push({ seatIndex: i, kind: "bet", rect: s.bet });
    out.push({ seatIndex: i, kind: "markers", rect: s.markers });
    if (s.cards) {
      out.push({ seatIndex: i, kind: "cards", rect: s.cards });
    }
  });
  return out;
}

/** Same-seat card/plate and marker/plate may touch by design. */
function shouldCheckOverlap(a: LabeledRect, b: LabeledRect): boolean {
  if (a.seatIndex !== b.seatIndex) return true;
  const kinds = new Set([a.kind, b.kind]);
  if (kinds.has("cards") && kinds.has("plate")) return false;
  if (kinds.has("markers") && kinds.has("plate")) return false;
  return true;
}

function layoutValid(layout: TableLayout): boolean {
  const boxes = labeledRects(layout);
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      const a = boxes[i]!;
      const b = boxes[j]!;
      if (!shouldCheckOverlap(a, b)) continue;
      const gap =
        a.kind === "center" || b.kind === "center" ? GAP : GAP;
      if (rectsOverlap(a.rect, b.rect, gap)) return false;
      if (
        (a.kind === "bet" && b.kind === "center") ||
        (a.kind === "center" && b.kind === "bet")
      ) {
        if (rectsOverlap(a.rect, b.rect, 0)) return false;
      }
    }
  }
  return true;
}

/**
 * Distribute seats evenly; index 0 = hero at bottom center.
 * Shrinks ellipse slightly until bounding boxes do not overlap.
 */
export function getSeatLayout(count: number): TableLayout {
  const n = clamp(Math.round(count), 2, 6);
  let rx = RX_BY_COUNT[n] ?? 34;
  let ry = RY_BY_COUNT[n] ?? 29;

  for (let attempt = 0; attempt < 36; attempt += 1) {
    const layout = layoutForRadii(n, rx, ry);
    if (layoutValid(layout)) return layout;
    rx -= 0.45;
    ry -= 0.34;
  }

  return layoutForRadii(n, rx, ry);
}

/** CSS for absolute placement from a layout rect (top-left anchor). */
export function rectStyle(r: RectPct): {
  left: string;
  top: string;
  width: string;
  height: string;
} {
  return {
    left: `${r.x}%`,
    top: `${r.y}%`,
    width: `${r.w}%`,
    height: `${r.h}%`,
  };
}

/** Update marker box width when player has two markers (HU dealer+SB). */
export function markerBoxForCount(
  plate: RectPct,
  count: 1 | 2,
  bet: RectPct,
): RectPct {
  return markersBox(plate, count, bet);
}

/** All layout rects for overlap testing (same rules as layoutValid). */
export function collectLayoutRects(layout: TableLayout): RectPct[] {
  return labeledRects(layout).map((l) => l.rect);
}

export function layoutHasOverlaps(layout: TableLayout): boolean {
  return !layoutValid(layout);
}

export function forbiddenOverlaps(
  layout: TableLayout,
): { a: LabeledRect; b: LabeledRect }[] {
  const boxes = labeledRects(layout);
  const hits: { a: LabeledRect; b: LabeledRect }[] = [];
  for (let i = 0; i < boxes.length; i += 1) {
    for (let j = i + 1; j < boxes.length; j += 1) {
      const a = boxes[i]!;
      const b = boxes[j]!;
      if (!shouldCheckOverlap(a, b)) continue;
      const gap = GAP;
      if (rectsOverlap(a.rect, b.rect, gap)) hits.push({ a, b });
      if (
        (a.kind === "bet" && b.kind === "center") ||
        (a.kind === "center" && b.kind === "bet")
      ) {
        if (rectsOverlap(a.rect, b.rect, 0)) hits.push({ a, b });
      }
    }
  }
  return hits;
}
