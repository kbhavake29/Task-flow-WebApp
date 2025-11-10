export interface Task {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  due_date: Date | null;
  status: 'pending' | 'completed';
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface TaskResponse {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  dueDate: Date | null;
  status: 'pending' | 'completed';
  isOverdue: boolean;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  projectName?: string;
}

export interface CreateTaskRequest {
  projectId: string;
  title: string;
  dueDate?: string | Date;
}

export interface UpdateTaskRequest {
  title?: string;
  dueDate?: string | Date | null;
  status?: 'pending' | 'completed';
}
