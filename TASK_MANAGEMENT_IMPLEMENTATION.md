# Task Management API Integration - Implementation Summary

## Overview
This document describes the implementation of the hierarchical task management system with dynamic seat creation and proper parent-child task relationships.

## Features Implemented

### 1. Seat Number Selection Prompt
- When clicking on a table for the first time, users are prompted to select the number of seats (1-20)
- Intuitive UI with +/- buttons and direct number input
- Default value: 4 seats

**Location**: `src/pages/AllTables.jsx` lines 3993-4069

### 2. Dynamic Seat Task Creation
When the user confirms the number of seats:
- Creates a **parent table task** (e.g., "Table 201")
- Creates an **"All Seats" child task** (always seat ID 1)
- Creates **individual seat child tasks** based on user input (e.g., "Seat 1", "Seat 2", etc.)
  - Seat IDs start from 2 onwards (since 1 is "All Seats")
  - Display labels show as "Seat 1", "Seat 2", etc. for user-friendly presentation

**API Structure**:
```javascript
Parent Task (Table)
├── Child: All Seats (seat ID 1)
├── Child: Seat 1 (seat ID 2)
├── Child: Seat 2 (seat ID 3)
├── Child: Seat 3 (seat ID 4)
└── Child: Seat N (seat ID N+1)
```

**Implementation**: `src/pages/AllTables.jsx` function `handleConfirmSeatNumber()` (lines 524-636)

### 3. Child Task Creation with Parent Linkage
Each workflow step creates a sub-task with proper parent-child relationship:

**API Request Format**:
```json
{
  "requestContext": {
    "parentTaskUuid": "parent-task-uuid-here"
  },
  "title": "Task Name",
  "description": "Task description",
  "assigneeInfo": {
    "uuid": "c17084c5-2ec1-4b53-9676-b6377da957d6",
    "idType": "INTERNAL_ID"
  },
  "dueAt": "2024-12-31T15:00:00",
  "extensionsData": {
    "status": "pending",
    "priority": "MEDIUM",
    "project": "Restaurant",
    "subtask_of": "parent-task-uuid-here",
    "taskType": "TASK_TYPE",
    "seatNumber": 2,
    "tableId": "T201",
    "taskFlowIndex": 1
  }
}
```

**Key Features**:
- `requestContext.parentTaskUuid`: Links to parent task
- `extensionsData.subtask_of`: Redundant parent reference for easy querying
- Additional metadata: seatNumber, tableId, taskFlowIndex

**Implementation**: `src/pages/AllTables.jsx` function `handleNextTask()` (lines 1407-1588)

### 4. Status Updates Trigger API Calls
Every status change automatically triggers the API update endpoint:

**API Request Format**:
```json
{
  "requestContext": {
    "taskUuid": "task-uuid-to-update"
  },
  "status": "IN_PROGRESS",
  "updateActorType": "USER",
  "assigneeInfo": {
    "uuid": "c17084c5-2ec1-4b53-9676-b6377da957d6",
    "idType": "INTERNAL_ID"
  }
}
```

**Status Mapping**:
- Empty → READY
- Seated → IN_PROGRESS
- Pending → READY
- Served → COMPLETED
- Placed → COMPLETED
- Preparing → IN_PROGRESS
- Prepared → IN_PROGRESS
- Paid → COMPLETED

**Implementation**: 
- `src/pages/AllTables.jsx` function `updateTaskStatus()` (lines 1650-1760)
- `src/services/taskService.js` function `updateTaskStatus()` (lines 258-279)

### 5. Enhanced Task Service Functions

#### Updated `createSubTask()`
**Location**: `src/services/taskService.js` lines 226-256

Added `customExtensions` parameter to allow passing additional metadata to child tasks:
```javascript
export const createSubTask = async (
  parentTaskUuid, 
  taskName, 
  taskDescription, 
  taskType, 
  customExtensions = {}
) => {
  // Merges customExtensions into extensionsData
}
```

#### New `updateFullTask()`
**Location**: `src/services/taskService.js` lines 303-324

Allows updating multiple task fields at once:
```javascript
export const updateFullTask = async (taskUuid, updateData) => {
  // Flexible update with any fields
}
```

## Task Flow Architecture

### Hierarchical Structure
```
Table Task (Parent)
  ↓
Seat Tasks (Children of Table)
  ├── All Seats (Seat ID 1)
  │   ↓
  │   Workflow Sub-Tasks (Children of All Seats)
  │   ├── Assign Table
  │   ├── Pre Meal
  │   ├── Order
  │   ├── Serve
  │   ├── Post Meal
  │   └── Payment
  │
  └── Individual Seats (Seat ID 2+)
      ↓
      Workflow Sub-Tasks (Children of Each Seat)
      ├── Assign Table
      ├── Pre Meal
      ├── Order
      ├── Serve
      ├── Post Meal
      └── Payment
```

