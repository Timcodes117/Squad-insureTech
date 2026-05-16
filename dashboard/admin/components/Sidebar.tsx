"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const NAV = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7m-9 2v10a1 1 0 001 1h6a1 1 0 001-1V10"
      />
    ),
  },
  {
    href: "/hospitals",
    label: "Hospitals",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    ),
  },
  {
    href: "/claims",
    label: "Claims",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    ),
  },
  {
    href: "/jobs",
    label: "Jobs",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 bg-white border-r border-slate-200 z-10">
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-200 shrink-0">
        <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
          B
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold">BetaHealth</div>
          <div className="text-xs text-slate-500">Admin console</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              ].join(" ")}
            >
              <svg
                className={["h-5 w-5 shrink-0", active ? "text-blue-600" : "text-slate-400"].join(" ")}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                {item.icon}
              </svg>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-200 shrink-0">
        <button
          onClick={logout}
          className="w-full text-left text-sm text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md hover:bg-slate-100 transition-colors flex items-center gap-3"
        >
          <svg className="h-5 w-5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}

export function MobileTopbar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const title =
    pathname === "/dashboard"
      ? "Overview"
      : pathname?.startsWith("/hospitals")
        ? "Hospitals"
        : pathname?.startsWith("/claims")
          ? "Claims"
          : pathname?.startsWith("/jobs")
            ? "Jobs"
            : "BetaHealth Admin";

  return (
    <div className="md:hidden sticky top-0 z-20 h-14 border-b border-slate-200 bg-white px-4 flex items-center gap-3">
      <div className="h-7 w-7 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
        B
      </div>
      <div className="font-semibold truncate flex-1">{title}</div>
      <button
        onClick={logout}
        className="text-sm text-slate-500 hover:text-slate-900 shrink-0"
        aria-label="Sign out"
      >
        Sign out
      </button>
    </div>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden sticky bottom-0 z-20 bg-white border-t border-slate-200 flex items-stretch">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "flex-1 flex flex-col items-center justify-center py-2 text-xs font-medium",
              active ? "text-blue-700" : "text-slate-500",
            ].join(" ")}
          >
            <svg
              className={["h-5 w-5 mb-0.5", active ? "text-blue-600" : "text-slate-400"].join(" ")}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              {item.icon}
            </svg>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
