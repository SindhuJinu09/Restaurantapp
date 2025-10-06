// Task Service for API calls to backend
const API_BASE_URL = 'http://localhost:8080'; // Dummy URL - replace with actual backend URL

// Test header values - replace with actual values when backend is ready
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'APP_ORG_UUID': 'test-org-uuid-123',
  'APP_USER_UUID': 'test-user-uuid-456',
  'APP_CLIENT_USER_SESSION_UUID': 'test-session-uuid-789',
  'APP_TRACE_ID': 'test-trace-id-101112',
  'APP_REGION_ID': 'test-region-id-131415'
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
  }
};

// Helper functions for task creation
export const createTableTask = async (tableId) => {
  const taskData = {
    title: `Table ${tableId}`,
    description: `Primary task for Table ${tableId}`,
    status: 'ACTIVE',
    extensionsData: {
      tableId: tableId,
      taskType: 'TABLE'
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
    title: seatName,
    description: `Task for ${seatName}`,
    parentTaskUuid: tableTaskUuid,
    status: 'ACTIVE',
    extensionsData: {
      seatId: seatId,
      seatName: seatName,
      taskType: 'SEAT'
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
    title: taskName,
    description: taskDescription,
    parentTaskUuid: parentTaskUuid,
    status: 'ACTIVE',
    extensionsData: {
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
    taskUuid: taskUuid,
    status: status
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
    taskUuid: taskUuid,
    description: description
  };

  try {
    const response = await taskService.updateTask(taskData);
    return response;
  } catch (error) {
    console.error('Error updating task description:', error);
    throw error;
  }
};

// Task status mapping
export const TASK_STATUS_MAPPING = {
  'Empty': 'ACTIVE',
  'Seated': 'ACTIVE',
  'Pending': 'ACTIVE',
  'Served': 'COMPLETED',
  'Placed': 'COMPLETED',
  'Preparing': 'IN_PROGRESS',
  'Prepared': 'IN_PROGRESS',
  'Paid': 'COMPLETED'
};

