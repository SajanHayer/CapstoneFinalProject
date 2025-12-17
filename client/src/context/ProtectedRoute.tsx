import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext.tsx";
export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return null; // or spinner

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}