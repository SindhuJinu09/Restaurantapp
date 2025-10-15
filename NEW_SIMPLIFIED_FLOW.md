# Simplified Task Flow - Implementation Summary

## Overview
The task management system has been updated with a **simplified, API-driven flow** that skips the old static workflow and creates tasks dynamically based on user actions.

## New Flow Architecture

### Previous Flow (Old - Now Bypassed)
```
Table → Seat Selection → Assign Table → Pre Meal → Order → Serve → Post Meal → Payment
```

### **New Simplified Flow**
```
Table → Select # of Seats → Click Seat → Order Task (Auto-created) → Serve Task → Payment Task
```

## Step-by-Step Process

### 1. Create Table with Seats
- Click on a table
- Prompt appears: "How Many Seats?"
- Select 1-20 seats
- System creates:
  - **1 Parent Table Task** (e.g., "Table 201")
  - **1 "All Seats" Child Task** (Seat ID 1)
  - **N Individual Seat Child Tasks** (Seat 1, Seat 2, etc.)

### 2. Click on Individual Seat
**What Happens:**
- Seat page opens showing all seats
- Click on any seat (e.g., "Seat 1")
- **System automatically creates an "Order" task** for that seat
- Order task is created as a child of the Seat task
- Menu opens automatically for ordering

**API Call Made:**
```json
POST /api/task
{
  "requestContext": {
    "parentTaskUuid": "seat-task-uuid"
  },
  "title": "Order - Seat 1",
  "description": "Order task for Seat 1",
  "assigneeInfo": {
    "uuid": "c17084c5-2ec1-4b53-9676-b6377da957d6",
    "idType": "INTERNAL_ID"
  },
  "dueAt": "2024-12-31T15:00:00",
  "extensionsData": {
    "status": "pending",
    "priority": "MEDIUM",
    "project": "Restaurant",
    "subtask_of": "seat-task-uuid",
    "taskType": "ORDER",
    "seatNumber": 2,
    "tableId": "T201"
  }
}
```

### 3. Place Order
**What Happens:**
- User adds items to cart
- User clicks "Place Order"
- **Order task description is updated via API** with order details

**API Call Made:**
```json
PUT /api/task
{
  "requestContext": {
    "taskUuid": "order-task-uuid"
  },
  "description": "2x Burger - $20.00, 1x Fries - $5.00 (Note: No onions)",
  "updateActorType": "USER",
  "assigneeInfo": {
    "uuid": "c17084c5-2ec1-4b53-9676-b6377da957d6",
    "idType": "INTERNAL_ID"
  }
}
```

**Order Description Format:**
```
{quantity}x {item_name} - ${total}, ...
(Note: {customer_note})
```

### 4. Click "Next Task" (From Order)
**What Happens:**
- System fetches Order task from API to get description
- **System creates "Serve" task** as child of Seat task
- Serve task description includes the order details
- UI switches to Serve view showing order description

**API Calls Made:**

1. **Fetch Order Task:**
```json
GET /api/task/{order-task-uuid}

Response:
{
  "taskDTO": {
    "taskUuid": "order-task-uuid",
    "description": "2x Burger - $20.00, 1x Fries - $5.00 (Note: No onions)",
    ...
  }
}
```

2. **Create Serve Task:**
```json
POST /api/task
{
  "requestContext": {
    "parentTaskUuid": "seat-task-uuid"
  },
  "title": "Serve - Seat 1",
  "description": "Serve: 2x Burger - $20.00, 1x Fries - $5.00 (Note: No onions)",
  "assigneeInfo": {
    "uuid": "c17084c5-2ec1-4b53-9676-b6377da957d6",
    "idType": "INTERNAL_ID"
  },
  "dueAt": "2024-12-31T15:00:00",
  "extensionsData": {
    "status": "pending",
    "priority": "MEDIUM",
    "project": "Restaurant",
    "subtask_of": "seat-task-uuid",
    "taskType": "SERVE",
    "seatNumber": 2,
    "tableId": "T201",
    "orderDetails": "2x Burger - $20.00, 1x Fries - $5.00 (Note: No onions)"
  }
}
```

### 5. Serve Task View
**What's Displayed:**
- Task header: "Serve - Seat 1"
- Order Details card showing full order description
- Instructions: "Please serve the items listed above to Seat 1"
- Button: "Mark as Served & Continue to Payment"

### 6. Click "Next Task" (From Serve)
**What Happens:**
- System creates "Payment" task as child of Seat task
- UI switches to Payment view

**API Call Made:**
```json
POST /api/task
{
  "requestContext": {
    "parentTaskUuid": "seat-task-uuid"
  },
  "title": "Payment - Seat 1",
  "description": "Payment for Seat 1",
  "assigneeInfo": {
    "uuid": "c17084c5-2ec1-4b53-9676-b6377da957d6",
    "idType": "INTERNAL_ID"
  },
  "dueAt": "2024-12-31T15:00:00",
  "extensionsData": {
    "status": "pending",
    "priority": "MEDIUM",
    "project": "Restaurant",
    "subtask_of": "seat-task-uuid",
    "taskType": "PAYMENT",
    "seatNumber": 2,
    "tableId": "T201"
  }
}
```

## Task Hierarchy

### Final Task Structure
```
Table "T201" (Parent Task)
  └── UUID: table-task-uuid
      │
      ├── "All Seats" (Child of Table)
      │   └── UUID: all-seats-uuid
      │
      ├── "Seat 1" (Child of Table)
      │   ├── UUID: seat-1-uuid
      │   └── Child Tasks:
      │       ├── "Order - Seat 1" (Child of Seat 1)
      │       │   └── UUID: order-task-uuid
      │       │   └── Description: "2x Burger - $20.00, ..."
      │       │
      │       ├── "Serve - Seat 1" (Child of Seat 1)
      │       │   └── UUID: serve-task-uuid
      │       │   └── Description: "Serve: 2x Burger - $20.00, ..."
      │       │
      │       └── "Payment - Seat 1" (Child of Seat 1)
      │           └── UUID: payment-task-uuid
      │
      └── "Seat 2" (Child of Table)
          └── ... (same structure)
```

