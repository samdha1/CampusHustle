import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "./Avatar.jsx";

// Works for visitors (Log in / Sign up) and for logged-in users (full menu).
export default function Navbar() {
  const { user, loading, logout } = useAuth();
  return (
    <header className="nav">
      <NavLink to="/" end className="nav__brand display">Campus Hustle</NavLink>

      {user ? (
        <>
          <nav className="nav__links" aria-label="Main">
            <NavLink to="/browse">Browse</NavLink>
            <NavLink to="/my-listings">My listings</NavLink>
            <NavLink to="/chats">Messages</NavLink>
            <NavLink to="/listings/new" className="nav__sell">Sell an item</NavLink>
          </nav>
          <div className="nav__user">
            <Link to="/profile" className="nav__profile" title="Your profile">
              <Avatar user={user} size={30} />
              <span>{user.name}</span>
            </Link>
            <button className="btn btn--ghost" onClick={logout}>Log out</button>
          </div>
        </>
      ) : (
        !loading && (
          <div className="nav__user">
            <Link to="/login" className="btn btn--ghost">Log in</Link>
            <Link to="/register" className="btn btn--accent">Sign up</Link>
          </div>
        )
      )}
    </header>
  );
}
