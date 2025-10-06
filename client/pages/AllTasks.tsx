import { useState, useEffect } from "react";
import { Plus, Calendar, User, Clock, Edit, Trash2, CheckCircle, Circle, MessageSquare, Tag, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Task {
  taskUuid: string;
  organizationUuid: string;
  title: string;
  description: string;
  authorUuid: string;
  assigneeUuid: string;
  assigneeUuidType: string;
  createdAt: string;
  dueAt: string;
  updatedAt: string;
  status: string;
  priority: string;
  category: string;
  location?: string;
  commentsCount: number;
  parentTaskUuid?: string;
  childTaskUuids?: string[];
  extensionsData?: Record<string, any>;
}

interface CreateTaskRequest {
  title: string;
  description: string;
  assigneeUuid: string;
  assigneeUuidType: string;
  dueAt: string;
  status: string;
  priority: string;
  category: string;
  location?: string;
}

// Static data representing real-world use cases - only 2 tasks
const staticTasks: Task[] = [
  {
    taskUuid: "task-001",
    organizationUuid: "starbucks-bangalore-001",
    title: "Morning Coffee Service Setup",
    description: "Prepare coffee machines, check inventory, and ensure all equipment is ready for morning rush. Verify milk stock and coffee beans availability.",
    authorUuid: "manager-001",
    assigneeUuid: "barista-001",
    assigneeUuidType: "USER",
    createdAt: "2024-01-15T06:00:00Z",
    dueAt: "2024-01-15T07:30:00Z",
    updatedAt: "2024-01-15T06:00:00Z",
    status: "IN_PROGRESS",
    priority: "HIGH",
    category: "OPERATIONS",
    location: "Bangalore Central Mall",
    commentsCount: 3
  },
  {
    taskUuid: "task-002",
    organizationUuid: "starbucks-hyderabad-001",
    title: "Evening Cleanup",
    description: "Complete end-of-day cleanup: sanitize all surfaces, clean coffee machines, dispose of waste, and prepare for next day.",
    authorUuid: "manager-002",
    assigneeUuid: "cleaner-001",
    assigneeUuidType: "USER",
    createdAt: "2024-01-15T20:00:00Z",
    dueAt: "2024-01-15T22:00:00Z",
    updatedAt: "2024-01-15T20:00:00Z",
    status: "COMPLETED",
    priority: "HIGH",
    category: "MAINTENANCE",
    location: "Hyderabad Tech Park",
    commentsCount: 0
  }
];

export default function AllTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<CreateTaskRequest>({
    title: "",
    description: "",
    assigneeUuid: "",
    assigneeUuidType: "USER",
    dueAt: "",
    status: "PENDING",
    priority: "MEDIUM",
    category: "OPERATIONS",
    location: ""
  });

  // Load static tasks on component mount
  useEffect(() => {
    // Simulate API call delay
    setTimeout(() => {
      setTasks(staticTasks);
      setLoading(false);
    }, 1000);
  }, []);

  const handleCreateTask = async () => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'APP_ORG_UUID': 'org-001',
          'APP_USER_UUID': 'user-001',
          'APP_CLIENT_USER_SESSION_UUID': 'session-001',
          'APP_TRACE_ID': 'trace-001',
          'APP_REGION_ID': 'region-001'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.responseResult === "SUCCESS") {
          setTasks(prev => [...prev, data.task]);
          setIsCreateDialogOpen(false);
          setFormData({
            title: "",
            description: "",
            assigneeUuid: "",
            assigneeUuidType: "USER",
            dueAt: "",
            status: "PENDING",
            priority: "MEDIUM",
            category: "OPERATIONS",
            location: ""
          });
        }
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;
    
    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'APP_ORG_UUID': 'org-001',
          'APP_USER_UUID': 'user-001',
          'APP_CLIENT_USER_SESSION_UUID': 'session-001',
          'APP_TRACE_ID': 'trace-001',
          'APP_REGION_ID': 'region-001'
        },
        body: JSON.stringify({
          taskUuid: editingTask.taskUuid,
          ...formData
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.responseResult === "SUCCESS") {
          setTasks(prev => prev.map(task => 
            task.taskUuid === editingTask.taskUuid ? data.task : task
          ));
          setIsEditDialogOpen(false);
          setEditingTask(null);
        }
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskUuid: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskUuid}`, {
        method: 'DELETE',
        headers: {
          'APP_ORG_UUID': 'org-001',
          'APP_USER_UUID': 'user-001',
          'APP_CLIENT_USER_SESSION_UUID': 'session-001',
          'APP_TRACE_ID': 'trace-001',
          'APP_REGION_ID': 'region-001'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.responseResult === "SUCCESS") {
          setTasks(prev => prev.filter(task => task.taskUuid !== taskUuid));
        }
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      assigneeUuid: task.assigneeUuid,
      assigneeUuidType: task.assigneeUuidType,
      dueAt: task.dueAt.split('T')[0],
      status: task.status,
      priority: task.priority,
      category: task.category,
      location: task.location || ""
    });
    setIsEditDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'OPERATIONS':
        return <Tag className="h-3 w-3" />;
      case 'TRAINING':
        return <User className="h-3 w-3" />;
      case 'MAINTENANCE':
        return <Clock className="h-3 w-3" />;
      case 'PATIENT_CARE':
        return <User className="h-3 w-3" />;
      case 'EQUIPMENT':
        return <Tag className="h-3 w-3" />;
      case 'ADMINISTRATION':
        return <Tag className="h-3 w-3" />;
      default:
        return <Tag className="h-3 w-3" />;
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">All Tasks</h1>
        </div>
        <div className="rounded-2xl border border-border/50 bg-card p-8">
          <div className="text-center text-foreground/60">
            <h2 className="text-lg font-semibold mb-2">Loading Tasks...</h2>
            <p>Please wait while we fetch your tasks.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-2xl p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">All Tasks</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full w-10 h-10 p-0">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter task description"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assignee">Assignee UUID</Label>
                <Input
                  id="assignee"
                  value={formData.assigneeUuid}
                  onChange={(e) => setFormData(prev => ({ ...prev, assigneeUuid: e.target.value }))}
                  placeholder="Enter assignee UUID"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assigneeType">Assignee Type</Label>
                <Select value={formData.assigneeUuidType} onValueChange={(value) => setFormData(prev => ({ ...prev, assigneeUuidType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="TEAM">Team</SelectItem>
                    <SelectItem value="ROLE">Role</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dueAt">Due Date</Label>
                <Input
                  id="dueAt"
                  type="date"
                  value={formData.dueAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueAt: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OPERATIONS">Operations</SelectItem>
                    <SelectItem value="TRAINING">Training</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="PATIENT_CARE">Patient Care</SelectItem>
                    <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                    <SelectItem value="ADMINISTRATION">Administration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location (Optional)</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Enter location"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTask}>
                Create Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Task Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tasks.map((task) => (
          <div key={task.taskUuid} className="rounded-2xl border border-border/50 bg-card p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs text-foreground/40 font-mono">#{task.taskUuid.slice(0, 8)}</span>
                {getStatusIcon(task.status)}
                <h3 className="font-semibold text-foreground truncate">{task.title}</h3>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditTask(task)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteTask(task.taskUuid)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <p className="text-sm text-foreground/70 line-clamp-3">{task.description}</p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-xs ${getStatusColor(task.status)}`}>
                  {task.status}
                </Badge>
                <Badge variant="outline" className={`text-xs ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-foreground/60">
                  {getCategoryIcon(task.category)}
                  <span>{task.category}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-foreground/60">
                <MessageSquare className="h-3 w-3" />
                <span>{task.commentsCount}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter task title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter task description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-assignee">Assignee UUID</Label>
              <Input
                id="edit-assignee"
                value={formData.assigneeUuid}
                onChange={(e) => setFormData(prev => ({ ...prev, assigneeUuid: e.target.value }))}
                placeholder="Enter assignee UUID"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-assigneeType">Assignee Type</Label>
              <Select value={formData.assigneeUuidType} onValueChange={(value) => setFormData(prev => ({ ...prev, assigneeUuidType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="TEAM">Team</SelectItem>
                  <SelectItem value="ROLE">Role</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-dueAt">Due Date</Label>
              <Input
                id="edit-dueAt"
                type="date"
                value={formData.dueAt}
                onChange={(e) => setFormData(prev => ({ ...prev, dueAt: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPERATIONS">Operations</SelectItem>
                  <SelectItem value="TRAINING">Training</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="PATIENT_CARE">Patient Care</SelectItem>
                  <SelectItem value="EQUIPMENT">Equipment</SelectItem>
                  <SelectItem value="ADMINISTRATION">Administration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-location">Location (Optional)</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Enter location"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTask}>
              Update Task
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {tasks.length === 0 && (
        <div className="rounded-2xl border border-border/50 bg-card p-8">
          <div className="text-center text-foreground/60">
            <h2 className="text-lg font-semibold mb-2">No Tasks Found</h2>
            <p>Create your first task by clicking the + button above.</p>
          </div>
        </div>
      )}
    </div>
  );
}
