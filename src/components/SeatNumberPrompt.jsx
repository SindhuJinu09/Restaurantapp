import React from "react";

export default function SeatNumberPrompt({
  open,
  tableId,
  numberOfSeats,
  setNumberOfSeats,
  maxSeatAddCap = 20,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative bg-white rounded-3xl shadow-2xl p-8 w-[90%] max-w-md z-10">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">How Many Seats?</h2>
        <div className="mb-6">
          <p className="text-center text-gray-600 mb-4">Table {tableId}</p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setNumberOfSeats(Math.max(1, numberOfSeats - 1))}
              className="w-12 h-12 rounded-xl bg-gray-200 hover:bg-gray-300 active:scale-95 transition-all duration-200 flex items-center justify-center font-bold text-xl"
            >
              –
            </button>
            <div className="w-32 h-16 rounded-xl border-2 border-blue-500 bg-blue-50 flex items-center justify-center">
              <input
                type="number"
                min="1"
                max={maxSeatAddCap}
                value={numberOfSeats}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  setNumberOfSeats(Math.max(1, Math.min(maxSeatAddCap, value)));
                }}
                className="w-full h-full text-4xl font-bold text-center bg-transparent outline-none"
              />
            </div>
            <button
              onClick={() => setNumberOfSeats(Math.min(maxSeatAddCap, numberOfSeats + 1))}
              className="w-12 h-12 rounded-xl bg-gray-200 hover:bg-gray-300 active:scale-95 transition-all duration-200 flex items-center justify-center font-bold text-xl"
            >
              +
            </button>
          </div>
          <p className="text-center text-sm text-gray-500 mt-3">Number of seats (1-{maxSeatAddCap})</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 px-4 rounded-xl bg-blue-500 text-white hover:bg-blue-600 active:scale-95 transition-all duration-200 font-medium"
          >
            Create {numberOfSeats} Seats
          </button>
        </div>
      </div>
    </div>
  );
}


