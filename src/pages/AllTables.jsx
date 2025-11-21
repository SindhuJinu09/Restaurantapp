import React, { useState, useEffect, useRef } from "react";
import { Clock, Menu, ArrowRight, ArrowLeft, Plus, Minus, ShoppingCart, X, MessageSquare, Bell, User, CreditCard, Smartphone, DollarSign, CheckCircle, ChevronDown } from "lucide-react";
import TableGrid from "../components/TableGrid";
import BarSeatCart from "../components/BarSeatCart";
import SeatPageGrid from "../components/SeatPageGrid";
import SeatDetail from "../components/SeatDetail";
import SeatHeader from "../components/SeatHeader";
import SeatNumberPrompt from "../components/SeatNumberPrompt";
import SeatSelectionPopup from "../components/SeatSelectionPopup";
import { useNavigate } from "react-router-dom";
import { taskService, createTableTask, createSeatTask, createSubTask, updateTaskStatus as updateTaskStatusAPI, updateTaskDescription, updateFullTask, TASK_STATUS_MAPPING, menuService, organizationService } from "../services/taskService";

// Assignee Info - used in all API calls
const ASSIGNEE_INFO = {
  uuid: "9e76e39a-aaeb-47a8-8182-db7d0187e64f",
  idType: "INTERNAL_ID"
};

