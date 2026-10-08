// An A320-style cabin: 30 rows of A B C | D E F, with exits at the front, over the wing and at the back.

export const ROWS = 30;
export const COLUMNS = ["A", "B", "C", "D", "E", "F"] as const;
export type Column = (typeof COLUMNS)[number];

/** Rows with an exit door beside them. */
export const EXIT_ROWS = [1, 12, 13, 30];
/** Rows with extra legroom: the bulkhead row and the over-wing exit rows. */
export const LEGROOM_ROWS = [1, 12, 13];

export type Seat = {
  id: string; // "12A"
  row: number;
  column: Column;
  occupied: boolean;
};

export const isWindow = (s: Pick<Seat, "column">) => s.column === "A" || s.column === "F";
export const isAisle = (s: Pick<Seat, "column">) => s.column === "C" || s.column === "D";
export const hasLegroom = (s: Pick<Seat, "row">) => LEGROOM_ROWS.includes(s.row);
export const rowsToExit = (s: Pick<Seat, "row">) => Math.min(...EXIT_ROWS.map((r) => Math.abs(r - s.row)));

/** Small deterministic PRNG (mulberry32), so a flight always shows the same occupied seats. */
export function random(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashSeed(text: string) {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** Builds the cabin for a flight. Occupancy is seeded by the flight id and roughly matches the load factor. */
export function buildCabin(flightId: string, loadFactor: number): Seat[] {
  const next = random(hashSeed(flightId));
  const seats: Seat[] = [];
  for (let row = 1; row <= ROWS; row++) {
    for (const column of COLUMNS) {
      // window and aisle seats sell first, like on a real flight
      const demand = isWindow({ column }) || isAisle({ column }) ? 1.15 : 0.7;
      seats.push({ id: `${row}${column}`, row, column, occupied: next() < loadFactor * demand });
    }
  }
  return seats;
}
