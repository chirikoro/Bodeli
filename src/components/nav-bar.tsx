"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "ホーム", icon: "🏠" },
  { href: "/meals", label: "食事", icon: "🍽" },
  { href: "/workouts", label: "筋トレ", icon: "💪" },
  { href: "/settings", label: "設定", icon: "⚙️" },
] as const;

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0f0f0f] border-t border-[#262626] safe-area-pb z-50">
      <div className="flex justify-around max-w-lg mx-auto">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center py-2 px-4 min-w-[64px] min-h-[44px] transition-colors ${
                active ? "text-[#f5f5f5]" : "text-[#737373]"
              }`}
            >
              <span className="text-lg" role="img" aria-hidden="true">
                {tab.icon}
              </span>
              <span className="text-[10px] mt-0.5">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
