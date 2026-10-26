import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Only logged-in users may see the page (REQ-1: protected actions need authentication).
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p className="boot">Loading…</p>;
  return user ? children : <Navigate to="/login" replace state={{ from: location }} />;
}

// Logged-in users are sent away from login / register.
export function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="boot">Loading…</p>;
  return user ? <Navigate to="/browse" replace /> : children;
}
