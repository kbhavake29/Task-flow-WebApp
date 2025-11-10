import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useTasks } from "@/hooks/useTasks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Pencil, Trash2, Calendar, CheckCircle2, Circle, XCircle } from "lucide-react";
import { TaskDialog } from "@/components/TaskDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { toast } from "sonner";
import { usePageHeader } from "@/contexts/PageHeaderContext";

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { tasks, updateTask, deleteTask } = useTasks(id);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const { setPageHeader } = usePageHeader();

  const { data: project } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      if (!id) throw new Error("Project ID is required");
      return await apiClient.getProject(id);
    },
    enabled: !!id,
  });

  const handleAddTask = useCallback(() => {
    setEditingTask(null);
    setDialogOpen(true);
  }, []);

  useEffect(() => {
    if (project) {
      setPageHeader(
        project.name,
        project.description || "No description",
        <Button onClick={handleAddTask}>
          <Plus className="mr-2 h-4 w-4" />
          Add Task
        </Button>
      );
    }
  }, [project, setPageHeader, handleAddTask]);

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ taskIds, status }: { taskIds: string[]; status: 'pending' | 'completed' }) => {
      return await apiClient.bulkUpdateTaskStatus(taskIds, status);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setSelectedTaskIds(new Set());
      toast.success(`${data.updatedCount} task(s) updated successfully`);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update tasks");
    },
  });

  const handleToggleStatus = async (taskId: string, currentStatus: string) => {
    await updateTask.mutateAsync({
      id: taskId,
      status: currentStatus === "completed" ? "pending" : "completed",
    });
  };

  const handleTaskSelection = (taskId: string, checked: boolean) => {
    const newSelection = new Set(selectedTaskIds);
    if (checked) {
      newSelection.add(taskId);
    } else {
      newSelection.delete(taskId);
    }
    setSelectedTaskIds(newSelection);
  };

  const handleSelectAll = () => {
    if (tasks && tasks.length > 0) {
      setSelectedTaskIds(new Set(tasks.map(t => t.id)));
    }
  };

  const handleDeselectAll = () => {
    setSelectedTaskIds(new Set());
  };

  const handleBulkMarkCompleted = () => {
    if (selectedTaskIds.size > 0) {
      bulkUpdateMutation.mutate({
        taskIds: Array.from(selectedTaskIds),
        status: 'completed',
      });
    }
  };

  const handleBulkMarkPending = () => {
    if (selectedTaskIds.size > 0) {
      bulkUpdateMutation.mutate({
        taskIds: Array.from(selectedTaskIds),
        status: 'pending',
      });
    }
  };

  const handleEdit = (task: any) => {
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleDelete = (taskId: string) => {
    setTaskToDelete(taskId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (taskToDelete) {
      deleteTask.mutate(taskToDelete);
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  if (!project) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Bulk Actions Bar */}
      {selectedTaskIds.size > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <p className="text-sm font-medium">
                  {selectedTaskIds.size} task{selectedTaskIds.size !== 1 ? 's' : ''} selected
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkMarkCompleted}
                    disabled={bulkUpdateMutation.isPending}
                    className="cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark Completed
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkMarkPending}
                    disabled={bulkUpdateMutation.isPending}
                    className="cursor-pointer"
                  >
                    <Circle className="h-4 w-4 mr-2" />
                    Mark Pending
                  </Button>
                </div>
              </div>
              <div className="flex gap-2">
                {tasks && selectedTaskIds.size < tasks.length && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    className="cursor-pointer"
                  >
                    Select All
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeselectAll}
                  className="cursor-pointer"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Deselect All
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks && tasks.length > 0 ? (
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                >
                  <Checkbox
                    checked={selectedTaskIds.has(task.id)}
                    onCheckedChange={(checked) => handleTaskSelection(task.id, checked as boolean)}
                    className="cursor-pointer"
                  />
                  <Checkbox
                    checked={task.status === "completed"}
                    onCheckedChange={() => handleToggleStatus(task.id, task.status)}
                    className="cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className={`font-medium ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                      {task.title}
                    </p>
                    {task.dueDate && (
                      <p className={`text-sm flex items-center gap-1 mt-1 ${task.isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                        <Calendar className="h-3 w-3" />
                        Due: {format(new Date(task.dueDate), "MMM dd, yyyy")}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={
                      task.isOverdue ? "destructive" :
                      task.status === "completed" ? "default" : "outline"
                    }
                    className={
                      task.status === "pending" && !task.isOverdue
                        ? "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800"
                        : ""
                    }
                  >
                    {task.isOverdue ? "overdue" : task.status}
                  </Badge>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(task)} className="cursor-pointer">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(task.id)} className="cursor-pointer">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No tasks yet</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Task
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingTask(null);
        }}
        projectId={id!}
        task={editingTask}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this task. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectDetail;
