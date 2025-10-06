// Task Service for API calls to backend
const API_BASE_URL = 'https://jitpnf3pv0.execute-api.us-east-1.amazonaws.com/prod';

// Static headers for API authentication
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'X-API-Key': 'pzKOjno8c-aLPvTz0L4b6U-UGDs7_7qq3W7qu7lpF7w',
  'X-APP-ORG-UUID': 'cts',
  'X-APP-USER-UUID': '42388507-ec8f-47ef-a7c7-8ddb69763ac6',
  'X-APP-CLIENT-USER-SESSION-UUID': 'static-session-uuid-123456',
  'X-APP-TRACE-ID': 'trace-id-789012',
  'X-APP-REGION-ID': 'US-EAST-1'
});

// Task Service API calls
export const taskService = {
  // Create a new task
  createTask: async (taskData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/task`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(taskData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  // Get task by UUID
  getTaskById: async (taskUUID) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/task/${taskUUID}`, {
        method: 'GET',
        headers: getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting task:', error);
      throw error;
    }
  },

  // Update task
  updateTask: async (taskData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/task`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(taskData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  },

  // Delete task
  deleteTask: async (taskUuid) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/task/${taskUuid}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }
};

// Helper functions for task creation
export const createTableTask = async (tableId) => {
  const taskData = {
    requestContext: {},
    title: `Table ${tableId}`,
    description: `Primary task for Table ${tableId}`,
    assigneeInfo: {
      uuid: "c17084c5-2ec1-4b53-9676-b6377da957d6",
      idType: "INTERNAL_ID"
    },
    dueAt: "2024-12-31T15:00:00",
    extensionsData: {
      status: "pending",
      priority: "HIGH",
      project: "Restaurant",
      phase: "planning",
      tableId: tableId,
      taskType: "TABLE"
    }
  };

  try {
    const response = await taskService.createTask(taskData);
    return response.taskUuid;
  } catch (error) {
    console.error('Error creating table task:', error);
    throw error;
  }
};

export const createSeatTask = async (tableTaskUuid, seatId, seatName) => {
  const taskData = {
    requestContext: {
      parentTaskUuid: tableTaskUuid
    },
    title: seatName,
    description: `Task for ${seatName}`,
    assigneeInfo: {
      uuid: "c17084c5-2ec1-4b53-9676-b6377da957d6",
      idType: "INTERNAL_ID"
    },
    dueAt: "2024-12-31T15:00:00",
    extensionsData: {
      status: "pending",
      priority: "HIGH",
      project: "Restaurant",
      subtask_of: tableTaskUuid,
      seatId: seatId,
      seatName: seatName,
      taskType: "SEAT"
    }
  };

  try {
    const response = await taskService.createTask(taskData);
    return response.taskUuid;
  } catch (error) {
    console.error('Error creating seat task:', error);
    throw error;
  }
};

export const createSubTask = async (parentTaskUuid, taskName, taskDescription, taskType) => {
  const taskData = {
    requestContext: {
      parentTaskUuid: parentTaskUuid
    },
    title: taskName,
    description: taskDescription,
    assigneeInfo: {
      uuid: "c17084c5-2ec1-4b53-9676-b6377da957d6",
      idType: "INTERNAL_ID"
    },
    dueAt: "2024-12-31T15:00:00",
    extensionsData: {
      status: "pending",
      priority: "MEDIUM",
      project: "Restaurant",
      subtask_of: parentTaskUuid,
      taskType: taskType,
      taskName: taskName
    }
  };

  try {
    const response = await taskService.createTask(taskData);
    return response.taskUuid;
  } catch (error) {
    console.error('Error creating sub-task:', error);
    throw error;
  }
};

export const updateTaskStatus = async (taskUuid, status) => {
  const taskData = {
    requestContext: {
      taskUuid: taskUuid
    },
    status: status,
    updateActorType: "USER",
    assigneeInfo: {
      uuid: "c17084c5-2ec1-4b53-9676-b6377da957d6",
      idType: "INTERNAL_ID"
    }
  };

  try {
    const response = await taskService.updateTask(taskData);
    return response;
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
};

export const updateTaskDescription = async (taskUuid, description) => {
  const taskData = {
    requestContext: {
      taskUuid: taskUuid
    },
    description: description,
    updateActorType: "USER",
    assigneeInfo: {
      uuid: "c17084c5-2ec1-4b53-9676-b6377da957d6",
      idType: "INTERNAL_ID"
    }
  };

  try {
    const response = await taskService.updateTask(taskData);
    return response;
  } catch (error) {
    console.error('Error updating task description:', error);
    throw error;
  }
};

// Task status mapping - mapping UI status to API status
export const TASK_STATUS_MAPPING = {
  'Empty': 'READY',
  'Seated': 'IN_PROGRESS', 
  'Pending': 'READY',
  'Served': 'COMPLETED',
  'Placed': 'COMPLETED',
  'Preparing': 'IN_PROGRESS',
  'Prepared': 'IN_PROGRESS',
  'Paid': 'COMPLETED'
};

// Reverse mapping - API status to UI status
export const API_STATUS_TO_UI_MAPPING = {
  'READY': 'Empty',
  'IN_PROGRESS': 'Seated',
  'COMPLETED': 'Served'
};

// Additional helper functions
export const deleteTask = async (taskUuid) => {
  try {
    const response = await taskService.deleteTask(taskUuid);
    return response;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

// Function to create restaurant workflow tasks
export const createRestaurantWorkflowTasks = async (seatTaskUuid) => {
  const workflowTasks = [
    {
      name: "Assign Table",
      description: "Assign table to customer",
      type: "ASSIGN_TABLE"
    },
    {
      name: "Take Order", 
      description: "Take customer order",
      type: "TAKE_ORDER"
    },
    {
      name: "Prepare Meal",
      description: "Prepare customer meal",
      type: "PREPARE_MEAL"
    },
    {
      name: "Serve Meal",
      description: "Serve meal to customer",
      type: "SERVE_MEAL"
    },
    {
      name: "Process Payment",
      description: "Process customer payment",
      type: "PROCESS_PAYMENT"
    }
  ];

  const createdTasks = [];
  
  for (const task of workflowTasks) {
    try {
      const taskUuid = await createSubTask(seatTaskUuid, task.name, task.description, task.type);
      createdTasks.push({
        uuid: taskUuid,
        name: task.name,
        type: task.type
      });
    } catch (error) {
      console.error(`Error creating workflow task ${task.name}:`, error);
    }
  }
  
  return createdTasks;
};