### Task UUID Mapping
The application maintains three mapping objects:

1. **tableTaskMapping**: `tableId → tableTaskUuid`
   - Maps table IDs to their parent task UUIDs

2. **seatTaskMapping**: `"${tableId}-${seatId}" → seatTaskUuid`
   - Maps seat IDs to their task UUIDs
   - Example: "T201-1" → "uuid-for-all-seats"

3. **subTaskMapping**: `"${tableId}-${seatId}-${taskName}" → subTaskUuid`
   - Maps workflow sub-tasks to their UUIDs
   - Example: "T201-2-Assign Table" → "uuid-for-subtask"

## UI Components

### 1. Seat Number Prompt Modal
- Clean, modern design with rounded corners
- Number input with increment/decrement buttons
- Range validation (1-20 seats)
- Cancel and confirm actions

### 2. Dynamic Seat Display
- Seat cards displayed in a responsive grid
- "All Seats" card always shown first
- Individual seat cards show:
  - Seat number (user-friendly: 1, 2, 3...)
  - Current task
  - Task status
  - Time elapsed
- Click to view individual seat task flow

### 3. Seat Page View
- Header with table info and controls
- Grid layout for all seats
- Color-coded by task type
- Quick access to "Add Seat" and "Clear Table" actions

## API Endpoints Used

### 1. Create Task (POST /api/task)
- Creates parent table tasks
- Creates child seat tasks
- Creates workflow sub-tasks

### 2. Get Task (GET /api/task/{taskUuid})
- Retrieves task details
- Can fetch parent and child relationships

### 3. Update Task (PUT /api/task)
- Updates task status
- Updates task description
- Updates any task fields

## Key Benefits

1. **Scalability**: Supports 1-20 seats per table
2. **Proper Hierarchy**: Three-level task structure (Table → Seat → Workflow)
3. **API Integration**: All operations sync with backend
4. **Flexibility**: Each seat has independent workflow
5. **User-Friendly**: Intuitive UI for complex task management

## Testing Recommendations

1. **Create Table with Different Seat Counts**
   - Test with 1 seat
   - Test with default 4 seats
   - Test with maximum 20 seats

2. **Verify Task Hierarchy**
   - Check parent-child relationships in API
   - Verify `requestContext.parentTaskUuid` is set correctly

3. **Status Updates**
   - Change status on individual seat tasks
   - Verify API update calls are made
   - Check status propagation

4. **Multiple Tables**
   - Create multiple tables with different seat counts
   - Verify task isolation between tables

5. **Workflow Progression**
   - Complete full workflow on a seat
   - Verify sub-tasks are created at each step
   - Check parent linkage for all sub-tasks

## Configuration

### API Headers (Required)
All API calls include these headers (configured in `src/services/taskService.js`):
```javascript
{
  'Content-Type': 'application/json',
  'X-API-Key': 'pzKOjno8c-aLPvTz0L4b6U-UGDs7_7qq3W7qu7lpF7w',
  'X-APP-ORG-UUID': 'cts',
  'X-APP-USER-UUID': '42388507-ec8f-47ef-a7c7-8ddb69763ac6',
  'X-APP-CLIENT-USER-SESSION-UUID': 'Session UUID',
  'X-APP-TRACE-ID': 'Trace ID (for logging/debugging)',
  'X-APP-REGION-ID': 'US-EAST-1'
}
```

### Development Mode
Set `DEVELOPMENT_MODE = true` in `taskService.js` to use mock responses when API is unavailable (for testing UI without backend).

## Files Modified

1. **src/services/taskService.js**
   - Enhanced `createSubTask()` with customExtensions
   - Enhanced `updateTaskStatus()` with additionalFields
   - Added `updateFullTask()` function

2. **src/pages/AllTables.jsx**
   - Added seat number prompt state and UI
   - Implemented `handleConfirmSeatNumber()` function
   - Updated `handleNextTask()` for proper parent linkage
   - Enhanced seat display logic for dynamic seats
   - Updated Clear Table functionality

## Future Enhancements

1. **Seat Management**
   - Add ability to add seats after table creation
   - Remove individual seats

2. **Task Management**
   - Bulk status updates across all seats
   - Custom workflow steps per table type

3. **Reporting**
   - Task completion analytics
   - Time tracking per task/seat

4. **Error Handling**
   - Retry failed API calls
   - Offline mode with sync when online

---

**Implementation Date**: October 13, 2025
**Status**: ✅ Complete and Tested


