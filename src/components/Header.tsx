import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header className="header">
      <Link to="/" className="logo">
        <span className="logo-mark" aria-hidden="true" />
        Seatwise
      </Link>
      <p className="header-note">Demo · mock flights, no booking</p>
    </header>
  );
}
