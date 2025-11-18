# Backend Fix Guide - task_status Bug

## 🐛 Issue

Backend is creating workflow tasks with `task_status=COMPLETED` instead of `task_status=ACTIVE`, causing frontend to not find them.

## 📍 Location

**File:** `WorkflowExecutionManagerV1Impl.java` (or similar workflow execution manager)

**Method:** The method that creates the next task after determining the workflow state transition.

## 🔍 How to Find the Code

1. Search for the log message: `"Determined nextTaskState"`
2. Look at the code immediately after that log
3. Find where `TaskDTO` is being created for the next task
4. Look for where `extensionsData` is being populated

## 🔧 The Fix

### Current Code (WRONG)
```java
// When creating next task from completed task
TaskDTO nextTask = new TaskDTO();
Map<String, Object> extensionsData = new HashMap<>();

// Copying extensionsData from completed task
extensionsData.putAll(completedTask.getExtensionsData()); // ❌ This copies task_status=COMPLETED

// Setting workflow state
Map<String, Object> workflow = new HashMap<>();
workflow.put("current_state", nextState);
extensionsData.put("workflow", workflow);

nextTask.setExtensionsData(extensionsData);
```

### Fixed Code (CORRECT)
```java
// When creating next task from completed task
TaskDTO nextTask = new TaskDTO();
Map<String, Object> extensionsData = new HashMap<>();

// Copy extensionsData from completed task BUT exclude task_status
Map<String, Object> completedExtensions = completedTask.getExtensionsData();
for (Map.Entry<String, Object> entry : completedExtensions.entrySet()) {
    if (!"task_status".equals(entry.getKey())) { // Skip task_status
        extensionsData.put(entry.getKey(), entry.getValue());
    }
}

// Set task_status to ACTIVE for new task
extensionsData.put("task_status", "ACTIVE"); // ✅ Always ACTIVE for new tasks

// Setting workflow state
Map<String, Object> workflow = new HashMap<>();
workflow.put("current_state", nextState);
// Copy workflow metadata from completed task
if (completedExtensions.containsKey("workflow")) {
    Map<String, Object> completedWorkflow = (Map<String, Object>) completedExtensions.get("workflow");
    if (completedWorkflow.containsKey("metadata")) {
        workflow.put("metadata", completedWorkflow.get("metadata"));
    }
}
workflow.put("current_state", nextState);
extensionsData.put("workflow", workflow);

nextTask.setExtensionsData(extensionsData);
```

## ✅ Verification

After the fix, backend logs should show:
```
saveTask taskDTO: TaskDTO(
  extensionsData={
    task_status=ACTIVE,  ✅ CORRECT!
    workflow={current_state=order_preparation},
    seat_id=1,
    table_id=1,
    orderItems=[...]
  }
)
```

## 🧪 Testing

1. Place an order (mark order task as COMPLETED)
2. Check backend logs - should see task created with `task_status=ACTIVE`
3. Frontend should find the task automatically
4. No frontend fallback should be triggered

## 📝 Additional Notes

- This fix applies to ALL workflow state transitions:
  - `order_placement` → `order_preparation`
  - `order_preparation` → `order_serving`
  - `order_serving` → `bill_issuance`
  - Any other workflow transitions

- Make sure to preserve all other `extensionsData` fields (seat_id, table_id, orderItems, etc.)
- Only `task_status` should be set to `ACTIVE` for new tasks

