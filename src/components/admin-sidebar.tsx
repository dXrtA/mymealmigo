
"use client";

import type React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, FileEdit, Users, Settings, X, Menu, List } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: Dispatch<SetStateAction<boolean>>;
  isMobile: boolean;
}

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen, isMobile }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Content Editor", href: "/admin/cms", icon: FileEdit },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Dropdown Manager", href: "/admin/dropdown-manager", icon: List },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile sidebar toggle */}
      {isMobile && (
        <div className="fixed top-4 left-4 z-40">
          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#58e221] p-2 rounded-md bg-white shadow-md md:hidden"
          >
            {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-56 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:w-64 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-14 bg-[#58e221] text-white md:h-16">
            <span className="text-lg font-bold md:text-xl">MyMealMigo Admin</span>
          </div>
          <nav className="flex-1 px-2 py-3 space-y-1 md:py-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  pathname === item.href
                    ? "bg-gray-100 text-[#58e221]"
                    : "text-gray-600 hover:bg-gray-50 hover:text-[#58e221]"
                }`}
              >
                <item.icon className="mr-2 h-5 w-5 md:mr-3" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
