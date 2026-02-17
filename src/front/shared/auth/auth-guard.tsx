import { Navigate, Outlet } from "react-router";
import { useAuth } from "./auth-context";

export function AuthGuard() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
