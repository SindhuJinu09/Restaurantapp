# Workflow Integration with Restaurant Application - Complete Explanation

## Overview

The restaurant application uses a **state-based workflow system** that manages the entire customer dining experience from table allocation to payment collection. The workflow is defined in a YAML configuration file stored in S3, and the backend automatically manages state transitions when tasks are completed.

---

## 1. Workflow Configuration Loading

### Initial Setup
When the application starts (or after user login), it fetches the workflow configuration:

**Location:** `src/pages/AllTables.jsx:206-241`

**Process:**
1. **Fetch Organization Details:** Calls `GET /api/organization/{orgUUID}` to get workflow configurations
2. **Extract Workflow Config:** Retrieves workflow metadata including:
   - `name`: Workflow name (e.g., "restaurant_ordering")
   - `version`: Workflow version
   - `s3_bucket`: S3 bucket where YAML config is stored
   - `s3_key`: S3 key/path to the YAML file
3. **Store in State:** Saves workflow config in `workflowConfig` state for use throughout the session
4. **Fallback:** If API fails, uses default config for development

**Code Example:**
```javascript
const fetchWorkflowConfig = async () => {
  const orgResponse = await organizationService.getOrganizationDetails(orgUuid);
  const restaurantWorkflow = workflows.find(w => w.name === 'restaurant_ordering');
  setWorkflowConfig({
    name: restaurantWorkflow.name,
    version: restaurantWorkflow.version,
    s3_bucket: restaurantWorkflow.s3_bucket,
    s3_key: restaurantWorkflow.s3_key
  });
};
```

---

## 2. Workflow States

The restaurant workflow follows these states (defined in the YAML config):

1. **`table_allocation`** - Initial state when a table is selected
2. **`order_placement`** - Customer is ready to place an order
3. **`order_preparation`** - Kitchen is preparing the order
4. **`order_serving`** - Order is ready to be served
5. **`payment_collection`** - Customer is ready to pay

---

## 3. Task Creation with Workflow Metadata

### Building Workflow Metadata

**Location:** `src/pages/AllTables.jsx:263-291`

Every task created includes workflow metadata in its `extensionsData`:

```javascript
const buildWorkflowMetadata = (currentState) => {
  return {
    workflow: {
      metadata: {
        s3_bucket: workflowConfig.s3_bucket,
        s3_key: workflowConfig.s3_key,
        version: workflowConfig.version,
        name: workflowConfig.name
      },
      current_state: currentState  // e.g., "order_placement"
    }
  };
};
```

### Task Structure

When creating a task, the workflow metadata is embedded:

```javascript
{
  requestContext: { parentTaskUuid: "..." },  // For child tasks
  title: "Seat 1",
  description: "Task for Seat 1",
  extensionsData: {
    table_id: "1",
    seat_id: "1",
    task_status: "ACTIVE",
    workflow: {
      metadata: {
        s3_bucket: "nucleus-org-silo",
        s3_key: "workflows-state-management/.../restaurant_ordering_v1.yaml",
        version: "1",
        name: "restaurant_ordering"
      },
      current_state: "order_placement"
    }
  }
}
```

---

## 4. Workflow Flow - Step by Step

### Step 1: Table Click → Create Parent Task

**Location:** `src/pages/AllTables.jsx:651-719`

**What Happens:**
1. User clicks on a table
2. System checks for existing active tasks
3. If no active tasks, creates a **parent table task** with:
   - `current_state: "table_allocation"`
   - Empty `requestContext` (no parent)
   - `extensionsData.table_id` set to table ID

**Code:**
```javascript
const workflowMetadata = buildWorkflowMetadata("table_allocation");
const tableTaskData = {
  requestContext: {},  // No parent for table task
  title: row.id,
  extensionsData: {
    table_id: row.id,
    ...workflowMetadata
  }
};
await taskService.createTask(tableTaskData);
```

---

### Step 2: Select Seats → Create Seat Tasks

