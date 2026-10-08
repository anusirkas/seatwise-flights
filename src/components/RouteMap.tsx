import { FLIGHTS } from "../lib/flights";

// Airport positions on a simple equirectangular projection of northern Europe
// (longitude -12..32, latitude 38..62) in a 600 x 400 box.
const AIRPORTS: Record<string, [lon: number, lat: number]> = {
  TLL: [24.8, 59.4],
  LHR: [-0.45, 51.5],
  CDG: [2.55, 49.0],
  ARN: [17.9, 59.65],
  FCO: [12.25, 41.8],
  BER: [13.5, 52.4],
  AMS: [4.76, 52.3],
  BCN: [2.08, 41.3],
  CPH: [12.65, 55.6],
};

const project = ([lon, lat]: [number, number]) => [((lon + 12) / 44) * 600, ((62 - lat) / 24) * 400] as const;

/** An arc from a to b, bowed to the left of the direction of travel like a great-circle route on a flat map. */
function arc(a: readonly [number, number], b: readonly [number, number]) {
  const [mx, my] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const bend = 0.22;
  return `M${a[0]},${a[1]} Q${mx + dy * bend},${my - dx * bend} ${b[0]},${b[1]}`;
}

type Props = {
  /** Airport code to highlight, from a hovered map point or departure row. */
  active?: string;
  onHover?: (code: string | undefined) => void;
};

/** Routes out of Tallinn, drawn in one by one. Hovering a destination names it in full. */
export default function RouteMap({ active, onHover }: Props) {
  const home = project(AIRPORTS.TLL);
  const activeFlight = FLIGHTS.find((f) => f.toCode === active);
  return (
    <svg className="route-map" viewBox="0 0 600 400" role="img" aria-label="Route map: flights from Tallinn">
      <defs>
        <pattern id="dots" width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.09)" />
        </pattern>
      </defs>
      <rect width="600" height="400" fill="url(#dots)" />
      {FLIGHTS.map((f, i) => {
        const to = project(AIRPORTS[f.toCode]);
        const isActive = active === f.toCode;
        return (
          <g
            key={f.id}
            className={`route ${isActive ? "is-active" : ""}`}
            style={{ "--i": i } as React.CSSProperties}
            onMouseEnter={() => onHover?.(f.toCode)}
            onMouseLeave={() => onHover?.(undefined)}
          >
            <path d={arc(home, to)} pathLength={1} className="route-line" />
            <circle cx={to[0]} cy={to[1]} r={isActive ? 6 : 4} className="route-dot" />
            {/* a bigger invisible target, so the small dots are easy to hover */}
            <circle cx={to[0]} cy={to[1]} r="18" className="route-hit" />
            <text x={to[0]} y={to[1] + 18} textAnchor="middle" className="route-code">
              {f.toCode}
            </text>
          </g>
        );
      })}
      {/* the full name goes on its own top layer, so it is never hidden behind other routes */}
      {activeFlight && (
        <text
          x={project(AIRPORTS[activeFlight.toCode])[0]}
          y={project(AIRPORTS[activeFlight.toCode])[1] + 18}
          textAnchor="middle"
          className="route-label"
        >
          {activeFlight.toCode} · {activeFlight.to}
        </text>
      )}
      <circle cx={home[0]} cy={home[1]} r="7" className="home-dot" />
      <circle cx={home[0]} cy={home[1]} r="7" className="home-pulse" />
      <text x={home[0]} y={home[1] - 14} textAnchor="middle" className="route-code home-code">
        TLL
      </text>
    </svg>
  );
}
