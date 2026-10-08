import { COLUMNS, EXIT_ROWS, hasLegroom, ROWS, type Seat } from "../lib/plane";

type Props = {
  cabin: Seat[];
  selected: Set<string>;
  recommended: Set<string>;
  onToggle: (seat: Seat) => void;
};

/** The cabin seen from above, nose at the top. Free seats are buttons; occupied ones are not. */
export default function SeatMap({ cabin, selected, recommended, onToggle }: Props) {
  const byId = new Map(cabin.map((s) => [s.id, s]));

  return (
    <div className="plane" aria-label="Seat map">
      <div className="nose" aria-hidden="true" />
      <div className="cabin-cols" aria-hidden="true">
        {COLUMNS.map((c, i) => (
          <span key={c} className={i === 3 ? "after-aisle" : ""}>
            {c}
          </span>
        ))}
      </div>
      {Array.from({ length: ROWS }, (_, i) => i + 1).map((row) => (
        <div key={row} className={`cabin-row ${hasLegroom({ row }) ? "legroom" : ""} ${EXIT_ROWS.includes(row) ? "exit" : ""}`}>
          {EXIT_ROWS.includes(row) && (
            <span className="exit-mark" aria-hidden="true">
              Exit
            </span>
          )}
          {COLUMNS.map((column, i) => {
            const seat = byId.get(`${row}${column}`)!;
            const isSelected = selected.has(seat.id);
            const state = seat.occupied ? "taken" : isSelected ? "chosen" : "free";
            return (
              <button
                key={seat.id}
                type="button"
                className={`seat ${state} ${i === 3 ? "after-aisle" : ""} ${recommended.has(seat.id) && !isSelected ? "was-recommended" : ""}`}
                disabled={seat.occupied}
                aria-pressed={isSelected}
                aria-label={`Seat ${seat.id}${seat.occupied ? ", taken" : isSelected ? ", selected" : ", free"}`}
                onClick={() => onToggle(seat)}
              >
                {isSelected ? seat.id : ""}
              </button>
            );
          })}
          <span className="row-number" aria-hidden="true">
            {row}
          </span>
        </div>
      ))}
    </div>
  );
}
