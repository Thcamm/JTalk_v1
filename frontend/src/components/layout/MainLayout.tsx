import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { Outlet } from "react-router";
import { useSidebarStore } from "@/stores/useSidebarStore";

export default function MainLayout() {
  const { isCollapsed } = useSidebarStore();

  return (
    <div className="h-screen overflow-hidden bg-slate-50 dark:bg-[#0b0f17] text-slate-900 dark:text-slate-100 transition-colors duration-200 flex">
      {/* Sidebar with responsive behavior */}
      <Sidebar />

      {/* Main Content Area */}
      <div
        className={`h-screen flex-1 flex flex-col transition-all duration-300 min-w-0 ${
          isCollapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        <Navbar />

        <main className="flex-1 overflow-y-auto bg-slate-50/60 dark:bg-[#0b0f17] transition-colors duration-200">
          <Outlet />
        </main>
      </div>
    </div>
  );
}