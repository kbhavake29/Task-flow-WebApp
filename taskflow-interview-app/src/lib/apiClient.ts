/**
 * API Client for TaskFlow Backend
 * Handles all API requests, authentication, and token management
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Load tokens from localStorage on initialization
    this.loadTokens();
  }

  private loadTokens() {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  private saveTokens(accessToken: string, refreshToken?: string) {
    this.accessToken = accessToken;
    localStorage.setItem('accessToken', accessToken);

    if (refreshToken) {
      this.refreshToken = refreshToken;
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        return false;
      }

      const result: ApiResponse<{ accessToken: string }> = await response.json();

      if (result.success && result.data) {
        this.saveTokens(result.data.accessToken);
        return true;
      }

      this.clearTokens();
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      return false;
    }
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authorization header if we have an access token
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      let response = await fetch(url, {
        ...options,
        headers,
      });

      // If unauthorized and we have a refresh token, try to refresh
      if (response.status === 401 && this.refreshToken) {
        const refreshed = await this.refreshAccessToken();

        if (refreshed) {
          // Retry the original request with new token
          headers['Authorization'] = `Bearer ${this.accessToken}`;
          response = await fetch(url, {
            ...options,
            headers,
          });
        } else {
          // Refresh failed, clear tokens and throw error
          this.clearTokens();
          window.location.href = '/auth';
          throw new Error('Session expired. Please log in again.');
        }
      }

      const data: ApiResponse<T> = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async signUp(email: string, password: string): Promise<AuthTokens & { user: any }> {
    const result = await this.request<AuthTokens & { user: any }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (result.success && result.data) {
      this.saveTokens(result.data.accessToken, result.data.refreshToken);
      return result.data;
    }

    throw new Error(result.message || 'Sign up failed');
  }

  async signIn(email: string, password: string): Promise<AuthTokens & { user: any }> {
    const result = await this.request<AuthTokens & { user: any }>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (result.success && result.data) {
      this.saveTokens(result.data.accessToken, result.data.refreshToken);
      return result.data;
    }

    throw new Error(result.message || 'Sign in failed');
  }

  async signOut(): Promise<void> {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
    } finally {
      this.clearTokens();
    }
  }

  async getCurrentUser(): Promise<any> {
    const result = await this.request<{ user: any }>('/auth/user', {
      method: 'GET',
    });

    if (result.success && result.data) {
      return result.data.user;
    }

    throw new Error('Failed to get current user');
  }

  // Project methods
  async getProjects(params?: { limit?: number; offset?: number }): Promise<{ projects: any[]; pagination: { total: number; limit: number; offset: number } }> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const queryString = queryParams.toString();
    const url = `/projects${queryString ? `?${queryString}` : ''}`;

    const result = await this.request<{ projects: any[]; pagination: any }>(url, {
      method: 'GET',
    });

    if (result.success && result.data) {
      return result.data;
    }

    return { projects: [], pagination: { total: 0, limit: params?.limit || 50, offset: params?.offset || 0 } };
  }

  async getProject(id: string): Promise<any> {
    const result = await this.request<{ project: any }>(`/projects/${id}`, {
      method: 'GET',
    });

    if (result.success && result.data) {
      return result.data.project;
    }

    throw new Error('Failed to get project');
  }

  async createProject(project: { name: string; description?: string }): Promise<any> {
    const result = await this.request<{ project: any }>('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });

    if (result.success && result.data) {
      return result.data.project;
    }

    throw new Error(result.message || 'Failed to create project');
  }

  async updateProject(id: string, updates: { name?: string; description?: string }): Promise<any> {
    const result = await this.request<{ project: any }>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });

    if (result.success && result.data) {
      return result.data.project;
    }

    throw new Error(result.message || 'Failed to update project');
  }

  async deleteProject(id: string): Promise<void> {
    const result = await this.request(`/projects/${id}`, {
      method: 'DELETE',
    });

    if (!result.success) {
      throw new Error(result.message || 'Failed to delete project');
    }
  }

  // Task methods
  async getTasks(projectId?: string): Promise<any[]> {
    const url = projectId ? `/tasks?projectId=${projectId}` : '/tasks';
    const result = await this.request<{ tasks: any[] }>(url, {
      method: 'GET',
    });

    if (result.success && result.data) {
      return result.data.tasks;
    }

    return [];
  }

  async getTask(id: string): Promise<any> {
    const result = await this.request<{ task: any }>(`/tasks/${id}`, {
      method: 'GET',
    });

    if (result.success && result.data) {
      return result.data.task;
    }

    throw new Error('Failed to get task');
  }

  async createTask(task: {
    projectId: string;
    title: string;
    dueDate?: string
  }): Promise<any> {
    const result = await this.request<{ task: any }>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });

    if (result.success && result.data) {
      return result.data.task;
    }

    throw new Error(result.message || 'Failed to create task');
  }

  async updateTask(id: string, updates: {
    title?: string;
    status?: string;
    dueDate?: string
  }): Promise<any> {
    const result = await this.request<{ task: any }>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });

    if (result.success && result.data) {
      return result.data.task;
    }

    throw new Error(result.message || 'Failed to update task');
  }

  async deleteTask(id: string): Promise<void> {
    const result = await this.request(`/tasks/${id}`, {
      method: 'DELETE',
    });

    if (!result.success) {
      throw new Error(result.message || 'Failed to delete task');
    }
  }

  async bulkUpdateTaskStatus(taskIds: string[], status: 'pending' | 'completed'): Promise<{ updatedCount: number; tasks: any[] }> {
    const result = await this.request<{ updatedCount: number; tasks: any[] }>('/tasks/bulk-update-status', {
      method: 'PATCH',
      body: JSON.stringify({ taskIds, status }),
    });

    if (result.success && result.data) {
      return result.data;
    }

    throw new Error(result.message || 'Failed to bulk update tasks');
  }

  async getOverdueTasks(): Promise<any[]> {
    const result = await this.request<{ tasks: any[] }>('/tasks/overdue', {
      method: 'GET',
    });

    if (result.success && result.data) {
      return result.data.tasks;
    }

    return [];
  }

  // Dashboard stats
  async getDashboardStats(): Promise<any> {
    const result = await this.request<{ stats: any }>('/stats/dashboard', {
      method: 'GET',
    });

    if (result.success && result.data) {
      return result.data.stats;
    }

    throw new Error('Failed to get dashboard stats');
  }

  // Profile methods
  async getProfile(): Promise<any> {
    const result = await this.request<{ profile: any }>('/profile', {
      method: 'GET',
    });

    if (result.success && result.data) {
      return result.data.profile;
    }

    throw new Error('Failed to get profile');
  }

  async updateProfile(data: { name?: string; email?: string }): Promise<any> {
    const result = await this.request<{ profile: any }>('/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });

    if (result.success && result.data) {
      return result.data.profile;
    }

    throw new Error(result.message || 'Failed to update profile');
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const result = await this.request('/profile/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!result.success) {
      throw new Error(result.message || 'Failed to change password');
    }
  }

  async deleteAccount(): Promise<void> {
    const result = await this.request('/profile', {
      method: 'DELETE',
    });

    if (!result.success) {
      throw new Error(result.message || 'Failed to delete account');
    }

    this.clearTokens();
  }

  // Account stats
  async getAccountStats(): Promise<any> {
    const result = await this.request<{ stats: any }>('/stats/account', {
      method: 'GET',
    });

    if (result.success && result.data) {
      return result.data.stats;
    }

    throw new Error('Failed to get account stats');
  }

  // Export methods
  async exportJSON(): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/export/json`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export data');
    }

    return response.blob();
  }

  async exportTasksCSV(): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/export/tasks-csv`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export tasks');
    }

    return response.blob();
  }

  async exportProjectsCSV(): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/export/projects-csv`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export projects');
    }

    return response.blob();
  }

  // Admin methods
  async getAdminStats(): Promise<any> {
    const result = await this.request<any>('/admin/stats', {
      method: 'GET',
    });

    if (result.success && result.data) {
      return result.data;
    }

    throw new Error('Failed to get admin stats');
  }

  async getAllUsers(): Promise<any[]> {
    const result = await this.request<{ users: any[] }>('/admin/users', {
      method: 'GET',
    });

    if (result.success && result.data) {
      return result.data.users;
    }

    return [];
  }

  async getAllProjects(): Promise<any[]> {
    const result = await this.request<{ projects: any[] }>('/admin/projects', {
      method: 'GET',
    });

    if (result.success && result.data) {
      return result.data.projects;
    }

    return [];
  }

  async getAllTasks(): Promise<any[]> {
    const result = await this.request<{ tasks: any[] }>('/admin/tasks', {
      method: 'GET',
    });

    if (result.success && result.data) {
      return result.data.tasks;
    }

    return [];
  }

  // Helper methods
  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  // Decode JWT to get user info including role
  getUserFromToken(): { userId: string; email: string; role: string } | null {
    if (!this.accessToken) return null;

    try {
      const parts = this.accessToken.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      return {
        userId: payload.userId,
        email: payload.email,
        role: payload.role || 'user',
      };
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  }

  isAdmin(): boolean {
    const user = this.getUserFromToken();
    return user?.role === 'admin';
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
