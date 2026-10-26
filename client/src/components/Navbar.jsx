import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useChat } from "../context/ChatContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import Avatar from "./Avatar.jsx";

// Works for visitors (Log in / Sign up) and for logged-in users (full menu).
export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const { unread } = useChat();
  const toast = useToast();

  const handleLogout = async () => {
    await logout();
    toast.info("You have been logged out.");
  };

  return (
    <header className="nav">
      <NavLink to="/" end className="nav__brand display">Campus Hustle</NavLink>

      {user ? (
        <>
          <nav className="nav__links" aria-label="Main">
            <NavLink to="/browse">Browse</NavLink>
            <NavLink to="/my-listings">My listings</NavLink>
            <NavLink to="/chats">
              Messages
              {unread > 0 && (
                <span className="nav__badge" aria-label={`${unread} unread messages`}>{unread > 99 ? "99+" : unread}</span>
              )}
            </NavLink>
            <NavLink to="/listings/new" className="nav__sell">Sell an item</NavLink>
          </nav>
          <div className="nav__user">
            <Link to="/profile" className="nav__profile" title="Your profile">
              <Avatar user={user} size={32} />
              <span>{user.name}</span>
            </Link>
            <button className="btn btn--ghost btn--sm" onClick={handleLogout}>Log out</button>
          </div>
        </>
      ) : (
        !loading && (
          <div className="nav__user">
            <Link to="/login" className="btn btn--ghost btn--sm">Log in</Link>
            <Link to="/register" className="btn btn--accent btn--sm">Sign up</Link>
          </div>
        )
      )}
    </header>
  );
}