import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { Outlet } from "react-router";
import { useSidebarStore } from "@/stores/useSidebarStore";

export default function MainLayout() {
  const { isCollapsed } = useSidebarStore();

  return (
    <div className="h-screen overflow-hidden bg-[#F9FAFB]">
      <Sidebar />

      <div
        className={`h-screen flex flex-col transition-all duration-300 ${
          isCollapsed ? "ml-20" : "ml-64"
        }`}
      >
        <Navbar />

        <main className="flex-1 overflow-auto bg-[#F9FAFB]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}