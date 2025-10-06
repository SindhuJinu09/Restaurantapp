import { cn } from "../utils";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Activity,
  List,
  BarChart3,
  FolderKanban,
  User,
} from "lucide-react";

const NavItem = ({
  icon: Icon,
  label,
  active = false,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
      active
        ? "bg-background text-sidebar-foreground ring-1 ring-sidebar-ring/40 shadow"
        : "text-sidebar-foreground/70 hover:bg-background/80 hover:text-sidebar-foreground",
    )}
    aria-pressed={active}
  >
    <Icon
      className={cn(
        "h-5 w-5",
        active ? "text-primary" : "text-primary/70 group-hover:text-primary",
      )}
    />
    <span>{label}</span>
  </button>
);

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { icon: LayoutDashboard, label: "Overview", path: "/" },
    { icon: List, label: "All Tables", path: "/all-tables" },
    { icon: User, label: "Tasks", path: "/tasks" },
    { icon: Activity, label: "Menu", path: "/activity" },
    { icon: BarChart3, label: "Payments", path: "/analytics" },
    { icon: FolderKanban, label: "Completed", path: "/projects" },
  ];

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/" || location.pathname === "/overview";
    }
    return location.pathname === path;
  };

  return (
    <aside className="hidden md:flex md:w-56 shrink-0 h-screen overflow-hidden flex-col border-r border-sidebar-border/50 bg-sidebar-background">
      <div className="px-4 py-5 flex items-center gap-2">
        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary/80 to-accent/70 shadow ring-1 ring-primary/50" />
        <div className="font-semibold text-lg text-sidebar-foreground">
          AlgoBrewery
        </div>
      </div>
      <nav className="px-3 py-2 space-y-1">
        {navItems.map((item) => (
          <NavItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            active={isActive(item.path)}
            onClick={() => navigate(item.path)}
          />
        ))}
      </nav>
      <div className="mt-auto p-4">
        <div className="rounded-xl border border-sidebar-border/60 bg-background p-4 text-xs text-sidebar-foreground/80">
          <div className="font-medium mb-1">Upgrade plan</div>
          <p className="mb-3">
            Unlock advanced insights and realtime processing.
          </p>
          <button className="w-full rounded-md bg-primary/90 text-primary-foreground py-2 text-sm hover:bg-primary transition">
            Upgrade
          </button>
        </div>
      </div>
    </aside>
  );
}
