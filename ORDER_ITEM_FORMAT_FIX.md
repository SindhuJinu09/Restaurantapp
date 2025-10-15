# Order Item Format Fix

## Changes Made

### 1. Fixed `$NaN` Issue in Description
**Problem**: Price was being multiplied as a string, causing `NaN` in the description.

**Solution**: Added proper price parsing for the description calculation:
```javascript
const orderItems = currentCart.map(item => {
  // Parse price from string format "$X.XX" to number for description
  const basePrice = typeof item.price === 'string' 
    ? parseFloat(item.price.replace('$', '')) 
    : item.basePrice || item.price || 0;
  
  return {
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    price: basePrice,  // Now a proper number
    seatId: item.seatId,
    kitchenStatus: "Preparing"
  };
});
```

### 2. Moved Fields into Each Order Item
**Previous Structure** (fields at extensionsData level):
```json
{
  "extensionsData": {
    "priority": "HIGH",
    "orderItems": [...],
    "orderNote": "no ice",
    "orderTimestamp": "2025-10-15T03:57:26.981Z",
    "orderStatus": "ORDERED"
  }
}
```

**New Structure** (fields inside each order item):
```json
{
  "extensionsData": {
    "priority": "HIGH",
    "orderItems": [
      {
        "id": 3,
        "name": "Americano",
        "description": "Smooth espresso diluted with hot water",
        "basePrice": 3,
        "isAvailable": true,
        "quantity": 1,
        "status": "ORDERED",
        "price": 3,
        "orderNote": "no ice",
        "orderTimestamp": "2025-10-15T03:57:26.981Z",
        "orderStatus": "ORDERED"
      }
    ]
  }
}
```

### 3. Code Changes

**Added timestamp generation:**
```javascript
// Get current timestamp for order
const orderTimestamp = new Date().toISOString();
```

**Updated order item mapping:**
```javascript
const apiOrderItems = currentCart.map(item => {
  const basePrice = typeof item.price === 'string' 
    ? parseFloat(item.price.replace('$', '')) 
    : item.basePrice || item.price || 0;
  
  return {
    id: parseInt(item.id) || item.id,
    name: item.name,
    description: item.description || '',
    basePrice: basePrice,
    isAvailable: true,
    quantity: item.quantity,
    status: "ORDERED",
    price: parseFloat((basePrice * item.quantity).toFixed(2)),
    orderNote: cartNote || "",           // ✅ Moved into item
    orderTimestamp: orderTimestamp,       // ✅ Moved into item
    orderStatus: "ORDERED"                // ✅ Moved into item
  };
});
```

**Updated extensionsData:**
```javascript
extensionsData: {
  priority: "HIGH",
  orderItems: apiOrderItems  // Now includes orderNote, orderTimestamp, orderStatus in each item
}
```

## Complete Request Format

The API request now sends:

```json
{
  "requestContext": {
    "taskUuid": "d7f9488d-7231-4dbb-9f0e-25429a5b6b64"
  },
  "updateActorType": "USER",
  "assigneeInfo": {
    "uuid": "c17084c5-2ec1-4b53-9676-b6377da957d6",
    "idType": "INTERNAL_ID"
  },
  "title": "Table T-101 Seat 2",
  "description": "1x Americano - $3.00",
  "status": "IN_PROGRESS",
  "dueAt": "2025-12-31T15:00:00",
  "extensionsData": {
    "priority": "HIGH",
    "orderItems": [
      {
        "id": 3,
        "name": "Americano",
        "description": "Smooth espresso diluted with hot water",
        "basePrice": 3,
        "isAvailable": true,
        "quantity": 1,
        "status": "ORDERED",
        "price": 3,
        "orderNote": "",
        "orderTimestamp": "2025-10-15T03:57:26.981Z",
        "orderStatus": "ORDERED"
      }
    ]
  }
}
```

## Fields Per Order Item

Each order item now contains:

| Field | Type | Example | Description |
|-------|------|---------|-------------|
| `id` | Number | `3` | Menu item ID |
| `name` | String | `"Americano"` | Item name |
| `description` | String | `"Smooth espresso..."` | Item description |
| `basePrice` | Number | `3.00` | Price per unit |
| `isAvailable` | Boolean | `true` | Item availability |
| `quantity` | Number | `1` | Quantity ordered |
| `status` | String | `"ORDERED"` | Order status |
| `price` | Number | `3.00` | Total price (basePrice × quantity) |
| `orderNote` | String | `"no ice"` | Customer note for this item |
| `orderTimestamp` | String | `"2025-10-15T..."` | When order was placed |
| `orderStatus` | String | `"ORDERED"` | Overall order status |

## Benefits

✅ **Fixed NaN Issue**: Description now shows proper prices (e.g., "$3.00" instead of "$NaN")  
✅ **Item-Level Tracking**: Each order item has its own note, timestamp, and status  
✅ **Better Structure**: More logical organization with item-specific data in each item  
✅ **Consistent Timestamps**: All items in an order share the same timestamp  
✅ **Per-Item Notes**: Different items can have different notes if needed in the future  

## Testing

1. **Clear browser cache** (Ctrl+Shift+R)
2. Navigate to **All Tables**
3. Select a **table** and **seat**
4. Progress to **Order** task
5. Add items to cart
6. Add a note (optional)
7. Click **"Place Order"**

### Expected Console Output:

```javascript
Updating task with order items: {
  "title": "Table T-101 Seat 2",
  "description": "1x Americano - $3.00",  // ✅ No more $NaN
  "extensionsData": {
    "orderItems": [
      {
        "id": 3,
        "price": 3,  // ✅ Proper number
        "orderNote": "",
        "orderTimestamp": "2025-10-15T03:57:26.981Z",
        "orderStatus": "ORDERED"
        // All fields now in each item ✅
      }
    ]
  }
}
```

## Example with Multiple Items

```json
{
  "extensionsData": {
    "priority": "HIGH",
    "orderItems": [
      {
        "id": 3,
        "name": "Americano",
        "basePrice": 3,
        "quantity": 2,
        "price": 6,
        "orderNote": "extra hot",
        "orderTimestamp": "2025-10-15T03:57:26.981Z",
        "orderStatus": "ORDERED"
      },
      {
        "id": 5,
        "name": "Garlic Bread",
        "basePrice": 5.5,
        "quantity": 1,
        "price": 5.5,
        "orderNote": "extra hot",
        "orderTimestamp": "2025-10-15T03:57:26.981Z",
        "orderStatus": "ORDERED"
      }
    ]
  }
}
```

## Build Status

```
✓ Build successful
✓ No linter errors
✓ 1258 modules transformed
✓ Size: 321.35 kB
```

## Files Modified

- ✅ `src/pages/AllTables.jsx`
  - Fixed price parsing for description
  - Added orderTimestamp constant
  - Moved orderNote, orderTimestamp, orderStatus into each order item
  - Removed these fields from extensionsData root level

