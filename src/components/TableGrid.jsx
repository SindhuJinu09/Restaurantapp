import React from "react";

// Renders the grid of table cards on the All Tables view.
// Behavior is unchanged; all logic is driven via props.
export default function TableGrid({
  rows,
  filteredRows,
  activeTasksForTable,
  onTableClick,
}) {
  const list = filteredRows || rows || [];

  const getTableBackgroundClass = (taskId) => {
    // Simplified: blue by default, green if table has ACTIVE tasks
    return taskId === "ACTIVE"
      ? "bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-green-200/50"
      : "";
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {list.map((row) => {
        const tasks = activeTasksForTable[row.id] || [];
        const seatIds = Array.from(
          new Set(
            tasks
              .map((t) => t.extensionsData?.seat_id)
              .filter((s) => s !== undefined && s !== null)
          )
        );
        seatIds.sort((a, b) => {
          const an = parseInt(a, 10);
          const bn = parseInt(b, 10);
          if (an === 99) return 1;
          if (bn === 99) return -1;
          return an - bn;
        });

        const hasActive = tasks.length > 0;
        const backgroundClass = hasActive
          ? "bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-green-200/50"
          : "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-blue-200/50";

        return (
          <div
            key={row.id}
            className={`rounded-xl md:rounded-2xl border-2 p-3 md:p-4 space-y-2 md:space-y-4 ${backgroundClass} cursor-pointer hover:shadow-xl active:scale-[0.98] transition-all duration-200 text-xs`}
            onClick={() => onTableClick(row)}
          >
            <div>
              <div className="font-mono font-bold text-sm text-gray-800">Table {row.id}</div>
              {seatIds.length > 0 ? (
                <div className="text-xs text-green-600 font-medium mt-1">
                  🪑 Seats {seatIds.join(", ")}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}


