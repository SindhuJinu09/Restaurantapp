# Backend State Management - Detailed Implementation Plan

## Overview
Update AllTables.jsx to use backend-managed state while keeping the UI exactly the same.

## Files to Update
1. `src/pages/AllTables.jsx` - Main file with all the updates
2. Already completed: `src/services/taskService.js` - filterTasksByAttributes function

## Implementation Strategy

Since this is a large refactoring, here's the approach:
1. Keep UI exactly as is
2. Replace frontend state with backend API calls
3. Maintain the same user experience
4. All data now comes from backend

## Changes Required

### 1. Order Placement (`newPlaceOrder()`)
**Current**: Updates frontend state (tableSeats, barSeats, rows)
**New**: 
- Update Order task to "COMPLETED" with orderItems in extensionsData
- Create Serve task as child with orderItems
- Use activeTasksForTable for UI display
- Refresh from backend after update

### 2. Order More Flow
**Current**: Updates frontend state
**New**:
- Get previous orderItems from Serve task's extensionsData
- Create new Order task with combined items
- Update Serve task with all items
- Refresh from backend

### 3. Serve Task Updates
**Current**: Updates item status in frontend state
**New**:
- Update Serve task's extensionsData with item statuses
- Refresh from backend
- On "Next": mark Serve "COMPLETED", create Payment task

### 4. Display Logic
**Current**: Uses tableSeats, barSeats, rows
**New**: Use activeTasksForTable with fetched backend data

## Key Functions to Update

1. `newPlaceOrder()` - Order placement
2. `handleOrderMoreClick()` - Order more functionality
3. `newUpdateItemServed()` - Mark items as served
4. `handleNextTaskClick()` - Task progression
5. `newGetServeOrders()` - Get orders for display
6. Display rendering logic

## Implementation Steps

1. Update order placement to create/update backend tasks
2. Update serve task to update backend
3. Update payment flow to create payment task
4. Update display logic to use backend data
5. Test end-to-end flow

## Notes

- Keep UI state management for display (expandedCard, etc.)
- Replace data source from frontend state to backend
- Add refresh calls after each backend update
- Maintain backward compatibility during transition

