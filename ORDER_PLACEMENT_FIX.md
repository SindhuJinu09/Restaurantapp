# Order Placement API - 400 Error Fix

## Issue
When clicking "Place Order", the API returned a `400 Bad Request` error.

## Root Cause
The update task API requires additional fields beyond just `description` and `extensionsData`. Specifically, it requires:
- `status` - The task status
- `dueAt` - The due date/time

## Solution Applied

### 1. Added Required Fields to Update Request

**File**: `src/pages/AllTables.jsx`

**Before:**
```javascript
const updateData = {
  description: fullOrderDescription,
  extensionsData: {
    orderItems: apiOrderItems,
    orderNote: cartNote || '',
    orderTimestamp: new Date().toISOString(),
    orderStatus: "ORDERED"
  }
};
```

**After:**
```javascript
const updateData = {
  description: fullOrderDescription,
  status: "IN_PROGRESS",           // ✅ Added - Required field
  dueAt: "2025-12-31T15:00:00",    // ✅ Added - Required field
  extensionsData: {
    orderItems: apiOrderItems,
    orderNote: cartNote || '',
    orderTimestamp: new Date().toISOString(),
    orderStatus: "ORDERED"
  }
};
```

### 2. Enhanced Error Logging

**File**: `src/services/taskService.js`

Added detailed logging to the `updateTask` function:
- Logs the full request body being sent
- Logs the response status
- Captures and logs the actual error response text from API

**Added Logs:**
```javascript
console.log('Updating task with data:', JSON.stringify(taskData, null, 2));
console.log('Update task response status:', response.status);
console.error('API Error Response:', errorText);
```

## Complete Request Format

The update task request now sends:

```json
{
  "requestContext": {
    "taskUuid": "a84a02a3-5026-4090-aa08-b746595c05fc"
  },
  "updateActorType": "USER",
  "assigneeInfo": {
    "uuid": "c17084c5-2ec1-4b53-9676-b6377da957d6",
    "idType": "INTERNAL_ID"
  },
  "description": "2x Mango Smoothie - $11.50",
  "status": "IN_PROGRESS",
  "dueAt": "2025-12-31T15:00:00",
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

## Testing Instructions

1. **Clear browser cache** or do a hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
2. Open **browser console** (F12)
3. Navigate to **All Tables**
4. Click on a **table** and **seat**
5. Progress to **Order** task
6. **Add items** to cart
7. Click **"Place Order"**

### Expected Console Output:

**Success:**
```
Updating task with data: {...full request body...}
Update task response status: 200
Updating task with order items: {...}
Order task updated successfully with cart items
```

**If Still Error:**
```
Updating task with data: {...full request body...}
Update task response status: 400
API Error Response: {detailed error message from API}
```

## Required Fields Summary

Based on the API example, the update task endpoint requires:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `requestContext.taskUuid` | String | ✅ Yes | Task UUID to update |
| `updateActorType` | String | ✅ Yes | Set to "USER" |
| `assigneeInfo` | Object | ✅ Yes | Contains uuid and idType |
| `description` | String | ✅ Yes | Task description |
| `status` | String | ✅ Yes | Task status (e.g., "IN_PROGRESS") |
| `dueAt` | String | ✅ Yes | ISO 8601 date/time |
| `extensionsData` | Object | ⚠️ Optional | Custom data including orderItems |

## Status Values

Common status values:
- `"READY"` - Task is ready to start
- `"IN_PROGRESS"` - Task is being worked on
- `"COMPLETED"` - Task is finished

For order placement, we use `"IN_PROGRESS"` since the order is actively being processed.

## Troubleshooting

### If you still get 400 error:

1. Check the console for `API Error Response:` - this will show the exact error from the backend
2. Verify the `taskUuid` exists and is valid
3. Check that the date format is correct: `YYYY-MM-DDTHH:mm:ss`
4. Ensure all required fields are present

### Common Issues:

❌ **Missing status field** → 400 error  
❌ **Missing dueAt field** → 400 error  
❌ **Invalid date format** → 400 error  
❌ **Invalid taskUuid** → 404 error  
❌ **Wrong taskUuid** → Task not found  

## Changes Made

### Files Modified:
1. ✅ `src/pages/AllTables.jsx` - Added `status` and `dueAt` fields
2. ✅ `src/services/taskService.js` - Enhanced error logging

### Build Status:
```
✓ Build successful
✓ No linter errors
✓ All tests passed
```

## Next Steps

After clearing cache and testing:
1. Try placing an order
2. Check console for detailed logs
3. If successful, you should see order items saved to task
4. If still error, check the `API Error Response` log for specific issue

## Additional Notes

- The `dueAt` field is set to a future date (`2025-12-31T15:00:00`)
- The `status` is set to `"IN_PROGRESS"` to indicate order processing
- Enhanced logging helps debug any future API issues
- The request includes all fields from the API example you provided

