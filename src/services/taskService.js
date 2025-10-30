// Task Service for API calls to backend
const API_BASE_URL = 'https://jitpnf3pv0.execute-api.us-east-1.amazonaws.com/prod';

// Development mode flag - set to true to use mock responses when API is not accessible
// CORS Issue: The API server may not allow requests from localhost:3000 in development
// To fix this, the backend team needs to add CORS headers allowing localhost origins
// For now, DEVELOPMENT_MODE provides mock responses to continue development
const DEVELOPMENT_MODE = false; // Set to false to see actual API errors

// Static headers for API authentication
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'X-API-Key': 'pzKOjno8c-aLPvTz0L4b6U-UGDs7_7qq3W7qu7lpF7w',
  'X-APP-ORG-UUID': 'cts',
  'X-APP-USER-UUID': '42388507-ec8f-47ef-a7c7-8ddb69763ac6',
  'X-APP-CLIENT-USER-SESSION-UUID': 'Session UUID',
  'X-APP-TRACE-ID': 'Trace ID (for logging/debugging)',
  'X-APP-REGION-ID': 'US-EAST-1'
});

// Task Service API calls
export const taskService = {
  // Create a new task
  createTask: async (taskData) => {
    try {
      console.log('Creating task with data:', JSON.stringify(taskData, null, 2));
      console.log('Using headers:', getHeaders());
      
      const response = await fetch(`${API_BASE_URL}/api/task`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(taskData),
        mode: 'cors' // Explicitly set CORS mode
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        console.error('Request body was:', JSON.stringify(taskData, null, 2));
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('Task created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error creating task:', error);
      
      // If it's a CORS error and we're in development mode, provide a mock response
      if (DEVELOPMENT_MODE && (error.message.includes('Failed to fetch') || error.message.includes('CORS'))) {
        console.warn('CORS Error: The API server may not allow requests from localhost. Using mock response for development.');
        // For development, we can return a mock response
        return {
          httpStatus: "CREATED",
          responseResult: "SUCCESS", 
          taskUuid: `mock-task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
      }
      
      throw error;
    }
  },

  // Get task by UUID
  getTaskById: async (taskUUID) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/task/${taskUUID}`, {
        method: 'GET',
        headers: getHeaders(),
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting task:', error);
      
      // Mock response for development when CORS fails
      if (DEVELOPMENT_MODE && (error.message.includes('Failed to fetch') || error.message.includes('CORS'))) {
        console.warn('CORS Error: Returning mock task data for development.');
        return {
          httpStatus: "OK",
          responseResult: "SUCCESS",
          taskDTO: {
            taskUuid: taskUUID,
            title: "Mock Task",
            description: "Mock task for development",
            status: "READY"
          }
        };
      }
      
      throw error;
    }
  },

  // Update task
  updateTask: async (taskData) => {
    try {
      console.log('Updating task with data:', JSON.stringify(taskData, null, 2));
      
      const response = await fetch(`${API_BASE_URL}/api/task`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(taskData),
        mode: 'cors'
      });

      console.log('Update task response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating task:', error);
      
      // Mock response for development when CORS fails
      if (DEVELOPMENT_MODE && (error.message.includes('Failed to fetch') || error.message.includes('CORS'))) {
        console.warn('CORS Error: Mock update successful for development.');
        return {
          httpStatus: "OK",
          responseResult: "SUCCESS"
        };
      }
      
      throw error;
    }
  },

  // Delete task
  deleteTask: async (taskUuid) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/task/${taskUuid}`, {
        method: 'DELETE',
        headers: getHeaders(),
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting task:', error);
      
      // Mock response for development when CORS fails
      if (DEVELOPMENT_MODE && (error.message.includes('Failed to fetch') || error.message.includes('CORS'))) {
        console.warn('CORS Error: Mock delete successful for development.');
        return {
          httpStatus: "OK",
          responseResult: "SUCCESS"
        };
      }
      
      throw error;
    }
  },

  // Filter tasks by attributes (table_id, task_status, seat_id, etc.)
  filterTasksByAttributes: async (filterCriteria) => {
    try {
      console.log('Filtering tasks with criteria:', filterCriteria);
      
      const requestBody = {
        requestContext: {
          organizationUuid: "cts",
          userUuid: "c17084c5-2ec1-4b53-9676-b6377da957d6"
        },
        filterCriteria: filterCriteria
      };
      
      const response = await fetch(`${API_BASE_URL}/api/tasks/filter`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(requestBody),
        mode: 'cors'
      });

      console.log('Filter response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Filter API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('Tasks filtered successfully:', result);
      return result;
    } catch (error) {
      console.error('Error filtering tasks:', error);
      
      // Mock response for development when CORS fails
      if (DEVELOPMENT_MODE && (error.message.includes('Failed to fetch') || error.message.includes('CORS'))) {
        console.warn('CORS Error: Using mock filter results for development.');
        return {
          httpStatus: "OK",
          responseResult: "SUCCESS",
          responseReasonCode: "SUCCESS",
          tasks: []
        };
      }
      
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

export const createSubTask = async (parentTaskUuid, taskName, taskDescription, taskType, customExtensions = {}) => {
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
      taskName: taskName,
      ...customExtensions
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

export const updateTaskStatus = async (taskUuid, status, additionalFields = {}) => {
  const taskData = {
    requestContext: {
      taskUuid: taskUuid
    },
    status: status,
    updateActorType: "USER",
    assigneeInfo: {
      uuid: "c17084c5-2ec1-4b53-9676-b6377da957d6",
      idType: "INTERNAL_ID"
    },
    ...additionalFields
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

// Update full task with multiple fields
export const updateFullTask = async (taskUuid, updateData) => {
  const taskData = {
    requestContext: {
      taskUuid: taskUuid
    },
    updateActorType: "USER",
    assigneeInfo: {
      uuid: "c17084c5-2ec1-4b53-9676-b6377da957d6",
      idType: "INTERNAL_ID"
    },
    ...updateData
  };

  try {
    const response = await taskService.updateTask(taskData);
    return response;
  } catch (error) {
    console.error('Error updating task:', error);
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

// Menu Service - Fetch menu items from API
export const menuService = {
  // Get all menu items
  getMenuItems: async () => {
    try {
      console.log('Fetching menu items from API');
      console.log('Using headers:', getHeaders());
      
      const response = await fetch(`${API_BASE_URL}/api/menu-items`, {
        method: 'GET',
        headers: getHeaders(),
        mode: 'cors'
      });

      console.log('Menu response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Menu API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const menuItems = await response.json();
      console.log('Menu items fetched successfully:', menuItems);
      return menuItems;
    } catch (error) {
      console.error('Error fetching menu items:', error);
      
      // If it's a CORS error and we're in development mode, provide a mock response
      if (DEVELOPMENT_MODE && (error.message.includes('Failed to fetch') || error.message.includes('CORS'))) {
        console.warn('CORS Error: Using mock menu items for development.');
        // Return mock menu items for development
        return [
          {id: 3, name: "Americano", description: "Smooth espresso diluted with hot water", basePrice: 3.00, isAvailable: true},
          {id: 4, name: "Iced Latte", description: "Chilled espresso with cold milk and ice", basePrice: 4.75, isAvailable: true},
          {id: 5, name: "Garlic Bread", description: "Toasted bread with garlic butter and herbs", basePrice: 5.50, isAvailable: true},
          {id: 6, name: "Margherita Pizza", description: "Classic pizza with mozzarella, tomato, and basil", basePrice: 12.99, isAvailable: true},
          {id: 7, name: "Pasta Alfredo", description: "Creamy fettuccine pasta with parmesan sauce", basePrice: 13.50, isAvailable: true},
          {id: 8, name: "Chicken Burger", description: "Grilled chicken patty with lettuce and mayo in a soft bun", basePrice: 9.99, isAvailable: true},
          {id: 9, name: "Veggie Wrap", description: "Grilled vegetables wrapped in a soft tortilla with sauce", basePrice: 8.25, isAvailable: true},
          {id: 10, name: "Caesar Salad", description: "Crisp romaine lettuce with Caesar dressing and croutons", basePrice: 7.50, isAvailable: true},
          {id: 11, name: "French Fries", description: "Crispy golden fries served with ketchup", basePrice: 4.00, isAvailable: true},
          {id: 12, name: "Brownie", description: "Chocolate brownie with a fudgy center", basePrice: 5.00, isAvailable: true},
          {id: 13, name: "Ice Cream Sundae", description: "Vanilla ice cream topped with chocolate sauce and nuts", basePrice: 6.25, isAvailable: true},
          {id: 14, name: "Mango Smoothie", description: "Fresh mango blended with yogurt and honey", basePrice: 5.75, isAvailable: true},
          {id: 15, name: "Lemon Iced Tea", description: "Refreshing iced tea with lemon flavor", basePrice: 3.75, isAvailable: true},
          {id: 16, name: "Cold Brew", description: "Smooth cold brew coffee with bold flavor", basePrice: 4.25, isAvailable: true},
          {id: 17, name: "Grilled Cheese Sandwich", description: "Melted cheese between toasted bread slices", basePrice: 6.00, isAvailable: true},
          {id: 18, name: "Club Sandwich", description: "Triple-layered sandwich with chicken, lettuce, and tomato", basePrice: 8.75, isAvailable: true},
          {id: 19, name: "Tiramisu", description: "Classic Italian dessert with mascarpone and espresso", basePrice: 6.99, isAvailable: true},
          {id: 20, name: "Espresso Shot", description: "Strong and bold single espresso shot", basePrice: 2.50, isAvailable: true},
          {id: 21, name: "Hot Chocolate", description: "Creamy hot chocolate topped with whipped cream", basePrice: 4.75, isAvailable: true},
          {id: 2, name: "Cappuccino", description: "Rich espresso with steamed milk foam", basePrice: 5.00, isAvailable: true}
        ];
      }
      
      throw error;
    }
  }
};

