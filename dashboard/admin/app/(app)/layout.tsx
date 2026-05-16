import { AuthGate } from "@/components/AuthGate";
import { Sidebar, MobileTopbar, MobileBottomNav } from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <div className="md:pl-64 min-h-screen flex flex-col">
          <MobileTopbar />
          <main className="flex-1 px-4 py-6 md:px-8 md:py-10 max-w-7xl mx-auto w-full">
            {children}
          </main>
          <MobileBottomNav />
        </div>
      </div>
    </AuthGate>
  );
}