export default function AllTables() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [quantities, setQuantities] = useState({});
  const [showCart, setShowCart] = useState(false);
  const [selectedTable, setSelectedTable] = useState("1");
  const [showTableDropdown, setShowTableDropdown] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [cartNote, setCartNote] = useState("");
  const commentInputRef = useRef(null);

  // Payment state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [isPaid, setIsPaid] = useState(false);
  
  // Split payment state
  const [paymentType, setPaymentType] = useState("single"); // "single" or "split"
  const [seatPaymentMethods, setSeatPaymentMethods] = useState({});
  const [seatPaidStatus, setSeatPaidStatus] = useState({});
  
  // Order More state
  const [orderMoreSelected, setOrderMoreSelected] = useState(false);
  
  // Seat selection state
  const [showSeatSelection, setShowSeatSelection] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [tableToSeat, setTableToSeat] = useState(null);
  
  // Seat page view state
  const [showSeatPageView, setShowSeatPageView] = useState(false);
  const [selectedTableForSeats, setSelectedTableForSeats] = useState(null);
  
  // Seat selection popup state
  const [showSeatSelectionPopup, setShowSeatSelectionPopup] = useState(false);
  const [seatAddOptions, setSeatAddOptions] = useState([]); // dynamic seat numbers to add
  const [isAddingSeats, setIsAddingSeats] = useState(false);
  const [selectedSeatsForTable, setSelectedSeatsForTable] = useState([]);
  
  // Seat number input state
  const [showSeatNumberPrompt, setShowSeatNumberPrompt] = useState(false);
  const [maxSeatAddCap, setMaxSeatAddCap] = useState(20);
  const [numberOfSeats, setNumberOfSeats] = useState(4); // Default to 4 seats
  const [tableForSeatNumberPrompt, setTableForSeatNumberPrompt] = useState(null);
  
  // Order task tab state
  const [activeOrderTab, setActiveOrderTab] = useState("1");
  
  // Cart items with seat tracking - per table
  const [tableCarts, setTableCarts] = useState({});
  
  // Individual seat data for each table - each seat has its own task flow
  const [tableSeats, setTableSeats] = useState({});
  
  // Task mapping state - tracks table IDs and their task UUIDs
  const [tableTaskMapping, setTableTaskMapping] = useState({}); // tableId -> taskUuid
  const [seatTaskMapping, setSeatTaskMapping] = useState({}); // `${tableId}-${seatId}` -> taskUuid
  const [subTaskMapping, setSubTaskMapping] = useState({}); // `${tableId}-${seatId}-${taskName}` -> taskUuid
  
  // Menu items state
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);

  // Ensure menu items are loaded when opening the menu
  const ensureMenuLoaded = async () => {
    if (menuItems.length > 0) return;
    try {
      setMenuLoading(true);
      const items = await menuService.getMenuItems();
      const availableItems = items.filter(item => item.isAvailable);
      setMenuItems(availableItems);
    } catch (err) {
      console.error('Failed to fetch menu items on demand:', err);
      setMenuItems([]);
    } finally {
      setMenuLoading(false);
    }
  };
  
  // Backend state management - NEW
  const [activeTasksForTable, setActiveTasksForTable] = useState({}); // tableId -> Array of tasks
  const [selectedTableId, setSelectedTableId] = useState(null); // Currently viewing table ID
  const [loadingTasks, setLoadingTasks] = useState(false);
  
  // Workflow configuration state
  const [workflowConfig, setWorkflowConfig] = useState(null); // Store workflow config from organization
  const [orgUuid, setOrgUuid] = useState('a66035aa-8e6e-4c43-a8c6-358d8d4036af'); // Default org UUID, should come from user profile
  
  // Initialize individual seat data for each table
  const initializeTableSeats = () => {
    const seatsData = {};
    rows.forEach(row => {
      seatsData[row.id] = {
        99: {
          id: 99,
          tableId: row.id,
          currentTaskIndex: 0, // Start with Order task (index 0 in new flow)
          currentTask: { 
            id: "3", 
            name: "Order", 
            statusOptions: ["Pending", "Placed"],
            currentStatus: "Pending"
          },
          minutes: 5,
          status: "Pending",
          orderMoreNext: false,
          serveHistory: [],
          selectedSeats: [99]
        },
        1: {
          id: 1,
          tableId: row.id,
          currentTaskIndex: 0, // All seats start with Order task
          currentTask: { 
            id: "3", 
            name: "Order", 
            statusOptions: ["Pending", "Placed"],
            currentStatus: "Pending"
          },
          minutes: 0,
          status: "Pending",
          orderMoreNext: false,
          serveHistory: [],
          selectedSeats: [1]
        },
        2: {
          id: 2,
          tableId: row.id,
          currentTaskIndex: 0, // All seats start with Order task
          currentTask: { 
            id: "3", 
            name: "Order", 
            statusOptions: ["Pending", "Placed"],
            currentStatus: "Pending"
          },
          minutes: 0,
          status: "Pending",
          orderMoreNext: false,
          serveHistory: [],
          selectedSeats: [2]
        },
        3: {
          id: 3,
          tableId: row.id,
          currentTaskIndex: 0, // All seats start with Order task
          currentTask: { 
            id: "3", 
            name: "Order", 
            statusOptions: ["Pending", "Placed"],
            currentStatus: "Pending"
          },
          minutes: 0,
          status: "Pending",
          orderMoreNext: false,
          serveHistory: [],
          selectedSeats: [3]
        },
        4: {
          id: 4,
          tableId: row.id,
          currentTaskIndex: 0, // All seats start with Order task
          currentTask: { 
            id: "3", 
            name: "Order", 
            statusOptions: ["Pending", "Placed"],
            currentStatus: "Pending"
          },
          minutes: 0,
          status: "Pending",
          orderMoreNext: false,
          serveHistory: [],
          selectedSeats: [4]
        }
      };
    });
    setTableSeats(seatsData);
  };
  
  // Initialize seat data when component mounts
  useEffect(() => {
    initializeTableSeats();
  }, []);
  
  // Fetch workflow configuration on component mount (should be called after user login)
  useEffect(() => {
    const fetchWorkflowConfig = async () => {
      try {
        console.log('Fetching workflow configuration for org:', orgUuid);
        const orgResponse = await organizationService.getOrganizationDetails(orgUuid);
        
        if (orgResponse?.organizationDTO?.extensionsData?.workflows) {
          const workflows = orgResponse.organizationDTO.extensionsData.workflows;
          // For now, use the first workflow (restaurant_ordering)
          const restaurantWorkflow = workflows.find(w => w.name === 'restaurant_ordering') || workflows[0];
          
          if (restaurantWorkflow) {
            setWorkflowConfig({
              name: restaurantWorkflow.name,
              version: restaurantWorkflow.version,
              s3_bucket: restaurantWorkflow.s3_bucket || 'nucleus-org-silo',
              s3_key: restaurantWorkflow.s3_key || restaurantWorkflow.config_url?.replace('s3://nucleus-org-silo/', '')
            });
            console.log('Workflow config loaded:', restaurantWorkflow);
          }
        }
      } catch (error) {
        console.error('Error fetching workflow configuration:', error);
        // Set default workflow config for development
        setWorkflowConfig({
          name: 'restaurant_ordering',
          version: '1',
          s3_bucket: 'nucleus-org-silo',
          s3_key: 'workflows-state-management/AkshayTestRestaurant1000/restaurant_ordering_v1.yaml'
        });
      }
    };
    
    fetchWorkflowConfig();
  }, [orgUuid]);
  
  // Update menu visibility based on workflow current_state (as per requirements)
  useEffect(() => {
    if (!expandedCard) {
      setShowMenu(false);
      return;
    }
    
    // Check workflow current_state from extensionsData
    const currentState = expandedCard.extensionsData?.workflow?.current_state || 
                        expandedCard.workflowState;
    
    // Show menu only when current_state is "order_placement" (as per requirements)
    if (currentState === 'order_placement') {
      ensureMenuLoaded().catch(() => {});
      setShowMenu(true);
    } else {
      setShowMenu(false);
    }
  }, [expandedCard?.extensionsData?.workflow?.current_state, expandedCard?.workflowState, expandedCard]);
  
  // Helper function to build workflow metadata for task extensions_data
  const buildWorkflowMetadata = (currentState) => {
    if (!workflowConfig) {
      // Fallback to default if workflow config not loaded yet
      return {
        workflow: {
          metadata: {
            s3_bucket: 'nucleus-org-silo',
            s3_key: 'workflows-state-management/AkshayTestRestaurant1000/restaurant_ordering_v1.yaml',
            version: '1',
            name: 'restaurant_ordering'
          },
          current_state: currentState
        }
      };
    }
    
    return {
      workflow: {
        metadata: {
          s3_bucket: workflowConfig.s3_bucket,
          s3_key: workflowConfig.s3_key,
          version: workflowConfig.version,
          name: workflowConfig.name
        },
        current_state: currentState
      }
    };
  };
  
  // Bar seats state management
  const [barSeats, setBarSeats] = useState([
    { id: 1, status: "Available", currentTaskIndex: 0, currentTask: { id: "1", name: "Assign Table", statusOptions: ["Empty", "Seated"], currentStatus: "Empty" }, minutes: 0, orderMoreNext: false, serveHistory: [], selectedSeats: [] },
    { id: 2, status: "In Progress", currentTaskIndex: 1, currentTask: { id: "2", name: "Pre Meal", statusOptions: ["Pending", "Served"], currentStatus: "Pending" }, minutes: 5, orderMoreNext: false, serveHistory: [], selectedSeats: [2] },
    { id: 3, status: "In Progress", currentTaskIndex: 2, currentTask: { id: "3", name: "Order", statusOptions: ["Pending", "Placed"], currentStatus: "Pending" }, minutes: 10, orderMoreNext: false, serveHistory: [], selectedSeats: [3] },
    { id: 4, status: "In Progress", currentTaskIndex: 3, currentTask: { id: "4", name: "Serve", statusOptions: ["Preparing", "Prepared", "Served"], currentStatus: "Preparing", kitchenStatus: "Prepared", serveStatus: "Pending" }, minutes: 15, orderMoreNext: false, serveHistory: [], selectedSeats: [4] },
    { id: 5, status: "Pending", currentTaskIndex: 4, currentTask: { id: "5", name: "Payment", statusOptions: ["Pending", "Paid"], currentStatus: "Pending" }, minutes: 3, orderMoreNext: false, serveHistory: [], selectedSeats: [5] }
  ]);
  
  const [selectedBarSeat, setSelectedBarSeat] = useState(null);
  
  // Payment methods
  const paymentMethods = [
    {
      id: "cash",
      name: "Cash",
      icon: DollarSign,
      description: "Pay with cash",
      color: "bg-green-500",
      textColor: "text-green-500"
    },
    {
      id: "upi",
      name: "UPI",
      icon: Smartphone,
      description: "Pay via UPI",
      color: "bg-purple-500",
      textColor: "text-purple-500"
    },
    {
      id: "card",
      name: "Card",
      icon: CreditCard,
      description: "Credit/Debit card",
      color: "bg-blue-500",
      textColor: "text-blue-500"
    }
  ];

  const canProceedToNextTask = (taskIndex = null) => {
    if (!expandedCard) return false;
    
    const currentTaskId = expandedCard.currentTask.id;
    
    // Handle individual seat tasks (bar seats and table seats)
    if (expandedCard.seat || (expandedCard.seatNumber && expandedCard.tableId)) {
      let seatData = null;
      
      if (expandedCard.seat) {
        // Bar seat
        seatData = expandedCard.seat;
      } else if (expandedCard.seatNumber && expandedCard.tableId) {
        // Table seat
        seatData = tableSeats[expandedCard.tableId]?.[expandedCard.seatNumber];
      }
      
      if (!seatData) return false;
      
      // Check if this is a PREPARATION task
      const isPreparationTask = expandedCard.currentTask?.type === 'PREPARATION' || 
                                currentTaskId === 'preparation' ||
                                expandedCard.workflowState === 'order_preparation';
      
      if (isPreparationTask) {
        // For preparation tasks, check if all items are prepared (served)
        const orderItems = expandedCard.extensionsData?.orderItems || [];
        console.log('[canProceedToNextTask] Preparation task - orderItems:', orderItems);
        console.log('[canProceedToNextTask] orderItems length:', orderItems.length);
        if (orderItems.length === 0) {
          console.log('[canProceedToNextTask] No order items, returning false');
          return false;
        }
        const allServed = orderItems.every(item => {
          const isServed = item.served === true || item.served === 'true' || item.orderStatus === 'PREPARED';
          console.log('[canProceedToNextTask] Item:', item.name, 'served:', item.served, 'orderStatus:', item.orderStatus, 'isServed:', isServed);
          return isServed;
        });
        console.log('[canProceedToNextTask] All items served?', allServed);
        return allServed;
      }
      
      // Check if this is a SERVE/order_serving task (workflow-based)
      const isServeTask = expandedCard.currentTask?.type === 'SERVE' || 
                         currentTaskId === 'serve' || 
                         expandedCard.workflowState === 'order_serving';
      
      if (isServeTask) {
        // For serve tasks, always allow proceeding to next task (payment_collection)
        // The serving is already done, so we can proceed to billing
        return true;
      }
      
      // Check if this is a BILL/payment_collection task (workflow-based)
      const isBillTask = expandedCard.currentTask?.type === 'BILL' || 
                        currentTaskId === 'bill' || 
                        expandedCard.workflowState === 'payment_collection';
      
      if (isBillTask) {
        // For bill tasks, always allow proceeding (payment is handled separately)
        return true;
      }
      
      switch (currentTaskId) {
        case "1": // Assign Table
          // Only active when status is changed from "Empty" to "Seated"
          return seatData.currentTask.currentStatus === "Seated";
        case "2": // Pre Meal
          // Only active when status is changed from "Pending" to "Served"
          return seatData.currentTask.currentStatus === "Served";
        case "3": // Order
          // Check if there are orders placed (serveHistory has items)
          const hasOrders = seatData.serveHistory && seatData.serveHistory.length > 0;
          return hasOrders;
        case "4": // Serve
          // Check if all items in serve history are served
          if (!seatData.serveHistory || seatData.serveHistory.length === 0) return false;
          return seatData.serveHistory.every(order => 
            order.items && order.items.every(item => item.served)
          );
        case "5": // Payment
          // Only active when status is changed from "Pending" to "Paid"
          return seatData.currentTask.currentStatus === "Paid";
        default:
          return false;
      }
    }
    
    // All seats (including seat ID 1 "All Seats") now use the same logic as individual seats
    // Removed special "All Seats" handling - seat ID 1 follows same flow as other seats
    
    // Handle regular table tasks (fallback)
    const currentStatus = expandedCard.currentTask.currentStatus;
    switch (currentTaskId) {
      case "1": // Assign Table
        return currentStatus === "Seated";
      case "2": // Pre Meal
        return currentStatus === "Served";
      case "3": // Order
        return currentStatus === "Placed";
      case "4": // Serve
        if (orderMoreSelected) return true;
        return expandedCard.currentTask.serveStatus === "Served";
      case "5": // Payment
        return paymentType === "single" ? isPaid : isAllSeatsPaid();
      default:
        return false;
    }
  };
  
  // Task flow definition with status options
  const taskFlow = [
    { 
      id: "1", 
      name: "Assign Table", 
      statusOptions: ["Empty", "Seated"],
      currentStatus: "Empty"
    },
    { 
      id: "2", 
      name: "Pre Meal", 
      statusOptions: ["Pending", "Served"],
      currentStatus: "Pending"
    },
    { 
      id: "3", 
      name: "Order", 
      statusOptions: ["Pending", "Placed"],
      currentStatus: "Pending"
    },
    { 
      id: "4", 
      name: "Serve", 
      statusOptions: ["Preparing", "Prepared", "Served"],
      currentStatus: "Preparing",
      kitchenStatus: "Prepared",
      serveStatus: "Pending"
    },
    { 
      id: "5", 
      name: "Payment", 
      statusOptions: ["Pending", "Paid"],
      currentStatus: "Pending"
    }
  ];

  const [rows, setRows] = useState([
    { 
      id: "1", 
      currentTaskIndex: 0,
      currentTask: { 
        id: "1", 
        name: "Assign Table", 
        statusOptions: ["Empty", "Seated"],
        currentStatus: "Empty"
      },
      minutes: 4, 
      status: "Pending",
      orderMoreNext: false,
      serveHistory: [], // Track serve statuses
      selectedSeats: [] // Track selected seats
    },
    { 
      id: "2", 
      currentTaskIndex: 1,
      currentTask: { 
        id: "2", 
        name: "Pre Meal", 
        statusOptions: ["Pending", "Served"],
        currentStatus: "Pending"
      },
      minutes: 4, 
      status: "In Progress",
      orderMoreNext: false,
      serveHistory: [],
      selectedSeats: []
    },
    { 
      id: "3", 
      currentTaskIndex: 2,
      currentTask: { 
        id: "3", 
        name: "Order", 
        statusOptions: ["Pending", "Placed"],
        currentStatus: "Pending"
      },
      minutes: 9, 
      status: "Pending",
      orderMoreNext: false,
      serveHistory: [],
      selectedSeats: []
    },
    { 
      id: "4", 
      currentTaskIndex: 3,
      currentTask: { 
        id: "4", 
        name: "Serve", 
        statusOptions: ["Preparing", "Prepared", "Served"],
        currentStatus: "Preparing",
        kitchenStatus: "Prepared",
        serveStatus: "Pending"
      },
      minutes: 21, 
      status: "Pending",
      orderMoreNext: false,
      serveHistory: [],
      selectedSeats: []
    },
    { 
      id: "5", 
      currentTaskIndex: 4,
      currentTask: { 
        id: "5", 
        name: "Payment", 
        statusOptions: ["Pending", "Paid"],
        currentStatus: "Pending"
      },
      minutes: 5, 
      status: "Completed",
      orderMoreNext: false,
      serveHistory: [],
      selectedSeats: []
    },
    { 
      id: "6", 
      currentTaskIndex: 5,
      currentTask: { 
        id: "6", 
        name: "Payment", 
        statusOptions: ["Pending", "Paid"],
        currentStatus: "Pending"
      },
      minutes: 0, 
      status: "Pending",
      orderMoreNext: false,
      serveHistory: [],
      selectedSeats: []
    },
  ]);

  const handlePayment = (seatId = null) => {
    if (paymentType === "single") {
      if (!selectedPaymentMethod) return;
      setIsPaid(true);
    } else {
      // Split payment
      if (!seatId || !seatPaymentMethods[seatId]) return;
      setSeatPaidStatus(prev => ({
        ...prev,
        [seatId]: true
      }));
    }
    
    // Don't auto-reset - let user click Next Task to proceed
  };

  const handleSeatPayment = (seatId, methodId) => {
    setSeatPaymentMethods(prev => ({
      ...prev,
      [seatId]: methodId
    }));
  };

  const isAllSeatsPaid = () => {
    const seatTotals = calculateSeatTotals();
    const seatIds = Object.keys(seatTotals);
    return seatIds.every(seatId => seatPaidStatus[seatId]);
  };


  const handleSeatConfirm = () => {
    if (selectedSeats.length === 0 || !tableToSeat) return;
    
    // Update the table with selected seats
    const updatedRows = rows.map(row => {
      if (row.id === tableToSeat.id) {
        return {
          ...row,
          selectedSeats: [...selectedSeats],
          currentTask: {
            ...row.currentTask,
            currentStatus: "Seated"
          }
        };
      }
      return row;
    });
    
    setRows(updatedRows);
    
    // Close seat selection and open the task view
    setShowSeatSelection(false);
    setSelectedSeats([]);
    setTableToSeat(null);
    
    // Find and set the updated row as expanded card
    const updatedTable = updatedRows.find(row => row.id === tableToSeat.id);
    setExpandedCard(updatedTable);
    
    // Set the first selected seat as the active tab instead of "all"
    if (selectedSeats.length > 0) {
      setActiveOrderTab(selectedSeats[0].toString());
    }
  };

  // Function to clear all table states
  const clearAllTableStates = () => {
    console.log('Clearing all table states');
    setTableSeats({});
    setSeatTaskMapping({});
    setTableTaskMapping({});
    setSelectedSeatsForTable([]);
    setSelectedTableForSeats(null);
    setShowSeatPageView(false);
    setShowSeatNumberPrompt(false);
    setTableForSeatNumberPrompt(null);
  };

  const handleTableClick = async (row) => {
    setSelectedTableForSeats(row);
    
    // First: check for existing ACTIVE tasks for this table
    try {
      const active = await fetchActiveTasks(row.id);
      if (active && active.length > 0) {
        // Go straight to seat card view showing active tasks; skip creation flow
        setShowSeatPageView(true);
        setShowSeatNumberPrompt(false);
        return;
      }
      // If no active tasks but seat page view is already open for this table, keep it open
      // This prevents resetting when tasks are completed (e.g., after placing order)
      if (showSeatPageView && selectedTableForSeats?.id === row.id) {
        console.log('No active tasks but seat view already open for this table - keeping it open');
        return; // Don't reset, just keep current view
      }
    } catch (e) {
      console.warn('Active task check failed; falling back to creation flow');
    }

    // No active tasks and seat view not open → create table task and proceed to seat selection
    try {
      // Build workflow metadata with current_state = "table_allocation"
      const workflowMetadata = buildWorkflowMetadata("table_allocation");
      
      const tableTaskData = {
        requestContext: {},  // Empty requestContext for table tasks (no parent)
        title: row.id,
        description: `Main task for table ${row.id}`,
        assigneeInfo: ASSIGNEE_INFO,
        dueAt: "2024-12-31T15:00:00",
        extensionsData: {
          table_id: row.id,
          task_status: "ACTIVE",
          status: "pending",
          priority: "HIGH",
          project: "Nucleus",
          phase: "planning",
          ...workflowMetadata  // Include workflow metadata
        }
      };
      
      console.log('Creating table task with data:', JSON.stringify(tableTaskData, null, 2));
      const tableResponse = await taskService.createTask(tableTaskData);
      console.log('Table task response:', tableResponse);
      
      if (!tableResponse.taskUuid) {
        console.error('Failed to create table task');
        return;
      }
      
      // Store the table task UUID
      setTableTaskMapping(prev => ({
        ...prev,
        [row.id]: tableResponse.taskUuid
      }));
      
      console.log('Successfully created table task with UUID:', tableResponse.taskUuid);
      
      // Now show seat selection prompt
      setTableForSeatNumberPrompt(row);
      setNumberOfSeats(4); // Reset to default
      setShowSeatNumberPrompt(true);
    } catch (error) {
      console.error('Error creating table task:', error);
    }
  };

  const handleSeatSelectionToggle = (seatNumber) => {
    setSelectedSeatsForTable(prev => {
      if (prev.includes(seatNumber)) {
        return prev.filter(seat => seat !== seatNumber);
      } else {
        return [...prev, seatNumber];
      }
    });
  };

  const handleConfirmSeatNumber = async () => {
    if (!tableForSeatNumberPrompt) return;
    try {
      // First, ensure parent table task exists - create it if it doesn't
      let tableTaskUuid = tableTaskMapping[tableForSeatNumberPrompt.id];
      
      if (!tableTaskUuid) {
        // Try to get from existing tasks
        const tasks = await fetchActiveTasks(tableForSeatNumberPrompt.id);
        const anySeat = tasks.find(t => t.extensionsData?.subtask_of);
        if (anySeat) {
          tableTaskUuid = anySeat.extensionsData.subtask_of;
        } else {
          // Parent task doesn't exist - create it first
          console.log('Parent table task not found, creating it first...');
          const workflowMetadata = buildWorkflowMetadata("table_allocation");
          
          const tableTaskData = {
            requestContext: {},  // Empty requestContext for table tasks (no parent)
            title: tableForSeatNumberPrompt.id,
            description: `Main task for table ${tableForSeatNumberPrompt.id}`,
            assigneeInfo: ASSIGNEE_INFO,
            dueAt: "2024-12-31T15:00:00",
            extensionsData: {
              table_id: tableForSeatNumberPrompt.id,
              task_status: "ACTIVE",
              status: "pending",
              priority: "HIGH",
              project: "Nucleus",
              phase: "planning",
              ...workflowMetadata  // Include workflow metadata
            }
          };
          
          const tableResponse = await taskService.createTask(tableTaskData);
          if (!tableResponse.taskUuid) {
            console.error('Failed to create parent table task');
            alert('Failed to create table task. Please try again.');
            return;
          }
          
          tableTaskUuid = tableResponse.taskUuid;
          // Store the table task UUID
          setTableTaskMapping(prev => ({
            ...prev,
            [tableForSeatNumberPrompt.id]: tableTaskUuid
          }));
          console.log('Parent table task created successfully:', tableTaskUuid);
        }
      }
      
      if (!tableTaskUuid) {
        console.error('Table task UUID not found and could not be created');
        alert('Failed to create table task. Please try again.');
        return;
      }

      if (isAddingSeats) {
        // Append next N seats after current max
        const tasks = await fetchActiveTasks(tableForSeatNumberPrompt.id);
        const existingSeats = Array.from(new Set(
          (tasks || [])
            .map(t => t.extensionsData?.seat_id)
            .filter(s => s && s !== '99')
            .map(s => parseInt(s, 10))
        ));
        const maxSeat = existingSeats.length > 0 ? Math.max(...existingSeats) : 0;
        const remaining = Math.max(0, 20 - existingSeats.length);
        const toCreate = Math.min(numberOfSeats, remaining);
        // Build workflow metadata with current_state = "order_placement"
        const workflowMetadata = buildWorkflowMetadata("order_placement");
        
        for (let i = 1; i <= toCreate; i++) {
          const seatNum = maxSeat + i;
          const seatTaskData = {
            requestContext: { parentTaskUuid: tableTaskUuid },
            title: 'order',
            description: `Seat ${seatNum}`,
            assigneeInfo: ASSIGNEE_INFO,
            dueAt: '2024-12-31T15:00:00',
            extensionsData: {
              seat_id: seatNum.toString(),
              table_id: tableForSeatNumberPrompt.id,
              task_status: 'ACTIVE',
              status: 'pending',
              priority: 'HIGH',
              project: 'Nucleus',
              phase: 'planning',
              subtask_of: tableTaskUuid,
              ...workflowMetadata  // Include workflow metadata
            }
          };
          await taskService.createTask(seatTaskData);
        }
      } else {
        // Initial creation: All Seats (99) and 1..N seats
        // Build workflow metadata with current_state = "order_placement"
        const workflowMetadata = buildWorkflowMetadata("order_placement");
        
        const allSeatsTaskData = {
          requestContext: { parentTaskUuid: tableTaskUuid },
          title: 'order',
          description: 'All Seats',
          assigneeInfo: ASSIGNEE_INFO,
          dueAt: '2024-12-31T15:00:00',
          extensionsData: {
            seat_id: '99',
            table_id: tableForSeatNumberPrompt.id,
            task_status: 'ACTIVE',
            status: 'pending',
            priority: 'HIGH',
            project: 'Nucleus',
            phase: 'planning',
            subtask_of: tableTaskUuid,
            ...workflowMetadata  // Include workflow metadata
          }
        };
        await taskService.createTask(allSeatsTaskData);
        for (let i = 1; i <= numberOfSeats; i++) {
          const seatTaskData = {
            requestContext: { parentTaskUuid: tableTaskUuid },
            title: 'order',
            description: `Seat ${i}`,
            assigneeInfo: ASSIGNEE_INFO,
            dueAt: '2024-12-31T15:00:00',
            extensionsData: {
              seat_id: i.toString(),
              table_id: tableForSeatNumberPrompt.id,
              task_status: 'ACTIVE',
              status: 'pending',
              priority: 'HIGH',
              project: 'Nucleus',
              phase: 'planning',
              subtask_of: tableTaskUuid,
              ...workflowMetadata  // Include workflow metadata
            }
          };
          await taskService.createTask(seatTaskData);
        }
      }

      await fetchActiveTasks(tableForSeatNumberPrompt.id);
      setShowSeatNumberPrompt(false);
      setTableForSeatNumberPrompt(null);
      setIsAddingSeats(false);
      setMaxSeatAddCap(20);
    } catch (error) {
      console.error('Error creating seat tasks:', error);
      alert('Failed to create tasks. Please try again.');
    }
  };

  const handleConfirmSeatSelection = async () => {
    if (selectedSeatsForTable.length === 0) {
      setSelectedSeatsForTable(seatAddOptions.length > 0 ? seatAddOptions.slice(0, 4) : [1, 2, 3, 4]);
    }
    
    // If we're adding seats from the seat page, create backend tasks directly
    if (isAddingSeats && selectedTableForSeats) {
      try {
        const tableId = selectedTableForSeats.id;
        // Determine table task uuid from existing active tasks (subtask_of of any seat task)
        const tasks = activeTasksForTable[tableId] || [];
        let tableTaskUuid = null;
        const anySeatTask = tasks.find(t => t.extensionsData?.subtask_of);
        if (anySeatTask) tableTaskUuid = anySeatTask.extensionsData.subtask_of;
        if (!tableTaskUuid) {
          // Create parent table task first with workflow metadata
          const workflowMetadata = buildWorkflowMetadata("table_allocation");
          tableTaskUuid = tableTaskMapping[tableId] || await createTableTask(tableId, workflowMetadata);
          setTableTaskMapping(prev => ({ ...prev, [tableId]: tableTaskUuid }));
        }
        // Ensure All Seats (99) exists when starting fresh
        const hasAllSeats = tasks.some(t => t.extensionsData?.seat_id === '99');
        const existingSeats = Array.from(new Set(
          tasks.map(t => t.extensionsData?.seat_id)
            .filter(s => s && s !== '99')
            .map(s => parseInt(s, 10))
        ));
        if (!hasAllSeats && existingSeats.length === 0) {
          const allSeatsTaskData = {
            requestContext: { parentTaskUuid: tableTaskUuid },
            title: 'order',
            description: 'All Seats',
            assigneeInfo: ASSIGNEE_INFO,
            dueAt: '2024-12-31T15:00:00',
            extensionsData: {
              seat_id: '99',
              table_id: tableId,
              task_status: 'ACTIVE',
              status: 'pending',
              priority: 'HIGH',
              project: 'Nucleus',
              phase: 'planning',
              subtask_of: tableTaskUuid
            }
          };
          await taskService.createTask(allSeatsTaskData);
        }
        // Create tasks for selected seats
        for (const seatId of selectedSeatsForTable) {
          const seatTaskData = {
            requestContext: { parentTaskUuid: tableTaskUuid },
            title: 'order',
            description: `Seat ${seatId}`,
            assigneeInfo: ASSIGNEE_INFO,
            dueAt: '2024-12-31T15:00:00',
            extensionsData: {
              seat_id: seatId.toString(),
              table_id: tableId,
              task_status: 'ACTIVE',
              status: 'pending',
              priority: 'HIGH',
              project: 'Nucleus',
              phase: 'planning',
              subtask_of: tableTaskUuid
            }
          };
          await taskService.createTask(seatTaskData);
        }
        await fetchActiveTasks(tableId);
        setShowSeatSelectionPopup(false);
        setIsAddingSeats(false);
        setSeatAddOptions([]);
        setSelectedSeatsForTable([]);
        return;
      } catch (e) {
        console.error('Error adding seats:', e);
        alert('Failed to add seats.');
        return;
      }
    }
    
    // Get current selected seats from the table
    const currentTable = rows.find(row => row.id === selectedTableForSeats.id);
    const currentSelectedSeats = currentTable?.selectedSeats || [];
    
    // Merge new seats with existing selected seats (avoid duplicates)
    const newSelectedSeats = selectedSeatsForTable.length > 0 ? selectedSeatsForTable : [1, 2, 3, 4];
    const mergedSeats = [...new Set([...currentSelectedSeats, ...newSelectedSeats])].sort((a, b) => a - b);
    
    try {
      // Create table task if it doesn't exist - parent task must be created first
      let tableTaskUuid = tableTaskMapping[selectedTableForSeats.id];
      if (!tableTaskUuid) {
        // Create parent table task first with workflow metadata
        const workflowMetadata = buildWorkflowMetadata("table_allocation");
        tableTaskUuid = await createTableTask(selectedTableForSeats.id, workflowMetadata);
        setTableTaskMapping(prev => ({
          ...prev,
          [selectedTableForSeats.id]: tableTaskUuid
        }));
        console.log('Parent table task created:', tableTaskUuid);
      }

      // Create seat tasks for newly selected seats
      const newSeatTasks = {};
      for (const seatId of mergedSeats) {
        const seatKey = `${selectedTableForSeats.id}-${seatId}`;
        if (!seatTaskMapping[seatKey]) {
          const seatName = seatId === 0 ? 'All Seats' : `Seat ${seatId}`;
          const seatTaskUuid = await createSeatTask(tableTaskUuid, seatId, seatName);
          
          setSeatTaskMapping(prev => ({
            ...prev,
            [seatKey]: seatTaskUuid
          }));
          
          newSeatTasks[seatId] = seatTaskUuid;
        }
      }

      // Initialize seat data for newly selected seats
      setTableSeats(prev => {
        const updatedSeats = { ...prev };
        if (!updatedSeats[selectedTableForSeats.id]) {
          updatedSeats[selectedTableForSeats.id] = {};
        }
        
        // Initialize each seat with proper structure
        mergedSeats.forEach(seatId => {
          if (!updatedSeats[selectedTableForSeats.id][seatId]) {
            updatedSeats[selectedTableForSeats.id][seatId] = {
              id: seatId,
              tableId: selectedTableForSeats.id,
              currentTaskIndex: 0,
              currentTask: { 
                id: "1", 
                name: "Assign Table", 
                statusOptions: ["Empty", "Seated"],
                currentStatus: "Empty"
              },
              minutes: 0,
              status: "Available",
              orderMoreNext: false,
              serveHistory: [],
              currentTaskUuid: newSeatTasks[seatId] || null
            };
          }
        });
        
        return updatedSeats;
      });

      // Update the table's selectedSeats property to remember the selection
      setRows(prev => prev.map(row => 
        row.id === selectedTableForSeats.id 
          ? { ...row, selectedSeats: mergedSeats }
          : row
      ));
      
      // Update the local selectedSeatsForTable state
      setSelectedSeatsForTable(mergedSeats);
      
      setShowSeatSelectionPopup(false);
      setShowSeatPageView(true);
    } catch (error) {
      console.error('Error creating tasks:', error);
      // Still proceed with UI updates even if API fails
      setRows(prev => prev.map(row => 
        row.id === selectedTableForSeats.id 
          ? { ...row, selectedSeats: mergedSeats }
          : row
      ));
      
      setSelectedSeatsForTable(mergedSeats);
      setShowSeatSelectionPopup(false);
      setShowSeatPageView(true);
    }
  };

  // Mark all ACTIVE tasks for a table as COMPLETED in backend
  const clearTableBackend = async (tableId) => {
    try {
      console.log('[Clear Table] Starting to clear table:', tableId);
      const tasks = activeTasksForTable[tableId] || [];
      console.log('[Clear Table] Found tasks:', tasks.length);
      
      // Helper to check if task is active (ACTIVE or COMPLETED with workflow state)
      const isActiveTask = (t) => {
        const taskStatus = t.extensionsData?.task_status;
        return taskStatus === "ACTIVE" || 
               (taskStatus === "COMPLETED" && t.extensionsData?.workflow?.current_state);
      };
      const active = tasks.filter(isActiveTask);
      console.log('[Clear Table] Active tasks to clear:', active.length);
      
      if (active.length === 0) {
        console.log('[Clear Table] No active tasks to clear');
        return;
      }
      
      // Clear local state immediately to prevent UI from showing stale data
      setActiveTasksForTable(prev => {
        const updated = { ...prev };
        updated[tableId] = [];
        return updated;
      });
      
      // Update all tasks in backend - wait for all to complete
      const updatePromises = active.map(async (t) => {
        const existingExt = t.extensionsData || {};
        // Remove workflow state to ensure task is no longer considered active
        const { workflow, ...extensionsWithoutWorkflow } = existingExt;
        const updateData = {
          title: t.title,
          description: t.description || '',
          status: 'COMPLETED',
          dueAt: '2025-12-31T15:00:00',
          extensionsData: { 
            ...extensionsWithoutWorkflow, 
            task_status: 'COMPLETED',
            workflow: null // Explicitly set to null to ensure backend removes it
          }
        };
        try {
          console.log('[Clear Table] Clearing task:', t.taskUuid, t.title);
          await updateFullTask(t.taskUuid, updateData);
          console.log('[Clear Table] Successfully cleared task:', t.taskUuid);
          return { success: true, taskUuid: t.taskUuid };
        } catch (e) {
          console.error('[Clear Table] Failed to complete task', t.taskUuid, e);
          return { success: false, taskUuid: t.taskUuid, error: e };
        }
      });
      
      // Wait for all updates to complete
      const results = await Promise.all(updatePromises);
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      console.log(`[Clear Table] Updated ${successCount} tasks successfully, ${failCount} failed`);
      
      // Wait longer for backend to process all updates (increased from 500ms to 2s)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refresh tasks from backend - force refresh
      console.log('[Clear Table] Refreshing tasks for table:', tableId);
      await refreshTasksForTable(tableId);
      
      // Double-check: fetch again to verify - wait a bit more
      await new Promise(resolve => setTimeout(resolve, 1000));
      const verifyTasks = await fetchActiveTasks(tableId);
      const remainingActive = verifyTasks.filter(t => {
        const taskStatus = t.extensionsData?.task_status;
        const hasWorkflow = t.extensionsData?.workflow?.current_state;
        // Task is active if: ACTIVE status OR (COMPLETED status AND has workflow state)
        const isActive = taskStatus === "ACTIVE" || (taskStatus === "COMPLETED" && hasWorkflow);
        if (isActive) {
          console.log(`[Clear Table] Still active task found: ${t.taskUuid}, title=${t.title}, task_status=${taskStatus}, has_workflow=${!!hasWorkflow}`);
        }
        return isActive;
      });
      
      if (remainingActive.length > 0) {
        console.warn(`[Clear Table] ⚠️ Still found ${remainingActive.length} active tasks after clearing. This may indicate backend update delay or workflow property not removed.`);
        console.warn(`[Clear Table] Remaining active tasks:`, remainingActive.map(t => ({
          uuid: t.taskUuid,
          title: t.title,
          task_status: t.extensionsData?.task_status,
          has_workflow: !!t.extensionsData?.workflow
        })));
      } else {
        console.log('[Clear Table] ✅ All tasks cleared successfully - no active tasks remaining');
      }
      
      console.log('[Clear Table] Table cleared successfully');
    } catch (e) {
      console.error('[Clear Table] Error clearing table backend:', e);
      throw e; // Re-throw to allow caller to handle
    }
  };

  const handleSeatPageSeatClick = async (seatNumber) => {
    console.log('=== handleSeatPageSeatClick (Backend-Managed) ===');
    console.log('Seat Number:', seatNumber);
    console.log('Selected Table:', selectedTableForSeats);
    
    const tableId = selectedTableForSeats.id;
    
    // Get active tasks for this table from backend
    const tasks = activeTasksForTable[tableId] || [];
    console.log('Active tasks for table:', tasks);
    
    // Find the task for this specific seat
    // Backend creates workflow tasks with task_status=COMPLETED, so we treat those as active
    const seatId = seatNumber.toString();
    
    // Helper function to check if task is active (ACTIVE or COMPLETED with workflow state)
    // Backend creates workflow tasks with COMPLETED status, so we need to check for both
    const isActiveTask = (task) => {
      const taskStatus = task.extensionsData?.task_status;
      return taskStatus === "ACTIVE" || 
             (taskStatus === "COMPLETED" && task.extensionsData?.workflow?.current_state);
    };
    
    // First, try to find an active Serve task for this seat
    let seatTask = tasks.find(task => 
      task.extensionsData?.seat_id === seatId && 
      isActiveTask(task) &&
      task.title === "serve"
    );
    
    // If no Serve task found, fall back to Order task
    if (!seatTask) {
      seatTask = tasks.find(task => 
        task.extensionsData?.seat_id === seatId && 
        isActiveTask(task)
      );
    }
    
    if (!seatTask) {
      console.error(`Seat task not found for table ${tableId}, seat ${seatNumber}`);
      return;
    }
    
    console.log('Found seat task:', seatTask);
    
    // Extract serve history from extensionsData
    // Get ONLY the MOST RECENT active Serve task for this seat
    const serveTasks = tasks.filter(task => 
      task.extensionsData?.seat_id === seatId &&
      isActiveTask(task) &&
      task.title === "serve"
    );
    
    console.log('Found serveTasks:', serveTasks);
    console.log('Number of serveTasks:', serveTasks.length);
    
    // If multiple serve tasks, take only the most recent one
    const latestServeTask = serveTasks.length > 0 ? serveTasks[0] : null;
    console.log('latestServeTask:', latestServeTask);
    console.log('latestServeTask orderItems:', latestServeTask?.extensionsData?.orderItems);
    
    // Build serve history from the latest Serve task ONLY
    const serveHistory = latestServeTask ? [{
      orderNumber: 1,
      status: "Pending",
      timestamp: latestServeTask.createdAt ? new Date(latestServeTask.createdAt[0], latestServeTask.createdAt[1] - 1, latestServeTask.createdAt[2], latestServeTask.createdAt[3], latestServeTask.createdAt[4], latestServeTask.createdAt[5]).toLocaleTimeString() : new Date().toLocaleTimeString(),
      items: latestServeTask.extensionsData?.orderItems?.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        seatId: seatId,
        served: item.status === "SERVED"
      })) || [],
      note: null
    }] : [];
    
    // Create a seat object from backend task data
    // Include workflow state information
    const workflowState = seatTask.extensionsData?.workflow?.current_state || 'order_placement';
      const seatObject = {
        id: `${tableId}-S${seatNumber}`,
        seatNumber: seatNumber,
        tableId: tableId,
        currentTask: {
          id: seatTask.title || "order",
          name: seatTask.title === "serve" ? "Serve" : seatTask.title === "order" ? "Order" : seatTask.title === "payment" ? "Payment" : (seatTask.title || "Order"),
          type: (seatTask.title || "ORDER").toUpperCase()
        },
      currentTaskUuid: seatTask.taskUuid,
      seatTaskUuid: seatTask.taskUuid,
        workflowState: workflowState, // Store workflow state for menu visibility
        extensionsData: seatTask.extensionsData, // Store full extensions data
      minutes: 0, // Can be calculated from createdAt if needed
      status: "Pending",
      orderMoreNext: false,
      serveHistory: serveHistory,
        selectedSeats: [seatNumber]
      };
    
    console.log('Created seat object:', seatObject);
      
      // Close seat page view and open task flow
      setShowSeatPageView(false);
      setExpandedCard(seatObject);
      setActiveOrderTab(seatNumber.toString());
      
      // Show menu only when workflow current_state is "order_placement" (as per requirements)
      const currentState = seatTask.extensionsData?.workflow?.current_state;
      const isOrderPlacement = currentState === 'order_placement';
      
      if (isOrderPlacement) {
        try { await ensureMenuLoaded(); } catch {}
      setShowMenu(true);
      } else {
        setShowMenu(false);
    }
  };

  const handleBarSeatClick = (seat) => {
    // For bar seats, always go directly to task flow (no seat selection needed)
    // Set the seat number as the selected seat for this bar seat
    const updatedSeat = {
      ...seat,
      selectedSeats: [seat.id] // The seat number is always the selected seat
    };
    
    // Reset active tab when switching seats
    setActiveOrderTab(seat.id.toString());
    // Set the selected bar seat for expanded view
    setSelectedBarSeat(updatedSeat);
    setExpandedCard({ 
      id: `BAR-SEAT-${seat.id}`, 
      type: "bar-seat", 
      seat: updatedSeat,
      selectedSeats: [seat.id]
    });
  };

  // Fetch menu items on component mount
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setMenuLoading(true);
        const items = await menuService.getMenuItems();
        // Filter only available items
        const availableItems = items.filter(item => item.isAvailable);
        setMenuItems(availableItems);
      } catch (err) {
        console.error('Failed to fetch menu items:', err);
        // Continue with empty menu on error
        setMenuItems([]);
      } finally {
        setMenuLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  // ==================== BACKEND STATE MANAGEMENT FUNCTIONS ====================

  // Fetch active tasks for a specific table from backend
  const fetchActiveTasks = async (tableId) => {
    try {
      setLoadingTasks(true);
      console.log('Fetching active tasks for table:', tableId);
      
      // Backend creates workflow tasks with task_status=COMPLETED (this is expected behavior)
      // We need to search for both ACTIVE and COMPLETED tasks to find all workflow tasks
      const filterCriteria = {
        attributes: [
          {
            name: "table_id",
            values: [tableId]
          },
          {
            name: "task_status",
            values: ["ACTIVE", "COMPLETED"] // Backend creates workflow tasks with COMPLETED status
          }
        ]
      };
      
      const response = await taskService.filterTasksByAttributes(filterCriteria);
      
      if (response && response.tasks) {
        // Filter to include ACTIVE tasks and COMPLETED tasks that have workflow state (backend-created workflow tasks)
        const filteredTasks = response.tasks.filter(t => {
          const taskStatus = t.extensionsData?.task_status;
          // Include ACTIVE tasks, or COMPLETED tasks that have workflow state (backend-created workflow tasks)
          return taskStatus === "ACTIVE" || 
                 (taskStatus === "COMPLETED" && t.extensionsData?.workflow?.current_state);
        });
        
        console.log(`Fetched ${response.tasks.length} tasks for table ${tableId} (${filteredTasks.length} after filtering):`, filteredTasks);
        
        // Store tasks by table ID
        setActiveTasksForTable(prev => ({
          ...prev,
          [tableId]: filteredTasks
        }));
        
        return filteredTasks;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching active tasks:', error);
      return [];
    } finally {
      setLoadingTasks(false);
    }
  };

  // Refresh tasks for a specific table
  const refreshTasksForTable = async (tableId) => {
    console.log('Refreshing tasks for table:', tableId);
    await fetchActiveTasks(tableId);
  };
  
  // Helper function to filter tasks by workflow current_state
  const getTasksByWorkflowState = (tableId, currentState) => {
    const tasks = activeTasksForTable[tableId] || [];
    // Helper to check if task is active (ACTIVE or COMPLETED with workflow state)
    const isActiveTask = (task) => {
      const taskStatus = task.extensionsData?.task_status;
      return taskStatus === "ACTIVE" || 
             (taskStatus === "COMPLETED" && task.extensionsData?.workflow?.current_state);
    };
    return tasks.filter(task => 
      task.extensionsData?.workflow?.current_state === currentState &&
      isActiveTask(task)
    );
  };
  
  // Function to handle payment collection - update current task to COMPLETED to advance to payment_collection
  const handleBillIssuance = async () => {
    if (!expandedCard || !expandedCard.currentTaskUuid) return;
    
    try {
      const tableId = expandedCard.tableId || expandedCard.seat?.tableId || expandedCard.id;
      const seatId = expandedCard.seat?.id ? expandedCard.seat.id.toString() : expandedCard.seatNumber?.toString();
      
      // Get current task to preserve workflow metadata
      let currentTask = null;
      try {
        const existingTask = await taskService.getTaskById(expandedCard.currentTaskUuid);
        currentTask = existingTask?.taskDTO;
      } catch (e) {
        console.warn('Could not fetch existing task for workflow metadata');
      }
      
      // Preserve workflow metadata
      const workflowData = currentTask?.extensionsData?.workflow || buildWorkflowMetadata("order_serving").workflow;
      
      // Helper to convert dueAt to ISO string (handles array, Date, or string)
      const formatDueAt = (dueAt) => {
        if (!dueAt) return '2025-12-31T15:00:00';
        if (typeof dueAt === 'string') return dueAt;
        if (Array.isArray(dueAt)) {
          // Array format: [2025, 12, 31, 15, 0] -> ISO string
          const [year, month, day, hour = 15, minute = 0] = dueAt;
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
        }
        if (dueAt instanceof Date) return dueAt.toISOString();
        return '2025-12-31T15:00:00';
      };
      
      // Update task to COMPLETED to trigger workflow advancement to payment_collection
      // Backend requires title and dueAt to be present (not null)
      const updateData = {
        title: currentTask?.title || expandedCard.currentTask?.name || 'Order Serving',
        description: currentTask?.description || expandedCard.currentTask?.name || 'Order Serving',
        status: "COMPLETED",
        dueAt: formatDueAt(currentTask?.dueAt),
        extensionsData: {
          ...(currentTask?.extensionsData || {}),
          task_status: "COMPLETED",
          workflow: workflowData
        }
      };
      
      console.log('Updating task to COMPLETED for payment collection:', JSON.stringify(updateData, null, 2));
      await updateFullTask(expandedCard.currentTaskUuid, updateData);
      console.log('Task updated. Backend should advance workflow to payment_collection.');
      
      // Refresh tasks to get the new payment_collection task
      if (tableId && seatId) {
        setTimeout(async () => {
          await refreshTasksForTable(tableId);
          const activeTasks = await fetchActiveTasks(tableId);
          const billTask = activeTasks.find(t => 
            t.extensionsData?.seat_id === seatId &&
            t.extensionsData?.workflow?.current_state === 'payment_collection'
          );
          
          if (billTask) {
            // Check if this task was created by backend
            const taskCreatedAt = billTask.createdAt || billTask.created_at;
            const isBackendCreated = taskCreatedAt && new Date(taskCreatedAt) > new Date(Date.now() - 10000); // Within 10 seconds
            
            if (isBackendCreated) {
              console.log('[Payment Collection] ✅✅✅ BACKEND WORKFLOW AUTOMATION WORKING! ✅✅✅');
              console.log('[Payment Collection] Backend automatically created payment_collection task:', billTask.taskUuid);
              console.log('[Payment Collection] Task created at:', taskCreatedAt);
            } else {
              console.log('[Payment Collection] ✅ Found payment_collection task (may be from previous session)');
            }
            
            setExpandedCard(prev => ({
              ...prev,
              currentTask: { id: 'bill', name: 'Payment Collection', type: 'BILL' },
              currentTaskUuid: billTask.taskUuid,
              workflowState: billTask.extensionsData?.workflow?.current_state,
              extensionsData: billTask.extensionsData
            }));
          } else {
            // Backend didn't create payment_collection task - create it manually as fallback
            console.log('[Payment Collection] ⚠️ FRONTEND FALLBACK: Backend didn\'t create payment_collection task. Creating manually...');
            console.log('[Payment Collection] ⚠️ Backend workflow automation is NOT working - using frontend fallback');
            try {
              const parentTaskUuid = currentTask?.extensionsData?.subtask_of || tableTaskMapping[tableId];
              const workflowMetadata = buildWorkflowMetadata("payment_collection");
              
              const billTaskData = {
                requestContext: parentTaskUuid ? { parentTaskUuid } : {},
                title: 'bill',
                description: `Payment Collection - Seat ${seatId}`,
                assigneeInfo: ASSIGNEE_INFO,
                dueAt: '2024-12-31T15:00:00',
                extensionsData: {
                  seat_id: seatId,
                  table_id: tableId,
                  task_status: 'ACTIVE',
                  status: 'pending',
                  priority: 'HIGH',
                  project: 'Nucleus',
                  phase: 'planning',
                  subtask_of: parentTaskUuid,
                  orderItems: currentTask?.extensionsData?.orderItems || [], // Copy orderItems
                  ...workflowMetadata
                }
              };
              
              const billResponse = await taskService.createTask(billTaskData);
              if (billResponse?.taskUuid) {
                console.log('[Payment Collection] ⚠️ FRONTEND FALLBACK: Successfully created payment_collection task manually:', billResponse.taskUuid);
                console.log('[Payment Collection] This means backend workflow system did NOT create the task automatically');
                
                await refreshTasksForTable(tableId);
                const newTasks = await fetchActiveTasks(tableId);
                const newBillTask = newTasks.find(t => t.taskUuid === billResponse.taskUuid);
                
                if (newBillTask) {
                  setExpandedCard(prev => ({
                    ...prev,
                    currentTask: { id: 'bill', name: 'Payment Collection', type: 'BILL' },
                    currentTaskUuid: newBillTask.taskUuid,
                    workflowState: newBillTask.extensionsData?.workflow?.current_state,
                    extensionsData: newBillTask.extensionsData
                  }));
                }
              }
            } catch (createError) {
              console.error('[Payment Collection] Failed to create payment_collection task manually:', createError);
            }
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error handling bill issuance:', error);
    }
  };
  
  // Function to calculate total from all tasks for a seat
  const calculateSeatTotal = (tableId, seatId) => {
    const tasks = activeTasksForTable[tableId] || [];
    let total = 0;
    
    // Find all tasks for this seat that have orderItems
    const seatTasks = tasks.filter(t => 
      t.extensionsData?.seat_id === seatId.toString() &&
      t.extensionsData?.orderItems
    );
    
    // Sum up all order items from all tasks
    seatTasks.forEach(task => {
      const orderItems = task.extensionsData.orderItems || [];
      orderItems.forEach(item => {
        if (item.status === 'ORDERED' || item.status === 'SERVED' || item.orderStatus === 'ORDERED' || item.orderStatus === 'SERVED') {
          total += (item.price || (item.basePrice * (item.quantity || 1)));
        }
      });
    });
    
    return total;
  };
  
  // Function to calculate total for all seats in a table
  const calculateTableTotal = (tableId) => {
    const tasks = activeTasksForTable[tableId] || [];
    let total = 0;
    
    // Sum up all order items from all tasks for this table
    tasks.forEach(task => {
      if (task.extensionsData?.table_id === tableId && task.extensionsData?.orderItems) {
        const orderItems = task.extensionsData.orderItems || [];
        orderItems.forEach(item => {
          if (item.status === 'ORDERED' || item.status === 'SERVED' || item.orderStatus === 'ORDERED' || item.orderStatus === 'SERVED') {
            total += (item.price || (item.basePrice * (item.quantity || 1)));
          }
        });
      }
    });
    
    return total;
  };

  // Prefetch active tasks for all visible tables so badges persist on reload
  useEffect(() => {
    try {
      if (filteredRows && Array.isArray(filteredRows)) {
        filteredRows.forEach(row => {
          if (!activeTasksForTable[row.id]) {
            fetchActiveTasks(row.id);
          }
        });
      }
    } catch (e) {
      console.warn('Prefetch tables error:', e);
    }
  }, []);

  // Create table and seat tasks using backend
  const createBackendTasks = async (tableId, numberOfSeats) => {
    try {
      console.log(`Creating backend tasks for table ${tableId} with ${numberOfSeats} seats`);
      
      const createdTaskIds = {
        tableTaskUuid: null,
        allSeatsTaskUuid: null,
        seatTasks: {}
      };
      
      // 1. Create Parent Table Task FIRST
      const tableTaskData = {
        requestContext: {},
        title: "table " + tableId,
        description: "Main task for table " + tableId,
        assigneeInfo: ASSIGNEE_INFO,
        dueAt: "2024-12-31T15:00:00",
        extensionsData: {
          table_id: tableId,
          task_status: "ACTIVE",
          status: "pending",
          priority: "HIGH",
          project: "Nucleus",
          phase: "planning"
        }
      };
      
      console.log('Creating table task with data:', JSON.stringify(tableTaskData, null, 2));
      const tableResponse = await taskService.createTask(tableTaskData);
      console.log('Table task response:', tableResponse);
      if (!tableResponse.taskUuid) {
        console.error('Table task response missing taskUuid:', tableResponse);
        throw new Error('Failed to create table task');
      }
      createdTaskIds.tableTaskUuid = tableResponse.taskUuid;
      console.log('Successfully created table task:', createdTaskIds.tableTaskUuid);
      
      // 2. Create "All Seats" Task (seat_id = 99)
      const allSeatsTaskData = {
        requestContext: {
          taskUuid: createdTaskIds.tableTaskUuid
        },
        title: "order",
        description: "first task",
        assigneeInfo: ASSIGNEE_INFO,
        dueAt: "2024-12-31T15:00:00",
        extensionsData: {
          seat_id: "99",
          table_id: tableId,
          task_status: "ACTIVE",
          status: "pending",
          priority: "HIGH",
          project: "Nucleus",
          phase: "planning"
        }
      };
      
      const allSeatsResponse = await taskService.createTask(allSeatsTaskData);
      if (!allSeatsResponse.taskUuid) {
        throw new Error('Failed to create all seats task');
      }
      createdTaskIds.allSeatsTaskUuid = allSeatsResponse.taskUuid;
      console.log('Created all seats task:', createdTaskIds.allSeatsTaskUuid);
      
      // 3. Create Individual Seat Tasks (seat_id = 1, 2, 3, ...)
      for (let i = 1; i <= numberOfSeats; i++) {
        const seatTaskData = {
          requestContext: {
            taskUuid: createdTaskIds.tableTaskUuid
          },
          title: "order",
          description: "first task",
          assigneeInfo: ASSIGNEE_INFO,
          dueAt: "2024-12-31T15:00:00",
          extensionsData: {
            seat_id: i.toString(),
            table_id: tableId,
            task_status: "ACTIVE",
            status: "pending",
            priority: "HIGH",
            project: "Nucleus",
            phase: "planning"
          }
        };
        
        const seatResponse = await taskService.createTask(seatTaskData);
        if (!seatResponse.taskUuid) {
          throw new Error(`Failed to create seat ${i} task`);
        }
        createdTaskIds.seatTasks[i] = seatResponse.taskUuid;
        console.log(`Created seat ${i} task:`, seatResponse.taskUuid);
      }
      
      // 4. Fetch all active tasks to update UI
      await fetchActiveTasks(tableId);
      
      return createdTaskIds;
    } catch (error) {
      console.error('Error creating backend tasks:', error);
      throw error;
    }
  };

  // Categorize menu items dynamically based on price ranges and keywords
  const categorizeMenuItems = () => {
    const categories = {
      beverages: { title: "Beverages", items: [] },
      appetizers: { title: "Appetizers & Sides", items: [] },
      mains: { title: "Main Courses", items: [] },
      desserts: { title: "Desserts", items: [] }
    };

    menuItems.forEach(item => {
      const itemName = item.name.toLowerCase();
      const itemDescription = item.description.toLowerCase();
      
      // Categorize based on keywords
      if (itemName.includes('coffee') || itemName.includes('latte') || 
          itemName.includes('espresso') || itemName.includes('brew') ||
          itemName.includes('cappuccino') || itemName.includes('americano') ||
          itemName.includes('tea') || itemName.includes('smoothie') ||
          itemName.includes('chocolate') && item.basePrice < 6) {
        categories.beverages.items.push({
          ...item,
          id: item.id.toString(),
          price: `$${item.basePrice.toFixed(2)}`
        });
      } else if (itemName.includes('bread') || itemName.includes('fries') ||
                 itemName.includes('salad') || item.basePrice < 8) {
        categories.appetizers.items.push({
          ...item,
          id: item.id.toString(),
          price: `$${item.basePrice.toFixed(2)}`
        });
      } else if (itemName.includes('tiramisu') || itemName.includes('brownie') ||
                 itemName.includes('ice cream') || itemName.includes('sundae') ||
                 itemDescription.includes('dessert')) {
        categories.desserts.items.push({
          ...item,
          id: item.id.toString(),
          price: `$${item.basePrice.toFixed(2)}`
        });
      } else {
        // Everything else goes to main courses
        categories.mains.items.push({
          ...item,
          id: item.id.toString(),
          price: `$${item.basePrice.toFixed(2)}`
        });
      }
    });

    // Filter out empty categories
    return Object.values(categories).filter(cat => cat.items.length > 0);
  };

  const menuCategories = categorizeMenuItems();

  // NEW CLEAN CART SYSTEM
  const newUpdateCartItem = (itemId, change, seatId = activeOrderTab) => {
    if (!expandedCard) return;
    
    const tableId = expandedCard.tableId || expandedCard.id;
    const actualSeatId = seatId.toString();
    
    setTableCarts(prev => {
      const seatKey = `${tableId}-S${actualSeatId}`;
      const currentCart = prev[seatKey] || [];
      
      const existingItemIndex = currentCart.findIndex(item => 
          item.id === itemId && item.seatId === actualSeatId
        );
        
        if (existingItemIndex >= 0) {
        const existingItem = currentCart[existingItemIndex];
          const newQuantity = Math.max(0, existingItem.quantity + change);
          
          if (newQuantity === 0) {
          const updatedCart = currentCart.filter((_, index) => index !== existingItemIndex);
            return { ...prev, [seatKey]: updatedCart };
          } else {
          const updatedCart = [...currentCart];
            updatedCart[existingItemIndex] = {
              ...existingItem,
              quantity: newQuantity
            };
            return { ...prev, [seatKey]: updatedCart };
          }
        } else if (change > 0) {
          const menuItem = menuCategories
            .flatMap(cat => cat.items)
            .find(item => item.id === itemId);
          
          if (menuItem) {
          const updatedCart = [...currentCart, {
              ...menuItem,
              quantity: change,
              seatId: actualSeatId,
              seatTag: `Seat ${actualSeatId}`
            }];
            return { ...prev, [seatKey]: updatedCart };
        }
      }
      
      return prev;
    });
  };

  const newGetQuantityForItem = (itemId, seatId = activeOrderTab) => {
    if (!expandedCard) return 0;
    
    const tableId = expandedCard.tableId || expandedCard.id;
    
    // For individual table seats, use the provided seatId or seatNumber; for "All Seats", use activeOrderTab
    const actualSeatId = (expandedCard.seatNumber && expandedCard.tableId) 
      ? (seatId || expandedCard.seatNumber).toString()
      : seatId.toString();
    
    const seatKey = `${tableId}-S${actualSeatId}`;
    const seatCart = tableCarts[seatKey] || [];
    const seatItem = seatCart.find(cartItem => 
      cartItem.id === itemId && cartItem.seatId === actualSeatId
    );
    return seatItem ? seatItem.quantity : 0;
  };

  const newGetCartItems = () => {
    if (!expandedCard) return [];
    const tableId = expandedCard.tableId || expandedCard.id;
    
    // For individual table seats, use seatNumber; for "All Seats", use activeOrderTab
    const actualSeatId = (expandedCard.seatNumber && expandedCard.tableId) 
      ? expandedCard.seatNumber.toString() 
      : activeOrderTab.toString();
    
    const seatKey = `${tableId}-S${actualSeatId}`;
    const seatCart = tableCarts[seatKey] || [];
    
    return seatCart.map(item => ({
          ...item,
      seatNumber: actualSeatId
    }));
  };

  const newGetTotalItems = () => {
    if (!expandedCard) return 0;
    const tableId = expandedCard.tableId || expandedCard.id;
    
    // For individual table seats, use seatNumber; for "All Seats", use activeOrderTab
    const actualSeatId = (expandedCard.seatNumber && expandedCard.tableId) 
      ? expandedCard.seatNumber.toString() 
      : activeOrderTab.toString();
    
    const seatKey = `${tableId}-S${actualSeatId}`;
        const seatCart = tableCarts[seatKey] || [];
    return seatCart.reduce((sum, item) => sum + item.quantity, 0);
  };

  // NEW CLEAN ORDER PLACEMENT SYSTEM
  const newPlaceOrder = async () => {
    if (!expandedCard) return;
    
    let tableId, seatId, seatKey;
    
    if (expandedCard.seat) {
      // Bar seat
      tableId = expandedCard.tableId || expandedCard.id;
      seatId = expandedCard.seat.id;
      seatKey = `BAR-SEAT-${seatId}`;
    } else if (expandedCard.seatNumber && expandedCard.tableId) {
      // Table seat
      tableId = expandedCard.tableId;
      seatId = expandedCard.seatNumber;
      seatKey = `${tableId}-S${seatId}`;
    } else {
      // Regular table
      tableId = expandedCard.id;
      seatId = activeOrderTab;
      seatKey = `${tableId}-S${seatId}`;
    }
    
    const currentCart = tableCarts[seatKey] || [];
    
    if (currentCart.length === 0) return;
    
    // Create order items with kitchen status (for UI)
    const orderItems = currentCart.map(item => {
      // Parse price from string format "$X.XX" to number for description
      const basePrice = typeof item.price === 'string' 
        ? parseFloat(item.price.replace('$', '')) 
        : item.basePrice || item.price || 0;
      
      return {
      id: item.id,
      name: item.name,
      quantity: item.quantity,
        price: basePrice,
      seatId: item.seatId,
      kitchenStatus: "Preparing"
      };
    });
    
    // Create order description for task (with proper price calculation)
    const orderDescription = orderItems.map(item => 
      `${item.quantity}x ${item.name} - $${(item.price * item.quantity).toFixed(2)}`
    ).join(', ');
    const fullOrderDescription = cartNote ? 
      `${orderDescription} (Note: ${cartNote})` : 
      orderDescription;
    
    // Create new order
    const newOrder = {
      orderNumber: 1, // Will be updated based on existing orders
      status: "Pending",
      timestamp: new Date().toLocaleTimeString(),
      items: orderItems,
      note: cartNote || null
    };

    // Get current timestamp for order
    const orderTimestamp = new Date().toISOString();
    
    // Format order items for API (extensionsData.orderItems)
    const apiOrderItems = currentCart.map(item => {
      // Parse price from string format "$X.XX" to number
      const basePrice = typeof item.price === 'string' 
        ? parseFloat(item.price.replace('$', '')) 
        : item.basePrice || item.price || 0;
      
      return {
        id: parseInt(item.id) || item.id,
        name: item.name,
        description: item.description || '',
        basePrice: basePrice,
        isAvailable: true,
        quantity: item.quantity,
        status: "ORDERED",
        price: parseFloat((basePrice * item.quantity).toFixed(2)),
        orderNote: cartNote || "",
        orderTimestamp: orderTimestamp,
        orderStatus: "ORDERED"
      };
    });

    // Update Order task with order items in extensionsData
    try {
      let taskUuidToUpdate = null;
      
      if (expandedCard.seatNumber && expandedCard.tableId && expandedCard.currentTaskUuid) {
        // Table seat - use the current task UUID
        taskUuidToUpdate = expandedCard.currentTaskUuid;
        console.log('Updating table seat Order task:', taskUuidToUpdate);
      } else if (expandedCard.seat && expandedCard.currentTaskUuid) {
        // Bar seat - use the current task UUID
        taskUuidToUpdate = expandedCard.currentTaskUuid;
        console.log('Updating bar seat Order task:', taskUuidToUpdate);
      } else if (!expandedCard.seat && !expandedCard.seatNumber && !expandedCard.tableId) {
        // This should not happen anymore since all seats follow the same logic
        console.warn('No seat information found for order placement');
      }
      
      if (taskUuidToUpdate) {
        // Get current task title or create a default one
        let taskTitle = "Order Task";
        if (expandedCard.seatNumber && expandedCard.tableId) {
          taskTitle = `Table ${expandedCard.tableId} Seat ${expandedCard.seatNumber}`;
        } else if (expandedCard.seat) {
          taskTitle = `Bar Seat ${expandedCard.seat.id}`;
        } else if (expandedCard.id) {
          taskTitle = `Table ${expandedCard.id}`;
        }
        
        // For "Order More" flow: Only add NEW items from cart, don't merge with existing items
        // Existing items in the task are from previous orders and should NOT be duplicated
        // The bill calculation will aggregate from all order_placement tasks separately
        let existingOrderItems = [];
        try {
          const existingOrder = await taskService.getTaskById(taskUuidToUpdate);
          existingOrderItems = existingOrder?.taskDTO?.extensionsData?.orderItems || [];
        } catch (e) {
          console.warn('Could not fetch existing order items; proceeding with current cart only');
        }
        
        // Only merge if existing items are empty (first order) or if we're not in "Order More" flow
        // For "Order More", the task starts with empty orderItems, so we only add new items
        const mergedOrderItems = existingOrderItems.length === 0 
          ? apiOrderItems  // First order: just use new items
          : [...existingOrderItems, ...apiOrderItems];  // Subsequent orders: merge (shouldn't happen with new logic)

        // Get current task to preserve workflow metadata
        let currentTask = null;
        try {
          const existingTask = await taskService.getTaskById(taskUuidToUpdate);
          currentTask = existingTask?.taskDTO;
        } catch (e) {
          console.warn('Could not fetch existing task for workflow metadata');
        }
        
        // Preserve workflow metadata and update current_state if needed
        const workflowData = currentTask?.extensionsData?.workflow || buildWorkflowMetadata("order_placement").workflow;

        // Update task with merged order items in extensionsData (matching Postman format)
        // Set status to COMPLETED so backend can advance workflow
        const updateData = {
          title: taskTitle,
          description: fullOrderDescription,
          status: "COMPLETED",  // Set to COMPLETED to trigger workflow advancement
          dueAt: "2025-12-31T15:00:00",
          extensionsData: {
            priority: "HIGH",
            task_status: "COMPLETED",  // Mark Order task as completed
            orderItems: mergedOrderItems,  // Preserve previous + add new items
            workflow: workflowData  // Preserve workflow metadata
          }
        };
        
        console.log('Updating task with order items and COMPLETED status:', JSON.stringify(updateData, null, 2));
        await updateFullTask(taskUuidToUpdate, updateData);
        console.log('Order task updated successfully with cart items. Backend should advance workflow.');
        
        // Backend will automatically create the next task (order_preparation) based on workflow config
        // Refresh tasks to get the new task created by backend
          const tableId = expandedCard.tableId || expandedCard.seat?.tableId || 'N/A';
        const seatId = expandedCard.seat?.id ? expandedCard.seat.id.toString() : expandedCard.seatNumber?.toString();
        
        // Store these for use in fallback
        const orderTaskUuid = taskUuidToUpdate;
        const orderItemsToCopy = mergedOrderItems;
        
        if (tableId !== 'N/A' && seatId) {
          // Retry logic to find the new task created by backend
          // Increased retries and delay to give backend more time
          const findNextTask = async (retries = 8, delay = 1500) => {
            for (let i = 0; i < retries; i++) {
              console.log(`[Order Placement] Attempting to find order_preparation task (attempt ${i + 1}/${retries})...`);
              
              await refreshTasksForTable(tableId);
              const activeTasks = await fetchActiveTasks(tableId);
              
              console.log(`[Order Placement] Found ${activeTasks.length} active tasks for table ${tableId}`);
              console.log(`[Order Placement] Looking for seat ${seatId} with state 'order_preparation'...`);
              
              // Log all tasks to see what we have
              activeTasks.forEach((t, idx) => {
                const taskSeatId = t.extensionsData?.seat_id?.toString();
                const taskState = t.extensionsData?.workflow?.current_state;
                const taskTitle = t.title;
                const taskStatus = t.extensionsData?.task_status;
                console.log(`[Order Placement] Task ${idx + 1}: UUID=${t.taskUuid}, title=${taskTitle}, seat_id=${taskSeatId}, current_state=${taskState}, task_status=${taskStatus}`);
              });
              
              // Find the new order_preparation task for this seat
              // Try exact match first (seat_id + state)
              // Also check COMPLETED tasks (backend bug workaround)
              let prepTask = activeTasks.find(t => {
                const taskSeatId = t.extensionsData?.seat_id?.toString();
                const taskState = t.extensionsData?.workflow?.current_state;
                const matches = taskSeatId === seatId && taskState === 'order_preparation';
                if (matches) {
                  console.log(`[Order Placement] ✅ Found exact matching task: ${t.taskUuid}`);
                }
                return matches;
              });
              
              // If not found, try flexible match (just state, or title contains "preparation")
              if (!prepTask) {
                console.log('[Order Placement] No exact match found. Trying flexible search...');
                prepTask = activeTasks.find(t => {
                  const taskState = t.extensionsData?.workflow?.current_state;
                  const taskTitle = (t.title || '').toLowerCase();
                  const taskTableId = t.extensionsData?.table_id?.toString();
                  const matches = (taskState === 'order_preparation' || taskTitle.includes('preparation')) 
                                  && taskTableId === tableId;
                  if (matches) {
                    console.log(`[Order Placement] ✅ Found flexible matching task: ${t.taskUuid}, seat_id=${t.extensionsData?.seat_id}, title=${t.title}`);
                  }
                  return matches;
                });
              }
              
              // If still not found, check if backend created a task with different seat_id or no seat_id
              if (!prepTask && i === retries - 1) {
                console.log('[Order Placement] Final attempt: Checking for any order_preparation task for this table...');
                const anyPrepTask = activeTasks.find(t => {
                  const taskState = t.extensionsData?.workflow?.current_state;
                  const taskTableId = t.extensionsData?.table_id?.toString();
                  return taskState === 'order_preparation' && taskTableId === tableId;
                });
                if (anyPrepTask) {
                  console.log(`[Order Placement] ⚠️ Found order_preparation task but seat_id mismatch:`, {
                    found_seat_id: anyPrepTask.extensionsData?.seat_id,
                    expected_seat_id: seatId,
                    task_uuid: anyPrepTask.taskUuid
                  });
                  // Use it anyway if it's the only one
                  prepTask = anyPrepTask;
                }
              }
              
              if (prepTask) {
                // Check if this task was created by backend (created recently)
                const taskCreatedAt = prepTask.createdAt || prepTask.created_at;
                const now = Date.now();
                const taskTime = taskCreatedAt ? new Date(taskCreatedAt).getTime() : 0;
                const timeDiff = now - taskTime;
                const isBackendCreated = taskCreatedAt && timeDiff < 30000; // Within 30 seconds (increased from 10)
                
                console.log('[Order Placement] Task details:', {
                  uuid: prepTask.taskUuid,
                  title: prepTask.title,
                  seat_id: prepTask.extensionsData?.seat_id,
                  table_id: prepTask.extensionsData?.table_id,
                  current_state: prepTask.extensionsData?.workflow?.current_state,
                  task_status: prepTask.extensionsData?.task_status,
                  createdAt: taskCreatedAt,
                  timeDiffMs: timeDiff,
                  isBackendCreated: isBackendCreated
                });
                
                if (isBackendCreated) {
                  console.log('[Order Placement] ✅✅✅ BACKEND WORKFLOW AUTOMATION WORKING! ✅✅✅');
                  console.log('[Order Placement] Backend automatically created order_preparation task:', prepTask.taskUuid);
                  console.log('[Order Placement] Task created at:', taskCreatedAt);
                  console.log('[Order Placement] Time difference:', Math.round(timeDiff / 1000), 'seconds');
                  console.log('[Order Placement] Task status:', prepTask.extensionsData?.task_status, '(Backend creates workflow tasks with COMPLETED status)');
                } else {
                  console.log('[Order Placement] ✅ Found order_preparation task (may be from previous session or frontend fallback)');
                }
                
                console.log('[Order Placement] ✅ Successfully found order_preparation task, switching view...');
                setExpandedCard(prev => ({
                  ...prev,
                  currentTask: { id: 'preparation', name: 'Order Preparation', type: 'PREPARATION' },
                  currentTaskUuid: prepTask.taskUuid,
                  workflowState: prepTask.extensionsData?.workflow?.current_state,
                  extensionsData: prepTask.extensionsData
                }));
                // Hide menu when workflow advances to order_preparation
                setShowMenu(false);
                return; // Success, exit retry loop
              }
              
              // If not found and not last retry, wait before next attempt
              if (i < retries - 1) {
                console.log(`[Order Placement] ⏳ Order preparation task not found yet. Waiting ${delay}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, delay));
              }
            }
            
            // If we get here, task wasn't found after all retries
            console.warn('[Order Placement] ⚠️ Order preparation task not found after all retries.');
            console.log('[Order Placement] This could mean:');
            console.log('  1. Backend workflow system is not creating the task automatically');
            console.log('  2. Backend is using a different state name');
            console.log('  3. Backend needs more time to process');
            console.log('[Order Placement] Order was placed successfully. Returning to seat view.');
            
            // Show success message to user (only once, not on every retry)
            // Removed alert to prevent disruption - order is successfully placed
            console.log('✅ Order placed successfully! The kitchen will prepare it shortly.');
            
            // Fallback: Keep the seat page view open so user can see the updated state
            // Don't reset expandedCard or close seat view - just hide menu
            setShowMenu(false);
            // Keep seat page view open - don't reset it
            // setShowSeatPageView(true); // Already open, don't reset
            // setExpandedCard(null); // Don't clear - keep current state
            
            // Fallback: If backend didn't create the task, create it manually
            console.log('[Order Placement] Creating order_preparation task manually as fallback...');
            try {
              // Get the completed order task to copy orderItems and parent info
              const completedOrderTask = await taskService.getTaskById(orderTaskUuid);
              const orderTaskData = completedOrderTask?.taskDTO;
              
              if (orderTaskData) {
                // Get parent task UUID from the completed order task
                const parentTaskUuid = orderTaskData.extensionsData?.subtask_of || 
                                      tableTaskMapping[tableId];
                
                // Build workflow metadata with current_state = "order_preparation"
                const workflowMetadata = buildWorkflowMetadata("order_preparation");
                
                // Create order_preparation task with copied orderItems
                const prepTaskData = {
                  requestContext: parentTaskUuid ? { parentTaskUuid } : {},
                  title: 'preparation',
                  description: `Order Preparation - Seat ${seatId}`,
            assigneeInfo: ASSIGNEE_INFO,
                  dueAt: '2024-12-31T15:00:00',
            extensionsData: {
              seat_id: seatId,
              table_id: tableId,
                    task_status: 'ACTIVE',
                    status: 'pending',
                    priority: 'HIGH',
                    project: 'Nucleus',
                    phase: 'planning',
                    subtask_of: parentTaskUuid,
                    orderItems: orderTaskData.extensionsData?.orderItems || orderItemsToCopy, // Copy orderItems
                    ...workflowMetadata  // Include workflow metadata with order_preparation state
                  }
                };
                
                console.log('[Order Placement] Creating preparation task:', prepTaskData);
                const prepResponse = await taskService.createTask(prepTaskData);
                
                if (prepResponse?.taskUuid) {
                  console.log('[Order Placement] ⚠️ FRONTEND FALLBACK: Created order_preparation task manually');
                  console.log('[Order Placement] This means backend workflow system did NOT create the task automatically');
                  console.log('[Order Placement] Task UUID:', prepResponse.taskUuid);
                  console.log('[Order Placement] ⚠️ Backend workflow automation is NOT working - using frontend fallback');
                  
                  // Refresh tasks and switch to preparation view
              await refreshTasksForTable(tableId);
                  const newTasks = await fetchActiveTasks(tableId);
                  const newPrepTask = newTasks.find(t => t.taskUuid === prepResponse.taskUuid);
                  
                  if (newPrepTask) {
          setExpandedCard(prev => ({
            ...prev,
                      currentTask: { id: 'preparation', name: 'Order Preparation', type: 'PREPARATION' },
                      currentTaskUuid: newPrepTask.taskUuid,
                      workflowState: newPrepTask.extensionsData?.workflow?.current_state,
                      extensionsData: newPrepTask.extensionsData
            }));
            setShowMenu(false);
          }
        }
              }
            } catch (createError) {
              console.error('[Order Placement] Failed to create preparation task manually:', createError);
            }
          };
          
          // Start retry logic after initial delay
          setTimeout(() => {
            findNextTask(5, 1000); // 5 retries, 1 second apart
          }, 1000);
        } else {
          setShowMenu(false);
        }
      } else {
        console.warn('No task UUID found to update with order items');
      }
    } catch (error) {
      console.error('Error updating Order task with cart items:', error);
    }
    
    // Handle different seat types
    // For multi-user backend truth, do not mutate local serveHistory.
    // Just switch UI status; rendering will be from backend serve task only.
    
    // Clear the cart
    setTableCarts(prev => {
      const newCarts = { ...prev };
      newCarts[seatKey] = [];
      return newCarts;
    });
    
    // Reset other states
    setQuantities({});
    setCartNote('');
    setShowCart(false);
    setShowMenu(false);
  };

  // Create a new Order task as a child of the current Serve task and copy items
  const handleOrderMoreClick = async () => {
    if (!expandedCard) return;
    try {
      // Identify table and seat
      const tableId = expandedCard.tableId || expandedCard.seat?.tableId || expandedCard.id;
      const seatId = (expandedCard.seat?.id ?? expandedCard.seatNumber)?.toString();
      if (!tableId || !seatId) return;

      // Get the table task UUID (parent for all seat tasks)
      const tableTaskUuid = tableTaskMapping[tableId];
      if (!tableTaskUuid) {
        console.error('[Order More] Table task UUID not found for table:', tableId);
        return;
      }

      // Aggregate orderItems from ALL previous order tasks for this seat
      const tasks = activeTasksForTable[tableId] || [];
      const allOrderItems = [];
      
      // Find all order_placement tasks for this seat (ONLY order_placement, not preparation/serving/payment)
      // This prevents duplicate items from being aggregated
      const orderTasks = tasks.filter(t => 
        t.extensionsData?.seat_id === seatId &&
        (t.extensionsData?.workflow?.current_state === 'order_placement' ||
         (t.title === 'order' && t.extensionsData?.workflow?.current_state === 'order_placement'))
      );
      
      // Collect all orderItems from previous orders (for UI display only, not for storing in new task)
      orderTasks.forEach(task => {
        const taskOrderItems = task.extensionsData?.orderItems || [];
        taskOrderItems.forEach(item => {
          allOrderItems.push(item);
        });
      });
      
      console.log(`[Order More] Found ${orderTasks.length} previous order tasks for seat ${seatId}, aggregating ${allOrderItems.length} items for display`);

      // Build workflow metadata with current_state = "order_placement" for new order
      const workflowMetadata = buildWorkflowMetadata("order_placement");

      // Create a new Order task as child of table task (not serve task)
      // IMPORTANT: Start with EMPTY orderItems - only new items will be added when order is placed
      // Previous items are only for UI display, not stored in this task to avoid duplicates in bill
      const orderTaskData = {
        requestContext: { parentTaskUuid: tableTaskUuid },
        title: 'order',
        description: 'Order More',
        assigneeInfo: ASSIGNEE_INFO,
        dueAt: '2024-12-31T15:00:00',
        extensionsData: {
          seat_id: seatId,
          table_id: tableId,
          task_status: 'ACTIVE',
          status: 'pending',
          priority: 'HIGH',
          project: 'Nucleus',
          phase: 'planning',
          subtask_of: tableTaskUuid, // Use table task as parent
          orderItems: [], // Start empty - only new items will be added, preventing duplicates
          ...workflowMetadata  // Include workflow metadata
        }
      };

      const orderResp = await taskService.createTask(orderTaskData);
      if (tableId) await refreshTasksForTable(tableId);

      // Switch UI to the new Order task and open menu
      if (orderResp?.taskUuid) {
        await ensureMenuLoaded();
        
        // Fetch the newly created task to get its full data including workflow state
        let newTaskData = null;
        try {
          const taskResponse = await taskService.getTaskById(orderResp.taskUuid);
          newTaskData = taskResponse?.taskDTO;
        } catch (e) {
          console.warn('[Order More] Could not fetch new task data, using response data');
        }
        
        // Set expandedCard with workflow state and ensure menu shows
        // Set menu state immediately before updating expandedCard to avoid race condition
        setShowMenu(true);
        setShowCart(false);
        
        setExpandedCard(prev => {
          const updatedExtensionsData = {
            ...(newTaskData?.extensionsData || prev.extensionsData || {}),
            orderItems: allOrderItems, // Preserve aggregated items in expandedCard
            workflow: newTaskData?.extensionsData?.workflow || {
              metadata: {
                s3_bucket: 'nucleus-org-silo',
                s3_key: 'workflows-state-management/AkshayTestRestaurant1000/restaurant_ordering_v1.yaml',
                version: '1',
                name: 'restaurant_ordering'
              },
              current_state: 'order_placement'
            }
          };
          
          return {
            ...prev,
            currentTask: { id: 'order', name: 'Order', type: 'ORDER' },
            currentTaskUuid: orderResp.taskUuid,
            workflowState: 'order_placement',
            extensionsData: updatedExtensionsData
          };
        });
        
        console.log('[Order More] ✅ Switched to Order task and opened menu:', orderResp.taskUuid);
        console.log('[Order More] Aggregated orderItems count:', allOrderItems.length);
        console.log('[Order More] Menu should be visible, showMenu:', true);
      }
    } catch (e) {
      console.error('Error in Order More flow:', e);
    }
  };

  // NEW CLEAN SERVE TASK DISPLAY - backend source of truth only
  const newGetServeOrders = () => {
    if (!expandedCard) return [];
    
    // Determine table and seat context
    const tableId = expandedCard.tableId || expandedCard.seat?.tableId || expandedCard.id;
    const seatId = (expandedCard.seat?.id ?? expandedCard.seatNumber)?.toString();
    if (!tableId || !seatId) return [];
    
    // Use backend-fetched tasks for the table
    const tasks = activeTasksForTable[tableId] || [];
    
    // Check if we're on a PREPARATION task - use current task's orderItems
    const isPreparationTask = expandedCard.currentTask?.type === 'PREPARATION' || expandedCard.currentTask?.id === 'preparation';
    if (isPreparationTask && expandedCard.extensionsData?.orderItems) {
      const allItems = expandedCard.extensionsData.orderItems || [];
      const seatIdFromBackend = expandedCard.extensionsData?.seat_id;
      
      // Group items by their orderTimestamp
      const groups = new Map();
      for (const item of allItems) {
        const ts = item.orderTimestamp || 'UNKNOWN';
        if (!groups.has(ts)) groups.set(ts, []);
        groups.get(ts).push(item);
      }
      
      // Sort groups by timestamp ascending (UNKNOWN last)
      const sortedTimestamps = Array.from(groups.keys()).sort((a, b) => {
        if (a === 'UNKNOWN') return 1;
        if (b === 'UNKNOWN') return -1;
        return new Date(a).getTime() - new Date(b).getTime();
      });
      
      // Build orders array: Order #1, #2, ...
      const orders = sortedTimestamps.map((ts, idx) => ({
        orderNumber: idx + 1,
        status: 'Pending',
        timestamp: ts === 'UNKNOWN' ? new Date().toLocaleTimeString() : new Date(ts).toLocaleTimeString(),
        seatId: seatIdFromBackend,
        items: groups.get(ts)
      }));
      
      return orders;
    }
    
    // For SERVE tasks, use the existing logic
    // Helper to check if task is active (ACTIVE or COMPLETED with workflow state)
    const isActiveTask = (t) => {
      const taskStatus = t.extensionsData?.task_status;
      return taskStatus === "ACTIVE" || 
             (taskStatus === "COMPLETED" && t.extensionsData?.workflow?.current_state);
    };
    const serveTasks = tasks.filter(t => 
      t.extensionsData?.seat_id === seatId &&
      isActiveTask(t) &&
      t.title === 'serve'
    );
    if (serveTasks.length === 0) return [];
    const latestServeTask = serveTasks[0];
    const allItems = latestServeTask.extensionsData?.orderItems || [];
    const seatIdFromBackend = latestServeTask.extensionsData?.seat_id;

    // Group items by their orderTimestamp
    const groups = new Map();
    for (const item of allItems) {
      const ts = item.orderTimestamp || 'UNKNOWN';
      if (!groups.has(ts)) groups.set(ts, []);
      groups.get(ts).push(item);
    }

    // Sort groups by timestamp ascending (UNKNOWN last)
    const sortedTimestamps = Array.from(groups.keys()).sort((a, b) => {
      if (a === 'UNKNOWN') return 1;
      if (b === 'UNKNOWN') return -1;
      return new Date(a).getTime() - new Date(b).getTime();
    });

    // Build orders array: Order #1, #2, ...
    const orders = sortedTimestamps.map((ts, idx) => ({
      orderNumber: idx + 1,
      status: 'Pending',
      timestamp: ts === 'UNKNOWN' ? new Date().toLocaleTimeString() : new Date(ts).toLocaleTimeString(),
      seatId: seatIdFromBackend,
      items: groups.get(ts)
    }));

    return orders;
  };

  const newUpdateItemServed = (orderIndex, itemIndex, served) => {
    if (expandedCard.seat) {
      // Bar seat update
      setBarSeats(prev => prev.map(seat => {
        if (seat.id === expandedCard.seat.id) {
          const updatedServeHistory = [...seat.serveHistory];
          if (updatedServeHistory[orderIndex] && updatedServeHistory[orderIndex].items) {
            updatedServeHistory[orderIndex] = {
              ...updatedServeHistory[orderIndex],
              items: updatedServeHistory[orderIndex].items.map((item, idx) =>
                idx === itemIndex ? { ...item, served } : item
              )
            };
          }
          
          // Check if all items in all orders are served
          const allItemsServed = updatedServeHistory.every(order => 
            order.items && order.items.every(item => item.served)
          );
          
          const updatedSeat = { 
            ...seat, 
            serveHistory: updatedServeHistory,
            currentTask: {
              ...seat.currentTask,
              serveStatus: allItemsServed ? "Served" : "Pending"
            }
          };
          
          // Update expandedCard immediately with the updated seat
          setExpandedCard(prev => ({
            ...prev,
            seat: updatedSeat
          }));
          
          return updatedSeat;
        }
        return seat;
      }));
      
    } else if (expandedCard.seatNumber && expandedCard.tableId) {
      // Table seat update
      setTableSeats(prev => {
        const updatedSeats = { ...prev };
        const tableId = expandedCard.tableId;
        const seatNumber = expandedCard.seatNumber;
        const seatData = updatedSeats[tableId]?.[seatNumber];
        
        if (seatData) {
          const updatedServeHistory = [...seatData.serveHistory];
          if (updatedServeHistory[orderIndex] && updatedServeHistory[orderIndex].items) {
            updatedServeHistory[orderIndex] = {
              ...updatedServeHistory[orderIndex],
              items: updatedServeHistory[orderIndex].items.map((item, idx) =>
                idx === itemIndex ? { ...item, served } : item
              )
            };
          }
          
          // Check if all items in all orders are served
          const allItemsServed = updatedServeHistory.every(order => 
            order.items && order.items.every(item => item.served)
          );
          
          const updatedSeat = { 
            ...seatData, 
            serveHistory: updatedServeHistory,
            currentTask: {
              ...seatData.currentTask,
              serveStatus: allItemsServed ? "Served" : "Pending"
            }
          };
          updatedSeats[tableId][seatNumber] = updatedSeat;
          
          // Update expandedCard immediately with the updated serve history
          setExpandedCard(prev => ({
            ...prev,
            serveHistory: updatedServeHistory,
            currentTask: {
              ...prev.currentTask,
              serveStatus: allItemsServed ? "Served" : "Pending"
            }
          }));
          
          return updatedSeats;
        }
        
        return prev;
      });
      
    } else {
      // Regular table update
      const idx = rows.findIndex(r => r.id === expandedCard.id);
      if (idx !== -1) {
        const updatedRows = [...rows];
        const updatedServeHistory = [...updatedRows[idx].serveHistory];
        if (updatedServeHistory[orderIndex] && updatedServeHistory[orderIndex].items) {
          updatedServeHistory[orderIndex] = {
            ...updatedServeHistory[orderIndex],
            items: updatedServeHistory[orderIndex].items.map((item, itemIdx) =>
              itemIdx === itemIndex ? { ...item, served } : item
            )
          };
        }
        
        // Check if all items in all orders are served
        const allItemsServed = updatedServeHistory.every(order => 
          order.items && order.items.every(item => item.served)
        );
        
        updatedRows[idx] = {
          ...updatedRows[idx],
          serveHistory: updatedServeHistory,
          currentTask: {
            ...updatedRows[idx].currentTask,
            serveStatus: allItemsServed ? "Served" : "Pending"
          }
        };
        setRows(updatedRows);
        setExpandedCard(updatedRows[idx]);
      }
    }
  };

  const newUpdateKitchenStatus = (orderIndex, itemIndex, kitchenStatus) => {
    if (expandedCard.seat) {
      // Bar seat update
      setBarSeats(prev => prev.map(seat => {
        if (seat.id === expandedCard.seat.id) {
          const updatedServeHistory = [...seat.serveHistory];
          if (updatedServeHistory[orderIndex] && updatedServeHistory[orderIndex].items) {
            updatedServeHistory[orderIndex] = {
              ...updatedServeHistory[orderIndex],
              items: updatedServeHistory[orderIndex].items.map((item, idx) =>
                idx === itemIndex ? { ...item, kitchenStatus } : item
              )
            };
          }
          const updatedSeat = { ...seat, serveHistory: updatedServeHistory };
          
          // Update expandedCard immediately with the updated seat
          setExpandedCard(prev => ({
            ...prev,
            seat: updatedSeat
          }));
          
          return updatedSeat;
        }
        return seat;
      }));
      
    } else if (expandedCard.seatNumber && expandedCard.tableId) {
      // Table seat update
      setTableSeats(prev => {
        const updatedSeats = { ...prev };
        const tableId = expandedCard.tableId;
        const seatNumber = expandedCard.seatNumber;
        const seatData = updatedSeats[tableId]?.[seatNumber];
        
        if (seatData) {
          const updatedServeHistory = [...seatData.serveHistory];
          if (updatedServeHistory[orderIndex] && updatedServeHistory[orderIndex].items) {
            updatedServeHistory[orderIndex] = {
              ...updatedServeHistory[orderIndex],
              items: updatedServeHistory[orderIndex].items.map((item, idx) =>
                idx === itemIndex ? { ...item, kitchenStatus } : item
              )
            };
          }
          
          const updatedSeat = { ...seatData, serveHistory: updatedServeHistory };
          updatedSeats[tableId][seatNumber] = updatedSeat;
          
          // Update expandedCard immediately with the updated serve history
          setExpandedCard(prev => ({
            ...prev,
            serveHistory: updatedServeHistory
          }));
          
          return updatedSeats;
        }
        
        return prev;
      });
      
    } else {
      // Regular table update
      const idx = rows.findIndex(r => r.id === expandedCard.id);
      if (idx !== -1) {
        const updatedRows = [...rows];
        const updatedServeHistory = [...updatedRows[idx].serveHistory];
        if (updatedServeHistory[orderIndex] && updatedServeHistory[orderIndex].items) {
          updatedServeHistory[orderIndex] = {
            ...updatedServeHistory[orderIndex],
            items: updatedServeHistory[orderIndex].items.map((item, itemIdx) =>
              itemIdx === itemIndex ? { ...item, kitchenStatus } : item
            )
          };
        }
        updatedRows[idx] = {
          ...updatedRows[idx],
          serveHistory: updatedServeHistory
        };
        setRows(updatedRows);
        setExpandedCard(updatedRows[idx]);
      }
    }
  };

  // Update single item's served status in backend (SERVED when true, ORDERED when false)
  const markServeItemStatus = async (orderIndex, itemIndex, isServed) => {
    try {
      if (!expandedCard) return;
      const tableId = expandedCard.tableId || expandedCard.seat?.tableId || expandedCard.id;
      const seatId = (expandedCard.seat?.id ?? expandedCard.seatNumber)?.toString();
      if (!tableId || !seatId) return;

      // Check if we're on a PREPARATION task - update the preparation task instead of serve task
      const isPreparationTask = expandedCard.currentTask?.type === 'PREPARATION' || expandedCard.currentTask?.id === 'preparation';
      
      if (isPreparationTask && expandedCard.currentTaskUuid) {
        // Update preparation task's orderItems
        const allItems = expandedCard.extensionsData?.orderItems || [];
        
        // Group items by orderTimestamp (same logic as newGetServeOrders)
        const groups = new Map();
        for (const it of allItems) {
          const ts = it.orderTimestamp || 'UNKNOWN';
          if (!groups.has(ts)) groups.set(ts, []);
          groups.get(ts).push(it);
        }
        const sortedTimestamps = Array.from(groups.keys()).sort((a, b) => {
          if (a === 'UNKNOWN') return 1;
          if (b === 'UNKNOWN') return -1;
          return new Date(a).getTime() - new Date(b).getTime();
        });
        const tsKey = sortedTimestamps[orderIndex];
        const targetGroup = groups.get(tsKey) || [];
        const target = targetGroup[itemIndex];
        if (!target) return;

        // Find the item in the flat list
        const idx = allItems.findIndex(it => 
          (it.orderTimestamp || 'UNKNOWN') === (target.orderTimestamp || 'UNKNOWN') && 
          it.id === target.id
        );
        if (idx === -1) return;

        const updatedItems = [...allItems];
        updatedItems[idx] = {
          ...updatedItems[idx],
          orderStatus: isServed ? 'PREPARED' : 'ORDERED',
          served: !!isServed,
          kitchenStatus: isServed ? 'Ready' : (updatedItems[idx].kitchenStatus || 'Preparing')
        };

        // Get current task to preserve status and workflow metadata
        let currentTask = null;
        try {
          const existingTask = await taskService.getTaskById(expandedCard.currentTaskUuid);
          currentTask = existingTask?.taskDTO;
        } catch (e) {
          console.warn('Could not fetch existing task for status preservation');
        }

        // Preserve current status (don't change to IN_PROGRESS - status should only change to COMPLETED when clicking Next Task)
        // CRITICAL: Backend creates workflow tasks with status: "COMPLETED"
        // If task has workflow state, it MUST use COMPLETED status (backend requirement)
        let currentStatus;
        
        // Check if this is a workflow task (has workflow.current_state)
        const hasWorkflowState = currentTask?.extensionsData?.workflow?.current_state || 
                                expandedCard.extensionsData?.workflow?.current_state;
        
        if (hasWorkflowState) {
          // This is a backend-created workflow task - MUST use COMPLETED status
          // Backend workflow tasks are always created with COMPLETED status
          currentStatus = 'COMPLETED';
          console.log('[Mark Item Prepared] Workflow task detected - using COMPLETED status');
        } else {
          // Not a workflow task - preserve existing status
          currentStatus = currentTask?.status || 
                         (currentTask?.extensionsData?.task_status === 'COMPLETED' ? 'COMPLETED' : 'ACTIVE') ||
                         (expandedCard.extensionsData?.task_status === 'COMPLETED' ? 'COMPLETED' : 'ACTIVE');
        }
        
        console.log('[Mark Item Prepared] Final status:', currentStatus, 'Has workflow state:', !!hasWorkflowState);
        const workflowData = currentTask?.extensionsData?.workflow || expandedCard.extensionsData?.workflow;

        // Helper to convert dueAt to ISO string
        const formatDueAt = (dueAt) => {
          if (!dueAt) return '2025-12-31T15:00:00';
          if (typeof dueAt === 'string') return dueAt;
          if (Array.isArray(dueAt)) {
            const [year, month, day, hour = 15, minute = 0] = dueAt;
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
          }
          if (dueAt instanceof Date) return dueAt.toISOString();
          return '2025-12-31T15:00:00';
        };

        // Update the preparation task - only update orderItems, preserve status and workflow
        await updateFullTask(expandedCard.currentTaskUuid, {
          title: currentTask?.title || expandedCard.currentTask?.name || 'preparation',
          description: currentTask?.description || expandedCard.currentTask?.name || 'Order Preparation',
          status: currentStatus, // Preserve current status - don't change it here
          dueAt: formatDueAt(currentTask?.dueAt),
          extensionsData: {
            ...(currentTask?.extensionsData || expandedCard.extensionsData || {}),
            orderItems: updatedItems,
            workflow: workflowData // Preserve workflow metadata
          }
        });

        // Update expandedCard immediately with new items (optimistic update)
        setExpandedCard(prev => ({
          ...prev,
          extensionsData: {
            ...(prev.extensionsData || {}),
            orderItems: updatedItems
          }
        }));

        // Refresh tasks and update expandedCard with backend data
        await refreshTasksForTable(tableId);
        const updatedTasks = await fetchActiveTasks(tableId);
        const updatedPrepTask = updatedTasks.find(t => t.taskUuid === expandedCard.currentTaskUuid);
        if (updatedPrepTask) {
          setExpandedCard(prev => ({
            ...prev,
            extensionsData: updatedPrepTask.extensionsData
          }));
        }
        return;
      }

      // For SERVE tasks, use the existing logic
      const tasks = activeTasksForTable[tableId] || [];
      // Helper to check if task is active (ACTIVE or COMPLETED with workflow state)
      const isActiveTask = (t) => {
        const taskStatus = t.extensionsData?.task_status;
        return taskStatus === "ACTIVE" || 
               (taskStatus === "COMPLETED" && t.extensionsData?.workflow?.current_state);
      };
      const serveTask = tasks.find(t => t.title === 'serve' && t.extensionsData?.seat_id === seatId && isActiveTask(t))
        || tasks.find(t => t.title === 'serve' && t.extensionsData?.seat_id === seatId);
      if (!serveTask?.taskUuid) return;

      // Find the specific item inside extensionsData.orderItems using the same grouping logic as newGetServeOrders
      const allItems = Array.isArray(serveTask.extensionsData?.orderItems) ? [...serveTask.extensionsData.orderItems] : [];
      const groups = new Map();
      for (const it of allItems) {
        const ts = it.orderTimestamp || 'UNKNOWN';
        if (!groups.has(ts)) groups.set(ts, []);
        groups.get(ts).push(it);
      }
      const sortedTimestamps = Array.from(groups.keys()).sort((a, b) => {
        if (a === 'UNKNOWN') return 1;
        if (b === 'UNKNOWN') return -1;
        return new Date(a).getTime() - new Date(b).getTime();
      });
      const tsKey = sortedTimestamps[orderIndex];
      const targetGroup = groups.get(tsKey) || [];
      const target = targetGroup[itemIndex];
      if (!target) return;

      // Locate in the flat list by a robust predicate
      const idx = allItems.findIndex(it => (it.orderTimestamp || 'UNKNOWN') === (target.orderTimestamp || 'UNKNOWN') && it.id === target.id && (it.seatId || seatId) === (target.seatId || seatId));
      if (idx === -1) return;

      const updatedItems = [...allItems];
      updatedItems[idx] = {
        ...updatedItems[idx],
        orderStatus: isServed ? 'SERVED' : 'ORDERED',
        served: !!isServed
      };

      // Preserve current status and workflow metadata - don't change status when updating items
      const currentStatus = serveTask.status || serveTask.extensionsData?.task_status || 'ACTIVE';
      const workflowData = serveTask.extensionsData?.workflow;

      // Helper to convert dueAt to ISO string
      const formatDueAt = (dueAt) => {
        if (!dueAt) return '2025-12-31T15:00:00';
        if (typeof dueAt === 'string') return dueAt;
        if (Array.isArray(dueAt)) {
          const [year, month, day, hour = 15, minute = 0] = dueAt;
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
        }
        if (dueAt instanceof Date) return dueAt.toISOString();
        return '2025-12-31T15:00:00';
      };

      await updateFullTask(serveTask.taskUuid, {
        title: serveTask.title || 'serve',
        description: serveTask.description || 'Serve task',
        status: currentStatus, // Preserve current status - don't change it here
        dueAt: formatDueAt(serveTask.dueAt),
        extensionsData: {
          ...(serveTask.extensionsData || {}),
          orderItems: updatedItems,
          workflow: workflowData // Preserve workflow metadata
        }
      });

      await refreshTasksForTable(tableId);
    } catch (e) {
      console.error('Failed to update item serve status:', e);
    }
  };

  // Backwards-compatible helper
  const markServeItemAsServed = async (orderIndex, itemIndex) => markServeItemStatus(orderIndex, itemIndex, true);


  const calculateOrderTotal = () => {
    let total = 0;
    expandedCard?.serveHistory?.forEach(serve => {
      serve.items?.forEach(item => {
        const price = parseFloat(item.price.replace('$', ''));
        total += price * item.quantity;
      });
    });
    return total.toFixed(2);
  };

  const calculateSeatTotals = () => {
    const seatTotals = {};
    
    expandedCard?.serveHistory?.forEach(serve => {
      serve.items?.forEach(item => {
        const seatId = item.seatId;
        if (seatId) { // Process all items with their actual seatId
          const price = parseFloat(item.price.replace('$', ''));
          const itemTotal = price * item.quantity;
          
          if (!seatTotals[seatId]) {
            seatTotals[seatId] = 0;
          }
          seatTotals[seatId] += itemTotal;
        }
      });
    });
    
    // Format totals to 2 decimal places
    Object.keys(seatTotals).forEach(seatId => {
      seatTotals[seatId] = seatTotals[seatId].toFixed(2);
    });
    
    return seatTotals;
  };

  const getAllOrderedItems = () => {
    const allItems = [];
    
    // Get "All Seats" orders from expandedCard.serveHistory
    expandedCard?.serveHistory?.forEach(serve => {
      serve.items?.forEach(item => {
        if (item.seatId) { // Include all items with their actual seatId
          allItems.push({
            ...item,
            orderNumber: serve.orderNumber,
            timestamp: serve.timestamp,
            seatId: item.seatId
          });
        }
      });
    });
    
    // Get individual seat orders from tableSeats
    if (expandedCard?.selectedSeats && expandedCard?.tableId) {
      expandedCard.selectedSeats.forEach(seatNumber => {
        const seatData = tableSeats[expandedCard.tableId]?.[seatNumber];
        if (seatData?.serveHistory) {
          seatData.serveHistory.forEach(serve => {
            serve.items?.forEach(item => {
              allItems.push({
                ...item,
                orderNumber: serve.orderNumber,
                timestamp: serve.timestamp,
                seatId: seatNumber.toString()
              });
            });
          });
        }
      });
    }
    
    return allItems;
  };

  const statusBadgeClass = (status) => {
    switch (status) {
      case "In progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Close dropdown when clicking outside
  const handleClickOutside = (event) => {
    if (!event.target.closest('.status-dropdown')) {
      setShowStatusDropdown(false);
    }
    if (!event.target.closest('.table-dropdown')) {
      setShowTableDropdown(false);
    }
  };

  // Add event listener for clicking outside
  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Filter rows based on status
  const filteredRows = rows.filter(row => 
    statusFilter === "all" || row.status === statusFilter
  );

  const handleNextTask = async () => {
    if (!expandedCard) return;
    
    // If this is a seat-specific task with the new Order -> Serve flow
    if (expandedCard.seatNumber && expandedCard.currentTaskUuid) {
      const tableId = expandedCard.tableId;
      const seatNumber = expandedCard.seatNumber;
      const seatKey = `${tableId}-${seatNumber}`;
      
      try {
        // Check what task we're currently on
        const currentTaskType = expandedCard.currentTask.type || expandedCard.currentTask.id;
        
        if (currentTaskType === 'ORDER' || currentTaskType === 'order') {
          // For ORDER tasks, we need seatTaskUuid to create SERVE tasks
          const seatTaskUuid = seatTaskMapping[seatKey];
          
          if (!seatTaskUuid) {
            console.error('Seat task UUID not found for', seatKey);
            return;
          }
          // We're on Order task, create Serve task
          console.log('Creating Serve task after Order');
          
          // First, get the Order task to fetch its description
          let orderDescription = '';
          try {
            const orderTaskResponse = await taskService.getTaskById(expandedCard.currentTaskUuid);
            orderDescription = orderTaskResponse?.taskDTO?.description || '';
            console.log('Fetched order description:', orderDescription);
          } catch (error) {
            console.error('Error fetching order task:', error);
          }
          
          // Create Serve task
          const serveTaskKey = `${tableId}-${seatNumber}-Serve`;
          let serveTaskUuid = subTaskMapping[serveTaskKey];
          
          if (!serveTaskUuid) {
            // Include order description in the Serve task description
            const serveDescription = orderDescription 
              ? `Serve: ${orderDescription}` 
              : `Serve items for Seat ${seatNumber - 1}`;
            
            serveTaskUuid = await createSubTask(
              seatTaskUuid,
              `Serve - Seat ${seatNumber - 1}`,
              serveDescription,
              'SERVE',
              {
                seatNumber: seatNumber,
                tableId: tableId,
                taskType: 'SERVE',
                orderDetails: orderDescription
              }
            );
            
            setSubTaskMapping(prev => ({
              ...prev,
              [serveTaskKey]: serveTaskUuid
            }));
            
            console.log('Serve task created:', serveTaskUuid);
          }
          
          // Update expanded card to show Serve task
          setExpandedCard(prev => ({
            ...prev,
            currentTask: {
              id: "serve",
              name: "Serve",
              type: "SERVE"
            },
            currentTaskUuid: serveTaskUuid,
            orderDescription: orderDescription
          }));
          
          // Hide menu, show serve interface
          setShowMenu(false);
          
        } else if (currentTaskType === 'SERVE' || currentTaskType === 'serve' || currentTaskType === 'PREPARATION' || currentTaskType === 'preparation') {
          // We're on Serve or Preparation task - mark as COMPLETED to advance workflow
          // Backend will create the next task (order_serving or payment_collection) based on workflow config
          console.log('Marking current task as COMPLETED to advance workflow');
          
          try {
            // Get current task to preserve workflow metadata
            let currentTask = null;
            try {
              const existingTask = await taskService.getTaskById(expandedCard.currentTaskUuid);
              currentTask = existingTask?.taskDTO;
            } catch (e) {
              console.warn('Could not fetch existing task for workflow metadata');
            }
            
            // Preserve workflow metadata
            const workflowData = currentTask?.extensionsData?.workflow || buildWorkflowMetadata("order_preparation").workflow;
            
            // Helper to convert dueAt to ISO string (handles array, Date, or string)
            const formatDueAt = (dueAt) => {
              if (!dueAt) return '2025-12-31T15:00:00';
              if (typeof dueAt === 'string') return dueAt;
              if (Array.isArray(dueAt)) {
                // Array format: [2025, 12, 31, 15, 0] -> ISO string
                const [year, month, day, hour = 15, minute = 0] = dueAt;
                return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
              }
              if (dueAt instanceof Date) return dueAt.toISOString();
              return '2025-12-31T15:00:00';
            };
            
            // Update task to COMPLETED
            // Backend requires title and dueAt to be present (not null)
            const updateData = {
              title: currentTask?.title || expandedCard.currentTask?.name || 'Order Preparation',
              description: currentTask?.description || expandedCard.currentTask?.name || 'Order Preparation',
              status: "COMPLETED",
              dueAt: formatDueAt(currentTask?.dueAt),
              extensionsData: {
                ...(currentTask?.extensionsData || {}),
                task_status: "COMPLETED",
                workflow: workflowData
              }
            };
            
            await updateFullTask(expandedCard.currentTaskUuid, updateData);
            console.log('Task marked as COMPLETED. Backend should advance workflow.');
            
            const seatId = seatNumber.toString();
            
            // Find the next task based on workflow state
            // After order_preparation, should be order_serving
            // After order_serving, should be payment_collection (per YAML workflow)
            const currentState = currentTask?.extensionsData?.workflow?.current_state;
            const nextState = currentState === 'order_preparation' ? 'order_serving' : 
                            currentState === 'order_serving' ? 'payment_collection' : null;
            
            // Find the next task - prioritize the exact next state
            // IMPORTANT: Don't select the current task - exclude it by UUID
            const currentTaskUuid = expandedCard.currentTaskUuid;
            
            // Retry logic to find the next task created by backend (especially for payment_collection)
            const findNextTaskWithRetry = async (retries = 5, delay = 1500) => {
              for (let i = 0; i < retries; i++) {
                console.log(`[Workflow] Attempting to find ${nextState} task (attempt ${i + 1}/${retries})...`);
                
                await refreshTasksForTable(tableId);
                const refreshedTasks = await fetchActiveTasks(tableId);
                
                // Find the exact next state task (excluding current task)
                const foundTask = refreshedTasks.find(t => 
                  t.taskUuid !== currentTaskUuid && // Don't select the current task
                  t.extensionsData?.seat_id === seatId &&
                  t.extensionsData?.workflow?.current_state === nextState
                );
                
                if (foundTask) {
                  console.log(`[Workflow] ✅ Found ${nextState} task on attempt ${i + 1}:`, foundTask.taskUuid);
                  return foundTask;
                }
                
                // Log available tasks for debugging
                const availableTasks = refreshedTasks.filter(t => 
                  t.extensionsData?.seat_id === seatId &&
                  t.extensionsData?.workflow?.current_state
                );
                console.log(`[Workflow] Available tasks for seat ${seatId} (attempt ${i + 1}):`, availableTasks.map(t => ({
                  uuid: t.taskUuid,
                  state: t.extensionsData?.workflow?.current_state,
                  title: t.title
                })));
                
                if (i < retries - 1) {
                  await new Promise(resolve => setTimeout(resolve, delay));
                }
              }
              return null;
            };
            
            // Try to find the next task with retry logic
            let nextTask = null;
            if (nextState) {
              nextTask = await findNextTaskWithRetry();
            }
            
            if (nextTask) {
              // Check if this task was created by backend
              const taskCreatedAt = nextTask.createdAt || nextTask.created_at;
              const isBackendCreated = taskCreatedAt && new Date(taskCreatedAt) > new Date(Date.now() - 10000); // Within 10 seconds
              
              if (isBackendCreated) {
                console.log(`[Workflow] ✅✅✅ BACKEND WORKFLOW AUTOMATION WORKING! ✅✅✅`);
                console.log(`[Workflow] Backend automatically created ${nextState} task:`, nextTask.taskUuid);
                console.log(`[Workflow] Task created at:`, taskCreatedAt);
              } else {
                console.log(`[Workflow] ✅ Found ${nextState} task (may be from previous session)`);
              }
              
              const taskType = nextTask.extensionsData?.workflow?.current_state === 'payment_collection' ? 'BILL' : 'SERVE';
              const taskName = nextTask.extensionsData?.workflow?.current_state === 'payment_collection' ? 'Payment Collection' : 'Order Serving';
              
              setExpandedCard(prev => ({
              ...prev,
                currentTask: {
                  id: nextTask.extensionsData?.workflow?.current_state === 'payment_collection' ? 'bill' : 'serve',
                  name: taskName,
                  type: taskType
                },
                currentTaskUuid: nextTask.taskUuid,
                workflowState: nextTask.extensionsData?.workflow?.current_state,
                extensionsData: nextTask.extensionsData
              }));
              
              // Hide menu for payment_collection, show for order_serving
              if (nextTask.extensionsData?.workflow?.current_state === 'payment_collection') {
                setShowMenu(false);
              }
              
              console.log(`[Workflow] ✅ Switched to ${taskName} task (${nextTask.extensionsData?.workflow?.current_state}):`, nextTask.taskUuid);
              console.log(`[Workflow] Next task state:`, nextTask.extensionsData?.workflow?.current_state);
              console.log(`[Workflow] Next task title:`, nextTask.title);
              return; // Exit early - we've found and switched to the next task
            } else if (nextState) {
              // Backend didn't create the task - create it manually as fallback
              console.log(`[Workflow] ⚠️ FRONTEND FALLBACK: Backend didn't create ${nextState} task. Creating manually...`);
              console.log(`[Workflow] ⚠️ Backend workflow automation is NOT working - using frontend fallback`);
              try {
                const parentTaskUuid = currentTask?.extensionsData?.subtask_of || tableTaskMapping[tableId];
                const workflowMetadata = buildWorkflowMetadata(nextState);
                
                const nextTaskData = {
                  requestContext: parentTaskUuid ? { parentTaskUuid } : {},
                  title: nextState === 'order_serving' ? 'serve' : 'bill',
                  description: nextState === 'order_serving' ? `Order Serving - Seat ${seatId}` : `Bill Issuance - Seat ${seatId}`,
                  assigneeInfo: ASSIGNEE_INFO,
                  dueAt: '2024-12-31T15:00:00',
                  extensionsData: {
                    seat_id: seatId,
                    table_id: tableId,
                    task_status: 'ACTIVE',
                    status: 'pending',
                    priority: 'HIGH',
                    project: 'Nucleus',
                    phase: 'planning',
                    subtask_of: parentTaskUuid,
                    orderItems: currentTask?.extensionsData?.orderItems || [], // Copy orderItems
                    ...workflowMetadata
                  }
                };
                
                const nextTaskResponse = await taskService.createTask(nextTaskData);
                if (nextTaskResponse?.taskUuid) {
                  console.log(`[Workflow] ⚠️ FRONTEND FALLBACK: Successfully created ${nextState} task manually:`, nextTaskResponse.taskUuid);
                  console.log(`[Workflow] This means backend workflow system did NOT create the task automatically`);
                  
                  await refreshTasksForTable(tableId);
                  const newTasks = await fetchActiveTasks(tableId);
                  const newNextTask = newTasks.find(t => t.taskUuid === nextTaskResponse.taskUuid);
                  
                  if (newNextTask) {
                    const taskType = nextState === 'payment_collection' ? 'BILL' : 'SERVE';
                    const taskName = nextState === 'payment_collection' ? 'Payment Collection' : 'Order Serving';
                    
                    setExpandedCard(prev => ({
                      ...prev,
                      currentTask: {
                        id: nextState === 'payment_collection' ? 'bill' : 'serve',
                        name: taskName,
                        type: taskType
                      },
                      currentTaskUuid: newNextTask.taskUuid,
                      workflowState: newNextTask.extensionsData?.workflow?.current_state,
                      extensionsData: newNextTask.extensionsData
                    }));
                    
                    // Hide menu for payment_collection
                    if (nextState === 'payment_collection') {
                      setShowMenu(false);
                    }
                    
                    console.log(`[Workflow] ⚠️ FRONTEND FALLBACK: Switched to ${taskName} task:`, newNextTask.taskUuid);
                    return; // Exit early - we've created and switched to the next task
                  }
                }
              } catch (createError) {
                console.error(`[Workflow] Failed to create ${nextState} task manually:`, createError);
                // Fallback to bill issuance if serving task creation fails
                if (nextState === 'order_serving') {
                  await handleBillIssuance();
                }
              }
            } else {
              // If no next task found and no next state, might be at end of workflow - show bill issuance
              await handleBillIssuance();
            }
          } catch (error) {
            console.error('Error advancing workflow:', error);
          }
          
        } else if (currentTaskType === 'BILL' || currentTaskType === 'bill') {
          // Already at bill issuance - payment should be handled separately
          console.log('At bill issuance - payment should be handled via payment flow');
        } else {
          // Default fallback - close or return to seats
          setShowSeatPageView(true);
          setExpandedCard(null);
        }
        
      } catch (error) {
        console.error('Error in handleNextTask:', error);
      }
      
      return;
    }
    
    // Old flow for seats without currentTaskUuid (backward compatibility)
    if (expandedCard.seatNumber) {
      const tableId = expandedCard.tableId;
      const seatNumber = expandedCard.seatNumber;
      const seatKey = `${tableId}-${seatNumber}`;
      const seatTaskUuid = seatTaskMapping[seatKey];
      
      if (!seatTaskUuid) {
        console.error('Seat task UUID not found for', seatKey);
        return;
      }
      
      try {
        const currentStatus = expandedCard.currentTask.currentStatus;
        const backendStatus = TASK_STATUS_MAPPING[currentStatus] || 'IN_PROGRESS';
        await updateTaskStatusAPI(seatTaskUuid, backendStatus);
        
        setTableSeats(prev => {
          const updatedSeats = { ...prev };
          const seatData = updatedSeats[tableId]?.[seatNumber];
          
          if (!seatData) return prev;
          
          if (canProceedToNextTask()) {
            const nextTaskIndex = seatData.currentTaskIndex + 1;
            const nextTask = taskFlow[nextTaskIndex];
            
            const subTaskKey = `${tableId}-${seatNumber}-${nextTask.name}`;
            
            if (!subTaskMapping[subTaskKey]) {
              createSubTask(
                seatTaskUuid, 
                nextTask.name, 
                `Task: ${nextTask.name} for Seat ${seatNumber}`, 
                nextTask.name.replace(/ /g, '_').toUpperCase(),
                {
                  seatNumber: seatNumber,
                  tableId: tableId,
                  taskFlowIndex: nextTaskIndex
                }
              )
                .then(subTaskUuid => {
                  setSubTaskMapping(prev => ({
                    ...prev,
                    [subTaskKey]: subTaskUuid
                  }));
                })
                .catch(error => console.error('Error creating sub-task:', error));
            }
            
            updatedSeats[tableId][seatNumber] = {
              ...seatData,
              currentTaskIndex: nextTaskIndex,
              currentTask: {
                ...nextTask,
                currentStatus: nextTask.statusOptions[0] || "Pending"
              }
            };
          }
          
          return updatedSeats;
        });
        
        setExpandedCard(prev => {
          if (canProceedToNextTask()) {
            const nextTaskIndex = prev.currentTaskIndex + 1;
            const nextTask = taskFlow[nextTaskIndex];
            
            return {
              ...prev,
              currentTaskIndex: nextTaskIndex,
              currentTask: {
                ...nextTask,
                currentStatus: "Pending"
              }
            };
          }
          return prev;
        });
        
      } catch (error) {
        console.error('Error updating task status:', error);
      }
      
      return;
    }
    
    // All seats (including seat ID 1 "All Seats") now use the same individual seat logic
    // Removed special "All Seats" handling - seat ID 1 follows same flow as other seats
    
    // Original logic for non-seat tasks
    const currentIndex = rows.findIndex(row => row.id === expandedCard.id);
    if (currentIndex === -1) return;
    
    const updatedRows = [...rows];
    const currentRow = updatedRows[currentIndex];
    
    // If we are in Serve and user requested Order More, go to Order instead of Pre Meal
    if (currentRow.currentTask.id === "4" && orderMoreSelected) {
      currentRow.currentTaskIndex = 2; // Order index
      currentRow.currentTask = { ...taskFlow[2] };
      setOrderMoreSelected(false); // reset flag after jumping
      currentRow.status = "Pending";
      // Preserve serve history when moving to Order
    } else {
      // Move to next task in flow
      if (currentRow.currentTaskIndex < taskFlow.length - 1) {
        currentRow.currentTaskIndex++;
        currentRow.currentTask = { ...taskFlow[currentRow.currentTaskIndex] };
        currentRow.status = "Pending";
        // Preserve serve history when moving to next task
      } else {
        // Reset to first task after payment
        currentRow.currentTaskIndex = 0;
        currentRow.currentTask = { ...taskFlow[0] };
        currentRow.status = "Pending";
        // Clear serve history when resetting to first task
        currentRow.serveHistory = [];
      }
    }
    
    // Reset payment state when moving to next task
    setIsPaid(false);
    setSelectedPaymentMethod(null);
    
    // Update the rows state
    setRows(updatedRows);
    // Update the expanded card with new task info
    setExpandedCard(updatedRows[currentIndex]);
  };

  const updateTaskStatus = async (tableId, newStatus, serveIndex = null) => {
    // If this is a seat-specific task, update the individual seat data
    if (expandedCard && expandedCard.seatNumber) {
      const seatNumber = expandedCard.seatNumber;
      const seatKey = `${tableId}-${seatNumber}`;
      const seatTaskUuid = seatTaskMapping[seatKey];
      
      try {
        // Update task status via API
        if (seatTaskUuid) {
          const backendStatus = TASK_STATUS_MAPPING[newStatus] || 'ACTIVE';
          await updateTaskStatusAPI(seatTaskUuid, backendStatus);
        }
      } catch (error) {
        console.error('Error updating task status:', error);
      }
      
      setTableSeats(prev => {
        const updatedSeats = { ...prev };
        const seatData = updatedSeats[tableId]?.[seatNumber];
        
        if (!seatData) return prev;
        
        updatedSeats[tableId][seatNumber] = {
          ...seatData,
          currentTask: {
            ...seatData.currentTask,
            currentStatus: newStatus,
            ...(seatData.currentTask.id === "4" && { serveStatus: newStatus })
          }
        };
        
        return updatedSeats;
      });
      
      // Update the expanded card
      setExpandedCard(prev => ({
        ...prev,
        currentTask: {
          ...prev.currentTask,
          currentStatus: newStatus,
          ...(prev.currentTask.id === "4" && { serveStatus: newStatus })
        }
      }));
      
      return;
    }
    
    // Original logic for non-seat tasks (All Seats case)
    try {
      // Update All Seats task status via API
      const allSeatsKey = `${tableId}-0`; // All Seats is seat 0
      const allSeatsTaskUuid = seatTaskMapping[allSeatsKey];
      
      if (allSeatsTaskUuid) {
        const backendStatus = TASK_STATUS_MAPPING[newStatus] || 'ACTIVE';
        await updateTaskStatusAPI(allSeatsTaskUuid, backendStatus);
      }
    } catch (error) {
      console.error('Error updating All Seats task status:', error);
    }
    
    const updatedRows = rows.map(row => {
      if (row.id === tableId) {
        const updatedRow = {
          ...row,
          currentTask: {
            ...row.currentTask,
            currentStatus: newStatus,
            ...(row.currentTask.id === "4" && { serveStatus: newStatus })
          }
        };
        
        // If this is a serve status update, track in serve history
        if (row.currentTask.id === "4") {
          // If updating a specific serve status from history
          if (serveIndex !== null) {
            updatedRow.serveHistory = [...row.serveHistory];
            if (updatedRow.serveHistory[serveIndex]) {
              updatedRow.serveHistory[serveIndex].status = newStatus;
            }
          } else {
            // This is updating the current serve status - find the latest order and update it
            if (updatedRow.serveHistory.length > 0) {
              const latestOrderIndex = updatedRow.serveHistory.length - 1;
              updatedRow.serveHistory = [...row.serveHistory];
              updatedRow.serveHistory[latestOrderIndex].status = newStatus;
            }
          }
        }
        
        return updatedRow;
      }
      return row;
    });
    setRows(updatedRows);
    
    // Update expanded card if it's the current one
    if (expandedCard && expandedCard.id === tableId) {
      const updatedCard = updatedRows.find(row => row.id === tableId);
      setExpandedCard(updatedCard);
    }
  };

  const addComment = () => {
    const value = newComment.trim();
    if (!value) return;
    setComments(prev => [...prev, { id: Date.now(), text: value }]);
    setNewComment("");
  };

  // Consolidated task colors function
  const getTaskColors = (taskId) => {
    const colors = {
      "1": { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
      "2": { bg: "bg-green-100", text: "text-green-800", border: "border-green-200" },
      "3": { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200" },
      "4": { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200" },
      "5": { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200" },
      "6": { bg: "bg-red-100", text: "text-red-800", border: "border-red-200" }
    };
    return colors[taskId] || { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-200" };
  };

  // Table background class function
  const getTableBackgroundClass = (taskId) => {
    switch (taskId) {
      case "1": return "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-blue-200/50";
      case "2": return "bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-green-200/50";
      case "3": return "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-orange-200/50";
      case "4": return "bg-gradient-to-br from-red-50 to-red-100 border-red-200 hover:shadow-red-200/50";
      case "5": return "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-blue-200/50";
      case "6": return "bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-green-200/50";
      default: return "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 hover:shadow-gray-200/50";
    }
  };

  useEffect(() => {
    if (showComments) {
      // focus the input when comments panel opens
      setTimeout(() => commentInputRef.current && commentInputRef.current.focus(), 0);
    }
  }, [showComments, expandedCard]);

  return (
    <div className="mx-auto max-w-screen-md md:max-w-screen-2xl space-y-0 min-h-0 text-sm md:text-base">
      {!expandedCard && (
        <div className="sticky top-0 z-40 bg-blue-500 border-b border-blue-600">
          <div className="h-14 px-3 md:px-4 flex items-center justify-between">
            <button aria-label="Menu" className="h-11 w-11 rounded-xl border border-blue-400 bg-blue-400 hover:bg-blue-300 flex items-center justify-center active:scale-95 transition">
              <Menu className="h-5 w-5 text-white" />
            </button>
            <div className="flex items-center gap-2 mb-2">
              <button aria-label="Notifications" className="h-11 w-11 rounded-xl border border-blue-400 bg-blue-400 hover:bg-blue-300 flex items-center justify-center active:scale-95 transition">
                <Bell className="h-5 w-5 text-white" />
              </button>
              <button aria-label="Profile" className="h-11 w-11 rounded-xl border border-blue-400 bg-blue-400 hover:bg-blue-300 flex items-center justify-center active:scale-95 transition">
                <User className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-3 md:px-4 py-3">
        {/* Clear All Tables Button */}
        {!expandedCard && !showSeatPageView && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={clearAllTableStates}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 active:scale-95 transition-all duration-200 font-medium shadow-md"
            >
              Clear All Tables
            </button>
                      </div>
                    )}
        
        {/* Cards Grid */}
        {!expandedCard && !showSeatPageView && (
          <TableGrid
            rows={rows}
            filteredRows={filteredRows}
            activeTasksForTable={activeTasksForTable}
            onTableClick={handleTableClick}
          />
        )}
      {expandedCard && expandedCard.type === "bar" && (
        <div className="w-full h-[100dvh]">
          <div className="mx-auto h-full max-w-none md:max-w-6xl rounded-xl md:rounded-2xl border-2 border-gray-200 shadow-2xl bg-gradient-to-br from-white to-gray-50 overflow-hidden flex flex-col">
            {/* Bar Table Header */}
            <div className="p-3 md:p-4 border-b-2 border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50 relative text-xs">
              {/* Close */}
              <button
                onClick={() => {
                  setExpandedCard(null);
                  setActiveOrderTab("1");
                  setShowMenu(false);
                  setShowCart(false);
                  setShowComments(false);
                }}
                className="absolute top-3 right-3 md:top-4 md:right-4 h-9 w-9 rounded-xl border-2 border-red-200 bg-red-50 hover:bg-red-100 active:scale-95 flex items-center justify-center transition-all duration-200 shadow-md"
                aria-label="Close"
              >
                <X className="h-4 w-4 text-red-600" />
              </button>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-purple-800">Bar Table Management</h2>
                  <p className="text-sm text-purple-600">Manage individual seats at the bar</p>
                </div>
                <div className="flex items-center gap-2">
                  <select className="px-3 py-2 rounded-lg border-2 border-purple-300 bg-white text-sm font-medium outline-none focus:ring-2 focus:ring-purple-400">
                    <option>Seat 1</option>
                    <option>Seat 2</option>
                    <option>Seat 3</option>
                    <option>Seat 4</option>
                    <option>Seat 5</option>
                    <option>Seat 6</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bar Seats Grid */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {barSeats.map((seat) => {
                  // Enhanced color scheme based on task type
                  
                  const backgroundClass = getTableBackgroundClass(seat.currentTask.id);
                  
                  return (
                    <div 
                      key={seat.id} 
                      onClick={() => handleBarSeatClick(seat)}
                      className={`rounded-xl md:rounded-2xl border-2 p-4 md:p-6 space-y-3 md:space-y-4 ${backgroundClass} shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-200 cursor-pointer`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-foreground/60 font-medium">Seat ID</div>
                          <div className="font-mono font-bold text-lg text-gray-800">Seat {seat.id}</div>
                          {seat.selectedSeats && seat.selectedSeats.length > 0 && (
                            <div className="text-xs text-green-600 font-medium mt-1">
                              🪑 Seats {seat.selectedSeats.sort((a, b) => a - b).join(', ')}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-foreground/60 font-medium">Status</div>
                          <div className={`text-xs font-semibold px-2 py-1 rounded-md ${
                            seat.status === "Available" ? "bg-green-100 text-green-800" :
                            seat.status === "In Progress" ? "bg-blue-100 text-blue-800" :
                            seat.status === "Completed" ? "bg-green-100 text-green-800" :
                            "bg-yellow-100 text-yellow-800"
                          }`}>
                            {seat.status}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-foreground/60 font-medium">Current Task</span>
                          <span className="text-sm font-semibold text-gray-800">{seat.currentTask.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-foreground/60 font-medium">Time</span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-blue-600" />
                            <span className="text-sm font-medium text-gray-700">{seat.minutes} min</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-foreground/60 font-medium">Task Status</span>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-md ${
                            seat.currentTask.currentStatus === "Pending" ? "bg-yellow-100 text-yellow-800" :
                            seat.currentTask.currentStatus === "Completed" || seat.currentTask.currentStatus === "Served" || seat.currentTask.currentStatus === "Seated" || seat.currentTask.currentStatus === "Placed" || seat.currentTask.currentStatus === "Paid" ? "bg-green-100 text-green-800" :
                            "bg-blue-100 text-blue-800"
                          }`}>
                            {seat.currentTask.currentStatus}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-foreground/70">
                          <div className="flex items-center gap-2 bg-white/50 rounded-lg px-2 py-1">
                            <span className="text-xs font-medium text-gray-700">Task {seat.currentTask.id}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {expandedCard && expandedCard.type === "bar-seat" && (
        <div className="w-full h-[100dvh]">
          <div className="mx-auto h-full max-w-none md:max-w-5xl rounded-xl md:rounded-2xl border-2 border-gray-200 shadow-2xl bg-gradient-to-br from-white to-gray-50 overflow-hidden flex flex-col">
            {/* Bar Seat Header */}
            <div className="p-3 md:p-4 border-b-2 border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50 relative text-xs">
              <button
                onClick={() => {
                  setExpandedCard(null);
                  setSelectedBarSeat(null);
                  setActiveOrderTab("1");
                  setShowMenu(false);
                  setShowCart(false);
                  setShowComments(false);
                  // Return to seats page if we have a selected table for seats
                  if (selectedTableForSeats) {
                    setShowSeatPageView(true);
                  }
                }}
                className="absolute top-3 right-3 md:top-4 md:right-4 h-9 w-9 rounded-xl border-2 border-red-200 bg-red-50 hover:bg-red-100 active:scale-95 flex items-center justify-center transition-all duration-200 shadow-md"
                aria-label="Close"
              >
                <X className="h-4 w-4 text-red-600" />
              </button>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="bg-white/70 rounded-lg px-3 py-2 shadow-sm">
                      <div className="text-xs text-gray-600 font-medium">Table</div>
                      <div className="font-semibold text-sm text-gray-800">Table {expandedCard.tableId || expandedCard.seat?.tableId || 'N/A'}</div>
                    </div>
                    <div className="bg-white/70 rounded-lg px-3 py-2 shadow-sm">
                      <div className="text-xs text-gray-600 font-medium">Seat</div>
                      <div className="font-semibold text-sm text-gray-800">
                        {expandedCard.seat?.id === 99 ? 'All Seats' : `${expandedCard.seat?.id || expandedCard.seatNumber || 'N/A'}`}
                      </div>
                    </div>
                    <div className="bg-white/70 rounded-lg px-3 py-2 shadow-sm">
                      <div className="text-xs text-gray-600 font-medium">Task</div>
                      <div className="font-semibold text-sm text-gray-800">{expandedCard.seat.currentTask.name}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Content */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Menu Section */}
              {showMenu && (
                <div className="md:w-full border-b md:border-b-0 border-border/30 overflow-y-auto p-3 md:p-4">
                  {/* Single Seat Tab - Always shows the seat number */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-lg">
                      <button
                        className="px-3 py-2 rounded-md text-sm font-medium bg-white text-purple-600 shadow-sm"
                      >
                        Seat {expandedCard.seat.id}
                      </button>
                    </div>
                  </div>

                  {/* Menu Content */}
                  <div className="space-y-4">
                    {menuCategories.map((category) => (
                      <div key={category.title} className="space-y-2">
                        <h3 className="text-lg font-semibold text-foreground border-b border-border/30 pb-1">
                          {category.title}
                        </h3>
                        <div className="space-y-2">
                          {category.items.map((item) => {
                            const currentQuantity = newGetQuantityForItem(item.id, expandedCard.seat.id.toString());
                            
                            return (
                              <div key={item.id} className="rounded-lg border border-border/30 bg-background p-3 space-y-2">
                                <div className="flex items-start">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-foreground">{item.name}</h4>
                                    <p className="text-sm text-foreground/70">{item.description}</p>
                                    <p className="text-xs text-purple-600 font-medium mt-1">
                                      For Seat {expandedCard.seat.id}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between -mt-4">
                                  <p className="text-sm font-medium text-primary">{item.price}</p>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => newUpdateCartItem(item.id, -1, expandedCard.seat.id.toString())}
                                      className="h-7 w-7 rounded-full border border-border/50 bg-card hover:bg-muted flex items-center justify-center transition-colors"
                                      disabled={!currentQuantity}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </button>
                                    <span className="min-w-[1.5rem] text-center font-medium text-sm">
                                      {currentQuantity}
                                    </span>
                                    <button
                                      onClick={() => newUpdateCartItem(item.id, 1, expandedCard.seat.id.toString())}
                                      className="h-7 w-7 rounded-full border border-border/50 bg-card hover:bg-muted flex items-center justify-center transition-colors"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Section when menu is not shown */}
              {!showMenu && (
                <div className="flex-1 p-8 md:p-6 overflow-y-auto">
                  <div className="space-y-4">
                    {(expandedCard.seat.currentTask.id === "4" || expandedCard.currentTask?.id === "serve" || expandedCard.currentTask?.type === "SERVE" || expandedCard.currentTask?.type === "PREPARATION" || expandedCard.currentTask?.id === "preparation") ? (
                      <div className="space-y-4">
                        {/* Order Summary Header */}
                            <div className="text-center mb-4">
                          <h3 className="text-xl font-bold text-purple-800 bg-purple-100 px-4 py-2 rounded-lg">
                            {(expandedCard.currentTask?.type === "PREPARATION" || expandedCard.currentTask?.id === "preparation")
                              ? `Order Preparation - Seat ${expandedCard.seat.id}`
                              : `Order Summary - Seat ${expandedCard.seat.id}`}
                          </h3>
                            </div>
                            
                        {/* Order Items */}
                        {expandedCard.seat.serveHistory && expandedCard.seat.serveHistory.length > 0 ? (
                          <div className="space-y-3">
                            {expandedCard.seat.serveHistory.map((order, orderIndex) => (
                              <div key={orderIndex} className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200 p-4 shadow-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-bold text-purple-700">Order #{order.orderNumber}</span>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{order.timestamp}</span>
                                  </div>
                                  
                                  <div className="space-y-2">
                                  {order.items && order.items.map((item, itemIndex) => (
                                    <div key={itemIndex} className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm border border-purple-100">
                                      {/* Checkbox */}
                                          <input
                                            type="checkbox"
                                            checked={item.served || false}
                                            onChange={(e) => {
                                          newUpdateItemServed(orderIndex, itemIndex, e.target.checked);
                                        }}
                                        className="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                                      />
                                      
                                      {/* Item Name */}
                                          <div className="flex-1">
                                        <div className="font-medium text-gray-800">{item.name}</div>
                                            </div>
                                      
                                      {/* Seat Number */}
                                      <div className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-md">
                                        Seat {order.seatId}
                                            </div>
                                      
                                      {/* Quantity */}
                                      <div className="text-sm font-bold text-green-600 bg-green-100 px-2 py-1 rounded-md">
                                        Qty: {item.quantity}
                                          </div>
                                      
                                      {/* Kitchen Status */}
                                      <select
                                        value={item.kitchenStatus || "Preparing"}
                                        onChange={(e) => {
                                          newUpdateKitchenStatus(orderIndex, itemIndex, e.target.value);
                                        }}
                                        className="text-xs font-medium text-orange-600 bg-orange-100 border border-orange-300 rounded px-1 py-1 focus:ring-1 focus:ring-orange-400"
                                      >
                                        <option value="Preparing">Preparing</option>
                                        <option value="Prepared">Prepared</option>
                                        <option value="Ready">Ready</option>
                                      </select>
                                      
                                      {/* Price */}
                                      <div className="text-sm font-bold text-gray-800">
                                        {item.price}
                                        </div>
                                      
                                      {/* Served Status */}
                                        {item.served && (
                                          <div className="ml-2">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                              ✓ Served
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="text-gray-500 text-lg font-medium mb-2">No orders to serve</div>
                            <div className="text-gray-400 text-sm">Place an order first to see it here</div>
                          </div>
                        )}
                      </div>
                    ) : expandedCard.seat.currentTask.id === "6" ? (
                      <div className="w-full max-w-lg mx-auto">
                        <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 space-y-6 shadow-lg">
                          <div className="text-center">
                            <h2 className="text-lg font-bold text-gray-800 mb-2">Payment Summary - Seat {expandedCard.seat.id}</h2>
                          </div>

                          {/* Split Payment - Seat Tabs for Bar Seat */}
                                    {(() => {
                                      const allItems = [];
                                expandedCard.seat.serveHistory?.forEach(serve => {
                                        serve.items?.forEach(item => {
                                          allItems.push({
                                            ...item,
                                            orderNumber: serve.orderNumber,
                                            timestamp: serve.timestamp,
                                            seatId: item.seatId || expandedCard.seat.id.toString()
                                          });
                                        });
                                      });
                                
                                const itemsBySeat = {};
                                
                                allItems.forEach(item => {
                                  const seatId = item.seatId;
                                  if (seatId) { // Process all items with their actual seatId
                                    if (!itemsBySeat[seatId]) {
                                      itemsBySeat[seatId] = [];
                                    }
                                    itemsBySeat[seatId].push(item);
                                  }
                                      });
                                      
                                      const seatTotals = {};
                                      allItems.forEach(item => {
                                        const seatId = item.seatId;
                                  if (seatId) { // Process all items with their actual seatId
                                        const price = parseFloat(item.price.replace('$', ''));
                                        const itemTotal = price * item.quantity;
                                        
                                        if (!seatTotals[seatId]) {
                                          seatTotals[seatId] = 0;
                                        }
                                        seatTotals[seatId] += itemTotal;
                                  }
                                });
                                
                                const seatIds = Object.keys(itemsBySeat).sort((a, b) => {
                                  return parseInt(a) - parseInt(b);
                                      });
                                      
                                      return (
                                  <div className="space-y-4">
                                    {/* Seat Tabs */}
                                    <div className="flex flex-wrap gap-2">
                                      {seatIds.map(seatId => (
                                        <button
                                          key={seatId}
                                          onClick={() => setActiveOrderTab(seatId)}
                                          className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 font-medium text-sm ${
                                            activeOrderTab === seatId
                                              ? 'border-purple-400 bg-purple-50 text-purple-800 ring-2 ring-purple-200'
                                              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                          }`}
                                        >
                                          {`Seat ${seatId}`}
                                          {seatPaidStatus[seatId] && <span className="ml-1">✓</span>}
                                        </button>
                                      ))}
                                    </div>

                                    {/* Active Seat Payment */}
                                    {activeOrderTab && itemsBySeat[activeOrderTab] && (
                                        <div className="bg-white/70 rounded-lg p-4 shadow-sm border-2 border-purple-100">
                                        <div className="flex items-center justify-between mb-4">
                                          <h4 className="text-lg font-bold text-purple-600">
                                            {`🪑 Seat ${activeOrderTab}`}
                                          </h4>
                                          <div className="text-xl font-bold text-green-600">
                                            ${(seatTotals[activeOrderTab] || 0).toFixed(2)}
                                            </div>
                                            </div>

                                        {/* Items for this seat */}
                                        <div className="space-y-2 mb-4">
                                          {itemsBySeat[activeOrderTab].map((item, index) => {
                                              const itemTotal = (parseFloat(item.price.replace('$', '')) * item.quantity).toFixed(2);
                                              return (
                                                <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                                                  <div className="flex-1">
                                                    <div className="text-sm font-medium text-gray-800">{item.name}</div>
                                                    <div className="text-xs text-gray-500">Order {item.orderNumber} • {item.timestamp}</div>
                                                  </div>
                                                  <div className="text-right">
                                                    <div className="text-sm font-medium text-gray-800">x {item.quantity}</div>
                                                    <div className="text-sm font-bold text-green-600">${itemTotal}</div>
                                                  </div>
                                                </div>
                                              );
                                            })}
                              </div>

                                        {/* Payment Methods for this seat */}
                              <div className="space-y-3">
                                          <h5 className="text-sm font-semibold text-gray-700">Select Payment Method</h5>
                                {paymentMethods.map((method) => {
                                  const Icon = method.icon;
                                            const isSelected = seatPaymentMethods[activeOrderTab] === method.id;
                                  
                                  return (
                                    <button
                                      key={method.id}
                                                onClick={() => handleSeatPayment(activeOrderTab, method.id)}
                                                disabled={seatPaidStatus[activeOrderTab]}
                                                className={`w-full p-3 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 shadow-sm ${
                                        isSelected
                                          ? `border-purple-400 bg-purple-50 ring-2 ring-purple-200`
                                          : `border-gray-300 bg-white hover:bg-gray-50`
                                                } ${seatPaidStatus[activeOrderTab] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                      <div className={`p-2 rounded-lg ${method.color} text-white shadow-sm`}>
                                                  <Icon className="h-4 w-4" />
                                      </div>
                                      <div className="flex-1 text-left">
                                        <div className="font-semibold text-sm text-gray-800">{method.name}</div>
                                        <div className="text-xs text-gray-600">{method.description}</div>
                                      </div>
                                      {isSelected && (
                                                  <CheckCircle className="h-4 w-4 text-purple-600" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>

                                        {/* Pay Button for this seat */}
                              <button
                                          onClick={() => handlePayment(activeOrderTab)}
                                          disabled={!seatPaymentMethods[activeOrderTab] || seatPaidStatus[activeOrderTab]}
                                          className={`w-full py-3 px-4 rounded-xl font-bold transition-all duration-200 text-sm shadow-lg mt-4 ${
                                            seatPaidStatus[activeOrderTab]
                                    ? 'bg-green-500 text-white cursor-not-allowed'
                                    : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed'
                                }`}
                              >
                                          {seatPaidStatus[activeOrderTab] ? 'Paid ✓' : `Pay $${(seatTotals[activeOrderTab] || 0).toFixed(2)}`}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-foreground/60">Status:</span>
                          <select
                            value={expandedCard.seat.currentTask.currentStatus}
                            onChange={(e) => {
                              setBarSeats(prev => prev.map(seat => 
                                seat.id === expandedCard.seat.id 
                                  ? { ...seat, currentTask: { ...seat.currentTask, currentStatus: e.target.value } }
                                  : seat
                              ));
                              setSelectedBarSeat(prev => prev ? { ...prev, currentTask: { ...prev.currentTask, currentStatus: e.target.value } } : null);
                              // Update expanded card
                              setExpandedCard(prev => ({
                                ...prev,
                                seat: {
                                  ...prev.seat,
                                  currentTask: {
                                    ...prev.seat.currentTask,
                                    currentStatus: e.target.value
                                  }
                                }
                              }));
                            }}
                            className="px-2 py-1 rounded border border-border/50 bg-card text-xs outline-none focus:ring-1 focus:ring-primary/30"
                          >
                            {expandedCard.seat.currentTask.statusOptions.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Footer */}
            <div className="p-3 md:p-6 border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-purple-50">
              <div className="flex items-center gap-2">
                {(expandedCard.seat.currentTask.id === "4" || expandedCard.currentTask?.id === "serve" || expandedCard.currentTask?.type === "SERVE") && (
                  <button
                    onClick={handleOrderMoreClick}
                    className={`flex-1 h-8 md:h-11 px-3 md:px-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
                      orderMoreSelected 
                        ? 'border-green-400 bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className={`h-4 w-4 rounded border-2 flex items-center justify-center ${
                      orderMoreSelected 
                        ? 'border-green-500 bg-green-500' 
                        : 'border-gray-400 bg-white'
                    }`}>
                      {orderMoreSelected && (
                        <div className="h-2 w-2 rounded bg-white"></div>
                      )}
                    </div>
                    <span className="text-xs md:text-sm font-medium">Order More</span>
                              </button>
                )}
                {/* Menu toggle removed: menu shows by default for Order */}
                {showMenu && (
                  <button
                    onClick={() => setShowCart(true)}
                    className="flex-1 h-8 md:h-11 px-3 md:px-4 rounded-xl border-2 border-orange-300 bg-orange-50 hover:bg-orange-100 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
                  >
                    <ShoppingCart className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
                    <span className="text-xs md:text-sm font-medium text-orange-700">Cart</span>
                    {newGetTotalItems() > 0 && (
                      <span className="ml-1 h-5 min-w-[1.25rem] px-1 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                        {newGetTotalItems()}
                      </span>
                    )}
                  </button>
                )}
                {/* Next Task button removed in bar-seat footer - dead code removed */}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bar Seat Cart Bottom Sheet */}
      {(expandedCard && expandedCard.type === "bar-seat" && showMenu && showCart) && (
        <BarSeatCart
          expandedCard={expandedCard}
          open={true}
          onClose={() => setShowCart(false)}
          getCartItems={newGetCartItems}
          updateCartItem={newUpdateCartItem}
          cartNote={cartNote}
          setCartNote={setCartNote}
          onPlaceOrder={() => newPlaceOrder()}
        />
      )}

      {expandedCard && expandedCard.seatNumber && expandedCard.tableId && (
        <div className="w-full h-[100dvh]">
          <div className="mx-auto h-full max-w-none md:max-w-5xl rounded-xl md:rounded-2xl border-2 border-gray-200 shadow-2xl bg-gradient-to-br from-white to-gray-50 overflow-hidden flex flex-col">
            {/* Table Seat Header - Copy from Bar Seat */}
            <div className="p-3 md:p-4 border-b-2 border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50 relative text-xs">
              <button
                onClick={() => {
                  setExpandedCard(null);
                  // Return to seats page instead of main tables page
                  setShowSeatPageView(true);
                  setShowMenu(false);
                  setShowCart(false);
                  setShowComments(false);
                }}
                className="absolute top-3 right-3 md:top-4 md:right-4 h-9 w-9 rounded-xl border-2 border-red-200 bg-red-50 hover:bg-red-100 active:scale-95 flex items-center justify-center transition-all duration-200 shadow-md"
                aria-label="Close"
              >
                <X className="h-4 w-4 text-red-600" />
              </button>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="bg-white/70 rounded-lg px-3 py-2 shadow-sm">
                      <div className="text-xs text-gray-600 font-medium">Table</div>
                      <div className="font-semibold text-sm text-gray-800">{expandedCard.tableId}</div>
                    </div>
                    <div className="bg-white/70 rounded-lg px-3 py-2 shadow-sm">
                      <div className="text-xs text-gray-600 font-medium">Seat</div>
                      <div className="font-semibold text-sm text-gray-800">{expandedCard.seatNumber === 99 ? 'All Seats' : `${expandedCard.seatNumber}`}</div>
                    </div>
                    <div className="bg-white/70 rounded-lg px-3 py-2 shadow-sm">
                      <div className="text-xs text-gray-600 font-medium">Task</div>
                      <div className="font-semibold text-sm text-gray-800">{expandedCard.currentTask.name}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content - Copy from Bar Seat */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Menu Section */}
              {showMenu && (
                <div className="md:w-full border-b md:border-b-0 border-border/30 overflow-y-auto p-3 md:p-4">
                  {/* Single Seat Tab - Always shows the seat number */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-lg">
                      <button
                        className="px-3 py-2 rounded-md text-sm font-medium bg-white text-purple-600 shadow-sm"
                      >
                        Seat {expandedCard.seatNumber}
                      </button>
                    </div>
                  </div>

                  {/* Menu Content */}
                  <div className="space-y-4">
                    {menuCategories.map((category) => (
                      <div key={category.title} className="space-y-2">
                        <h3 className="text-lg font-semibold text-foreground border-b border-border/30 pb-1">
                          {category.title}
                        </h3>
                        <div className="space-y-2">
                          {category.items.map((item) => {
                            const currentQuantity = newGetQuantityForItem(item.id, expandedCard.seatNumber.toString());
                            
                            return (
                              <div key={item.id} className="rounded-lg border border-border/30 bg-background p-3 space-y-2">
                                <div className="flex items-start">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-foreground">{item.name}</h4>
                                    <p className="text-sm text-foreground/70">{item.description}</p>
                                    <p className="text-xs text-purple-600 font-medium mt-1">
                                      For Seat {expandedCard.seatNumber}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between -mt-4">
                                  <p className="text-sm font-medium text-primary">{item.price}</p>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => newUpdateCartItem(item.id, -1, expandedCard.seatNumber.toString())}
                                      className="h-7 w-7 rounded-full border border-border/50 bg-card hover:bg-muted flex items-center justify-center transition-colors"
                                      disabled={!currentQuantity}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </button>
                                    <span className="min-w-[1.5rem] text-center font-medium text-sm">
                                      {currentQuantity}
                                    </span>
                                    <button
                                      onClick={() => newUpdateCartItem(item.id, 1, expandedCard.seatNumber.toString())}
                                      className="h-7 w-7 rounded-full border border-border/50 bg-card hover:bg-muted flex items-center justify-center transition-colors"
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Section when menu is not shown */}
              {!showMenu && (
                <div className="flex-1 p-8 md:p-6 overflow-y-auto">
                  <div className="space-y-4">
                    {/* Show Order Description for Serve Task */}
                    {(expandedCard.currentTask.type === 'SERVE' || expandedCard.currentTask.type === 'serve') && expandedCard.orderDescription ? (
                      <div className="space-y-4">
                        {/* Serve Task Header */}
                        <div className="text-center mb-4">
                          <h3 className="text-2xl font-bold text-green-800 bg-green-100 px-6 py-3 rounded-lg">
                            Serve - Seat {expandedCard.seatNumber - 1}
                          </h3>
                        </div>
                        
                        {/* Order Details */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 p-6 shadow-lg">
                          <h4 className="text-lg font-semibold text-green-800 mb-3">Order Details:</h4>
                          <div className="bg-white rounded-lg p-4 text-gray-800">
                            <p className="whitespace-pre-wrap text-base">{expandedCard.orderDescription}</p>
                          </div>
                        </div>
                        
                        {/* Serve Instructions */}
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <p className="text-sm text-blue-800 font-medium">
                            📋 Please serve the items listed above to Seat {expandedCard.seatNumber - 1}
                          </p>
                        </div>
                        
                        {/* Next Task Button */}
                        <div className="pt-4">
                          <button
                            onClick={handleNextTask}
                            className="w-full bg-green-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:bg-green-700 active:scale-95 transition shadow-lg"
                          >
                            Mark as Served & Continue to Payment
                          </button>
                        </div>
                      </div>
                    ) : (expandedCard.currentTask.id === "4" || expandedCard.currentTask.id === "serve" || expandedCard.currentTask.type === "SERVE" || expandedCard.workflowState === 'order_serving' || expandedCard.currentTask.type === "PREPARATION" || expandedCard.currentTask.id === "preparation") ? (
                      <div className="space-y-4">
                        {/* Order Summary Header */}
                        <div className="text-center mb-4">
                          <h3 className="text-xl font-bold text-purple-800 bg-purple-100 px-4 py-2 rounded-lg">
                            {expandedCard.currentTask.type === "PREPARATION" || expandedCard.currentTask.id === "preparation" 
                              ? `Order Preparation - Seat ${expandedCard.seatNumber}` 
                              : `Order Summary - Seat ${expandedCard.seatNumber}`}
                          </h3>
                        </div>
                        
                        {/* Order Items */}
                        {newGetServeOrders().length > 0 ? (
                          <div className="space-y-3">
                            {newGetServeOrders().map((order, orderIndex) => (
                              <div key={orderIndex} className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200 p-4 shadow-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-bold text-purple-700">Order #{order.orderNumber}</span>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{order.timestamp}</span>
                                </div>
                                
                                <div className="space-y-2">
                                  {order.items && order.items.map((item, itemIndex) => (
                                    <div key={itemIndex} className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm border border-purple-100">
                                      {/* Checkbox */}
                                      <input
                                        type="checkbox"
                                        checked={item.served || false}
                                        onChange={async (e) => {
                                          const isChecked = e.target.checked;
                                          newUpdateItemServed(orderIndex, itemIndex, isChecked);
                                          await markServeItemStatus(orderIndex, itemIndex, isChecked);
                                        }}
                                        className="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                                      />
                                      
                                      {/* Item Name */}
                                      <div className="flex-1">
                                        <div className="font-medium text-gray-800">{item.name}</div>
                                      </div>
                                      
                                      {/* Seat Number */}
                                      <div className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-md">
                                        Seat {expandedCard.seat?.id || expandedCard.seatNumber}
                                      </div>
                                      
                                      {/* Quantity */}
                                      <div className="text-sm font-bold text-green-600 bg-green-100 px-2 py-1 rounded-md">
                                        Qty: {item.quantity}
                                      </div>
                                      
                                      {/* Kitchen Status */}
                                      <select
                                        value={item.kitchenStatus || "Preparing"}
                                        onChange={(e) => {
                                          newUpdateKitchenStatus(orderIndex, itemIndex, e.target.value);
                                        }}
                                        className="text-xs font-medium text-orange-600 bg-orange-100 border border-orange-300 rounded px-1 py-1 focus:ring-1 focus:ring-orange-400"
                                      >
                                        <option value="Preparing">Preparing</option>
                                        <option value="Prepared">Prepared</option>
                                        <option value="Ready">Ready</option>
                                      </select>
                                      
                                      {/* Price removed from serve summary */}
                                      
                                      {/* Served Status - reserved space */}
                                      <div className="ml-2 w-24 flex justify-end">
                                        {item.served ? (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            ✓ Served
                                          </span>
                                        ) : (
                                          <span className="invisible inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            ✓ Served
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="text-gray-500 text-lg font-medium mb-2">No orders to serve</div>
                            <div className="text-gray-400 text-sm">Place an order first to see it here</div>
                          </div>
                        )}
                      </div>
                    ) : (expandedCard.currentTask.id === "6" || expandedCard.currentTask.type === "BILL" || expandedCard.workflowState === 'payment_collection') ? (
                      <div className="w-full max-w-lg mx-auto">
                        <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 space-y-6 shadow-lg">
                          <div className="text-center">
                            <h2 className="text-lg font-bold text-gray-800 mb-2">Payment Summary - Seat {expandedCard.seatNumber}</h2>
                          </div>

                          {/* Split Payment - Seat Tabs for Table Seat */}
                              {(() => {
                                // For workflow-based payment_collection tasks, aggregate orderItems from ALL order tasks for this seat
                                const tableId = expandedCard.tableId;
                                const seatId = expandedCard.seatNumber?.toString() || expandedCard.extensionsData?.seat_id?.toString();
                                
                                // Get all tasks for this table to aggregate orderItems from all order tasks
                                const allTableTasks = activeTasksForTable[tableId] || [];
                                
                                // Find all order_placement tasks for this seat (ONLY order_placement, not preparation/serving/payment)
                                // This prevents duplicate items from being counted in the bill
                                const orderTasks = allTableTasks.filter(t => 
                                  t.extensionsData?.seat_id === seatId &&
                                  (t.extensionsData?.workflow?.current_state === 'order_placement' ||
                                   (t.title === 'order' && t.extensionsData?.workflow?.current_state === 'order_placement'))
                                );
                                
                                // Aggregate orderItems from all order tasks for this seat
                                const aggregatedOrderItems = [];
                                orderTasks.forEach(task => {
                                  const taskOrderItems = task.extensionsData?.orderItems || [];
                                  taskOrderItems.forEach(item => {
                                    aggregatedOrderItems.push(item);
                                  });
                                });
                                
                                // If no aggregated items, use current task's orderItems
                                const orderItems = aggregatedOrderItems.length > 0 ? aggregatedOrderItems : (expandedCard.extensionsData?.orderItems || []);
                                
                                // Get individual seat orders
                                const allItems = [];
                                
                                // Use aggregated orderItems from all order tasks
                                if (orderItems.length > 0) {
                                  orderItems.forEach((item, index) => {
                                    const price = typeof item.price === 'number' ? item.price : parseFloat(String(item.price || item.basePrice || 0));
                                    allItems.push({
                                      name: item.name,
                                      price: `$${price.toFixed(2)}`,
                                      quantity: item.quantity || 1,
                                      orderNumber: index + 1,
                                      timestamp: item.orderTimestamp || new Date().toLocaleString(),
                                      seatId: item.seat_id || seatId || expandedCard.seatNumber?.toString()
                                    });
                                  });
                                } else {
                                  // Fallback to old serveHistory method
                                  newGetServeOrders()?.forEach(serve => {
                                    serve.items?.forEach(item => {
                                      allItems.push({
                                        ...item,
                                        orderNumber: serve.orderNumber,
                                        timestamp: serve.timestamp,
                                        seatId: item.seatId || expandedCard.seatNumber.toString()
                                      });
                                    });
                                  });
                                }
                                
                                // Calculate total bill from aggregated orderItems
                                let allSeatsBill = 0;
                                const tableData = rows.find(row => row.id === expandedCard.tableId);
                                
                                // Calculate from aggregated orderItems (includes all orders from "Order More")
                                if (orderItems.length > 0) {
                                  orderItems.forEach(item => {
                                    const price = typeof item.price === 'number' ? item.price : parseFloat(String(item.price || item.basePrice || 0));
                                    allSeatsBill += price * (item.quantity || 1);
                                  });
                                } else {
                                  // Fallback: Get the table's "All Seats" orders from rows state
                                  if (tableData?.serveHistory) {
                                    tableData.serveHistory.forEach(serve => {
                                      serve.items?.forEach(item => {
                                        const price = parseFloat(item.price.replace('$', ''));
                                        allSeatsBill += price * item.quantity;
                                      });
                                    });
                                  }
                                }
                                
                                // Get all occupied seats for this table
                                const occupiedSeats = tableData?.selectedSeats || [expandedCard.seatNumber];
                                const billPerSeat = occupiedSeats.length > 0 ? allSeatsBill / occupiedSeats.length : 0;
                                
                                const itemsBySeat = {};
                                
                                allItems.forEach(item => {
                                  const seatId = item.seatId;
                                  if (seatId) { // Process all items with their actual seatId
                                    if (!itemsBySeat[seatId]) {
                                      itemsBySeat[seatId] = [];
                                    }
                                    itemsBySeat[seatId].push(item);
                                  }
                                });
                                
                                const seatTotals = {};
                                allItems.forEach(item => {
                                  const seatId = item.seatId;
                                  if (seatId) { // Process all items with their actual seatId
                                    const price = parseFloat(item.price.replace('$', ''));
                                    const itemTotal = price * item.quantity;
                                    
                                    if (!seatTotals[seatId]) {
                                      seatTotals[seatId] = 0;
                                    }
                                    seatTotals[seatId] += itemTotal;
                                  }
                                });
                                
                                // Add "All Seats" split to each seat
                                occupiedSeats.forEach(seatId => {
                                  const seatIdStr = seatId.toString();
                                  if (!seatTotals[seatIdStr]) {
                                    seatTotals[seatIdStr] = 0;
                                  }
                                  seatTotals[seatIdStr] += billPerSeat;
                                });
                                
                                const seatIds = Object.keys(itemsBySeat).sort((a, b) => {
                                  return parseInt(a) - parseInt(b);
                                });
                                
                                return (
                                  <div className="space-y-4">
                                    {/* Seat Tabs */}
                                    <div className="flex flex-wrap gap-2">
                                      {seatIds.map(seatId => (
                                        <button
                                          key={seatId}
                                          onClick={() => setActiveOrderTab(seatId)}
                                          className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 font-medium text-sm ${
                                            activeOrderTab === seatId
                                              ? 'border-purple-400 bg-purple-50 text-purple-800 ring-2 ring-purple-200'
                                              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                          }`}
                                        >
                                          {`Seat ${seatId}`}
                                          {seatPaidStatus[seatId] && <span className="ml-1">✓</span>}
                                        </button>
                                      ))}
                                    </div>

                                    {/* Active Seat Payment */}
                                    {activeOrderTab && itemsBySeat[activeOrderTab] && (
                                      <div className="bg-white/70 rounded-lg p-4 shadow-sm border-2 border-purple-100">
                                        <div className="flex items-center justify-between mb-4">
                                          <h4 className="text-lg font-bold text-purple-600">
                                            {`🪑 Seat ${activeOrderTab}`}
                                          </h4>
                                          <div className="text-xl font-bold text-green-600">
                                            ${(seatTotals[activeOrderTab] || 0).toFixed(2)}
                                          </div>
                                        </div>

                                        {/* Items for this seat */}
                                        <div className="space-y-2 mb-4">
                                          {/* Individual seat orders */}
                                          {itemsBySeat[activeOrderTab] && itemsBySeat[activeOrderTab].map((item, index) => {
                                            const itemTotal = (parseFloat(item.price.replace('$', '')) * item.quantity).toFixed(2);
                                            return (
                                              <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                                                <div className="flex-1">
                                                  <div className="text-sm font-medium text-gray-800">{item.name}</div>
                                                  <div className="text-xs text-gray-500">Order {item.orderNumber} • {item.timestamp}</div>
                                                </div>
                                                <div className="text-right">
                                                  <div className="text-sm font-medium text-gray-800">x {item.quantity}</div>
                                                  <div className="text-sm font-bold text-green-600">${itemTotal}</div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                          
                                          {/* All Seats Bill Split */}
                                          {billPerSeat > 0 && (
                                            <div className="flex items-center justify-between bg-blue-50 rounded-lg p-2 border border-blue-200">
                                              <div className="flex-1">
                                                <div className="text-sm font-medium text-blue-800">All Seats Bill Split</div>
                                                <div className="text-xs text-blue-600">Shared among {occupiedSeats.length} seats</div>
                                              </div>
                                              <div className="text-right">
                                                <div className="text-sm font-bold text-blue-600">${billPerSeat.toFixed(2)}</div>
                                              </div>
                                            </div>
                                          )}
                                        </div>

                                        {/* Payment Methods for this seat */}
                                        <div className="space-y-3">
                                          <h5 className="text-sm font-semibold text-gray-700">Select Payment Method</h5>
                                          {paymentMethods.map((method) => {
                                            const Icon = method.icon;
                                            const isSelected = seatPaymentMethods[activeOrderTab] === method.id;
                                            
                                            return (
                                              <button
                                                key={method.id}
                                                onClick={() => handleSeatPayment(activeOrderTab, method.id)}
                                                disabled={seatPaidStatus[activeOrderTab]}
                                                className={`w-full p-3 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 shadow-sm ${
                                                  isSelected
                                                    ? `border-purple-400 bg-purple-50 ring-2 ring-purple-200`
                                                    : `border-gray-300 bg-white hover:bg-gray-50`
                                                } ${seatPaidStatus[activeOrderTab] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                              >
                                                <div className={`p-2 rounded-lg ${method.color} text-white shadow-sm`}>
                                                  <Icon className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 text-left">
                                                  <div className="font-semibold text-sm text-gray-800">{method.name}</div>
                                                  <div className="text-xs text-gray-600">{method.description}</div>
                                                </div>
                                                {isSelected && (
                                                  <CheckCircle className="h-4 w-4 text-purple-600" />
                                                )}
                                              </button>
                                            );
                                          })}
                                        </div>

                                        {/* Pay Button for this seat */}
                                        <button
                                          onClick={() => handlePayment(activeOrderTab)}
                                          disabled={!seatPaymentMethods[activeOrderTab] || seatPaidStatus[activeOrderTab]}
                                          className={`w-full py-3 px-4 rounded-xl font-bold transition-all duration-200 text-sm shadow-lg mt-4 ${
                                            seatPaidStatus[activeOrderTab]
                                              ? 'bg-green-500 text-white cursor-not-allowed'
                                              : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed'
                                          }`}
                                        >
                                          {seatPaidStatus[activeOrderTab] ? 'Paid ✓' : `Pay $${(seatTotals[activeOrderTab] || 0).toFixed(2)}`}
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                        </div>
                      </div>

                    ) : (
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-foreground/60">Status:</span>
                          <select
                            value={expandedCard.currentTask.currentStatus}
                            onChange={(e) => {
                              setTableSeats(prev => {
                                const updatedSeats = { ...prev };
                                const tableId = expandedCard.tableId;
                                const seatNumber = expandedCard.seatNumber;
                                const seatData = updatedSeats[tableId]?.[seatNumber];
                                
                                if (seatData) {
                                  updatedSeats[tableId][seatNumber] = {
                                    ...seatData,
                                    currentTask: { ...seatData.currentTask, currentStatus: e.target.value }
                                  };
                                }
                                
                                return updatedSeats;
                              });
                              setExpandedCard(prev => ({
                                ...prev,
                                currentTask: { ...prev.currentTask, currentStatus: e.target.value }
                              }));
                            }}
                            className="px-2 py-1 rounded border border-border/50 bg-card text-xs outline-none focus:ring-1 focus:ring-primary/30"
                          >
                            {expandedCard.currentTask.statusOptions && expandedCard.currentTask.statusOptions.map(option => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Footer - Copy from Bar Seat */}
            <div className="p-3 md:p-6 border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-purple-50">
              <div className="flex items-center gap-2">
                {(expandedCard.currentTask.id === "4" || expandedCard.currentTask.id === "serve" || expandedCard.currentTask.type === "SERVE" || expandedCard.workflowState === 'order_serving') && (
                  <button
                    onClick={handleOrderMoreClick}
                    className={`flex-1 h-8 md:h-11 px-3 md:px-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
                      orderMoreSelected 
                        ? 'border-green-400 bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className={`h-4 w-4 rounded border-2 flex items-center justify-center ${
                      orderMoreSelected 
                        ? 'border-green-500 bg-green-500' 
                        : 'border-gray-400 bg-white'
                    }`}>
                      {orderMoreSelected && (
                        <div className="h-2 w-2 rounded bg-white"></div>
                      )}
                    </div>
                    <span className="text-xs md:text-sm font-medium">Order More</span>
                  </button>
                )}
                {/* Menu toggle removed: menu shows by default for Order */}
                {showMenu && (
                  <button
                    onClick={() => setShowCart(true)}
                    className="flex-1 h-8 md:h-11 px-3 md:px-4 rounded-xl border-2 border-orange-300 bg-orange-50 hover:bg-orange-100 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
                  >
                    <ShoppingCart className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
                    <span className="text-xs md:text-sm font-medium text-orange-700">Cart</span>
                    {newGetTotalItems() > 0 && (
                      <span className="ml-1 h-5 min-w-[1.25rem] px-1 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                        {newGetTotalItems()}
                      </span>
                    )}
                  </button>
                )}
                {!(expandedCard.currentTask.id === "3" || expandedCard.currentTask.id === "order" || expandedCard.currentTask.type === "ORDER" || showMenu) && (
                <button
                  onClick={() => {
                    // For PREPARATION tasks, use handleNextTask (workflow-based)
                    const isPreparationTask = expandedCard.currentTask?.type === 'PREPARATION' || expandedCard.currentTask?.id === 'preparation';
                    if (isPreparationTask) {
                      handleNextTask();
                      return;
                    }
                    // For SERVE/order_serving tasks, use handleNextTask (workflow-based)
                    const isServeTask = expandedCard.currentTask?.type === 'SERVE' || 
                                       expandedCard.currentTask?.id === 'serve' || 
                                       expandedCard.workflowState === 'order_serving';
                    if (isServeTask) {
                      handleNextTask();
                      return;
                    }
                    
                    // For other tasks, use the old task flow logic
                    setTableSeats(prev => {
                      const updatedSeats = { ...prev };
                      const tableId = expandedCard.tableId;
                      const seatNumber = expandedCard.seatNumber;
                      const seatData = updatedSeats[tableId]?.[seatNumber];
                      
                      if (seatData) {
                        if (seatData.currentTaskIndex < taskFlow.length - 1) {
                          seatData.currentTaskIndex++;
                          seatData.currentTask = { ...taskFlow[seatData.currentTaskIndex] };
                          seatData.status = "Pending";
                          } else {
                          seatData.currentTaskIndex = 0;
                          seatData.currentTask = { ...taskFlow[0] };
                          seatData.status = "Pending";
                          seatData.serveHistory = [];
                        }
                        
                        updatedSeats[tableId][seatNumber] = seatData;
                      }
                      
                      return updatedSeats;
                    });
                    
                    setExpandedCard(prev => {
                      if (prev.currentTaskIndex < taskFlow.length - 1) {
                        return {
                          ...prev,
                          currentTaskIndex: prev.currentTaskIndex + 1,
                          currentTask: { ...taskFlow[prev.currentTaskIndex + 1] }
                        };
                      } else {
                        return {
                          ...prev,
                          currentTaskIndex: 0,
                          currentTask: { ...taskFlow[0] },
                          serveHistory: []
                        };
                      }
                    });
                  }}
                  disabled={!canProceedToNextTask()}
                  className="flex-1 h-8 md:h-11 px-4 md:px-6 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg font-medium"
                >
                  <span className="text-xs md:text-sm">Next Task</span>
                  <ArrowRight className="h-4 w-4 md:h-5 md:w-5" />
                </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Seat Cart Bottom Sheet */}
      {(expandedCard && expandedCard.seatNumber && expandedCard.tableId && showMenu && showCart) && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowCart(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-screen-md md:max-w-2xl bg-card border border-border/50 rounded-t-2xl shadow-xl p-4 md:p-6 max-h-[65vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Cart - Seat {expandedCard.seatNumber}</h3>
              <button
                onClick={() => setShowCart(false)}
                className="h-8 w-8 rounded-md border border-border/50 bg-background hover:bg-muted flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {newGetCartItems().length === 0 ? (
              <p className="text-foreground/60 text-sm py-8 text-center">No items in cart</p>
            ) : (
              <div className="space-y-3">
                {newGetCartItems().map((item, index) => (
                  <div key={`${item.id}-${item.seatId}-${index}`} className="flex items-center justify-between py-3 border-b border-border/30 last:border-b-0">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs text-foreground/60">{item.price}</div>
                      <div className="text-xs text-purple-600 font-medium">
                        For Seat {expandedCard.seat?.id || expandedCard.seatNumber}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => newUpdateCartItem(item.id, -1, item.seatId)}
                        className="h-6 w-6 rounded-full border border-border/50 bg-background hover:bg-muted flex items-center justify-center"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="min-w-[1.5rem] text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => newUpdateCartItem(item.id, 1, item.seatId)}
                        className="h-6 w-6 rounded-full border border-border/50 bg-background hover:bg-muted flex items-center justify-center"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t border-border/30 space-y-0">
                  <input
                    type="text"
                    value={cartNote}
                    onChange={(e) => setCartNote(e.target.value)}
                    placeholder="Add a note (e.g., no onions)"
                    className="w-full h-9 px-3 rounded-lg border border-border/50 bg-card text-xs outline-none focus:ring-2 focus:ring-primary/30 mt-0 mb-1"
                  />
                  <button
                    onClick={() => {
                      newPlaceOrder();
                    }}
                    className="w-full bg-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-purple-700 active:scale-95 transition mt-2"
                  >
                    Place Order
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {expandedCard && expandedCard.type !== "bar" && expandedCard.type !== "bar-seat" && !expandedCard.seatNumber && !expandedCard.tableId && (
        <div className="w-full h-[100dvh]">
          <div className="mx-auto h-full max-w-none md:max-w-5xl rounded-xl md:rounded-2xl border-2 border-gray-200 shadow-2xl bg-gradient-to-br from-white to-gray-50 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-3 md:p-4 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 relative text-xs">
            {/* Close */}
            <button
              onClick={() => {
                // Save the current state back to the main table
                if (expandedCard.tableId) {
                  setRows(prev => prev.map(row => 
                    row.id === expandedCard.id 
                      ? { 
                          ...row, 
                          currentTaskIndex: expandedCard.currentTaskIndex,
                          currentTask: { ...expandedCard.currentTask },
                          minutes: expandedCard.minutes,
                          status: expandedCard.status,
                          serveHistory: expandedCard.serveHistory || []
                        }
                      : row
                  ));
                  setShowSeatPageView(true);
                }
                
                setExpandedCard(null);
                setActiveOrderTab("1");
                setShowMenu(false);
                setShowCart(false);
                setShowComments(false);
              }}
              className="absolute top-3 right-3 md:top-4 md:right-4 h-9 w-9 rounded-xl border-2 border-red-200 bg-red-50 hover:bg-red-100 active:scale-95 flex items-center justify-center transition-all duration-200 shadow-md"
              aria-label="Close"
            >
              <X className="h-4 w-4 text-red-600" />
            </button>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="bg-white/70 rounded-lg px-3 py-2 shadow-sm">
                    <div className="text-xs text-gray-600 font-medium">Table</div>
                    <div className="font-semibold text-sm text-gray-800">
                      {expandedCard.id}
                      {expandedCard.seatNumber && (
                        <span className="text-blue-600 ml-1">(Seat {expandedCard.seatNumber})</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-white/70 rounded-lg px-3 py-2 shadow-sm">
                    <div className="text-xs text-gray-600 font-medium">Task</div>
                    <div className="font-semibold text-sm text-gray-800">{expandedCard.currentTask.name}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 -mt-4">
                  <div className="flex items-center gap-2">
                    {/* Menu toggle removed: menu shows by default for Order */}
                    <button
                      onClick={() => setShowComments(true)}
                      className="h-8 md:h-11 px-3 md:px-4 rounded-lg md:rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 active:scale-95 flex items-center gap-1.5 md:gap-2 transition-all duration-200 shadow-md"
                    >
                      <MessageSquare className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-600" />
                      <span className="text-xs font-medium text-blue-700">Comments</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 bg-white/70 rounded-lg px-3 py-2 shadow-sm">
                    <Clock className="h-4 w-4 text-purple-600" />
                    <span className="text-xs font-medium text-gray-700">{expandedCard.minutes} mins</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Menu Section */}
            {showMenu && (
              <div className="md:w-full border-b md:border-b-0 border-border/30 overflow-y-auto p-3 md:p-4">

                {/* Menu Content */}
                <div className="space-y-4">
                  {menuCategories.map((category) => (
                    <div key={category.title} className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground border-b border-border/30 pb-1">
                        {category.title}
                      </h3>
                      <div className="space-y-2">
                        {category.items.map((item) => {
                          const currentQuantity = newGetQuantityForItem(item.id, activeOrderTab);
                          
                          return (
                            <div key={item.id} className="rounded-lg border border-border/30 bg-background p-3 space-y-2">
                              <div className="flex items-start">
                                <div className="flex-1">
                                  <h4 className="font-medium text-foreground">{item.name}</h4>
                                  <p className="text-sm text-foreground/70">{item.description}</p>
                                    <p className="text-xs text-blue-600 font-medium mt-1">
                                      Adding to Seat {activeOrderTab}
                                    </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between -mt-4">
                                <p className="text-sm font-medium text-primary">{item.price}</p>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => newUpdateCartItem(item.id, -1, activeOrderTab)}
                                    className="h-7 w-7 rounded-full border border-border/50 bg-card hover:bg-muted flex items-center justify-center transition-colors"
                                    disabled={!currentQuantity}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="min-w-[1.5rem] text-center font-medium text-sm">
                                    {currentQuantity}
                                  </span>
                                  <button
                                    onClick={() => newUpdateCartItem(item.id, 1, activeOrderTab)}
                                    className="h-7 w-7 rounded-full border border-border/50 bg-card hover:bg-muted flex items-center justify-center transition-colors"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cart Bottom Sheet */}
            {(showMenu && showCart) && (
                  <div className="fixed inset-0 z-50">
                    <div
                      className="absolute inset-0 bg-black/40"
                      onClick={() => setShowCart(false)}
                    />
                    <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-screen-md md:max-w-2xl bg-card border border-border/50 rounded-t-2xl shadow-xl p-4 md:p-6 max-h-[65vh] overflow-y-auto">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold">Cart</h3>
                        <button
                          onClick={() => setShowCart(false)}
                          className="h-8 w-8 rounded-md border border-border/50 bg-background hover:bg-muted flex items-center justify-center"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      {newGetCartItems().length === 0 ? (
                        <p className="text-foreground/60 text-sm py-8 text-center">No items in cart</p>
                      ) : (
                        <div className="space-y-3">
                          {newGetCartItems().map((item, index) => (
                            <div key={`${item.id}-${item.seatId}-${index}`} className="flex items-center justify-between py-3 border-b border-border/30 last:border-b-0">
                              <div className="flex-1">
                                <div className="font-medium text-sm">{item.name}</div>
                                <div className="text-xs text-foreground/60">{item.price}</div>
                                <div className="text-xs text-blue-600 font-medium">
                                  For {`Seat ${item.seatId}`}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => newUpdateCartItem(item.id, -1, item.seatId)}
                                  className="h-6 w-6 rounded-full border border-border/50 bg-background hover:bg-muted flex items-center justify-center"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="min-w-[1.5rem] text-center text-sm font-medium">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => newUpdateCartItem(item.id, 1, item.seatId)}
                                  className="h-6 w-6 rounded-full border border-border/50 bg-background hover:bg-muted flex items-center justify-center"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                          <div className="pt-3 border-t border-border/30 space-y-0">
                            <input
                              type="text"
                              value={cartNote}
                              onChange={(e) => setCartNote(e.target.value)}
                              placeholder="Add a note (e.g., no onions)"
                              className="w-full h-9 px-3 rounded-lg border border-border/50 bg-card text-xs outline-none focus:ring-2 focus:ring-primary/30 mt-0 mb-1"
                            />
                            <button
                              onClick={() => {
                                newPlaceOrder();
                              }}
                              className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-xl font-medium hover:bg-primary/90 active:scale-95 transition mt-2"
                            >
                              Place Order
                            </button>
                          </div>
                </div>
              )}
            </div>
          </div>
            )}

            {/* Status Section when menu is not shown */}
            {!showMenu && (
              <div className="flex-1 p-8 md:p-6 overflow-y-auto">
                <div className="space-y-4">
                  {(expandedCard.currentTask.id === "4" || expandedCard.currentTask.id === "serve" || expandedCard.currentTask.type === "SERVE") ? (
                    <div className="space-y-4">
                      {/* Order Summary Header */}
                      <div className="text-center mb-4">
                        <h3 className="text-xl font-bold text-blue-800 bg-blue-100 px-4 py-2 rounded-lg">All Seats</h3>
                      </div>
                      
                      {/* Order Items */}
                      {(() => {
                        // Get all orders using the new clean function
                        const allOrders = newGetServeOrders();
                        
                        if (allOrders.length === 0) {
                          return (
                            <div className="text-center py-8">
                              <div className="text-gray-500 text-lg font-medium mb-2">No orders to serve</div>
                              <div className="text-gray-400 text-sm">Place an order first to see it here</div>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-3">
                            {allOrders.map((order, orderIndex) => (
                              <div key={orderIndex} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-4 shadow-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-bold text-blue-700">Order #{order.orderNumber}</span>
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{order.timestamp}</span>
                            </div>

                                <div className="space-y-2">
                                  {order.items && order.items.map((item, itemIndex) => (
                                    <div key={itemIndex} className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm border border-blue-100">
                                      {/* Checkbox */}
                                          <input
                                            type="checkbox"
                                            checked={item.served || false}
                                            onChange={(e) => {
                                          newUpdateItemServed(orderIndex, itemIndex, e.target.checked);
                                            }}
                                            className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                          />
                                      
                                      {/* Item Name */}
                                      <div className="flex-1">
                                        <div className="font-medium text-gray-800">{item.name}</div>
                                          </div>
                                      
                                      {/* Seat Number */}
                                      <div className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-md">
                                        Seat {item.seatId}
                                        </div>
                                      
                                      {/* Quantity */}
                                      <div className="text-sm font-bold text-green-600 bg-green-100 px-2 py-1 rounded-md">
                                        Qty: {item.quantity}
                                      </div>
                                      
                                      {/* Kitchen Status */}
                                      <select
                                        value={item.kitchenStatus || "Preparing"}
                                                  onChange={(e) => {
                                          newUpdateKitchenStatus(orderIndex, itemIndex, e.target.value);
                                        }}
                                        className="text-xs font-medium text-orange-600 bg-orange-100 border border-orange-300 rounded px-1 py-1 focus:ring-1 focus:ring-orange-400"
                                      >
                                        <option value="Preparing">Preparing</option>
                                        <option value="Prepared">Prepared</option>
                                        <option value="Ready">Ready</option>
                                      </select>
                                      
                                      {/* Price removed from serve summary */}
                                      
                                      {/* Served Status - reserved space */}
                                      <div className="ml-2 w-24 flex justify-end">
                                        {item.served ? (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            ✓ Served
                                          </span>
                                        ) : (
                                          <span className="invisible inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            ✓ Served
                                          </span>
                                        )}
                                      </div>
                                  </div>
                                ))}
                              </div>
                                  </div>
                                ))}
                              </div>
                        );
                      })()}
                    </div>
                  ) : expandedCard.currentTask.id === "6" ? (
                    <div className="w-full max-w-lg mx-auto">
                      <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 space-y-6 shadow-lg">
                        <div className="text-center">
                          <h2 className="text-lg font-bold text-gray-800 mb-2">Payment Summary</h2>
                        </div>

                        {/* Payment Type Selection */}
                        <div className="space-y-3">
                          <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">Payment Type</h3>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setPaymentType("single")}
                              className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all duration-200 font-medium ${
                                paymentType === "single"
                                  ? 'border-blue-400 bg-blue-50 text-blue-800 ring-2 ring-blue-200'
                                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              Single Payment
                            </button>
                            <button
                              onClick={() => setPaymentType("split")}
                              className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all duration-200 font-medium ${
                                paymentType === "split"
                                  ? 'border-blue-400 bg-blue-50 text-blue-800 ring-2 ring-blue-200'
                                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              Split Payment
                            </button>
                          </div>
                        </div>

                        {paymentType === "single" ? (
                          <>
                            {/* Single Payment - Order Details with Seat Breakdown */}
                            <div className="space-y-4">
                              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">Order Details by Seat</h3>
                              {getAllOrderedItems().length > 0 ? (
                                <div className="space-y-4 max-h-60 overflow-y-auto">
                                  {(() => {
                                    const itemsBySeat = {};
                                    
                                    getAllOrderedItems().forEach(item => {
                                      const seatId = item.seatId;
                                      if (seatId) { // Process all items with their actual seatId
                                        if (!itemsBySeat[seatId]) {
                                          itemsBySeat[seatId] = [];
                                        }
                                        itemsBySeat[seatId].push(item);
                                      }
                                    });
                                    
                                    const seatTotals = calculateSeatTotals();
                                    
                                    return Object.keys(itemsBySeat).sort((a, b) => {
                                      return parseInt(a) - parseInt(b);
                                    }).map(seatId => (
                                      <div key={seatId} className="bg-white/70 rounded-lg p-4 shadow-sm border-2 border-gray-100">
                                        <div className="flex items-center justify-between mb-3">
                                          <div className="text-sm font-bold text-blue-600">
                                            {`🪑 Seat ${seatId}`}
                                          </div>
                                          <div className="text-lg font-bold text-green-600">
                                            ${seatTotals[seatId] || '0.00'}
                                          </div>
                                        </div>
                                        <div className="space-y-2">
                                          {itemsBySeat[seatId].map((item, index) => {
                                            const itemTotal = (parseFloat(item.price.replace('$', '')) * item.quantity).toFixed(2);
                                            return (
                                              <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                                                <div className="flex-1">
                                                  <div className="text-sm font-medium text-gray-800">{item.name}</div>
                                                  <div className="text-xs text-gray-500">Order {item.orderNumber} • {item.timestamp}</div>
                                                </div>
                                                <div className="text-right">
                                                  <div className="text-sm font-medium text-gray-800">x {item.quantity}</div>
                                                  <div className="text-sm font-bold text-green-600">${itemTotal}</div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    ));
                                  })()}
                                </div>
                              ) : (
                                <div className="text-center text-gray-500 py-4">No items found</div>
                              )}
                            </div>

                            {/* Grand Total */}
                            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-gray-800">Grand Total:</span>
                                <span className="text-2xl font-bold text-green-600">${calculateOrderTotal()}</span>
                              </div>
                            </div>

                            {/* Payment Methods */}
                            <div className="space-y-3">
                              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">Select Payment Method</h3>
                              {paymentMethods.map((method) => {
                                const Icon = method.icon;
                                const isSelected = selectedPaymentMethod === method.id;
                                
                                return (
                                  <button
                                    key={method.id}
                                    onClick={() => setSelectedPaymentMethod(method.id)}
                                    disabled={isPaid}
                                    className={`w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 shadow-sm ${
                                      isSelected
                                        ? `border-blue-400 bg-blue-50 ring-2 ring-blue-200`
                                        : `border-gray-300 bg-white hover:bg-gray-50`
                                    } ${isPaid ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    <div className={`p-2 rounded-lg ${method.color} text-white shadow-sm`}>
                                      <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 text-left">
                                      <div className="font-semibold text-sm text-gray-800">{method.name}</div>
                                      <div className="text-xs text-gray-600">{method.description}</div>
                                    </div>
                                    {isSelected && (
                                      <CheckCircle className="h-5 w-5 text-blue-600" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Pay Button */}
                            <button
                              onClick={() => handlePayment()}
                              disabled={!selectedPaymentMethod || isPaid}
                              className={`w-full py-4 px-6 rounded-xl font-bold transition-all duration-200 text-sm shadow-lg ${
                                isPaid 
                                  ? 'bg-green-500 text-white cursor-not-allowed'
                                  : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                              }`}
                            >
                              {isPaid ? 'Paid ✓' : `Pay $${calculateOrderTotal()}`}
                            </button>
                          </>
                        ) : (
                          <>
                            {/* Split Payment */}
                            {(() => {
                              // Calculate total bill from serveHistory
                              let totalBill = 0;
                              expandedCard?.serveHistory?.forEach(serve => {
                                serve.items?.forEach(item => {
                                  const price = parseFloat(item.price.replace('$', ''));
                                  totalBill += price * item.quantity;
                                });
                              });
                              
                              return (
                                <div className="space-y-4">
                                  {/* Seat Tabs */}
                                  <div className="flex flex-wrap gap-2">
                                    {seatIds.map(seatId => (
                                      <button
                                        key={seatId}
                                        onClick={() => setActiveOrderTab(seatId)}
                                        className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 font-medium text-sm ${
                                          activeOrderTab === seatId
                                            ? 'border-blue-400 bg-blue-50 text-blue-800 ring-2 ring-blue-200'
                                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                        }`}
                                      >
                                        {`Seat ${seatId}`}
                                        {seatPaidStatus[seatId] && <span className="ml-1">✓</span>}
                                      </button>
                                    ))}
                                  </div>

                                  {/* Active Seat Payment */}
                                  {activeOrderTab && (
                                    <div className="bg-white/70 rounded-lg p-4 shadow-sm border-2 border-gray-100">
                                      <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-lg font-bold text-blue-600">
                                          {`🪑 Seat ${activeOrderTab}`}
                                        </h4>
                                        <div className="text-xl font-bold text-green-600">
                                          ${seatTotals[activeOrderTab] || '0.00'}
                                        </div>
                                      </div>

                                      {/* Items for this seat */}
                                      <div className="space-y-2 mb-4">
                                        {/* Individual seat orders */}
                                        {itemsBySeat[activeOrderTab] && itemsBySeat[activeOrderTab].map((item, index) => {
                                          const itemTotal = (parseFloat(item.price.replace('$', '')) * item.quantity).toFixed(2);
                                          return (
                                            <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                                              <div className="flex-1">
                                                <div className="text-sm font-medium text-gray-800">{item.name}</div>
                                                <div className="text-xs text-gray-500">Order {item.orderNumber} • {item.timestamp}</div>
                                              </div>
                                              <div className="text-right">
                                                <div className="text-sm font-medium text-gray-800">x {item.quantity}</div>
                                                <div className="text-sm font-bold text-green-600">${itemTotal}</div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                        
                                        {/* Split "All Seats" bill */}
                                        {billPerSeat > 0 && (
                                          <div className="flex items-center justify-between bg-blue-50 rounded-lg p-2 border border-blue-200">
                                            <div className="flex-1">
                                              <div className="text-sm font-medium text-blue-800">All Seats Bill Split</div>
                                              <div className="text-xs text-blue-600">Shared among {occupiedSeats.length} seats</div>
                                            </div>
                                            <div className="text-right">
                                              <div className="text-sm font-bold text-blue-600">${billPerSeat.toFixed(2)}</div>
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {/* Payment Methods for this seat */}
                                      <div className="space-y-3">
                                        <h5 className="text-sm font-semibold text-gray-700">Select Payment Method</h5>
                                        {paymentMethods.map((method) => {
                                          const Icon = method.icon;
                                          const isSelected = seatPaymentMethods[activeOrderTab] === method.id;
                                          
                                          return (
                                            <button
                                              key={method.id}
                                              onClick={() => handleSeatPayment(activeOrderTab, method.id)}
                                              disabled={seatPaidStatus[activeOrderTab]}
                                              className={`w-full p-3 rounded-xl border-2 transition-all duration-200 flex items-center gap-3 shadow-sm ${
                                                isSelected
                                                  ? `border-blue-400 bg-blue-50 ring-2 ring-blue-200`
                                                  : `border-gray-300 bg-white hover:bg-gray-50`
                                              } ${seatPaidStatus[activeOrderTab] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                              <div className={`p-2 rounded-lg ${method.color} text-white shadow-sm`}>
                                                <Icon className="h-4 w-4" />
                                              </div>
                                              <div className="flex-1 text-left">
                                                <div className="font-semibold text-sm text-gray-800">{method.name}</div>
                                                <div className="text-xs text-gray-600">{method.description}</div>
                                              </div>
                                              {isSelected && (
                                                <CheckCircle className="h-4 w-4 text-blue-600" />
                                              )}
                                            </button>
                                          );
                                        })}
                                      </div>

                                      {/* Pay Button for this seat */}
                                      <button
                                        onClick={() => handlePayment(activeOrderTab)}
                                        disabled={!seatPaymentMethods[activeOrderTab] || seatPaidStatus[activeOrderTab]}
                                        className={`w-full py-3 px-4 rounded-xl font-bold transition-all duration-200 text-sm shadow-lg mt-4 ${
                                          seatPaidStatus[activeOrderTab]
                                            ? 'bg-green-500 text-white cursor-not-allowed'
                                            : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                                        }`}
                                      >
                                        {seatPaidStatus[activeOrderTab] ? 'Paid ✓' : `Pay $${seatTotals[activeOrderTab] || '0.00'}`}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </>
                        )}

                        {/* Payment Info */}
                        <div className="text-center text-xs text-gray-500 bg-gray-100 rounded-lg p-3">
                          <p>Secure payment powered by Algobrewery</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-foreground/60">Status:</span>
                        <select
                          value={expandedCard.currentTask.currentStatus}
                          onChange={(e) => updateTaskStatus(expandedCard.id, e.target.value)}
                          className="px-2 py-1 rounded border border-border/50 bg-card text-xs outline-none focus:ring-1 focus:ring-primary/30"
                        >
                          {expandedCard.currentTask.statusOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {showComments && (
            <div className="px-4 md:px-6 pb-4 md:pb-6">
              <div className="relative rounded-xl border-2 border-border bg-card p-3 md:p-4 space-y-0 text-xs shadow">
                <button
                  onClick={() => setShowComments(false)}
                  aria-label="Close comments"
                  className="absolute top-2 right-2 h-8 w-8 rounded-md border border-border/50 bg-card hover:bg-muted flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="pr-10 flex justify-center">
                  <h3 className="text-lg font-semibold text-foreground text-center px-2 py-1">Comments</h3>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {comments.length === 0 ? (
                    <p className="text-xs text-foreground/60 my-[5px]">No comments yet.</p>
                  ) : (
                    comments.map(c => (
                      <div key={c.id} className="text-xs text-foreground bg-card rounded-md border border-border/40 p-2">
                        {c.text}
                      </div>
                    ))
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addComment(); }}
                    ref={commentInputRef}
                    placeholder="Add a comment..."
                    className="flex-1 h-8 md:h-10 px-3 rounded-lg md:rounded-xl border border-border/50 bg-card text-xs md:text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    onClick={addComment}
                    className="h-8 md:h-10 px-3 md:px-4 rounded-lg md:rounded-xl bg-primary text-primary-foreground text-xs md:text-sm hover:bg-primary/90 active:scale-95 transition"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-3 md:p-6 border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
              <div className="flex items-center gap-2">
              {expandedCard && (expandedCard.currentTask.id === "4" || expandedCard.currentTask.id === "serve" || expandedCard.currentTask.type === "SERVE" || expandedCard.workflowState === 'order_serving') && (
                <button
                  onClick={handleOrderMoreClick}
                  className={`flex-1 h-8 md:h-11 px-3 md:px-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
                    orderMoreSelected 
                      ? 'border-green-400 bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className={`h-4 w-4 rounded border-2 flex items-center justify-center ${
                    orderMoreSelected 
                      ? 'border-green-500 bg-green-500' 
                      : 'border-gray-400 bg-white'
                  }`}>
                    {orderMoreSelected && (
                      <div className="h-2 w-2 rounded bg-white"></div>
                    )}
                  </div>
                  <span className="text-xs md:text-sm font-medium">Order More</span>
                </button>
              )}
              {showMenu && (
                <button
                  onClick={() => setShowCart(true)}
                  className="flex-1 h-8 md:h-11 px-3 md:px-4 rounded-xl border-2 border-orange-300 bg-orange-50 hover:bg-orange-100 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
                >
                  <ShoppingCart className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
                  <span className="text-xs md:text-sm font-medium text-orange-700">Cart</span>
                  {newGetTotalItems() > 0 && (
                    <span className="ml-1 h-5 min-w-[1.25rem] px-1 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                      {newGetTotalItems()}
                    </span>
                  )}
                </button>
              )}
              {/* Next Task button intentionally removed for order flow bottom bar */}
            </div>
          </div>

          </div>
        </div>
        )}

        <SeatNumberPrompt
          open={showSeatNumberPrompt && !!tableForSeatNumberPrompt}
          tableId={tableForSeatNumberPrompt?.id}
          numberOfSeats={numberOfSeats}
          setNumberOfSeats={setNumberOfSeats}
          maxSeatAddCap={maxSeatAddCap}
          onCancel={() => {
                setShowSeatNumberPrompt(false);
                setTableForSeatNumberPrompt(null);
              }}
          onConfirm={handleConfirmSeatNumber}
        />

        {/* Seat Selection Modal */}
        {showSeatSelection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div 
                className="absolute inset-0 bg-black/60"
                onClick={() => {
                  setShowSeatSelection(false);
                  setSelectedSeats([]);
                  setTableToSeat(null);
                }}
              />
            <div className="relative bg-white rounded-2xl p-6 md:p-8 max-w-md w-full mx-4 shadow-2xl">
              <div className="text-center mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
                  Select Seat for {tableToSeat?.id}
                </h2>
                <p className="text-sm text-gray-600">
                  Select one or more seats for this table
                </p>
                {selectedSeats.length > 0 && (
                  <div className="mt-2 text-sm text-blue-600 font-medium">
                    Selected: Seats {selectedSeats.sort((a, b) => a - b).join(', ')}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {[1, 2, 3, 4].map((seatNumber) => (
                  <button
                    key={seatNumber}
                    onClick={() => {
                      setSelectedSeats(prev => {
                        if (prev.includes(seatNumber)) {
                          // Remove seat if already selected
                          return prev.filter(seat => seat !== seatNumber);
                        } else {
                          // Add seat if not selected
                          return [...prev, seatNumber];
                        }
                      });
                    }}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 font-semibold ${
                      selectedSeats.includes(seatNumber)
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg scale-105'
                        : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="text-2xl">🪑</div>
                      <span className="text-sm font-bold">Seat {seatNumber}</span>
                      {selectedSeats.includes(seatNumber) && (
                        <div className="text-xs text-blue-600 font-bold">✓</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSeatSelection(false);
                    setSelectedSeats([]);
                    setTableToSeat(null);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSeatConfirm}
                  disabled={selectedSeats.length === 0}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
                    selectedSeats.length > 0
                      ? 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Confirm Seats ({selectedSeats.length})
                </button>
              </div>
            </div>
          </div>
        )}

        <SeatSelectionPopup
          open={showSeatSelectionPopup && !!selectedTableForSeats}
          tableId={selectedTableForSeats?.id}
          selectedSeats={selectedSeatsForTable}
          onToggleSeat={handleSeatSelectionToggle}
          onCancel={() => {
            setShowSeatSelectionPopup(false);
            setSelectedSeatsForTable([]);
            setSelectedTableForSeats(null);
          }}
          onContinue={handleConfirmSeatSelection}
          options={seatAddOptions.length > 0 ? seatAddOptions : [1, 2, 3, 4]}
        />

        {/* Seat Page View */}
        {showSeatPageView && selectedTableForSeats && (
          <div className="px-3 md:px-4 py-3">
            {/* Header */}
            <SeatHeader
              tableId={selectedTableForSeats.id}
              onBack={() => setShowSeatPageView(false)}
              onAddSeat={() => {
                if (!selectedTableForSeats) return;
                setIsAddingSeats(true);
                const tableId = selectedTableForSeats.id;
                const tasks = activeTasksForTable[tableId] || [];
                const existingSeats = Array.from(new Set(
                  tasks.map(t => t.extensionsData?.seat_id)
                    .filter(s => s && s !== '99')
                    .map(s => parseInt(s, 10))
                ));
                const remaining = Math.max(0, 20 - existingSeats.length);
                setMaxSeatAddCap(remaining);
                setNumberOfSeats(Math.min(4, Math.max(1, remaining)));
                setTableForSeatNumberPrompt(selectedTableForSeats);
                setShowSeatNumberPrompt(true);
              }}
              onClearTable={async () => {
                try {
                  const tableId = selectedTableForSeats.id;
                  console.log('[Clear Table] Clearing table from UI:', tableId);
                  
                  // Clear backend tasks first
                  await clearTableBackend(tableId);
                  
                  // Refresh tasks to get updated state
                  await fetchActiveTasks(tableId);
                  
                  // Clear frontend state
                  setTableSeats(prev => {
                    const updatedSeats = { ...prev };
                    if (updatedSeats[tableId]) {
                      Object.keys(updatedSeats[tableId]).forEach(seatId => {
                        updatedSeats[tableId][seatId] = {
                          ...updatedSeats[tableId][seatId],
                          currentTaskIndex: 0,
                          currentTask: { ...taskFlow[0] },
                          minutes: 0,
                          status: "Pending",
                          orderMoreNext: false,
                          serveHistory: []
                        };
                      });
                    }
                    return updatedSeats;
                  });
                  setTableCarts(prev => {
                    const updatedCarts = { ...prev };
                    const currentSeats = tableSeats[tableId];
                    if (currentSeats) {
                      Object.keys(currentSeats).forEach(seatId => {
                        const seatKey = `${tableId}-S${seatId}`;
                        updatedCarts[seatKey] = [];
                      });
                    }
                    return updatedCarts;
                  });
                  setRows(prev => prev.map(row => 
                    row.id === tableId 
                      ? { 
                          ...row, 
                          selectedSeats: [],
                          currentTaskIndex: 0,
                          currentTask: { ...taskFlow[0] },
                          minutes: 0,
                          status: "Available",
                          serveHistory: []
                        }
                      : row
                  ));
                  setQuantities({});
                  setCartNote('');
                  setShowMenu(false);
                  setShowCart(false);
                  setShowComments(false);
                  setActiveOrderTab("1");
                  setSelectedSeatsForTable([]);
                  setExpandedCard(null);
                  
                  // Close seat page view and return to main table view
                  setShowSeatPageView(false);
                  setSelectedTableForSeats(null);
                  
                  console.log('[Clear Table] Table cleared successfully from UI');
                } catch (error) {
                  console.error('[Clear Table] Error clearing table:', error);
                  alert('Failed to clear table. Please try again.');
                }
              }}
              currentTaskName={rows.find(row => row.id === selectedTableForSeats.id)?.currentTask?.name || "Assign Table"}
            />

            {/* Table Seats Grid */}
            <SeatPageGrid
              selectedTableForSeats={selectedTableForSeats}
              activeTasksForTable={activeTasksForTable}
              selectedSeatsForTable={selectedSeatsForTable}
              tableSeats={tableSeats}
              getTableBackgroundClass={getTableBackgroundClass}
              onSeatClick={handleSeatPageSeatClick}
            />
          </div>
        )}

        {/* Bar Table Section */}
        {!expandedCard && !showSeatPageView && (
          <div className="px-3 md:px-4 py-3">
            <div 
              onClick={() => setExpandedCard({ 
                id: "BAR", 
                type: "bar", 
                seats: 6, 
                currentTask: { id: "1", name: "Bar Management" },
                selectedSeats: [1, 2, 3, 4, 5, 6]
              })}
              className="bg-gradient-to-br from-purple-100 to-purple-200 border-2 border-purple-300 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg cursor-pointer hover:shadow-xl active:scale-[0.98] transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-purple-800">Bar Table</h3>
                  <p className="text-sm text-purple-700">6 Seats Available</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-purple-700">Active Seats</p>
                  <p className="text-lg font-bold text-purple-800">4/6 Occupied</p>
                </div>
              </div>
              
              {/* Seat Task Grid */}
              <div className="grid grid-cols-3 gap-3 md:gap-4 mb-4">
                {[
                  { id: "S1", task: "Assign", color: "bg-green-100 border-green-300 text-green-800" },
                  { id: "S2", task: "Pre Meal", color: "bg-blue-100 border-blue-300 text-blue-800" },
                  { id: "S3", task: "Order", color: "bg-blue-100 border-blue-300 text-blue-800" },
                  { id: "S4", task: "Serve", color: "bg-blue-100 border-blue-300 text-blue-800" },
                  { id: "S5", task: "Payment", color: "bg-yellow-100 border-yellow-300 text-yellow-800" }
                ].map((seat) => (
                  <div 
                    key={seat.id} 
                    className={`rounded-lg border-2 p-3 text-center ${seat.color} shadow-sm`}
                  >
                    <div className="text-sm font-bold">{seat.id}</div>
                    <div className="text-xs font-medium">{seat.task}</div>
                  </div>
                ))}
              </div>
              
              {/* Footer */}
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-2 text-purple-700">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Avg: 8 mins</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

