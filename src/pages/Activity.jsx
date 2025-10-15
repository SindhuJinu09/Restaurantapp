import { useState, useEffect } from "react";
import { Plus, Minus, ShoppingCart, ChevronDown } from "lucide-react";
import { menuService } from "../services/taskService";

export default function Activity() {
  const [quantities, setQuantities] = useState({});
  const [showCart, setShowCart] = useState(false);
  const [selectedTable, setSelectedTable] = useState("1");
  const [showTableDropdown, setShowTableDropdown] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch menu items on component mount
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        const items = await menuService.getMenuItems();
        // Filter only available items
        const availableItems = items.filter(item => item.isAvailable);
        setMenuItems(availableItems);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch menu items:', err);
        setError('Failed to load menu items. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  // Categorize menu items dynamically based on price ranges and keywords
  const categorizeMenuItems = () => {
    const categories = {
      beverages: { title: "Beverages", items: [] },
      appetizers: { title: "Appetizers & Sides", items: [] },
      mains: { title: "Main Courses", items: [] },
      desserts: { title: "Desserts", items: [] }
    };

    menuItems.forEach(item => {
      const itemName = item.name.toLowerCase();
      const itemDescription = item.description.toLowerCase();
      
      // Categorize based on keywords
      if (itemName.includes('coffee') || itemName.includes('latte') || 
          itemName.includes('espresso') || itemName.includes('brew') ||
          itemName.includes('cappuccino') || itemName.includes('americano') ||
          itemName.includes('tea') || itemName.includes('smoothie') ||
          itemName.includes('chocolate') && item.basePrice < 6) {
        categories.beverages.items.push({
          ...item,
          id: item.id.toString(),
          price: `$${item.basePrice.toFixed(2)}`
        });
      } else if (itemName.includes('bread') || itemName.includes('fries') ||
                 itemName.includes('salad') || item.basePrice < 8) {
        categories.appetizers.items.push({
          ...item,
          id: item.id.toString(),
          price: `$${item.basePrice.toFixed(2)}`
        });
      } else if (itemName.includes('tiramisu') || itemName.includes('brownie') ||
                 itemName.includes('ice cream') || itemName.includes('sundae') ||
                 itemDescription.includes('dessert')) {
        categories.desserts.items.push({
          ...item,
          id: item.id.toString(),
          price: `$${item.basePrice.toFixed(2)}`
        });
      } else {
        // Everything else goes to main courses
        categories.mains.items.push({
          ...item,
          id: item.id.toString(),
          price: `$${item.basePrice.toFixed(2)}`
        });
      }
    });

    // Filter out empty categories
    return Object.values(categories).filter(cat => cat.items.length > 0);
  };

  const menuCategories = categorizeMenuItems();

  const updateQuantity = (itemId, change) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + change)
    }));
  };

  const getCartItems = () => {
    const items = [];
    menuCategories.forEach(category => {
      category.items.forEach(item => {
        if (quantities[item.id] > 0) {
          items.push({
            ...item,
            quantity: quantities[item.id]
          });
        }
      });
    });
    return items;
  };

  const getTotalItems = () => {
    return Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
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
        <h1 className="text-2xl font-bold text-foreground">Menu</h1>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2">
             <label className="text-sm font-medium text-foreground">
               Table:
             </label>
             <div className="relative table-dropdown">
               <button
                 onClick={() => setShowTableDropdown(!showTableDropdown)}
                 className="h-9 px-3 rounded-lg border border-border/60 bg-card text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 transition-colors shadow-sm flex items-center gap-2 min-w-[120px] justify-between"
               >
                 <span>Table {selectedTable}</span>
                 <ChevronDown className={`h-4 w-4 transition-transform ${showTableDropdown ? 'rotate-180' : ''}`} />
               </button>
               
               {showTableDropdown && (
                 <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border/60 rounded-lg shadow-lg z-50">
                   {Array.from({ length: 6 }, (_, i) => i + 1).map((tableNum) => (
                     <button
                       key={tableNum}
                       onClick={() => {
                         setSelectedTable(tableNum.toString());
                         setShowTableDropdown(false);
                       }}
                       className={`w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg ${
                         selectedTable === tableNum.toString() 
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
        </div>
      </div>
      
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-foreground/60">Loading menu items...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Menu Items */}
      {!loading && !error && (
        <div className="space-y-8">
        {menuCategories.map((category) => (
          <div key={category.title} className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground border-b border-border/50 pb-2">
              {category.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.items.map((item) => (
                <div key={item.id} className="rounded-2xl border border-border/50 bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{item.name}</h3>
                      <p className="text-sm text-foreground/70 mt-1">{item.description}</p>
                      <p className="text-sm font-medium text-primary mt-2">{item.price}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="h-8 w-8 rounded-full border border-border/50 bg-background hover:bg-muted flex items-center justify-center transition-colors"
                      disabled={!quantities[item.id]}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="min-w-[2rem] text-center font-medium">
                      {quantities[item.id] || 0}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="h-8 w-8 rounded-full border border-border/50 bg-background hover:bg-muted flex items-center justify-center transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Cart Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowCart(!showCart)}
          className="relative h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors flex items-center justify-center"
        >
          <ShoppingCart className="h-6 w-6" />
          {getTotalItems() > 0 && (
            <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white text-xs font-medium flex items-center justify-center">
              {getTotalItems()}
            </span>
          )}
        </button>

                 {/* Cart Popup */}
         {showCart && (
           <div className="absolute bottom-16 right-0 w-80 bg-card border border-border/50 rounded-2xl shadow-xl p-4 space-y-3">
             <div className="flex items-center justify-between">
               <div>
                 <h3 className="font-semibold text-foreground">Cart</h3>
                 <p className="text-xs text-foreground/60">Table {selectedTable}</p>
               </div>
               <button
                 onClick={() => setShowCart(false)}
                 className="text-foreground/60 hover:text-foreground"
               >
                 ×
               </button>
             </div>
            
                         {getCartItems().length === 0 ? (
               <p className="text-foreground/60 text-sm py-4 text-center">No items in cart</p>
             ) : (
               <div className="space-y-2 max-h-64 overflow-y-auto">
                 {getCartItems().map((item) => (
                   <div key={item.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-b-0">
                     <div className="flex-1">
                       <div className="font-medium text-sm">{item.name}</div>
                       <div className="text-xs text-foreground/60">{item.price}</div>
                     </div>
                     <div className="flex items-center gap-2">
                       <button
                         onClick={() => updateQuantity(item.id, -1)}
                         className="h-6 w-6 rounded-full border border-border/50 bg-background hover:bg-muted flex items-center justify-center"
                       >
                         <Minus className="h-3 w-3" />
                       </button>
                       <span className="min-w-[1.5rem] text-center text-sm font-medium">
                         {item.quantity}
                       </span>
                       <button
                         onClick={() => updateQuantity(item.id, 1)}
                         className="h-6 w-6 rounded-full border border-border/50 bg-background hover:bg-muted flex items-center justify-center"
                       >
                         <Plus className="h-3 w-3" />
                       </button>
                     </div>
                   </div>
                 ))}
               </div>
             )}
             
             {getCartItems().length > 0 && (
               <div className="pt-3 border-t border-border/30">
                 <button
                   onClick={() => {
                     alert('Order placed successfully!');
                     setQuantities({});
                     setShowCart(false);
                   }}
                   className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                 >
                   Place Order
                 </button>
               </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
