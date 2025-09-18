"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, LogOut } from "lucide-react";
import { getClientAuth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const auth = await getClientAuth();
      if (!auth) throw new Error("Auth not available on server");
      await signOut(auth);
      router.push("/");
      setMobileMenuOpen(false);
    } catch (err) {
      console.error("Error logging out:", err);
      router.push("/");
      setMobileMenuOpen(false);
    }
  };

  if (loading) {
    return <div className="bg-white h-16 animate-pulse" />;
  }

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand + Links */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="text-xl font-bold text-[#58e221]">
                MyMealMigo
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-6 lg:space-x-8">
              <Link
                href="/#features"
                className="text-gray-500 hover:border-[#58e221] hover:text-[#58e221] inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium"
              >
                Features
              </Link>
              <Link
                href="/#pricing"
                className="text-gray-500 hover:border-[#58e221] hover:text-[#58e221] inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium"
              >
                Pricing
              </Link>
              <Link
                href="/#testimonials"
                className="text-gray-500 hover:border-[#58e221] hover:text-[#58e221] inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium"
              >
                Testimonials
              </Link>
              <Link
                href="/#howitworks"
                className="text-gray-500 hover:border-[#58e221] hover:text-[#58e221] inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium"
              >
                How It Works
              </Link>
              <Link
                href="/#download"
                className="text-gray-500 hover:border-[#58e221] hover:text-[#58e221] inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium"
              >
                Download
              </Link>
              <Link
                href="/calculators"
                className="text-gray-500 hover:border-[#58e221] hover:text-[#58e221] inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium"
              >
                Calculators
              </Link>
            
              <Link
                href="/#ProjectWebsite"
                className="text-gray-500 hover:border-[#58e221] hover:text-[#58e221] inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium"
              >
                About Project
              </Link>

              {user && isAdmin && (
                <Link
                  href="/admin/dashboard"
                  className="text-gray-500 hover:border-[#58e221] hover:text-[#58e221] inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium"
                >
                  Admin Dashboard
                </Link>
              )}
            </div>
          </div>

          {/* Right: Auth actions */}
          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            {user ? (
              <>
                {/* Username → Account */}
                <Link
                  href="/account"
                  className="text-gray-700 text-sm font-medium hidden md:block truncate max-w-[150px] hover:text-[#58e221]"
                  title="Account"
                >
                  {user.displayName || user.email || "Account"}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-[#58e221] focus:outline-none focus:ring-2 focus:ring-[#58e221]"
                  aria-label="Logout"
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* Sign Up removed per request */}
                <Link
                  href="/login"
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#58e221]"
                >
                  Login
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="bg-white inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#58e221]"
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden" id="mobile-menu">
          <div className="pt-2 pb-3 space-y-1">
            <Link
              href="/#features"
              className="text-gray-500 hover:bg-gray-50 hover:text-[#58e221] block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="/#pricing"
              className="text-gray-500 hover:bg-gray-50 hover:text-[#58e221] block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link
              href="/#testimonials"
              className="text-gray-500 hover:bg-gray-50 hover:text-[#58e221] block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Testimonials
            </Link>
            <Link
              href="/#howitworks"
              className="text-gray-500 hover:bg-gray-50 hover:text-[#58e221] block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link
              href="/#download"
              className="text-gray-500 hover:bg-gray-50 hover:text-[#58e221] block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Download
            </Link>
            <Link
              href="/calculators"
              className="text-gray-500 hover:bg-gray-50 hover:text-[#58e221] block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              Calculators
            </Link>
            {/* NEW: About Project in mobile menu */}
            <Link
              href="/ProjectWebsite"
              className="text-gray-500 hover:bg-gray-50 hover:text-[#58e221] block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              About Project
            </Link>

            {user ? (
              <>
                {/* Account + Logout */}
                <Link
                  href="/account"
                  className="block pl-3 pr-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {user.displayName || user.email || "Account"}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-[#58e221]"
                  aria-label="Logout"
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* Sign Up removed per request */}
                <Link
                  href="/login"
                  className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
