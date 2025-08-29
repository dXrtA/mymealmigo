"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/admin-sidebar"; // Adjust path

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Closed by default
  const [isMobile, setIsMobile] = useState(false);
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  // Check if we're on mobile and set sidebar state
  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768; // md breakpoint
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile); // Closed on mobile, open on desktop
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Protect the route
  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/"); // Redirect to home if not authenticated
    } else if (!isAdmin) {
      router.push("/"); // Redirect to home if not admin
    }
  }, [user, loading, isAdmin, router]);

  // Show loading state while auth is resolving
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Prevent rendering if not authenticated or not admin
  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isMobile={isMobile}
      />
      {/* Main content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isSidebarOpen && isMobile ? "ml-56" : "ml-0 md:ml-64"
        }`}
      >
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}