**Location:** `src/pages/AllTables.jsx:731-845`

**What Happens:**
1. User selects number of seats
2. System creates **seat tasks** (one per seat) with:
   - `current_state: "order_placement"`
   - `requestContext.parentTaskUuid` pointing to table task
   - `extensionsData.seat_id` set to seat number

**Code:**
```javascript
const workflowMetadata = buildWorkflowMetadata("order_placement");
const seatTaskData = {
  requestContext: { parentTaskUuid: tableTaskUuid },
  title: `Seat ${seatId}`,
  extensionsData: {
    seat_id: seatId,
    table_id: tableId,
    ...workflowMetadata
  }
};
await taskService.createTask(seatTaskData);
```

---

### Step 3: Place Order → Advance to Preparation

**Location:** `src/pages/AllTables.jsx:1980-2150`

**What Happens:**
1. User selects menu items and clicks "Place Order"
2. System updates the seat task with:
   - `status: "COMPLETED"` (triggers workflow advancement)
   - `extensionsData.orderItems` containing selected items
   - Preserves workflow metadata
3. **Backend automatically:**
   - Reads the workflow YAML from S3
   - Identifies transition from `order_placement` → `order_preparation`
   - Creates a new task with `current_state: "order_preparation"`
   - Copies relevant data (orderItems, table_id, seat_id)

**Code:**
```javascript
const updateData = {
  status: "COMPLETED",  // Triggers workflow advancement
  extensionsData: {
    orderItems: [...selectedItems],
    workflow: workflowData  // Preserve metadata
  }
};
await updateFullTask(taskUuid, updateData);

// Backend creates order_preparation task automatically
// Frontend polls for new task
const prepTask = await findNextTask(); // Finds task with current_state: "order_preparation"
```

---

### Step 4: Kitchen Prepares → Advance to Serving

**Location:** `src/pages/AllTables.jsx:2342-2449` (handleNextTask)

**What Happens:**
1. Kitchen marks preparation task as `COMPLETED`
2. **Backend automatically:**
   - Transitions workflow to `order_serving`
   - Creates new task with `current_state: "order_serving"`
3. Frontend refreshes and displays serving task

**Code:**
```javascript
await updateFullTask(prepTaskUuid, {
  status: "COMPLETED",
  extensionsData: {
    ...existingData,
    workflow: workflowData
  }
});

// Backend creates order_serving task
// Frontend finds it and updates UI
```

---

### Step 5: Serve Order → Advance to Payment

**Location:** `src/pages/AllTables.jsx:1399-1535` (handleBillIssuance)

**What Happens:**
1. Server marks serving task as `COMPLETED`
2. **Backend automatically:**
   - Transitions workflow to `payment_collection`
   - Creates new task with `current_state: "payment_collection"`
   - May aggregate order items per seat (based on YAML rules)
3. Frontend displays payment collection interface

**Code:**
```javascript
await updateFullTask(serveTaskUuid, {
  status: "COMPLETED",
  extensionsData: {
    workflow: workflowData
  }
});

// Backend creates payment_collection task
const billTask = await findTaskWithState('payment_collection');
```

---

### Step 6: Clear Table → Remove Workflow

**Location:** `src/pages/AllTables.jsx:1069-1150`

**What Happens:**
1. User clicks "Clear Table"
2. System removes workflow state from all tasks:
   - Sets `workflow: null` in extensionsData
   - Sets `status: "COMPLETED"` and `task_status: "COMPLETED"`
3. Tasks are no longer considered "active" (no workflow state)

**Code:**
```javascript
const { workflow, ...extensionsWithoutWorkflow } = existingExt;
await updateFullTask(taskUuid, {
  status: 'COMPLETED',
  extensionsData: {
    ...extensionsWithoutWorkflow,
    workflow: null  // Remove workflow to mark as inactive
  }
});
```

---

## 5. Menu Visibility Based on Workflow State

**Location:** `src/pages/AllTables.jsx:243-261`