## Key Features

### 1. **Automatic Order Task Creation**
- No manual task creation needed
- Order task created when seat is clicked
- Menu opens automatically for easy ordering

### 2. **API-Driven Description Updates**
- Order details stored in Order task description
- Serve task retrieves and displays order details
- Real-time sync with backend

### 3. **Proper Parent-Child Linking**
- All tasks linked via `parentTaskUuid` in `requestContext`
- Maintains proper hierarchy: Table → Seat → Order/Serve/Payment
- Easy to query and track task relationships

### 4. **Clean UI Flow**
- Order → Shows menu
- Serve → Shows order description
- Payment → Shows payment options
- Each step clearly defined and purpose-driven

## Code Changes Summary

### 1. **`handleSeatPageSeatClick()` - Line 707**
```javascript
// Auto-creates Order task when seat is clicked
const orderTaskUuid = await createSubTask(
  seatTaskUuid,
  `Order - Seat ${seatNumber - 1}`,
  `Order task for Seat ${seatNumber - 1}`,
  'ORDER',
  { seatNumber, tableId, taskType: 'ORDER' }
);

// Opens expanded card with Order task
setExpandedCard({
  ...seatObject,
  currentTask: { id: "order", name: "Order", type: "ORDER" },
  currentTaskUuid: orderTaskUuid,
  seatTaskUuid: seatTaskUuid
});

// Show menu automatically
setShowMenu(true);
```

### 2. **`newPlaceOrder()` - Line 995**
```javascript
// Update Order task description with order details
if (expandedCard.currentTaskUuid) {
  await updateTaskDescription(
    expandedCard.currentTaskUuid, 
    fullOrderDescription
  );
}
```

### 3. **`handleNextTask()` - Line 1457**
```javascript
// Check current task type
const currentTaskType = expandedCard.currentTask.type;

if (currentTaskType === 'ORDER') {
  // Fetch Order task description
  const orderTaskResponse = await taskService.getTaskById(
    expandedCard.currentTaskUuid
  );
  const orderDescription = orderTaskResponse?.taskDTO?.description;
  
  // Create Serve task with order description
  const serveTaskUuid = await createSubTask(
    seatTaskUuid,
    `Serve - Seat ${seatNumber - 1}`,
    `Serve: ${orderDescription}`,
    'SERVE',
    { seatNumber, tableId, taskType: 'SERVE', orderDetails: orderDescription }
  );
  
  // Update UI to show Serve task
  setExpandedCard({
    ...prev,
    currentTask: { id: "serve", name: "Serve", type: "SERVE" },
    currentTaskUuid: serveTaskUuid,
    orderDescription: orderDescription
  });
}
```

### 4. **Serve Task UI - Line 2833**
```javascript
{/* Show Order Description for Serve Task */}
{expandedCard.currentTask.type === 'SERVE' && expandedCard.orderDescription ? (
  <div className="space-y-4">
    <h3>Serve - Seat {expandedCard.seatNumber - 1}</h3>
    
    <div className="order-details">
      <h4>Order Details:</h4>
      <p>{expandedCard.orderDescription}</p>
    </div>
    
    <button onClick={handleNextTask}>
      Mark as Served & Continue to Payment
    </button>
  </div>
) : /* ... other task views ... */}
```

## Testing the New Flow

### Test Case 1: Single Seat Order
1. Click table → Enter "1" seat → Confirm
2. Click "Seat 1" → Order task created automatically
3. Add items to cart → Click "Place Order"
4. Verify order description updated in API
5. Click "Next Task" → Serve task shows order details
6. Click "Next Task" → Payment task created

### Test Case 2: Multiple Seats
1. Click table → Enter "4" seats → Confirm
2. Click "Seat 1" → Place order → Complete flow
3. Click "Seat 2" → Place different order → Complete flow
4. Verify each seat has independent task chain
5. Verify all tasks linked to same table parent

### Test Case 3: API Verification
1. Use browser DevTools → Network tab
2. Watch API calls during flow:
   - POST `/api/task` when seat clicked (Order task)
   - PUT `/api/task` when order placed (Update description)
   - GET `/api/task/{uuid}` when Next Task clicked (Fetch order)
   - POST `/api/task` when moving to Serve (Serve task)
   - POST `/api/task` when moving to Payment (Payment task)

## Benefits of New Flow

1. **Simpler**: Only 3 steps (Order → Serve → Payment)
2. **API-Driven**: All data stored and retrieved from backend
3. **Real-Time**: Order details passed between tasks
4. **Scalable**: Each seat independent workflow
5. **Maintainable**: Clear task types and hierarchy
6. **Flexible**: Easy to add more task types later

## Migration Notes

- **Old flow still works** for "All Seats" and bar seats (backward compatible)
- **New flow** only applies to individual seat clicks
- Detection: New flow uses `expandedCard.currentTaskUuid` to identify new tasks
- Old flow: Uses `expandedCard.currentTaskIndex` and static `taskFlow` array

## Future Enhancements

1. **Kitchen Display**: Serve task could trigger kitchen display
2. **Order Modifications**: Add ability to modify order after placement
3. **Split Payments**: Multiple payment methods per seat
4. **Task Status**: Update task status to IN_PROGRESS, COMPLETED
5. **Notifications**: Real-time updates when task status changes

---

**Implementation Date**: October 13, 2025  
**Status**: ✅ Complete and Ready for Testing


