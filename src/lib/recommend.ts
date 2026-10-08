import { COLUMNS, hasLegroom, isWindow, rowsToExit, type Seat } from "./plane";

export type Preferences = {
  passengers: number;
  window: boolean;
  legroom: boolean;
  nearExit: boolean;
  together: boolean;
};

export type Recommendation = {
  seats: Seat[];
  /** Whether the group got a single row (possibly across the aisle). */
  together: boolean;
  /** Human-readable notes on what was and wasn't possible. */
  notes: string[];
};

/** How much one seat matches the preferences. Front rows win ties, since you get off sooner. */
export function scoreSeat(seat: Seat, p: Preferences): number {
  let score = (30 - seat.row) * 0.01;
  if (p.window && isWindow(seat)) score += 3;
  if (p.legroom && hasLegroom(seat)) score += 3;
  if (p.nearExit) score += Math.max(0, 3 - rowsToExit(seat) * 0.5);
  return score;
}

const columnIndex = (s: Seat) => COLUMNS.indexOf(s.column);

/** Every run of `size` free, side-by-side seats in one row. Crossing the aisle (C to D) is allowed but costs a point. */
function rowRuns(free: Seat[], size: number) {
  const runs: { seats: Seat[]; aislePenalty: number }[] = [];
  const byRow = new Map<number, Seat[]>();
  for (const s of free) byRow.set(s.row, [...(byRow.get(s.row) ?? []), s]);
  for (const seats of byRow.values()) {
    const sorted = [...seats].sort((a, b) => columnIndex(a) - columnIndex(b));
    for (let i = 0; i + size <= sorted.length; i++) {
      const run = sorted.slice(i, i + size);
      const contiguous = run.every((s, k) => k === 0 || columnIndex(s) === columnIndex(run[k - 1]) + 1);
      if (contiguous) runs.push({ seats: run, aislePenalty: run.some((s) => s.column === "D") && run.some((s) => s.column === "C") ? 1 : 0 });
    }
  }
  return runs;
}

const total = (seats: Seat[], p: Preferences) => seats.reduce((sum, s) => sum + scoreSeat(s, p), 0);

/**
 * Picks seats for the group. With `together`, the best single-row run wins; if no row has room,
 * the group is split over two neighbouring rows and the notes say so. Returns null when the
 * flight doesn't have enough free seats.
 */
export function recommend(cabin: Seat[], p: Preferences): Recommendation | null {
  const free = cabin.filter((s) => !s.occupied);
  if (p.passengers < 1 || free.length < p.passengers) return null;

  let seats: Seat[];
  let together = p.passengers === 1;

  if (p.together && p.passengers > 1) {
    const runs = rowRuns(free, p.passengers);
    if (runs.length > 0) {
      runs.sort((a, b) => total(b.seats, p) - b.aislePenalty - (total(a.seats, p) - a.aislePenalty));
      seats = runs[0].seats;
      together = true;
    } else {
      seats = bestAcrossTwoRows(free, p);
    }
  } else {
    seats = [...free].sort((a, b) => scoreSeat(b, p) - scoreSeat(a, p)).slice(0, p.passengers);
    together = p.passengers === 1 || seats.every((s) => s.row === seats[0].row);
  }

  seats = [...seats].sort((a, b) => a.row - b.row || columnIndex(a) - columnIndex(b));
  return { seats, together, notes: explain(seats, p, together) };
}

/** Fallback for groups that don't fit in one row: the best seats from any two neighbouring rows. */
function bestAcrossTwoRows(free: Seat[], p: Preferences): Seat[] {
  let best: Seat[] = [];
  let bestScore = -Infinity;
  for (let row = 1; row < 30; row++) {
    const pool = free.filter((s) => s.row === row || s.row === row + 1);
    if (pool.length < p.passengers) continue;
    const picked = [...pool].sort((a, b) => scoreSeat(b, p) - scoreSeat(a, p)).slice(0, p.passengers);
    const score = total(picked, p);
    if (score > bestScore) {
      best = picked;
      bestScore = score;
    }
  }
  // no two neighbouring rows have room either: take the best seats anywhere
  return best.length ? best : [...free].sort((a, b) => scoreSeat(b, p) - scoreSeat(a, p)).slice(0, p.passengers);
}

function explain(seats: Seat[], p: Preferences, together: boolean): string[] {
  const n = seats.length;
  const count = (test: (s: Seat) => boolean) => seats.filter(test).length;
  const notes: string[] = [];
  if (p.together && n > 1) {
    notes.push(together ? "Seated together in one row." : "No row had room for everyone, so the group is split over neighbouring rows.");
  }
  if (p.window) {
    const w = count(isWindow);
    notes.push(w === n ? (n === 1 ? "Window seat." : "Everyone by a window.") : `${w} of ${n} by a window${p.together ? " (one window per side of a row)" : ""}.`);
  }
  if (p.legroom) {
    const l = count(hasLegroom);
    notes.push(l === n ? "Extra legroom for everyone." : l === 0 ? "No extra-legroom seats were free." : `${l} of ${n} with extra legroom.`);
  }
  if (p.nearExit) {
    const nearest = Math.min(...seats.map(rowsToExit));
    notes.push(nearest === 0 ? "Right at an exit row." : `${nearest} ${nearest === 1 ? "row" : "rows"} from the nearest exit.`);
  }
  return notes;
}
