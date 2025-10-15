# Quick Start Guide - Task Management System

## How It Works

### 1. Creating a Table with Seats

**Step 1**: Click on any table card
- A prompt appears: "How Many Seats?"

**Step 2**: Select number of seats (1-20)
- Use +/- buttons or type directly
- Default is 4 seats

**Step 3**: Click "Create X Seats"
- System creates:
  - 1 Table Task (parent)
  - 1 "All Seats" task (for managing all seats together)
  - X Individual Seat tasks (Seat 1, Seat 2, etc.)

### 2. Managing Seats

**Seat Page View**:
- Shows all seats in a grid
- "All Seats" card - manage all seats together
- Individual seat cards - manage each seat independently

**Click on "All Seats"**:
- Opens task flow for all seats
- Changes apply to all seats simultaneously

**Click on individual seat** (e.g., "Seat 1"):
- Opens task flow for that specific seat
- Changes only affect that seat

### 3. Task Workflow

Each seat follows this workflow:
1. **Assign Table** → Mark as "Seated"
2. **Pre Meal** → Mark as "Served"
3. **Order** → Place orders
4. **Serve** → Mark items as served
5. **Post Meal** → Mark as "Served"
6. **Payment** → Mark as "Paid"

**How to Progress**:
1. Change status using dropdown/buttons
2. Click "Next Task" when ready
3. System creates a child task for the next step
4. All changes sync with API automatically

### 4. Task Hierarchy in API

```
Table "T201" (Parent Task)
  ├── UUID: abc-123
  │
  ├── "All Seats" (Child of Table)
  │   ├── UUID: def-456
  │   └── Child Tasks:
  │       ├── "Assign Table" (Child of All Seats)
  │       ├── "Pre Meal" (Child of All Seats)
  │       └── ...
  │
  ├── "Seat 1" (Child of Table)
  │   ├── UUID: ghi-789
  │   └── Child Tasks:
  │       ├── "Assign Table" (Child of Seat 1)
  │       ├── "Pre Meal" (Child of Seat 1)
  │       └── ...
  │
  └── "Seat 2" (Child of Table)
      ├── UUID: jkl-012
      └── Child Tasks:
          ├── "Assign Table" (Child of Seat 2)
          └── ...
```

## API Request Examples

### Creating a Child Task

When you click "Next Task", the system sends:

```json
{
  "requestContext": {
    "parentTaskUuid": "parent-seat-uuid"
  },
  "title": "Pre Meal",
  "description": "Task: Pre Meal for Seat 1",
  "assigneeInfo": {
    "uuid": "c17084c5-2ec1-4b53-9676-b6377da957d6",
    "idType": "INTERNAL_ID"
  },
  "dueAt": "2024-12-31T15:00:00",
  "extensionsData": {
    "status": "pending",
    "priority": "MEDIUM",
    "project": "Restaurant",
    "subtask_of": "parent-seat-uuid",
    "taskType": "PRE_MEAL",
    "seatNumber": 2,
    "tableId": "T201",
    "taskFlowIndex": 1
  }
}
```

**Key Points**:
- `parentTaskUuid` links to parent seat task
- `extensionsData.subtask_of` provides redundant parent reference
- Additional metadata helps with filtering and reporting

### Updating Task Status

When you change a status, the system sends:

```json
{
  "requestContext": {
    "taskUuid": "task-to-update-uuid"
  },
  "status": "IN_PROGRESS",
  "updateActorType": "USER",
  "assigneeInfo": {
    "uuid": "c17084c5-2ec1-4b53-9676-b6377da957d6",
    "idType": "INTERNAL_ID"
  }
}
```

## Status Mapping

| UI Status  | API Status   | When Used                |
|-----------|--------------|--------------------------|
| Empty     | READY        | Initial state            |
| Seated    | IN_PROGRESS  | Customer seated          |
| Pending   | READY        | Waiting for action       |
| Served    | COMPLETED    | Item/meal served         |
| Placed    | COMPLETED    | Order placed             |
| Preparing | IN_PROGRESS  | Kitchen preparing        |
| Prepared  | IN_PROGRESS  | Ready to serve           |
| Paid      | COMPLETED    | Payment completed        |

## Common Operations

### Adding More Seats Later
1. Click "Add Seat" button in Seat Page View
2. Select additional seats from the popup
3. New seat tasks are created with same parent table

### Clearing a Table
1. Click "Clear Table" button
2. All seats reset to initial state
3. Task history is cleared
4. Ready for new customers

### Viewing Task Details
All task UUIDs are tracked in the application:
- `tableTaskMapping`: Table ID → Parent Task UUID
- `seatTaskMapping`: Seat Key → Seat Task UUID
- `subTaskMapping`: Sub-task Key → Sub-task UUID

You can retrieve these UUIDs for API calls or debugging.

## Tips

1. **Use "All Seats" for simple tables**: When all customers need the same service
2. **Use individual seats for complex orders**: When customers order separately
3. **Status changes are automatic**: Every change triggers API update
4. **Child tasks track workflow**: Each workflow step creates a child task with proper linkage

## Troubleshooting

### Task not creating?
- Check browser console for API errors
- Verify DEVELOPMENT_MODE setting in `taskService.js`
- Check network tab for failed requests

### Seats not showing?
- Verify seat number was confirmed in prompt
- Check that table has `selectedSeats` property
- Look for seat data in `tableSeats` state

### Status update not working?
- Ensure task UUID exists in mapping
- Check that status is in valid list
- Verify API endpoint is accessible

## Development Mode

Set `DEVELOPMENT_MODE = true` in `src/services/taskService.js` to:
- Use mock API responses
- Test UI without backend
- Development and debugging

**Note**: Mock mode generates random UUIDs but doesn't persist data.

---

**Need Help?** Check the implementation documentation in `TASK_MANAGEMENT_IMPLEMENTATION.md`


