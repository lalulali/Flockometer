"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator, BarChart3 } from "lucide-react";

export default function FloatingNavbar() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Counter",
      href: "/counter",
      icon: Calculator,
    },
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: BarChart3,
    },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100 px-6 py-3 flex items-center gap-8">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 transition-colors ${
                isActive ? "text-[#0072BC]" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? "animate-in zoom-in-75 duration-300" : ""}`} />
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isActive ? "opacity-100" : "opacity-60"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
