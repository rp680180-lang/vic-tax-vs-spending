"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Overview" },
  { href: "/tax", label: "Tax Revenue" },
  { href: "/federal", label: "Federal Spending" },
  { href: "/state", label: "State Spending" },
  { href: "/correlations", label: "Correlations" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-slate-900 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-white font-bold text-lg">
            VIC Tax vs Spending
          </Link>
          <div className="flex gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-slate-700 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
