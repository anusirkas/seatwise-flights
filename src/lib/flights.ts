export type Flight = {
  id: string;
  number: string;
  from: string;
  to: string;
  toCode: string;
  date: string; // ISO date
  departs: string; // HH:MM
  arrives: string;
  price: number; // EUR, from
  loadFactor: number; // share of seats already sold
};

// Mock departures from Tallinn. Occupancy is generated per flight from its id (see plane.ts).
export const FLIGHTS: Flight[] = [
  { id: "TLL-LHR-1", number: "SW 201", from: "Tallinn", to: "London", toCode: "LHR", date: "2026-11-12", departs: "07:10", arrives: "08:40", price: 129, loadFactor: 0.72 },
  { id: "TLL-CDG-2", number: "SW 315", from: "Tallinn", to: "Paris", toCode: "CDG", date: "2026-11-12", departs: "09:45", arrives: "11:55", price: 149, loadFactor: 0.55 },
  { id: "TLL-ARN-3", number: "SW 118", from: "Tallinn", to: "Stockholm", toCode: "ARN", date: "2026-11-13", departs: "06:30", arrives: "06:40", price: 59, loadFactor: 0.48 },
  { id: "TLL-FCO-4", number: "SW 422", from: "Tallinn", to: "Rome", toCode: "FCO", date: "2026-11-13", departs: "12:20", arrives: "14:50", price: 168, loadFactor: 0.64 },
  { id: "TLL-BER-5", number: "SW 207", from: "Tallinn", to: "Berlin", toCode: "BER", date: "2026-11-14", departs: "15:05", arrives: "16:15", price: 89, loadFactor: 0.83 },
  { id: "TLL-AMS-6", number: "SW 330", from: "Tallinn", to: "Amsterdam", toCode: "AMS", date: "2026-11-14", departs: "18:40", arrives: "20:05", price: 112, loadFactor: 0.38 },
  { id: "TLL-BCN-7", number: "SW 509", from: "Tallinn", to: "Barcelona", toCode: "BCN", date: "2026-11-15", departs: "10:15", arrives: "13:30", price: 189, loadFactor: 0.9 },
  { id: "TLL-CPH-8", number: "SW 141", from: "Tallinn", to: "Copenhagen", toCode: "CPH", date: "2026-11-15", departs: "13:50", arrives: "14:35", price: 79, loadFactor: 0.27 },
];

export const findFlight = (id: string | undefined) => FLIGHTS.find((f) => f.id === id);

const DATE = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
export const formatDate = (iso: string) => DATE.format(new Date(`${iso}T00:00:00Z`));
