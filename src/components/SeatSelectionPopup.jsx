import React from "react";

export default function SeatSelectionPopup({
  open,
  tableId,
  selectedSeats,
  onToggleSeat,
  onCancel,
  onContinue,
  options = [1, 2, 3, 4],
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl p-6 md:p-8 max-w-lg w-full mx-4 shadow-2xl">
        <div className="text-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">Select Seats for Table {tableId}</h2>
          <p className="text-sm text-gray-600">Choose which seats to manage for this table</p>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {options.map((seatNumber) => (
            <button
              key={seatNumber}
              onClick={() => onToggleSeat(seatNumber)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 font-semibold ${
                selectedSeats.includes(seatNumber)
                  ? "border-blue-500 bg-blue-50 text-blue-700 shadow-lg scale-105"
                  : "border-gray-300 bg-white hover:bg-gray-50 text-gray-700 hover:border-gray-400"
              }`}
            >
              <div className="flex items-center justify-center">
                <span className="text-2xl mr-2">🪑</span>
                <span>Seat {seatNumber}</span>
              </div>
            </button>
          ))}
        </div>
        {selectedSeats.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-sm font-medium text-blue-800">Selected Seats: {selectedSeats.sort((a, b) => a - b).join(", ")}</p>
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onContinue}
            className="flex-1 py-3 px-4 rounded-xl bg-blue-500 text-white hover:bg-blue-600 active:scale-95 transition-all duration-200 font-medium"
          >
            Continue ({selectedSeats.length > 0 ? selectedSeats.length : options.length} seats)
          </button>
        </div>
      </div>
    </div>
  );
}


