// src/app/account/page.tsx
"use client";

import Link from "next/link";

export default function AccountRemoved() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold mb-3">Account/Profile is no longer available</h1>
        <p className="text-gray-600 mb-6">
          This application now supports admin login only. End-user accounts and profile customization
          have been removed.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Return Home
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 rounded-md bg-[#58e221] text-white hover:opacity-90"
          >
            Admin Login
          </Link>
        </div>
      </div>
    </main>
  );
}
