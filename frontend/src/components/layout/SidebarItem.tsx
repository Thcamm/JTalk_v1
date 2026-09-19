import { NavLink } from "react-router";

interface SidebarItemProps {
  icon: React.ReactNode;
  text: string;
  to: string;
}

export default function SidebarItem({
  icon,
  text,
  to,
}: SidebarItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `
        flex items-center gap-3
        px-4 py-3
        rounded-xl
        transition-all duration-200
        ${
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }
      `
      }
    >
      {icon}
      <span>{text}</span>
    </NavLink>
  );
}