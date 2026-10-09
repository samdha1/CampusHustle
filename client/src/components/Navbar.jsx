import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <header className="nav">
      <NavLink to="/" className="nav__brand display">Campus Hustle</NavLink>
      <nav className="nav__links" aria-label="Main">
        <NavLink to="/" end>Browse</NavLink>
        <NavLink to="/my-listings">My listings</NavLink>
        <NavLink to="/chats">Messages</NavLink>
        <NavLink to="/listings/new" className="nav__sell">Sell an item</NavLink>
      </nav>
      <div className="nav__user">
        <span>{user.name}</span>
        <button className="btn btn--ghost" onClick={logout}>Log out</button>
      </div>
    </header>
  );
}
