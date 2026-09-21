import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { Outlet } from "react-router";

export default function MainLayout() {
  return (
    <div className="h-screen overflow-hidden bg-background">
      <Sidebar />

      <div className="ml-72 h-screen flex flex-col">
        <Navbar />

        <main className="flex-1 p-8 overflow-auto bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}