import React from "react";

export default function SeatPageGrid({
  selectedTableForSeats,
  activeTasksForTable,
  selectedSeatsForTable,
  tableSeats,
  getTableBackgroundClass,
  onSeatClick
}) {
  if (!selectedTableForSeats) return null;

  const tableId = selectedTableForSeats.id;
  const tasks = activeTasksForTable[tableId] || [];
  const seatIds = [...new Set(tasks.map(task => task.extensionsData?.seat_id).filter(Boolean))].sort();
  const seatsToRender = seatIds.length > 0 ? seatIds : selectedSeatsForTable;

  const toMillis = (arr) => Array.isArray(arr) && arr.length >= 6 ? Date.UTC(arr[0], (arr[1]||1)-1, arr[2]||1, arr[3]||0, arr[4]||0, arr[5]||0) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
      {seatsToRender.map((seatId) => {
        const seatTasks = tasks.filter(task => task.extensionsData?.seat_id === seatId);
        const activeTasks = seatTasks.filter(t => t.extensionsData?.task_status === 'ACTIVE');
        const sortedActive = activeTasks.sort((a,b) => (toMillis(b.updatedAt||b.createdAt) - toMillis(a.updatedAt||a.createdAt)));
        const sortedAll = seatTasks.sort((a,b) => (toMillis(b.updatedAt||b.createdAt) - toMillis(a.updatedAt||a.createdAt)));
        const latestTask = sortedActive[0] || sortedAll[0];

        const seatData = latestTask ? {
          id: seatId,
          currentTask: {
            id: latestTask.title || "order",
            name: latestTask.title === "serve" ? "Serve" : latestTask.title === "order" ? "Order" : latestTask.title === "payment" ? "Payment" : (latestTask.title || "Order")
          },
          currentTaskUuid: latestTask.taskUuid,
          createdAt: latestTask.createdAt
        } : tableSeats[tableId]?.[seatId];

        const displaySeatNumber = seatId === 99 ? 'All Seats' : seatId;

        if (!seatData) {
          return (
            <div key={seatId} className="rounded-xl md:rounded-2xl border-2 p-4 md:pm-6 bg-gray-100">
              <div className="text-center text-gray-500">
                <div className="font-mono font-bold text-lg">{displaySeatNumber === 'All Seats' ? 'All Seats' : `Seat ${displaySeatNumber}`}</div>
                <div className="text-sm">Loading...</div>
              </div>
            </div>
          );
        }

        const backgroundClass = getTableBackgroundClass(seatData.currentTask.id);

        return (
          <div
            key={seatId}
            onClick={() => onSeatClick(seatId)}
            className={`rounded-xl md:rounded-2xl border-2 p-4 md:pm-6 space-y-3 md:space-y-4 ${backgroundClass} shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-200 cursor-pointer`}
          >
            <div className="text-center space-y-2">
              <div className="font-bold text-lg text-gray-800">
                {seatId === 99 ? 'All Seats' : `Seat ${seatId}`}
              </div>
              <div className="font-semibold text-md text-gray-700">
                {seatData.currentTask.name}
              </div>
              <div className="text-xs text-gray-500">
                {new Date().toISOString()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


