"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requireAuth = false,
  requireAdmin = false,
  redirectTo = "/",
}: ProtectedRouteProps) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !user) {
      router.push(redirectTo);
    } else if (requireAdmin && !isAdmin) {
      router.push(redirectTo);
    }
  }, [user, loading, isAdmin, router, requireAuth, requireAdmin, redirectTo]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if ((requireAuth && !user) || (requireAdmin && !isAdmin)) {
    return null;
  }

  return <>{children}</>;
}