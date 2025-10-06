import { useState, useEffect } from "react";
import { Search, Filter, Clock, Edit, ChevronDown } from "lucide-react";

export default function Tasks() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const columns = [
    { key: "assign-table", title: "Assign table" },
    { key: "pre-meal-complementary", title: "Pre-meal complementary" },
    { key: "take-order", title: "Take order" },
    { key: "serve-food", title: "Serve food" },
    { key: "payment", title: "Payment" },
    { key: "postmeal", title: "Postmeal" },
  ];

  const cardsByColumn = {
    "assign-table": [
      // T-201: yellow highlight, 5 mins
      { id: "T-201", table: "E1", status: "Pending", minutes: 5, highlight: "yellow" },
      // T-202: green highlight, 3 mins, Completed
      { id: "T-202", table: "E2", status: "Completed", minutes: 3, highlight: "green" },
    ],
    "pre-meal-complementary": [
      // T-203: Completed and green highlight
      { id: "T-203", table: "F1", status: "Completed", minutes: 5, highlight: "green" },
    ],
    "take-order": [
      { id: "T-204", table: "F2", status: "In progress", minutes: 5, description: "1x Pizza, 2x Coke" },
    ],
    // Serve food: highlight column red and set time to 20 mins
    "serve-food": [
      { id: "T-205", table: "G1", status: "Pending", minutes: 20, highlight: "red" },
    ],
    "payment": [
      { id: "T-206", table: "G2", status: "Pending", minutes: 5 },
    ],
    "postmeal": [
      { id: "T-207", table: "H1", status: "Pending", minutes: 5 },
    ],
  };

  const statusBadgeClass = (status) => {
    switch (status) {
      case "In progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const cardHighlightClass = (highlight) => {
    switch (highlight) {
      case "yellow":
        return "ring-1 ring-yellow-300/70";
      case "green":
        return "ring-1 ring-green-300/70";
      case "red":
        return "ring-1 ring-red-300/70";
      default:
        return "";
    }
  };

  // Close dropdown when clicking outside
  const handleClickOutside = (event) => {
    if (!event.target.closest('.status-dropdown')) {
      setShowStatusDropdown(false);
    }
  };

  // Add event listener for clicking outside
  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  

  const filterCard = (card) => {
    const matchesQuery =
      query.trim() === "" ||
      card.id.toLowerCase().includes(query.toLowerCase()) ||
      card.table.toLowerCase().includes(query.toLowerCase());

    const matchesStatus = statusFilter === "all" || card.status === statusFilter;
    return matchesQuery && matchesStatus;
  };

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 lg:p-8 space-y-6 min-h-0">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-foreground">Tasks</h1>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/50" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by table or task id"
              className="h-8 pl-7 pr-2 rounded-md border border-border/60 bg-card text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-colors shadow-sm"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/50" />
            <div className="relative status-dropdown">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="h-8 pl-7 pr-7 rounded-md border border-border/60 bg-card text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-colors shadow-sm flex items-center gap-1 justify-between min-w-[120px]"
              >
                <span>{statusFilter === "all" ? "All" : statusFilter}</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${showStatusDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showStatusDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/60 rounded-md shadow-lg z-50">
                  {["all", "Pending", "In progress", "Completed"].map((status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setStatusFilter(status);
                        setShowStatusDropdown(false);
                      }}
                      className={`w-full px-3 py-1.5 text-left text-xs hover:bg-muted transition-colors first:rounded-t-md last:rounded-b-md ${
                        statusFilter === status 
                          ? 'bg-primary/10 text-primary font-medium' 
                          : 'text-foreground'
                      }`}
                    >
                      {status === "all" ? "All" : status}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-2.5">
        {columns.map((col) => (
          <div key={col.key} className="rounded-lg border border-border/50 bg-card flex flex-col max-h-[calc(100dvh-12rem)] min-h-0">
            <div className={`px-3 py-2 border-b border-border/50 font-medium text-foreground text-xs ${col.headerClass ?? ""}`}>
              {col.title}
            </div>
            <div className="p-2.5 space-y-1.5 overflow-y-auto flex-1 min-h-0">
              {cardsByColumn[col.key]
                .filter(filterCard)
                .map((card) => (
                  <div key={card.id} className={`rounded-md border border-border/60 bg-background p-2.5 space-y-1.5 ${cardHighlightClass(card.highlight)}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 items-center">
                        <div className="text-[10px] text-foreground/60">Table</div>
                        <div className="text-xs font-medium">{card.table}</div>
                        <div className="text-[10px] text-foreground/60">Task ID</div>
                        <div className="font-mono text-[11px]">{card.id}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="h-5 w-5 p-0 bg-transparent hover:bg-muted rounded flex items-center justify-center" aria-label="Edit status">
                          <Edit className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {col.key === "take-order" && card.description && (
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-[11px] text-foreground/80">{card.description}</div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-foreground/60">
                      <div className="flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        <span>{card.minutes} mins</span>
                      </div>
                      <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded border ${statusBadgeClass(card.status)}`}>{card.status}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