The menu is only shown when the workflow state is `order_placement`:

```javascript
useEffect(() => {
  const currentState = expandedCard.extensionsData?.workflow?.current_state;
  
  // Show menu only when current_state is "order_placement"
  if (currentState === 'order_placement') {
    setShowMenu(true);
  } else {
    setShowMenu(false);
  }
}, [expandedCard?.extensionsData?.workflow?.current_state]);
```

---

## 6. Active Task Detection

**Location:** `src/pages/AllTables.jsx:1166-1205` (fetchActiveTasks)

Tasks are considered "active" if:
- `task_status === "ACTIVE"` OR
- `task_status === "COMPLETED"` AND `workflow.current_state` exists

This allows the system to track workflow tasks even when they're marked as COMPLETED (backend creates workflow tasks with COMPLETED status).

**Code:**
```javascript
const isActive = taskStatus === "ACTIVE" || 
                 (taskStatus === "COMPLETED" && task.extensionsData?.workflow?.current_state);
```

---

## 7. Backend Workflow Automation

The backend workflow system:

1. **Monitors Task Updates:** When a task is updated with `status: "COMPLETED"`, the backend checks if it has workflow metadata
2. **Reads YAML Config:** Downloads the workflow YAML from S3 using metadata
3. **Identifies Transitions:** Finds the current state and determines the next state based on transitions
4. **Creates Next Task:** Automatically creates a new task with:
   - `current_state` set to the next state
   - Relevant data copied (orderItems, table_id, seat_id)
   - Proper parent-child relationships
5. **Executes Actions:** Performs actions defined in YAML (e.g., notify_kitchen, notify_server)

---

## 8. Key Integration Points

### Frontend Responsibilities:
- ✅ Create tasks with workflow metadata
- ✅ Set `status: "COMPLETED"` to trigger transitions
- ✅ Preserve workflow metadata when updating tasks
- ✅ Poll for new tasks created by backend
- ✅ Filter tasks by workflow state
- ✅ Show/hide UI elements based on `current_state`

### Backend Responsibilities:
- ✅ Read workflow YAML from S3
- ✅ Parse workflow configuration
- ✅ Monitor task status changes
- ✅ Automatically create next task when state transitions
- ✅ Copy relevant data between tasks
- ✅ Execute workflow actions (notifications, aggregations)

---

## 9. Workflow Metadata Structure

Every task with workflow integration includes:

```javascript
extensionsData: {
  // Task-specific data
  table_id: "1",
  seat_id: "1",
  orderItems: [...],
  
  // Workflow metadata
  workflow: {
    metadata: {
      s3_bucket: "nucleus-org-silo",
      s3_key: "workflows-state-management/.../restaurant_ordering_v1.yaml",
      version: "1",
      name: "restaurant_ordering"
    },
    current_state: "order_placement"  // Current workflow state
  }
}
```

---

## 10. Error Handling & Fallbacks

### Frontend Fallbacks:
1. **Workflow Config:** If organization API fails, uses default config
2. **Task Creation:** If backend doesn't create next task, frontend creates it manually (with logging)
3. **Task Polling:** Retries multiple times with delays to find backend-created tasks

### Logging:
- ✅ Logs when backend workflow automation works
- ⚠️ Logs warnings when frontend fallback is used
- 📊 Logs all task state transitions for debugging

---

## Summary

The workflow integration works through a **collaborative system**:

1. **Frontend** creates tasks with workflow metadata and triggers transitions by marking tasks as COMPLETED
2. **Backend** reads workflow YAML, manages state transitions, and automatically creates next tasks
3. **Workflow State** (`current_state`) drives UI behavior (menu visibility, task filtering)
4. **Task Status** (`COMPLETED`) triggers backend workflow automation
5. **Metadata Preservation** ensures workflow context is maintained across transitions

This creates a seamless flow where the frontend focuses on user interactions while the backend handles the complex state management logic defined in the YAML configuration.

