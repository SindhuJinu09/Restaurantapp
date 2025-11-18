# Backend Task Creation Debugging Guide

## Problem Summary

**Backend is determining next workflow states but NOT creating tasks.**

### Evidence

From backend logs:
```
Looking for workflow with name: restaurant_ordering, version: 1 in WorkflowConfig
Found matching workflow: restaurant_ordering v1
Workflow downloaded and parsed successfully
Determined nextTaskState: order_preparation, currentTaskState: order_placement
```

From frontend logs:
- Frontend searches for `order_preparation` task (5-8 retries, 12+ seconds)
- No task found
- Frontend fallback creates task manually

### What Should Happen

After determining `nextTaskState: order_preparation`, the backend should:

1. **Create a new task** with:
   - `extensionsData.workflow.current_state: "order_preparation"`
   - `extensionsData.task_status: "ACTIVE"`
   - `extensionsData.table_id: "1"` (from parent task)
   - `extensionsData.seat_id: "1"` (from completed order task)
   - `extensionsData.orderItems: [...]` (copied from completed order task)
   - `extensionsData.subtask_of: <parent_task_uuid>`
   - `requestContext.parentTaskUuid: <parent_task_uuid>`

2. **Return the created task** so frontend can find it

### What's Actually Happening

- ✅ Backend determines next state correctly
- ❌ Backend does NOT create the task
- ❌ Frontend cannot find the task
- ⚠️ Frontend fallback creates task manually

## Debugging Steps

### 1. Find Where "Determined nextTaskState" is Logged

Search backend code for:
```java
"Determined nextTaskState"
```

This will show you where the state determination happens.

### 2. Check Code After State Determination

After finding the log statement, check:
- Is there a task creation call immediately after?
- Is there a try-catch that might be swallowing errors?
- Is task creation conditional on something that might be false?

### 3. Verify Task Creation Service

Check if there's a method like:
```java
createTaskForWorkflow(WorkflowState nextState, TaskDTO completedTask)
```

Or similar that should be called after state determination.

### 4. Check for Silent Failures

Look for:
- Try-catch blocks that log errors but don't throw
- Conditional logic that might skip task creation
- Missing null checks that might cause silent failures

### 5. Verify Task Status

Check if backend is creating tasks but with wrong status:
- `task_status: "COMPLETED"` instead of `"ACTIVE"`
- Tasks created but immediately marked as completed
- Tasks created but filtered out by some condition

### 6. Check Task Filtering

Frontend filters tasks by:
```javascript
{
  attributes: [
    { name: "table_id", values: ["1"] },
    { name: "task_status", values: ["ACTIVE"] }
  ]
}
```

Verify backend is creating tasks that match this filter.

## Expected Backend Flow

```java
// 1. Task is marked COMPLETED
taskService.updateTask(taskUuid, { status: "COMPLETED", ... });

// 2. Workflow system detects completion
WorkflowExecutionManager.onTaskCompleted(taskUuid);

// 3. Load workflow configuration
WorkflowConfig config = loadWorkflowFromS3(task.extensionsData.workflow.metadata);

// 4. Determine next state
String nextState = config.getNextState(task.extensionsData.workflow.current_state);
// Log: "Determined nextTaskState: order_preparation"

// 5. CREATE THE TASK (THIS IS MISSING!)
TaskDTO newTask = createNextTask(task, nextState, config);
// Should include:
// - workflow.current_state = nextState
// - task_status = "ACTIVE"
// - Copy orderItems from completed task
// - Set parentTaskUuid

// 6. Save the new task
taskService.createTask(newTask);
```

## Questions to Answer

1. **Is there a `createNextTask()` method?**
   - If yes, is it being called?
   - If no, why not?

2. **Are there any errors in backend logs after "Determined nextTaskState"?**
   - Check for exceptions
   - Check for warnings
   - Check for any error messages

3. **Is task creation happening but failing silently?**
   - Check for try-catch blocks
   - Check for conditional logic that might skip creation
   - Check for validation that might reject the task

4. **Is the task being created but with wrong metadata?**
   - Check if `task_status` is set correctly
   - Check if `current_state` is set correctly
   - Check if `table_id` and `seat_id` are copied correctly

5. **Is the task being created but immediately deleted or marked as completed?**
   - Check for any post-creation logic
   - Check for any workflow triggers that might complete it immediately

## Recommended Fix

The backend should have code like this after determining the next state:

```java
// After: "Determined nextTaskState: order_preparation"
String nextState = ...; // Already determined

// Create the next task
TaskDTO nextTask = new TaskDTO();
nextTask.setTitle("preparation");
nextTask.setDescription("Order Preparation - Seat " + completedTask.getExtensionsData().get("seat_id"));
nextTask.setStatus("IN_PROGRESS");
nextTask.getExtensionsData().put("workflow", Map.of(
    "metadata", completedTask.getExtensionsData().get("workflow.metadata"),
    "current_state", nextState
));
nextTask.getExtensionsData().put("task_status", "ACTIVE");
nextTask.getExtensionsData().put("table_id", completedTask.getExtensionsData().get("table_id"));
nextTask.getExtensionsData().put("seat_id", completedTask.getExtensionsData().get("seat_id"));
nextTask.getExtensionsData().put("orderItems", completedTask.getExtensionsData().get("orderItems"));
nextTask.getExtensionsData().put("subtask_of", completedTask.getExtensionsData().get("subtask_of"));

// Set parent task
RequestContext requestContext = new RequestContext();
requestContext.setParentTaskUuid(completedTask.getExtensionsData().get("subtask_of"));

// Create the task
TaskDTO createdTask = taskService.createTask(nextTask, requestContext);
log.info("Created next workflow task: {}", createdTask.getTaskUuid());
```

## Testing

After fixing, verify:
1. Place an order
2. Check backend logs for "Created next workflow task"
3. Check frontend logs for "✅✅✅ BACKEND WORKFLOW AUTOMATION WORKING!"
4. Verify task appears in frontend without fallback

