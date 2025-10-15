# Order Placement API Integration

## Overview
Successfully integrated the "Place Order" functionality to save cart items to the task's `extensionsData.orderItems` field when placing orders.

## Changes Made

### 1. **Updated Place Order Function** (`src/pages/AllTables.jsx`)

#### Import Added:
```javascript
import { updateFullTask } from "../services/taskService";
```

#### Updated `newPlaceOrder()` Function:
- Added API order items formatting
- Each cart item is transformed to match the API structure:
  ```javascript
  {
    id: 14,                    // Item ID (integer)
    name: "Mango Smoothie",    // Item name
    description: "Fresh mango blended with yogurt and honey",
    basePrice: 5.75,           // Base price per item (number)
    quantity: 2,               // Quantity ordered
    status: "ORDERED",         // Order status
    price: 11.50               // Total price (basePrice * quantity)
  }
  ```

#### API Call Details:
- **Endpoint**: `https://jitpnf3pv0.execute-api.us-east-1.amazonaws.com/prod/api/task`
- **Method**: PUT (via `updateFullTask`)
- **Headers**: Same authentication headers as task service
- **Body Structure**:
  ```json
  {
    "requestContext": {
      "taskUuid": "a84a02a3-5026-4090-aa08-b746595c05fc"
    },
    "description": "2x Mango Smoothie - $11.50",
    "updateActorType": "USER",
    "assigneeInfo": {
      "uuid": "c17084c5-2ec1-4b53-9676-b6377da957d6",
      "idType": "INTERNAL_ID"
    },
    "extensionsData": {
      "orderItems": [
        {
          "id": 14,
          "name": "Mango Smoothie",
          "description": "Fresh mango blended with yogurt and honey",
          "basePrice": 5.75,
          "quantity": 2,
          "status": "ORDERED",
          "price": 11.50
        }
      ],
      "orderNote": "no ice",
      "orderTimestamp": "2025-10-15T10:30:00.000Z",
      "orderStatus": "ORDERED"
    }
  }
  ```

## Workflow

### When User Clicks "Place Order":
1. **Gather cart items** from current seat/table
2. **Format items** according to API structure:
   - Parse price from string format (`"$5.75"`) to number (`5.75`)
   - Calculate total price per item (basePrice × quantity)
   - Set status to `"ORDERED"`
   - Include item description from menu
3. **Update task via API**:
   - Find the current Order task UUID
   - Call `updateFullTask()` with formatted order items
   - Save to `extensionsData.orderItems`
4. **Update UI** to show order in Serve task
5. **Clear cart** and reset states

## Task UUID Resolution

The function handles three different scenarios:

1. **Table Seat Order**: Uses `expandedCard.currentTaskUuid`
2. **Bar Seat Order**: Uses `expandedCard.currentTaskUuid`
3. **Regular Table Order**: Uses `seatTaskMapping[allSeatsKey]`

## Additional Fields in extensionsData

Beyond `orderItems`, the update also includes:
- `orderNote`: Customer note (e.g., "no onions", "extra sauce")
- `orderTimestamp`: ISO 8601 timestamp of when order was placed
- `orderStatus`: Status set to `"ORDERED"`

## Price Handling

The function intelligently handles prices in multiple formats:
- **String format**: `"$5.75"` → parsed to `5.75`
- **Number format**: Direct use of `basePrice` or `price` property
- **Calculation**: `price = basePrice × quantity` (rounded to 2 decimals)

## Error Handling

- Console logging for debugging order placement
- Try-catch block prevents UI disruption on API errors
- Warning logged if no task UUID is found
- Cart still clears even if API call fails (fail-safe)

## Console Logs for Debugging

The function provides detailed console output:
```
Updating table seat Order task: <UUID>
Updating task with order items: { description: "...", extensionsData: {...} }
Order task updated successfully with cart items
```

Or if no task found:
```
No task UUID found to update with order items
```

## Testing

To test the order placement:

1. **Navigate to All Tables page**
2. **Click on a table** (e.g., Table 1)
3. **Assign seats** if not already assigned
4. **Click on a seat** to open the seat view
5. **Progress to "Order" task**
6. **Click the Menu button** to open menu
7. **Add items to cart** using +/- buttons
8. **Open cart** by clicking the cart button
9. **Add a note** (optional): "no ice"
10. **Click "Place Order"**
11. **Check browser console** for API logs
12. **Verify in backend** that task's `extensionsData.orderItems` contains the order

## Example Console Output

```javascript
Updating table seat Order task: a84a02a3-5026-4090-aa08-b746595c05fc
Updating task with order items: {
  description: "2x Mango Smoothie - $11.50, 1x Garlic Bread - $5.50 (Note: no ice)",
  extensionsData: {
    orderItems: [
      {
        id: 14,
        name: "Mango Smoothie",
        description: "Fresh mango blended with yogurt and honey",
        basePrice: 5.75,
        quantity: 2,
        status: "ORDERED",
        price: 11.50
      },
      {
        id: 5,
        name: "Garlic Bread",
        description: "Toasted bread with garlic butter and herbs",
        basePrice: 5.50,
        quantity: 1,
        status: "ORDERED",
        price: 5.50
      }
    ],
    orderNote: "no ice",
    orderTimestamp: "2025-10-15T10:30:45.123Z",
    orderStatus: "ORDERED"
  }
}
Order task updated successfully with cart items
```

## Benefits

✅ **Persistent Order Data**: Orders saved to backend, not just in UI  
✅ **API Integration**: Uses existing task service infrastructure  
✅ **Structured Data**: Order items in standardized format  
✅ **Full Order Details**: Includes descriptions, prices, quantities  
✅ **Timestamp Tracking**: Records when order was placed  
✅ **Customer Notes**: Preserves special instructions  
✅ **Error Resilient**: Graceful handling of API failures  
✅ **Debugging Support**: Comprehensive console logging

## Related Files

- `src/pages/AllTables.jsx` - Place Order implementation
- `src/services/taskService.js` - `updateFullTask()` function
- `MENU_API_INTEGRATION.md` - Menu items API documentation

