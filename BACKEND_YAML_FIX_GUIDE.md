# Backend YAML Parsing Fix Guide

## Current Error

```
Failed to parse YAML
at WorkflowExecutionManagerV1Impl.downloadWorkflow
```

The backend successfully downloads the YAML file from S3 but fails to parse it.

## Current YAML Structure

```yaml
workflows:
  - name: restaurant_ordering
    version: 1
    initialStates: ["table_allocation", "server_allocation", "order_placement"]
    completionStates: ["table_clear", "payment_collection"]
    states:
      table_allocation:
        transitions:
          - to: "table_clear"
            action: "notify_server"
      server_allocation:
        transitions:
          - to: "order_placement"
            action: "notify_server"
      order_placement:
        transitions:
          - to: "order_preparation"
            action: "notify_kitchen"
      order_preparation:
        transitions:
          - to: "order_serving"
            action: "notify_server"
      order_serving:
        transitions:
          - to: "payment_collection"
            action: "notify_accounts"
    aggregationRules:
      - state: "payment_collection"
        description: 'Aggregate order_items per seat for payment_collection'
        groupBy:
          - "extensionsData.seatId"
        operation: "merge"
        operands:
          - "extensionsData.orderItems"
```

## Potential Issues & Fixes

### Issue 1: Missing Trigger Conditions

The backend might expect transitions to specify **when** they should occur. Currently, transitions don't have a trigger condition.

**Possible Fix:**
```yaml
order_placement:
  transitions:
    - to: "order_preparation"
      on: "complete"  # or "on_complete" or "when_completed"
      action: "notify_kitchen"
      condition: "task_status == 'COMPLETED'"
```

### Issue 2: Missing State Metadata

States might need additional metadata like assignee, type, or required fields.

**Possible Fix:**
```yaml
order_placement:
  type: "user_task"
  assignee: "server"
  transitions:
    - to: "order_preparation"
      on: "complete"
      action: "notify_kitchen"
```

### Issue 3: Top-Level Structure

The backend might expect a single workflow object, not a list.

**Possible Fix:**
```yaml
workflow:
  name: restaurant_ordering
  version: 1
  initialStates: ["table_allocation", "server_allocation", "order_placement"]
  # ... rest of structure
```

Or:
```yaml
name: restaurant_ordering
version: 1
initialStates: ["table_allocation", "server_allocation", "order_placement"]
# ... rest of structure (no workflows: wrapper)
```

### Issue 4: Transition Structure

The backend might expect transitions in a different format.

**Possible Fix:**
```yaml
order_placement:
  on_complete:
    next_state: "order_preparation"
    action: "notify_kitchen"
    create_task: true
```

### Issue 5: Missing Required Fields

The backend might require fields like:
- `task_type` or `task_category`
- `assignee_type` or `assignee_role`
- `required_extensions_data`
- `copy_fields` (what to copy from previous task)

## Recommended YAML Structure (Based on Common Patterns)

```yaml
workflow:
  name: restaurant_ordering
  version: 1
  initialStates: 
    - table_allocation
    - server_allocation
    - order_placement
  completionStates:
    - table_clear
    - payment_collection
  
  states:
    table_allocation:
      type: user_task
      assignee: server
      on_complete:
        next_state: table_clear
        action: notify_server
    
    order_placement:
      type: user_task
      assignee: server
      on_complete:
        next_state: order_preparation
        action: notify_kitchen
        copy_fields:
          - extensionsData.orderItems
          - extensionsData.table_id
          - extensionsData.seat_id
    
    order_preparation:
      type: system_task
      assignee: kitchen
      on_complete:
        next_state: order_serving
        action: notify_server
        copy_fields:
          - extensionsData.orderItems
          - extensionsData.table_id
          - extensionsData.seat_id
    
    order_serving:
      type: user_task
      assignee: server
      on_complete:
        next_state: payment_collection
        action: notify_accounts
        copy_fields:
          - extensionsData.orderItems
          - extensionsData.table_id
          - extensionsData.seat_id
    
    payment_collection:
      type: user_task
      assignee: accounts
      aggregation:
        groupBy: extensionsData.seat_id
        operation: merge
        fields: extensionsData.orderItems
```

## How to Debug

1. **Check Backend Logs for Detailed Error:**
   - Look for the exact line/field causing the parse error
   - Check if there's a stack trace showing which YAML field failed

2. **Check Backend Code:**
   - Find `WorkflowExecutionManagerV1Impl.java`
   - Look at the YAML parsing logic (line 163 based on error)
   - See what structure it expects

3. **Test YAML Syntax:**
   - Use an online YAML validator to check syntax
   - Ensure proper indentation (2 spaces, not tabs)

4. **Check Backend Dependencies:**
   - Verify the YAML parser library version
   - Check if there are any schema validation requirements

## Quick Test

Try this minimal YAML to see if it parses:

```yaml
name: restaurant_ordering
version: 1
states:
  order_placement:
    on_complete:
      next_state: order_preparation
```

If this works, gradually add more fields to identify which one causes the issue.

## Next Steps

1. Check backend logs for the **exact parsing error** (which field/line)
2. Review `WorkflowExecutionManagerV1Impl.java` to see expected structure
3. Update YAML to match backend expectations
4. Test with minimal YAML first, then add complexity

The frontend fallback ensures the system continues working while you fix the backend YAML parsing issue.


