import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { useEffect } from "react";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

const AdminTasks = () => {
  const { setPageHeader } = usePageHeader();

  useEffect(() => {
    setPageHeader("All Tasks", "View and manage all tasks across the system", undefined);
  }, [setPageHeader]);

  const { data: tasks = [] } = useQuery({
    queryKey: ["admin-tasks"],
    queryFn: async () => {
      return await apiClient.getAllTasks();
    },
  });

  const getStatusIcon = (status: string) => {
    if (status === 'completed') {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    }
    return <Clock className="h-4 w-4 text-orange-600" />;
  };

  const getStatusBadge = (task: any) => {
    if (task.isOverdue) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Overdue
        </Badge>
      );
    }
    if (task.status === 'completed') {
      return <Badge variant="default" className="bg-green-600">Completed</Badge>;
    }
    return <Badge variant="secondary">Pending</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>All Tasks ({tasks.length})</CardTitle>
          <CardDescription>Tasks from all users and projects</CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No tasks found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task: any) => (
                <div
                  key={task.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">{getStatusIcon(task.status)}</div>
                    <div className="flex-1 space-y-1">
                      <h4 className="font-medium">{task.title}</h4>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span>Project: {task.project_name || 'Unknown'}</span>
                        <span>•</span>
                        <span>User: {task.user_email || task.user_name || 'Unknown'}</span>
                        {task.due_date && (
                          <>
                            <span>•</span>
                            <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(task)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTasks;
