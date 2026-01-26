import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext.tsx";
import { isGuest } from "../lib/guest";

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return null; // or spinner

  // Allow guest mode to pass without login
  if (!user && !isGuest()) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

