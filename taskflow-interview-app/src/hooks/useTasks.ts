import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";

export interface Task {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  dueDate: string | null;
  status: "pending" | "completed";
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const useTasks = (projectId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      const data = await apiClient.getTasks(projectId);
      return data as Task[];
    },
    enabled: projectId !== undefined,
  });

  const createTask = useMutation({
    mutationFn: async (task: { projectId: string; title: string; dueDate?: string }) => {
      return await apiClient.createTask(task);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({ title: "Success", description: "Task created successfully" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      return await apiClient.updateTask(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({ title: "Success", description: "Task updated successfully" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.deleteTask(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast({ title: "Success", description: "Task deleted successfully" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  return {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
  };
};
