import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../features/auth/authContext";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-cream text-sm text-slate-500">Loading session...</div>;
  }

  if (!user) {
    return <Navigate replace state={{ from: location }} to="/sign-in" />;
  }

  return children;
}
