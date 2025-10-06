import { useState, useEffect } from "react";
import { CreditCard, Smartphone, DollarSign, CheckCircle, ChevronDown } from "lucide-react";

export default function Analytics() {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [amount, setAmount] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const [showTableDropdown, setShowTableDropdown] = useState(false);

  const paymentMethods = [
    {
      id: "cash",
      name: "Cash",
      icon: DollarSign,
      description: "Pay with cash",
      color: "bg-green-500",
      textColor: "text-green-500"
    },
    {
      id: "upi",
      name: "UPI",
      icon: Smartphone,
      description: "Pay via UPI",
      color: "bg-purple-500",
      textColor: "text-purple-500"
    },
    {
      id: "card",
      name: "Card",
      icon: CreditCard,
      description: "Credit/Debit card",
      color: "bg-blue-500",
      textColor: "text-blue-500"
    }
  ];

  const handlePayment = () => {
    if (!selectedPaymentMethod || !amount || !tableNumber) return;
    
    // Simulate payment processing
    setIsPaid(true);
    
    // Reset after 3 seconds
    setTimeout(() => {
      setIsPaid(false);
      setSelectedPaymentMethod(null);
      setAmount("");
      setTableNumber("");
    }, 3000);
  };

  // Close dropdown when clicking outside
  const handleClickOutside = (event) => {
    if (!event.target.closest('.table-dropdown')) {
      setShowTableDropdown(false);
    }
  };

  // Add event listener for clicking outside
  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Payments</h1>
      </div>
      
      <div className="max-w-md mx-auto">
        <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">Select Payment Method</h2>
            {/* <p className="text-sm text-foreground/60">Choose your preferred payment option</p> */}
          </div>

                     {/* Table Number and Amount Inputs */}
           <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <label className="text-sm font-medium text-foreground">Table Number</label>
               <div className="relative table-dropdown">
                 <button
                   onClick={() => setShowTableDropdown(!showTableDropdown)}
                   disabled={isPaid}
                   className={`w-full px-3 py-3 rounded-lg border border-border/60 bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-colors flex items-center gap-2 justify-between ${isPaid ? 'opacity-50 cursor-not-allowed' : ''}`}
                 >
                   <span>{tableNumber || "Select table"}</span>
                   <ChevronDown className={`h-4 w-4 transition-transform ${showTableDropdown ? 'rotate-180' : ''}`} />
                 </button>
                 
                 {showTableDropdown && !isPaid && (
                   <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/60 rounded-lg shadow-lg z-50">
                     {Array.from({ length: 6 }, (_, i) => i + 1).map((tableNum) => (
                       <button
                         key={tableNum}
                         onClick={() => {
                           setTableNumber(tableNum.toString());
                           setShowTableDropdown(false);
                         }}
                         className={`w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg ${
                           tableNumber === tableNum.toString() 
                             ? 'bg-primary/10 text-primary font-medium' 
                             : 'text-foreground'
                         }`}
                       >
                         Table {tableNum}
                       </button>
                     ))}
                   </div>
                 )}
               </div>
             </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/60">₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  disabled={isPaid}
                  className={`w-full pl-8 pr-3 py-3 rounded-lg border border-border/60 bg-background text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-colors ${isPaid ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">Payment Method</label>
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedPaymentMethod === method.id;
              
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedPaymentMethod(method.id)}
                  disabled={isPaid}
                  className={`w-full p-4 rounded-lg border transition-all duration-200 flex items-center gap-3 ${
                    isSelected
                      ? `border-primary bg-primary/5 ring-2 ring-primary/20`
                      : `border-border/60 bg-background hover:bg-muted/50`
                  } ${isPaid ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`p-2 rounded-lg ${method.color} text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-foreground">{method.name}</div>
                    <div className="text-sm text-foreground/60">{method.description}</div>
                  </div>
                  {isSelected && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Pay Button */}
          <button
            onClick={handlePayment}
            disabled={!selectedPaymentMethod || !amount || !tableNumber || isPaid}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              isPaid 
                ? 'bg-green-500 text-white cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed'
            }`}
          >
            {isPaid ? 'Paid ✓' : `Pay ₹${amount || "0.00"}`}
          </button>

          {/* Payment Info */}
          <div className="text-center text-xs text-foreground/60">
            <p>Secure payment powered by Algobrewery</p>
          </div>
        </div>
      </div>
    </div>
  );
}
