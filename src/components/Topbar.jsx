import { Bell, Settings, ChevronDown, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";

export default function Topbar() {
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [priorityTables, setPriorityTables] = useState([]);
  const [hasPriorityTables, setHasPriorityTables] = useState(false);

  // Check for priority tables by looking at the current page data
  useEffect(() => {
    const checkPriorityTables = () => {
      // This is a simple check - in a real app, you'd get this from your backend
      // For now, we'll simulate priority tables based on localStorage or a simple check
      const currentPath = window.location.pathname;
      if (currentPath === '/all-tables') {
        // Simulate priority tables for demonstration
        const mockPriorityTables = [
          { id: "T-104", task: "Serve food", minutes: 21 },
          { id: "T-106", task: "", minutes: 0 }
        ].filter(table => table.minutes > 15 || (table.task === "" && table.minutes === 0));
        
        setPriorityTables(mockPriorityTables);
        setHasPriorityTables(mockPriorityTables.length > 0);
      } else {
        setPriorityTables([]);
        setHasPriorityTables(false);
      }
    };

    checkPriorityTables();
    // Check every 30 seconds for updates
    const interval = setInterval(checkPriorityTables, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close notification popup when clicking outside
  const handleClickOutside = (event) => {
    if (!event.target.closest('.notification-dropdown')) {
      setShowNotificationPopup(false);
    }
  };

  // Add event listener for clicking outside
  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
  return (
    <header className="sticky top-0 z-20 border-b border-border/40 bg-muted">
      <div className="mx-auto max-w-screen-2xl px-4 py-3 flex items-center gap-3">
        <div className="ml-auto flex items-center gap-2">
          <div className="relative notification-dropdown">
            <button
              onClick={() => setShowNotificationPopup(!showNotificationPopup)}
              aria-label="Notifications"
              className="h-9 w-9 inline-grid place-items-center rounded-lg bg-background ring-1 ring-border/60 hover:bg-muted/80 relative"
            >
              <Bell className="h-4 w-4 text-foreground/80" />
              {hasPriorityTables && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs font-medium flex items-center justify-center">
                  {priorityTables.length}
                </span>
              )}
            </button>

            {showNotificationPopup && hasPriorityTables && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-card border border-border/50 rounded-lg shadow-lg z-50">
                <div className="p-3 border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <h3 className="font-semibold text-foreground">Priority Tables</h3>
                  </div>
                  <p className="text-xs text-foreground/60 mt-1">Tables requiring immediate attention</p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {priorityTables.map((table) => (
                    <div key={table.id} className="p-3 border-b border-border/30 last:border-b-0 hover:bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{table.id}</div>
                          <div className="text-xs text-foreground/60">{table.task}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium text-red-600">{table.minutes} mins</div>
                          <div className="text-xs text-foreground/60">Pending</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            aria-label="Settings"
            className="h-9 w-9 inline-grid place-items-center rounded-lg bg-background ring-1 ring-border/60 hover:bg-muted/80"
          >
            <Settings className="h-4 w-4 text-foreground/80" />
          </button>
          <div className="h-9 flex items-center gap-2 rounded-lg bg-background ring-1 ring-border/60 px-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary/80 to-accent/70" />
            <span className="text-sm">Server</span>
            <ChevronDown className="h-4 w-4 text-foreground/70" />
          </div>
        </div>
      </div>
    </header>
  );
}
