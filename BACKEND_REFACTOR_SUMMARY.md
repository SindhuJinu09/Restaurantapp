# Backend State Management Refactor - Progress Summary

## ✅ Completed

### 1. Backend Service Updates (`src/services/taskService.js`)
- ✅ Added `filterTasksByAttributes()` function to filter tasks by `table_id`, `seat_id`, `task_status`
- ✅ Function uses POST to `/api/tasks/filter` with proper filterCriteria structure

### 2. Backend State Management Functions (`src/pages/AllTables.jsx`)
- ✅ Added `ASSIGNEE_INFO` constant for consistent API calls
- ✅ Added state variables:
  - `activeTasksForTable` - stores active tasks per table
  - `selectedTableId` - currently viewing table
  - `loadingTasks` - loading state
- ✅ Added `fetchActiveTasks(tableId)` - fetches active tasks from backend
- ✅ Added `refreshTasksForTable(tableId)` - refresh tasks for a table
- ✅ Added `createBackendTasks(tableId, numberOfSeats)` - creates table and seat tasks with proper `extensionsData`

### 3. Updated Seat Creation Flow
- ✅ Modified `handleConfirmSeatNumber()` to use new `createBackendTasks()` function
- ✅ Removed frontend state initialization (now backend-driven)

## 🔄 Remaining Work

### 1. Order Flow Updates (`newPlaceOrder()`)
**Location**: Around line 1050+
**Changes Needed**:
- Update Order task status to "COMPLETED" with orderItems in extensionsData
- Create Serve task as child with orderItems
- Refresh tasks from backend
- Navigate to Serve view

### 2. Order More Flow (`handleOrderMoreClick()`)
**Changes Needed**:
- Get previous orderItems from current Serve task's extensionsData
- Create new Order task with combined orderItems
- Update Serve task with all orderItems (previous + new)
- Refresh tasks from backend

### 3. Serve Flow Updates
**Changes Needed**:
- Update item statuses in Serve task's extensionsData
- When "Next" clicked: mark Serve task "COMPLETED", create Payment task as child
- Refresh tasks from backend

### 4. UI Display Updates
**Location**: Seat rendering section (around line 4000+)
**Changes Needed**:
- Display tasks from `activeTasksForTable` instead of `tableSeats`
- Use `task.extensionsData.seat_id` for seat identification
- Show task title from backend tasks

### 5. Remove Old State Management
**Remove these states** (keep for now during transition):
- `tableSeats` - replaced by `activeTasksForTable`
- `tableTaskMapping` - backend manages this now
- `seatTaskMapping` - backend manages this now
- `subTaskMapping` - backend manages this now

### 6. Update Task Status Mappings
- Map backend task statuses to UI display
- Handle status transitions properly

## 📋 Current Implementation Notes

### Task Creation Structure
```javascript
{
  extensionsData: {
    table_id: "T-101",
    seat_id: "99" | "1" | "2" | ...,
    task_status: "ACTIVE" | "COMPLETED",
    orderItems: [...],  // For Order/Serve/Payment tasks
    orderNumber: 1,     // For tracking multiple orders
    // ... other fields
  }
}
```

### Parent-Child Relationships
```javascript
// Child tasks include parent UUID in requestContext
{
  requestContext: {
    taskUuid: "parent-task-uuid"
  }
}
```

## 🚀 Next Steps Priority

1. **HIGH**: Update Order placement to use backend
2. **HIGH**: Update Serve task creation and updates
3. **MEDIUM**: Update Payment task creation
4. **MEDIUM**: Update Order More flow
5. **LOW**: UI display updates to use backend data
6. **LOW**: Remove old frontend state management

## ⚠️ Testing Checklist

- [ ] Create table with seats
- [ ] Place order and verify Serve task creation
- [ ] Order More and verify accumulated items
- [ ] Mark items as served
- [ ] Complete payment
- [ ] Refresh page and verify state persistence
- [ ] Multi-user scenario (same table)

