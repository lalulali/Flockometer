"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator, BarChart3 } from "lucide-react";

export default function StickyNavbar() {
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
    <nav className="sticky bottom-0 w-full bg-white border-t border-gray-50 flex items-center justify-around py-0.5 z-50">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-[1px] w-full transition-colors ${
              isActive ? "text-[#0072BC]" : "text-gray-300"
            }`}
          >
            <div className={`p-[3px] rounded-lg transition-colors ${isActive ? "bg-blue-50/50" : ""}`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className={`text-[9px] font-semibold ${isActive ? "opacity-100" : "opacity-40"}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
