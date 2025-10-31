import React from "react";
import { X, Minus, Plus } from "lucide-react";

export default function BarSeatCart({
  expandedCard,
  open,
  onClose,
  getCartItems,
  updateCartItem,
  cartNote,
  setCartNote,
  onPlaceOrder
}) {
  if (!open || !expandedCard) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-screen-md md:max-w-2xl bg-card border border-border/50 rounded-t-2xl shadow-xl p-4 md:p-6 max-h-[65vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Cart - Seat {expandedCard.seat?.id}</h3>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-md border border-border/50 bg-background hover:bg-muted flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {getCartItems().length === 0 ? (
          <p className="text-foreground/60 text-sm py-8 text-center">No items in cart</p>
        ) : (
          <div className="space-y-3">
            {getCartItems().map((item, index) => (
              <div key={`${item.id}-${item.seatId}-${index}`} className="flex items-center justify-between py-3 border-b border-border/30 last:border-b-0">
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.name}</div>
                  <div className="text-xs text-foreground/60">{item.price}</div>
                  <div className="text-xs text-purple-600 font-medium">
                    For Seat {expandedCard.seat?.id}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateCartItem(item.id, -1, item.seatId)}
                    className="h-6 w-6 rounded-full border border-border/50 bg-background hover:bg-muted flex items-center justify-center"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="min-w-[1.5rem] text-center text-sm font-medium">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateCartItem(item.id, 1, item.seatId)}
                    className="h-6 w-6 rounded-full border border-border/50 bg-background hover:bg-muted flex items-center justify-center"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-border/30 space-y-0">
              <input
                type="text"
                value={cartNote}
                onChange={(e) => setCartNote(e.target.value)}
                placeholder="Add a note (e.g., no onions)"
                className="w-full h-9 px-3 rounded-lg border border-border/50 bg-card text-xs outline-none focus:ring-2 focus:ring-primary/30 mt-0 mb-1"
              />
              <button
                onClick={onPlaceOrder}
                className="w-full bg-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-purple-700 active:scale-95 transition mt-2"
              >
                Place Order
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


