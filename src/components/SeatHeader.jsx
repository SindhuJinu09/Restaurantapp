import React from "react";
import { ArrowLeft } from "lucide-react";

export default function SeatHeader({
  tableId,
  onBack,
  onAddSeat,
  onClearTable,
  currentTaskName,
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-800">{tableId}</h2>
          <p className="text-sm text-gray-600">Table Seat Management</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex gap-3">
          <button
            onClick={onAddSeat}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:scale-95 transition-all duration-200 font-medium shadow-md"
          >
            Add Seat
          </button>
          <button
            onClick={onClearTable}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 active:scale-95 transition-all duration-200 font-medium shadow-md"
          >
            Clear Table
          </button>
        </div>
      </div>
    </div>
  );
}


