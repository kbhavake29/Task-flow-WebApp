import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FolderKanban, CheckSquare, Clock, TrendingUp, AlertCircle, Shield } from "lucide-react";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { useEffect } from "react";

const AdminDashboard = () => {
  const { setPageHeader } = usePageHeader();

  useEffect(() => {
    setPageHeader("Admin Dashboard", "System-wide overview and statistics", undefined);
  }, [setPageHeader]);

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      return await apiClient.getAdminStats();
    },
  });

  return (
    <div className="space-y-6">
      {/* Row 1: User Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-3xl font-bold">{stats?.totalUsers || 0}</h3>
                  <span className="text-xs text-muted-foreground">registered</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-3xl font-bold">{stats?.activeUsers || 0}</h3>
                  <span className="text-xs text-muted-foreground">last 30 days</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950">
                <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Admin Users</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-3xl font-bold">{stats?.adminUsers || 0}</h3>
                  <span className="text-xs text-muted-foreground">with access</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Project & Task Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
                <FolderKanban className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-3xl font-bold">{stats?.totalProjects || 0}</h3>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950">
                <CheckSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-3xl font-bold">{stats?.totalTasks || 0}</h3>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950">
                <CheckSquare className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-3xl font-bold">{stats?.completedTasks || 0}</h3>
                  <span className="text-xs text-muted-foreground">
                    {stats?.totalTasks ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}%` : '0%'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-3xl font-bold">{stats?.overdueTasks || 0}</h3>
                  <span className="text-xs text-muted-foreground">tasks</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Overview of platform usage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Pending Tasks</span>
                <span className="font-medium">{stats?.pendingTasks || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Task Completion Rate</span>
                <span className="font-medium">
                  {stats?.totalTasks ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}%` : '0%'}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Average Projects per User</span>
                <span className="font-medium">
                  {stats?.totalUsers ? (stats.totalProjects / stats.totalUsers).toFixed(1) : '0'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Average Tasks per Project</span>
                <span className="font-medium">
                  {stats?.totalProjects ? (stats.totalTasks / stats.totalProjects).toFixed(1) : '0'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
