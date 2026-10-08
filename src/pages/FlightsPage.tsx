import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Header from "../components/Header";
import Plane from "../components/Plane";
import RouteMap from "../components/RouteMap";
import SplitFlap from "../components/SplitFlap";
import { FLIGHTS, formatDate } from "../lib/flights";

const MAX_PRICE = Math.max(...FLIGHTS.map((f) => f.price));

export default function FlightsPage() {
  const [params, setParams] = useSearchParams();
  const [hovered, setHoveredNow] = useState<string>();
  // a short delay before highlighting, so sweeping the mouse across the map doesn't flicker
  const hoverTimer = useRef(0);
  const setHovered = (code: string | undefined) => {
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(() => setHoveredNow(code), code ? 120 : 60);
  };
  useEffect(() => () => window.clearTimeout(hoverTimer.current), []);
  const to = params.get("to") ?? "";
  const maxPrice = Number(params.get("max") ?? MAX_PRICE);

  const flights = useMemo(
    () => FLIGHTS.filter((f) => (!to || f.toCode === to) && f.price <= maxPrice),
    [to, maxPrice],
  );

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <>
      <Header />
      <section className="hero">
        <div className="contrail" aria-hidden="true">
          <span className="contrail-trail" />
          <Plane size={28} className="contrail-plane" />
        </div>
        <div className="hero-inner">
          <div className="hero-text">
            <p className="eyebrow light">Departures · Tallinn</p>
            <h1>
              Pick a flight.
              <br />
              We&apos;ll find your <span className="hl">seats.</span>
            </h1>
            <p className="lead">
              Tell Seatwise who&apos;s travelling and what matters: a window, legroom, being near an exit, sitting
              together. It scores every free seat on the plane and explains its choice.
            </p>
          </div>
          <RouteMap active={hovered ?? (to || undefined)} onHover={setHovered} />
        </div>
      </section>

      <main className="page">
        <div className="board-bar">
          <h2 className="board-title">
            <SplitFlap text="DEPARTURES" />
          </h2>
          <form className="filters" onSubmit={(e) => e.preventDefault()}>
            <label>
              <span>Destination</span>
              <select value={to} onChange={(e) => update("to", e.target.value)}>
                <option value="">Anywhere</option>
                {FLIGHTS.map((f) => (
                  <option key={f.id} value={f.toCode}>
                    {f.to} ({f.toCode})
                  </option>
                ))}
              </select>
            </label>
            <label className="range">
              <span>
                Max price <output>€{maxPrice}</output>
              </span>
              <input
                type="range"
                min={50}
                max={MAX_PRICE}
                step={10}
                value={maxPrice}
                onChange={(e) => update("max", e.target.value === String(MAX_PRICE) ? "" : e.target.value)}
              />
            </label>
          </form>
        </div>

        <div className="board" role="table" aria-label="Departures">
          <div className="board-head" role="row">
            <span role="columnheader">Time</span>
            <span role="columnheader">Destination</span>
            <span role="columnheader">Flight</span>
            <span role="columnheader">Seats left</span>
            <span role="columnheader">From</span>
            <span role="columnheader" className="sr-only">
              Choose
            </span>
          </div>
          {flights.map((f, i) => {
            const left = Math.round(180 * (1 - f.loadFactor));
            return (
              <Link
                key={f.id}
                to={`/flights/${f.id}`}
                className="board-row"
                role="row"
                onMouseEnter={() => setHovered(f.toCode)}
                onMouseLeave={() => setHovered(undefined)}
                onFocus={() => setHovered(f.toCode)}
                onBlur={() => setHovered(undefined)}
              >
                <span role="cell" className="mono">
                  <strong>{f.departs}</strong>
                  <small>{formatDate(f.date)}</small>
                </span>
                <span role="cell" className="dest">
                  <SplitFlap text={f.to.toUpperCase()} delay={(i % 3) * 90} />
                  <small className="mono">{f.toCode}</small>
                </span>
                <span role="cell" className="mono">
                  {f.number}
                </span>
                <span role="cell" className={`mono ${left < 30 ? "low" : ""}`}>
                  {left < 30 ? `Only ~${left}` : `~${left}`}
                </span>
                <span role="cell" className="mono price">
                  €{f.price}
                </span>
                <span role="cell" className="go">
                  Choose seats →
                </span>
              </Link>
            );
          })}
          {flights.length === 0 && <p className="empty">No flights under €{maxPrice}. Raise the max price.</p>}
        </div>
      </main>
      <footer className="footer">
        Built by <a href="https://portfolio-anu-sirkas-projects.vercel.app">Anu Sirkas</a> · React, TypeScript, Vitest ·{" "}
        <a href="https://github.com/anusirkas/seatwise-flights">Source</a>
      </footer>
    </>
  );
}
