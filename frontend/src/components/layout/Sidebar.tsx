import { Crown } from "lucide-react";

import SidebarItem from "./SidebarItem";
import { sidebarItems } from "./sidebar-data";

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-72 bg-card border-r shadow-soft border-border/20">
      {/* Logo */}
      <div className="h-20 flex items-center px-6 border-b border-border/20">
        <h1 className="text-2xl font-bold text-primary">
          JTalk
        </h1>
      </div>

      {/* Menu */}
      <nav className="p-4 space-y-2">
        {sidebarItems.map((item) => {
          const Icon = item.icon;

          return (
            <SidebarItem
              key={item.to}
              icon={<Icon size={20} />}
              text={item.text}
              to={item.to}
            />
          );
        })}
      </nav>

      {/* Upgrade */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="rounded-2xl bg-gradient-primary p-5 text-white">
          <Crown className="mb-2" />

          <h3 className="font-semibold">
            Nâng cấp Plus
          </h3>

          <p className="mt-1 text-sm opacity-90">
            Mở khóa toàn bộ bài luyện AI
          </p>

          <button className="mt-4 w-full rounded-xl bg-white py-2 font-medium text-primary">
            Upgrade
          </button>
        </div>
      </div>
    </aside>
  );
}