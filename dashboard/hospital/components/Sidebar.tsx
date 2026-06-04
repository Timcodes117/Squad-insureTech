"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";

const NAV = [
  { href: "/dashboard", label: "Home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/scan", label: "Verify patient", icon: "M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" },
  { href: "/claims/new", label: "New claim", icon: "M12 4v16m8-8H4" },
  { href: "/claims", label: "Claims", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
];

function NavIcon({ d }: { d: string }) {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { logout, session } = useAuth();

  return (
    <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 bg-white border-r border-slate-200 z-10">
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-200 shrink-0">
        <div className="h-9 w-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm">
          H
        </div>
        <div className="leading-tight min-w-0">
          <div className="text-sm font-semibold truncate">{session?.hospitalName || "Hospital"}</div>
          <div className="text-xs text-slate-500">Provider portal</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-100",
              ].join(" ")}
            >
              <span className={active ? "text-emerald-600" : "text-slate-400"}>
                <NavIcon d={item.icon} />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-200">
        <button
          type="button"
          onClick={logout}
          className="w-full text-left text-sm text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md hover:bg-slate-100"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}

export function MobileTopbar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const title = NAV.find((n) => pathname === n.href || pathname?.startsWith(`${n.href}/`))?.label || "Hospital";

  return (
    <div className="md:hidden sticky top-0 z-20 h-14 border-b border-slate-200 bg-white px-4 flex items-center gap-3">
      <div className="h-7 w-7 rounded bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">H</div>
      <div className="font-semibold truncate flex-1">{title}</div>
      <button type="button" onClick={logout} className="text-sm text-slate-500">
        Sign out
      </button>
    </div>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden sticky bottom-0 z-20 bg-white border-t border-slate-200 flex">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center py-2 text-[10px] font-medium ${active ? "text-emerald-700" : "text-slate-500"}`}
          >
            <span className={active ? "text-emerald-600" : "text-slate-400"}>
              <NavIcon d={item.icon} />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
