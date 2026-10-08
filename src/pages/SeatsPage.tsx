import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import SeatMap from "../components/SeatMap";
import { findFlight, formatDate } from "../lib/flights";
import { buildCabin, type Seat } from "../lib/plane";
import { recommend, type Preferences } from "../lib/recommend";

const TOGGLES: { key: keyof Omit<Preferences, "passengers">; label: string; hint: string }[] = [
  { key: "window", label: "Window", hint: "Seats A and F" },
  { key: "legroom", label: "Extra legroom", hint: "Rows 1, 12 and 13" },
  { key: "nearExit", label: "Near an exit", hint: "Front, over the wing, back" },
  { key: "together", label: "Sit together", hint: "Same row, side by side" },
];

export default function SeatsPage() {
  const { id } = useParams();
  const flight = findFlight(id);
  const [params, setParams] = useSearchParams();

  const prefs: Preferences = {
    passengers: Math.min(6, Math.max(1, Number(params.get("passengers") ?? 2) || 2)),
    window: params.get("window") === "1",
    legroom: params.get("legroom") === "1",
    nearExit: params.get("nearExit") === "1",
    together: params.get("together") !== "0", // on by default
  };
  const prefsKey = JSON.stringify(prefs);

  const cabin = useMemo(() => (flight ? buildCabin(flight.id, flight.loadFactor) : []), [flight]);
  const result = useMemo(() => recommend(cabin, JSON.parse(prefsKey) as Preferences), [cabin, prefsKey]);

  // Manual picks belong to one set of preferences; changing a preference goes back to the recommendation.
  const [manual, setManual] = useState<{ key: string; ids: string[] } | null>(null);
  const manualIds = manual?.key === prefsKey ? manual.ids : null;
  const recommendedIds = useMemo(() => new Set(result?.seats.map((s) => s.id)), [result]);
  const selectedIds = new Set(manualIds ?? recommendedIds);

  if (!flight) {
    return (
      <>
        <Header />
        <main className="page">
          <p className="empty">
            That flight doesn&apos;t exist. <Link to="/">Back to departures</Link>
          </p>
        </main>
      </>
    );
  }

  const setPref = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value === null) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const toggleSeat = (seat: Seat) => {
    const current = [...selectedIds];
    const ids = current.includes(seat.id)
      ? current.filter((x) => x !== seat.id)
      : [...current, seat.id].slice(-prefs.passengers); // keep the most recent picks
    setManual({ key: prefsKey, ids });
  };

  const chosen = cabin
    .filter((s) => selectedIds.has(s.id))
    .sort((a, b) => a.row - b.row || a.column.localeCompare(b.column));
  const missing = prefs.passengers - chosen.length;

  return (
    <>
      <Header />
      <main className="page seats-page">
        <Link to="/" className="back">
          ← All departures
        </Link>
        <div className="seats-layout">
          <aside className="prefs">
            <p className="eyebrow">
              {flight.number} · {formatDate(flight.date)}
            </p>
            <h1>
              Tallinn <span aria-hidden="true">→</span> {flight.to}
            </h1>

            <fieldset>
              <legend>Travellers</legend>
              <div className="stepper">
                <button type="button" onClick={() => setPref("passengers", String(prefs.passengers - 1))} disabled={prefs.passengers <= 1} aria-label="Fewer travellers">
                  −
                </button>
                <output aria-live="polite">{prefs.passengers}</output>
                <button type="button" onClick={() => setPref("passengers", String(prefs.passengers + 1))} disabled={prefs.passengers >= 6} aria-label="More travellers">
                  +
                </button>
              </div>
            </fieldset>

            <fieldset>
              <legend>What matters</legend>
              {TOGGLES.map((t) => (
                <label key={t.key} className="toggle">
                  <input
                    type="checkbox"
                    checked={prefs[t.key]}
                    onChange={(e) => setPref(t.key, t.key === "together" ? (e.target.checked ? null : "0") : e.target.checked ? "1" : null)}
                  />
                  <span>
                    {t.label}
                    <small>{t.hint}</small>
                  </span>
                </label>
              ))}
            </fieldset>

            <ul className="legend" aria-label="Legend">
              <li>
                <span className="seat chosen" /> Your seats
              </li>
              <li>
                <span className="seat free" /> Free
              </li>
              <li>
                <span className="seat taken" /> Taken
              </li>
              <li>
                <span className="legend-legroom" /> Extra legroom
              </li>
            </ul>
          </aside>

          <SeatMap cabin={cabin} selected={selectedIds} recommended={recommendedIds} onToggle={toggleSeat} />

          <section className="pass" aria-label="Your seats">
            <div className="pass-top">
              <span className="mono">{flight.number}</span>
              <span className="mono">{formatDate(flight.date)}</span>
            </div>
            <div className="pass-route">
              <div>
                <strong>TLL</strong>
                <small>{flight.departs}</small>
              </div>
              <span className="pass-plane" aria-hidden="true">
                ✈
              </span>
              <div>
                <strong>{flight.toCode}</strong>
                <small>{flight.arrives}</small>
              </div>
            </div>
            <div className="pass-seats">
              <p className="eyebrow">{manualIds ? "Your picks" : "Recommended seats"}</p>
              {chosen.length > 0 ? (
                <p className="seat-list mono">{chosen.map((s) => s.id).join("  ")}</p>
              ) : (
                <p className="muted">No seats picked.</p>
              )}
              {missing > 0 && <p className="warn">Pick {missing} more {missing === 1 ? "seat" : "seats"} on the map.</p>}
            </div>
            <div className="pass-notes">
              {result === null ? (
                <p className="warn">This flight doesn&apos;t have {prefs.passengers} free seats left.</p>
              ) : manualIds ? (
                <button type="button" className="link" onClick={() => setManual(null)}>
                  Back to the recommendation
                </button>
              ) : (
                <ul>
                  {(result.notes.length ? result.notes : ["Best free seats towards the front of the plane."]).map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              )}
            </div>
            <p className="pass-hint">Tap any free seat to change the picks.</p>
          </section>
        </div>
      </main>
    </>
  );
}
