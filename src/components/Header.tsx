import { Link } from "react-router-dom";
import Plane from "./Plane";

export default function Header() {
  return (
    <header className="header">
      <Link to="/" className="logo" aria-label="Seatwise, home">
        Seat
        <Plane size={22} className="logo-plane" />
        wise
      </Link>
      <p className="header-note">Demo · mock flights, no booking</p>
    </header>
  );
}
