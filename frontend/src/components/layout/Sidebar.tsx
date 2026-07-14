import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, TrendingUp, Newspaper, BarChart2, Factory, Scale, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Materials", path: "/materials", icon: Package },
  { name: "Price Trends", path: "/trends", icon: TrendingUp },
  { name: "News", path: "/news", icon: Newspaper },
  { name: "Analysis", path: "/analysis", icon: BarChart2 },
  { name: "Capacity", path: "/capacity", icon: Factory },
  { name: "Comparison", path: "/compare", icon: Scale },
  { name: "Analytics", path: "/analytics", icon: PieChart },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 border-r bg-card flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
          <span className="text-primary-foreground font-bold">A</span>
        </div>
        <span className="text-lg font-bold tracking-tight text-foreground">ASPL Market Intel</span>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
                           (item.path !== "/" && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t text-xs text-muted-foreground">
        &copy; 2026 ASPL
      </div>
    </div>
  );
}
