"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminNavbar from "@/components/admin/AdminNavbar";
import AdminGuard from "@/components/auth/AdminGuard";
import { useSidebarStore } from "@/stores/useSidebarStore";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebarStore();

  return (
    <AdminGuard>
      <div className="h-screen overflow-hidden bg-slate-950 text-slate-100 flex font-sans">
        {/* Admin Sidebar */}
        <AdminSidebar />

        {/* Admin Main Content Container */}
        <div
          className={`h-screen flex-1 flex flex-col transition-all duration-300 min-w-0 ${
            isCollapsed ? "lg:ml-20" : "lg:ml-64"
          }`}
        >
          <AdminNavbar />

          <main className="flex-1 overflow-y-auto bg-slate-950/95 text-slate-100 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
