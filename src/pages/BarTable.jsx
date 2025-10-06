import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Menu, ArrowRight, Plus, Minus, ShoppingCart, X, MessageSquare, Bell, User, CreditCard, Smartphone, DollarSign, CheckCircle, ChevronDown, BarChart3, ArrowLeft } from "lucide-react";

export default function BarTable() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [quantities, setQuantities] = useState({});
  const [showCart, setShowCart] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showTableDropdown, setShowTableDropdown] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [cartNote, setCartNote] = useState("");
  const commentInputRef = useRef(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [orderMoreSelected, setOrderMoreSelected] = useState(false);

  // Bar table seats data - 6 seats
  const [barSeats, setBarSeats] = useState([
    { 
      id: "Seat 1", 
      currentTaskIndex: 0,
      currentTask: { 
        id: "1", 
        name: "Assign Table", 
        statusOptions: ["Pending", "Assigned"],
        currentStatus: "Pending"
      },
      minutes: 0, 
      status: "Available",
      orderMoreNext: false,
      serveHistory: []
    },
    { 
      id: "Seat 2", 
      currentTaskIndex: 1,
      currentTask: { 
        id: "2", 
        name: "Pre Meal", 
        statusOptions: ["Pending", "Completed"],
        currentStatus: "Pending"
      },
      minutes: 5, 
      status: "In Progress",
      orderMoreNext: false,
      serveHistory: []
    },
    { 
      id: "Seat 3", 
      currentTaskIndex: 2,
      currentTask: { 
        id: "3", 
        name: "Order", 
        statusOptions: ["Pending", "Placed"],
        currentStatus: "Pending"
      },
      minutes: 10, 
      status: "In Progress",
      orderMoreNext: false,
      serveHistory: []
    },
    { 
      id: "Seat 4", 
      currentTaskIndex: 3,
      currentTask: { 
        id: "4", 
        name: "Serve", 
        statusOptions: ["Pending", "Served"],
        currentStatus: "Pending"
      },
      minutes: 15, 
      status: "In Progress",
      orderMoreNext: false,
      serveHistory: []
    },
    { 
      id: "Seat 5", 
      currentTaskIndex: 4,
      currentTask: { 
        id: "5", 
        name: "Post Meal", 
        statusOptions: ["Pending", "Completed"],
        currentStatus: "Pending"
      },
      minutes: 8, 
      status: "In Progress",
      orderMoreNext: false,
      serveHistory: []
    },
    { 
      id: "Seat 6", 
      currentTaskIndex: 5,
      currentTask: { 
        id: "6", 
        name: "Payment", 
        statusOptions: ["Pending", "Paid"],
        currentStatus: "Pending"
      },
      minutes: 3, 
      status: "Pending",
      orderMoreNext: false,
      serveHistory: []
    },
  ]);

  // Payment methods
  const paymentMethods = [
    { id: "cash", name: "Cash", icon: DollarSign },
    { id: "card", name: "Card", icon: CreditCard },
    { id: "upi", name: "UPI", icon: Smartphone }
  ];

  // Task flow data
  const taskFlow = [
    { id: "1", name: "Assign Table", statusOptions: ["Pending", "Assigned"] },
    { id: "2", name: "Pre Meal", statusOptions: ["Pending", "Completed"] },
    { id: "3", name: "Order", statusOptions: ["Pending", "Placed"] },
    { id: "4", name: "Serve", statusOptions: ["Pending", "Served"] },
    { id: "5", name: "Post Meal", statusOptions: ["Pending", "Completed"] },
    { id: "6", name: "Payment", statusOptions: ["Pending", "Paid"] }
  ];

  // Filter seats based on status
  const filteredSeats = barSeats.filter(seat => 
    statusFilter === "all" || seat.status === statusFilter
  );

  // Helper functions (copied from AllTables.jsx)
  const canProceedToNextTask = (currentTaskIndex) => {
    return currentTaskIndex < taskFlow.length - 1;
  };

  const handlePayment = () => {
    if (!selectedPaymentMethod) {
      alert("Please select a payment method");
      return;
    }
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }
    setIsPaid(true);
    alert(`Payment of ₹${paymentAmount} completed via ${selectedPaymentMethod}`);
  };

  const handleNextTask = (seatId) => {
    setBarSeats(prevSeats => 
      prevSeats.map(seat => {
        if (seat.id === seatId && canProceedToNextTask(seat.currentTaskIndex)) {
          const nextTaskIndex = seat.currentTaskIndex + 1;
          const nextTask = taskFlow[nextTaskIndex];
          return {
            ...seat,
            currentTaskIndex: nextTaskIndex,
            currentTask: {
              ...nextTask,
              currentStatus: "Pending"
            }
          };
        }
        return seat;
      })
    );
  };

  const updateTaskStatus = (seatId, newStatus) => {
    setBarSeats(prevSeats => 
      prevSeats.map(seat => {
        if (seat.id === seatId) {
          return {
            ...seat,
            currentTask: {
              ...seat.currentTask,
              currentStatus: newStatus
            }
          };
        }
        return seat;
      })
    );
  };

  const addComment = () => {
    if (newComment.trim()) {
      const comment = {
        id: Date.now(),
        text: newComment,
        timestamp: new Date().toLocaleTimeString(),
        user: "Manager"
      };
      setComments(prev => [...prev, comment]);
      setNewComment("");
    }
  };

  const updateQuantity = (itemId, change) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + change)
    }));
  };

  const getCartItems = () => {
    return Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, qty]) => ({ id: itemId, name: `Item ${itemId}`, quantity: qty, price: 150 }));
  };

  const getTotalItems = () => {
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
  };

  const calculateOrderTotal = () => {
    return getCartItems().reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getAllOrderedItems = () => {
    return getCartItems().map(item => `${item.name} x${item.quantity}`).join(", ");
  };

  // Enhanced color scheme for bar seats
  const getTaskColors = (taskId) => {
    switch (taskId) {
      case "1": return "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-blue-200/50";
      case "2": return "bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-green-200/50";
      case "3": return "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-orange-200/50";
      case "4": return "bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-red-200/50";
      case "5": return "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-blue-200/50";
      case "6": return "bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-green-200/50";
      default: return "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:shadow-gray-200/50";
    }
  };

  return (
    <>
      <div className="mx-auto max-w-screen-md md:max-w-screen-2xl space-y-0 min-h-0 text-sm md:text-base">
        {!expandedCard && (
          <div className="px-3 md:px-4 py-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => navigate(-1)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Bar Table Management</h1>
              </div>
              
              {/* Status Filter */}
              <div className="relative">
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-medium">
                    {statusFilter === "all" ? "All Seats" : statusFilter}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showStatusDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    {["all", "Available", "In Progress", "Pending", "Completed"].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setStatusFilter(status);
                          setShowStatusDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                      >
                        {status === "all" ? "All Seats" : status}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Bar Seats Grid - 3 columns for 6 seats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {filteredSeats.map((seat) => {
                const backgroundClass = getTaskColors(seat.currentTask.id);
                return (
                  <div 
                    key={seat.id} 
                    className={`rounded-xl md:rounded-2xl border-2 p-3 md:p-4 space-y-2 md:space-y-4 ${backgroundClass} cursor-pointer hover:shadow-xl active:scale-[0.98] transition-all duration-200 text-xs`}
                    onClick={() => setExpandedCard(seat)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-foreground/60 font-medium">Seat ID</div>
                        <div className="font-mono font-bold text-sm text-gray-800">{seat.id}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-foreground/60 font-medium">Status</div>
                        <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          seat.status === "Available" ? "bg-green-100 text-green-800" :
                          seat.status === "In Progress" ? "bg-blue-100 text-blue-800" :
                          seat.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {seat.status}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <div className="text-xs text-foreground/60 font-medium">Current Task</div>
                        <div className="font-semibold text-sm text-gray-800">{seat.currentTask.name}</div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-600">{seat.minutes} min</span>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Task Status:</span>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          seat.currentTask.currentStatus === "Pending" ? "bg-yellow-100 text-yellow-800" :
                          seat.currentTask.currentStatus === "Assigned" ? "bg-blue-100 text-blue-800" :
                          seat.currentTask.currentStatus === "Completed" ? "bg-green-100 text-green-800" :
                          seat.currentTask.currentStatus === "Placed" ? "bg-orange-100 text-orange-800" :
                          seat.currentTask.currentStatus === "Served" ? "bg-red-100 text-red-800" :
                          "bg-green-100 text-green-800"
                        }`}>
                          {seat.currentTask.currentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Individual Seat Management View */}
        {expandedCard && (
          <div className="px-3 md:px-4 py-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setExpandedCard(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{expandedCard.id}</h2>
                  <p className="text-sm text-gray-600">Bar Table Management</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowComments(!showComments)}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm">Comments</span>
                  {comments.length > 0 && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      {comments.length}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Menu className="w-4 h-4" />
                  <span className="text-sm">Menu</span>
                </button>
              </div>
            </div>

            {/* Task Management */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4">Current Task: {expandedCard.currentTask.name}</h3>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Task Status
                  </label>
                  <select
                    value={expandedCard.currentTask.currentStatus}
                    onChange={(e) => updateTaskStatus(expandedCard.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {expandedCard.currentTask.statusOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                
                {canProceedToNextTask(expandedCard.currentTaskIndex) && (
                  <div className="flex items-end">
                    <button
                      onClick={() => handleNextTask(expandedCard.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Next Task
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Menu Section */}
            {showMenu && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                <h3 className="text-lg font-semibold mb-4">Menu Items</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {["Appetizer", "Main Course", "Dessert", "Beverage"].map((item) => (
                    <div key={item} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <span className="font-medium">{item}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item, -1)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center">{quantities[item] || 0}</span>
                        <button
                          onClick={() => updateQuantity(item, 1)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {getTotalItems() > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setShowCart(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      View Cart ({getTotalItems()})
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Comments Section */}
            {showComments && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                <h3 className="text-lg font-semibold mb-4">Comments</h3>
                
                <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
                  {comments.map((comment) => (
                    <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{comment.user}</span>
                        <span className="text-xs text-gray-500">{comment.timestamp}</span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.text}</p>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <input
                    ref={commentInputRef}
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addComment()}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={addComment}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Payment Section */}
            {expandedCard.currentTask.name === "Payment" && (
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-lg font-semibold mb-4">Payment</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {paymentMethods.map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setSelectedPaymentMethod(method.id)}
                          className={`flex items-center justify-center gap-2 p-3 border-2 rounded-lg transition-colors ${
                            selectedPaymentMethod === method.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <method.icon className="w-5 h-5" />
                          <span className="text-sm font-medium">{method.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount
                    </label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <button
                    onClick={handlePayment}
                    disabled={isPaid}
                    className={`w-full py-3 rounded-lg font-medium transition-colors ${
                      isPaid
                        ? "bg-green-100 text-green-800 cursor-not-allowed"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    {isPaid ? (
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Payment Completed
                      </div>
                    ) : (
                      "Process Payment"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cart Modal */}
        {showCart && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Cart</h3>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-3 mb-4">
                {getCartItems().map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-sm text-gray-600">x{item.quantity}</span>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold">Total: ₹{calculateOrderTotal()}</span>
                </div>
                
                <div className="space-y-3">
                  <textarea
                    value={cartNote}
                    onChange={(e) => setCartNote(e.target.value)}
                    placeholder="Add a note to the order..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                  />
                  
                  <button
                    onClick={() => {
                      alert(`Order placed: ${getAllOrderedItems()}`);
                      setShowCart(false);
                      setQuantities({});
                      setCartNote("");
                    }}
                    className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Place Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

