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
        ${isCollapsed ? "justify-center px-2 py-3" : "px-3.5 py-3"}
        rounded-2xl
        font-bold text-xs sm:text-sm
        transition-all duration-200 group relative
        ${
          isActive
            ? highlight
              ? "bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 shadow-2xs"
              : "bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-l-4 border-rose-500 dark:border-rose-400 shadow-2xs"
            : highlight
            ? "text-amber-600 dark:text-amber-400 hover:bg-amber-50/80 dark:hover:bg-amber-950/30 hover:text-amber-700"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
        }
      `
      }
    >
      <span className="shrink-0 transition-transform duration-200 group-hover:scale-110">
        {icon}
      </span>
      {!isCollapsed && <span className="truncate tracking-tight">{text}</span>}
      {isCollapsed && (
        <span className="sr-only">{text}</span>
      )}
    </NavLink>
  );
}
