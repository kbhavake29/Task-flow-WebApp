import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  isArchived: number;
  createdAt: string;
  updatedAt: string;
  userEmail?: string;
  userName?: string | null;
}

export const useProjects = (params?: { limit?: number; offset?: number }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["projects", params],
    queryFn: async () => {
      return await apiClient.getProjects(params);
    },
  });

  const projects = data?.projects || [];
  const pagination = data?.pagination || { total: 0, limit: params?.limit || 50, offset: params?.offset || 0 };

  const createProject = useMutation({
    mutationFn: async (project: { name: string; description: string }) => {
      return await apiClient.createProject(project);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: "Success", description: "Project created successfully" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Project> & { id: string }) => {
      return await apiClient.updateProject(id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: "Success", description: "Project updated successfully" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.deleteProject(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: "Success", description: "Project deleted successfully" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  return {
    projects,
    pagination,
    isLoading,
    createProject,
    updateProject,
    deleteProject,
  };
};
