import { describe, expect, it } from "vitest";
import { buildCabin, COLUMNS, hasLegroom, isWindow, ROWS, type Seat } from "./plane";
import { recommend, type Preferences } from "./recommend";

const prefs = (p: Partial<Preferences> = {}): Preferences => ({
  passengers: 1,
  window: false,
  legroom: false,
  nearExit: false,
  together: false,
  ...p,
});

/** An empty cabin with only the listed seats occupied. */
function cabin(occupied: string[] = []): Seat[] {
  const seats: Seat[] = [];
  for (let row = 1; row <= ROWS; row++) {
    for (const column of COLUMNS) seats.push({ id: `${row}${column}`, row, column, occupied: occupied.includes(`${row}${column}`) });
  }
  return seats;
}

/** Fills every seat except the listed ones. */
const onlyFree = (free: string[]) => cabin().map((s) => ({ ...s, occupied: !free.includes(s.id) }));

describe("recommend", () => {
  it("gives a single traveller a window seat when asked", () => {
    const r = recommend(cabin(), prefs({ window: true }))!;
    expect(r.seats).toHaveLength(1);
    expect(isWindow(r.seats[0])).toBe(true);
  });

  it("never picks an occupied seat", () => {
    const busy = buildCabin("TLL-LHR-1", 0.8);
    const r = recommend(busy, prefs({ passengers: 4, window: true }))!;
    for (const s of r.seats) expect(busy.find((b) => b.id === s.id)!.occupied).toBe(false);
  });

  it("seats a group side by side in one row", () => {
    const r = recommend(cabin(), prefs({ passengers: 3, together: true }))!;
    expect(r.together).toBe(true);
    expect(new Set(r.seats.map((s) => s.row)).size).toBe(1);
    expect(r.seats.map((s) => s.column).join("")).toMatch(/ABC|DEF/);
  });

  it("prefers one side of the aisle over crossing it", () => {
    const r = recommend(cabin(), prefs({ passengers: 2, together: true }))!;
    expect(r.seats.map((s) => s.column).join("")).not.toBe("CD");
  });

  it("uses extra-legroom rows when asked", () => {
    const r = recommend(cabin(), prefs({ passengers: 2, legroom: true }))!;
    expect(r.seats.every(hasLegroom)).toBe(true);
  });

  it("splits the group over neighbouring rows when no row has room, and says so", () => {
    // only pairs are free: 5A 5B and 6A 6B
    const r = recommend(onlyFree(["5A", "5B", "6A", "6B"]), prefs({ passengers: 3, together: true }))!;
    expect(r.together).toBe(false);
    expect(r.seats.every((s) => s.row === 5 || s.row === 6)).toBe(true);
    expect(r.notes[0]).toMatch(/split/);
  });

  it("returns null when the flight is too full", () => {
    expect(recommend(onlyFree(["1A"]), prefs({ passengers: 2 }))).toBeNull();
  });

  it("explains a partial match", () => {
    const r = recommend(cabin(), prefs({ passengers: 3, together: true, window: true }))!;
    expect(r.notes).toContain("1 of 3 by a window (one window per side of a row).");
  });
});

describe("buildCabin", () => {
  it("is the same for the same flight, so the seat map doesn't change on reload", () => {
    expect(buildCabin("TLL-CDG-2", 0.6)).toEqual(buildCabin("TLL-CDG-2", 0.6));
  });

  it("roughly follows the load factor", () => {
    const occupied = buildCabin("TLL-ARN-3", 0.5).filter((s) => s.occupied).length;
    expect(occupied / 180).toBeGreaterThan(0.35);
    expect(occupied / 180).toBeLessThan(0.65);
  });
});
