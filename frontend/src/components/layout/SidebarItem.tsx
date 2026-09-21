import { NavLink } from "react-router";

interface SidebarItemProps {
  icon: React.ReactNode;
  text: string;
  to: string;
  highlight?: boolean;
  isCollapsed?: boolean;
}

export default function SidebarItem({
  icon,
  text,
  to,
  highlight,
  isCollapsed = false,
}: SidebarItemProps) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      title={isCollapsed ? text : undefined}
      className={({ isActive }) =>
        `
        flex items-center gap-3.5
        ${isCollapsed ? "justify-center px-2 py-3" : "px-4 py-3"}
        rounded-2xl
        font-semibold text-xs sm:text-sm
        transition-all duration-200
        ${
          isActive
            ? highlight
              ? "bg-amber-50 text-amber-800 font-bold border border-amber-200 shadow-2xs"
              : "bg-emerald-50 text-emerald-800 font-bold border-l-4 border-emerald-500 shadow-2xs"
            : highlight
            ? "text-amber-600 hover:bg-amber-50/80 hover:text-amber-700"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }
      `
      }
    >
      <span className="shrink-0">{icon}</span>
      {!isCollapsed && <span className="truncate">{text}</span>}
    </NavLink>
  );
}
