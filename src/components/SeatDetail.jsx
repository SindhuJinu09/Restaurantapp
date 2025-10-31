import React from "react";
import { X, Minus, Plus } from "lucide-react";

export default function SeatDetail({
  expandedCard,
  onClose,
  showMenu,
  setShowMenu,
  menuCategories,
  newGetQuantityForItem,
  newUpdateCartItem,
  newGetServeOrders,
  newUpdateItemServed,
  newUpdateKitchenStatus,
  handleNextTask,
  paymentMethods,
  seatPaymentMethods,
  setSeatPaymentMethods,
  seatPaidStatus,
  setSeatPaidStatus,
  activeOrderTab,
  setActiveOrderTab,
  rows
}) {
  if (!expandedCard || !expandedCard.seatNumber || !expandedCard.tableId) return null;

  return (
    <div className="w-full h-[100dvh]">
      <div className="mx-auto h-full max-w-none md:max-w-5xl rounded-xl md:rounded-2xl border-2 border-gray-200 shadow-2xl bg-gradient-to-br from-white to-gray-50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-3 md:p-4 border-b-2 border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50 relative text-xs">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 md:top-4 md:right-4 h-9 w-9 rounded-xl border-2 border-red-200 bg-red-50 hover:bg-red-100 active:scale-95 flex items-center justify-center transition-all duration-200 shadow-md"
            aria-label="Close"
          >
            <X className="h-4 w-4 text-red-600" />
          </button>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="bg-white/70 rounded-lg px-3 py-2 shadow-sm">
                  <div className="text-xs text-gray-600 font-medium">Table</div>
                  <div className="font-semibold text-sm text-gray-800">{expandedCard.tableId}</div>
                </div>
                <div className="bg-white/70 rounded-lg px-3 py-2 shadow-sm">
                  <div className="text-xs text-gray-600 font-medium">Seat</div>
                  <div className="font-semibold text-sm text-gray-800">{expandedCard.seatNumber === 99 ? 'All Seats' : `${expandedCard.seatNumber}`}</div>
                </div>
                <div className="bg-white/70 rounded-lg px-3 py-2 shadow-sm">
                  <div className="text-xs text-gray-600 font-medium">Task</div>
                  <div className="font-semibold text-sm text-gray-800">{expandedCard.currentTask.name}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Menu Section */}
          {showMenu && (
            <div className="md:w-full border-b md:border-b-0 border-border/30 overflow-y-auto p-3 md:p-4">
              {/* Single Seat Tab */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-lg">
                  <button
                    className="px-3 py-2 rounded-md text-sm font-medium bg-white text-purple-600 shadow-sm"
                  >
                    Seat {expandedCard.seatNumber}
                  </button>
                </div>
              </div>

              {/* Menu Content */}
              <div className="space-y-4">
                {menuCategories.map((category) => (
                  <div key={category.title} className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground border-b border-border/30 pb-1">
                      {category.title}
                    </h3>
                    <div className="space-y-2">
                      {category.items.map((item) => {
                        const currentQuantity = newGetQuantityForItem(item.id, expandedCard.seatNumber.toString());
                        return (
                          <div key={item.id} className="rounded-lg border border-border/30 bg-background p-3 space-y-2">
                            <div className="flex items-start">
                              <div className="flex-1">
                                <h4 className="font-medium text-foreground">{item.name}</h4>
                                <p className="text-sm text-foreground/70">{item.description}</p>
                                <p className="text-xs text-purple-600 font-medium mt-1">
                                  For Seat {expandedCard.seatNumber}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between -mt-4">
                              <p className="text-sm font-medium text-primary">{item.price}</p>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => newUpdateCartItem(item.id, -1, expandedCard.seatNumber.toString())}
                                  className="h-7 w-7 rounded-full border border-border/50 bg-card hover:bg-muted flex items-center justify-center transition-colors"
                                  disabled={!currentQuantity}
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="min-w-[1.5rem] text-center font-medium text-sm">
                                  {currentQuantity}
                                </span>
                                <button
                                  onClick={() => newUpdateCartItem(item.id, 1, expandedCard.seatNumber.toString())}
                                  className="h-7 w-7 rounded-full border border-border/50 bg-card hover:bg-muted flex items-center justify-center transition-colors"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Section when menu is not shown */}
          {!showMenu && (
            <div className="flex-1 p-8 md:p-6 overflow-y-auto">
              <div className="space-y-4">
                {(expandedCard.currentTask.type === 'SERVE' || expandedCard.currentTask.type === 'serve') && expandedCard.orderDescription ? (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <h3 className="text-2xl font-bold text-green-800 bg-green-100 px-6 py-3 rounded-lg">
                        Serve - Seat {expandedCard.seatNumber - 1}
                      </h3>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 p-6 shadow-lg">
                      <h4 className="text-lg font-semibold text-green-800 mb-3">Order Details:</h4>
                      <div className="bg-white rounded-lg p-4 text-gray-800">
                        <p className="whitespace-pre-wrap text-base">{expandedCard.orderDescription}</p>
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <p className="text-sm text-blue-800 font-medium">
                        📋 Please serve the items listed above to Seat {expandedCard.seatNumber - 1}
                      </p>
                    </div>
                    <div className="pt-4">
                      <button
                        onClick={handleNextTask}
                        className="w-full bg-green-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-green-700 active:scale-95 transition shadow-lg"
                      >
                        Mark as Served & Continue to Payment
                      </button>
                    </div>
                  </div>
                ) : (expandedCard.currentTask.id === "4" || expandedCard.currentTask.id === "serve" || expandedCard.currentTask.type === "SERVE") ? (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold text-purple-800 bg-purple-100 px-4 py-2 rounded-lg">Order Summary - Seat {expandedCard.seatNumber}</h3>
                    </div>
                    {newGetServeOrders().length > 0 ? (
                      <div className="space-y-3">
                        {newGetServeOrders().map((order, orderIndex) => (
                          <div key={orderIndex} className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200 p-4 shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-bold text-purple-700">Order #{order.orderNumber}</span>
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{order.timestamp}</span>
                            </div>
                            <div className="space-y-2">
                              {order.items && order.items.map((item, itemIndex) => (
                                <div key={itemIndex} className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm border border-purple-100">
                                  <input
                                    type="checkbox"
                                    checked={item.served || false}
                                    onChange={(e) => {
                                      newUpdateItemServed(orderIndex, itemIndex, e.target.checked);
                                    }}
                                    className="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-800">{item.name}</div>
                                  </div>
                                  <div className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-md">
                                    Seat {expandedCard.seatNumber}
                                  </div>
                                  <div className="text-sm font-bold text-green-600 bg-green-100 px-2 py-1 rounded-md">
                                    Qty: {item.quantity}
                                  </div>
                                  <select
                                    value={item.kitchenStatus || "Preparing"}
                                    onChange={(e) => {
                                      newUpdateKitchenStatus(orderIndex, itemIndex, e.target.value);
                                    }}
                                    className="text-xs font-medium text-orange-600 bg-orange-100 border border-orange-300 rounded px-1 py-1 focus:ring-1 focus:ring-orange-400"
                                  >
                                    <option value="Preparing">Preparing</option>
                                    <option value="Prepared">Prepared</option>
                                    <option value="Ready">Ready</option>
                                  </select>
                                  <div className="text-sm font-bold text-gray-800">
                                    {item.price}
                                  </div>
                                  {item.served && (
                                    <div className="ml-2">
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        ✓ Served
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-gray-500 text-lg font-medium mb-2">No orders to serve</div>
                        <div className="text-gray-400 text-sm">Place an order first to see it here</div>
                      </div>
                    )}
                  </div>
                ) : expandedCard.currentTask.id === "6" ? (
                  <div className="w-full max-w-lg mx-auto">
                    <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 space-y-6 shadow-lg">
                      <div className="text-center">
                        <h2 className="text-lg font-bold text-gray-800 mb-2">Payment Summary - Seat {expandedCard.seatNumber}</h2>
                      </div>
                      {(() => {
                        const allItems = [];
                        newGetServeOrders()?.forEach(serve => {
                          serve.items?.forEach(item => {
                            allItems.push({
                              ...item,
                              orderNumber: serve.orderNumber,
                              timestamp: serve.timestamp,
                              seatId: item.seatId || expandedCard.seatNumber.toString()
                            });
                          });
                        });
                        let allSeatsBill = 0;
                        const tableData = rows.find(row => row.id === expandedCard.tableId);
                        if (tableData?.serveHistory) {
                          tableData.serveHistory.forEach(serve => {
                            serve.items?.forEach(item => {
                              const price = parseFloat(item.price.replace('$', ''));
                              allSeatsBill += price * item.quantity;
                            });
                          });
                        }
                        const occupiedSeats = tableData?.selectedSeats || [expandedCard.seatNumber];
                        const billPerSeat = occupiedSeats.length > 0 ? allSeatsBill / occupiedSeats.length : 0;
                        const itemsBySeat = {};
                        allItems.forEach(item => {
                          const seatId = item.seatId;
                          if (seatId) {
                            if (!itemsBySeat[seatId]) itemsBySeat[seatId] = [];
                            itemsBySeat[seatId].push(item);
                          }
                        });
                        const seatTotals = {};
                        allItems.forEach(item => {
                          const seatId = item.seatId;
                          if (seatId) {
                            const price = parseFloat(item.price.replace('$', ''));
                            const itemTotal = price * item.quantity;
                            if (!seatTotals[seatId]) seatTotals[seatId] = 0;
                            seatTotals[seatId] += itemTotal;
                          }
                        });
                        occupiedSeats.forEach(seatId => {
                          const seatIdStr = seatId.toString();
                          if (!seatTotals[seatIdStr]) seatTotals[seatIdStr] = 0;
                          seatTotals[seatIdStr] += billPerSeat;
                        });
                        const seatIds = Object.keys(itemsBySeat).sort((a, b) => parseInt(a) - parseInt(b));
                        return (
                          <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                              {seatIds.map(seatId => (
                                <button
                                  key={seatId}
                                  onClick={() => setActiveOrderTab(seatId)}
                                  className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 font-medium text-sm ${
                                    activeOrderTab === seatId
                                      ? 'border-purple-400 bg-purple-50 text-purple-800 ring-2 ring-purple-200'
                                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {`Seat ${seatId}`}
                                  {seatPaidStatus[seatId] && <span className="ml-1">✓</span>}
                                </button>
                              ))}
                            </div>
                            {activeOrderTab && itemsBySeat[activeOrderTab] && (
                              <div className="bg-white/70 rounded-lg p-4 shadow-sm border-2 border-purple-100">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="text-lg font-bold text-purple-600">
                                    {`🪑 Seat ${activeOrderTab}`}
                                  </h4>
                                  <div className="text-xl font-bold text-green-600">
                                    ${(seatTotals[activeOrderTab] || 0).toFixed(2)}
                                  </div>
                                </div>
                                <div className="space-y-2 mb-4">
                                  {itemsBySeat[activeOrderTab] && itemsBySeat[activeOrderTab].map((item, index) => {
                                    const itemTotal = (parseFloat(item.price.replace('$', '')) * item.quantity).toFixed(2);
                                    return (
                                      <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                                        <div className="flex-1">
                                          <div className="text-sm font-medium text-gray-800">{item.name}</div>
                                          <div className="text-xs text-gray-500">Order {item.orderNumber} • {item.timestamp}</div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-sm font-medium text-gray-800">x {item.quantity}</div>
                                          <div className="text-sm font-bold text-green-600">${itemTotal}</div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {billPerSeat > 0 && (
                                    <div className="flex items-center justify-between bg-blue-50 rounded-lg p-2 border border-blue-200">
                                      <div className="flex-1">
                                        <div className="text-sm font-medium text-blue-800">All Seats Bill Split</div>
                                        <div className="text-xs text-blue-600">Shared among {occupiedSeats.length} seats</div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-sm font-bold text-blue-600">${billPerSeat.toFixed(2)}</div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="space-y-3">
                                  <h5 className="text-sm font-semibold text-gray-700">Select Payment Method</h5>
                                  {paymentMethods.map((method) => {
                                    const Icon = method.icon;
                                    const isSelected = seatPaymentMethods[activeOrderTab] === method.id;
                                    return (
                                      <button
                                        key={method.id}
                                        onClick={() => setSeatPaymentMethods(prev => ({ ...prev, [activeOrderTab]: method.id }))}
                                        className={`w-full p-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-between ${
                                          isSelected ? `${method.color.replace('bg-', 'border-')} bg-white` : 'border-gray-200 bg-white hover:bg-gray-50'
                                        }`}
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className={`h-8 w-8 rounded-md ${method.color} bg-opacity-20 flex items-center justify-center`}>
                                            <Icon className={`h-4 w-4 ${method.textColor}`} />
                                          </div>
                                          <div>
                                            <div className="text-sm font-medium">{method.name}</div>
                                            <div className="text-xs text-gray-500">{method.description}</div>
                                          </div>
                                        </div>
                                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-green-500 bg-green-500' : 'border-gray-300 bg-white'}`}>
                                          {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-white" />}
                                        </div>
                                      </button>
                                    );
                                  })}
                                  <button
                                    onClick={() => setSeatPaidStatus(prev => ({ ...prev, [activeOrderTab]: true }))}
                                    disabled={!seatPaymentMethods[activeOrderTab]}
                                    className={`w-full py-3 rounded-xl font-semibold transition-all ${seatPaymentMethods[activeOrderTab] ? 'bg-green-600 text-white hover:bg-green-700 active:scale-95' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
                                  >
                                    Mark Seat as Paid
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


