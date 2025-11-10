export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
  is_archived: boolean;
  user_email?: string;
  user_name?: string | null;
}

export interface ProjectResponse {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  taskCount?: number;
  userEmail?: string;
  userName?: string | null;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  isArchived?: boolean;
}
