import { Search, Bell, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function Topbar() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex-1 max-w-xl flex items-center relative">
        <Search className="w-4 h-4 absolute left-3 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Search materials, news, analysis..." 
          className="w-full bg-muted border-none rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <div className="flex items-center gap-4 ml-4">
        <button 
          onClick={() => setIsDark(!isDark)} 
          className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <button className="p-2 rounded-full hover:bg-muted text-muted-foreground relative transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
        </button>
        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center overflow-hidden">
          <span className="text-sm font-medium text-primary">U</span>
        </div>
      </div>
    </header>
  );
}
