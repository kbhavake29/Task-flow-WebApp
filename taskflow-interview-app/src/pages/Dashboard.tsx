import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, CheckCircle2, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { setPageHeader } = usePageHeader();
  const navigate = useNavigate();

  useEffect(() => {
    setPageHeader("Dashboard", "Overview of your projects and tasks", undefined);
  }, [setPageHeader]);
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      return await apiClient.getDashboardStats();
    },
  });

  const { data: overdueTasks } = useQuery({
    queryKey: ["overdue-tasks"],
    queryFn: async () => {
      return await apiClient.getOverdueTasks();
    },
  });

  // Fetch projects and tasks for stacked bar chart
  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      return await apiClient.getProjects();
    },
  });

  const projects = projectsData?.projects || [];

  const { data: allTasks } = useQuery({
    queryKey: ["all-tasks"],
    queryFn: async () => {
      return await apiClient.getTasks();
    },
  });

  // Calculate task distribution with overdue
  const overdueCount = stats?.tasksOverdue || 0;
  const pendingNonOverdue = (stats?.pendingTasks || 0) - overdueCount;
  const completedCount = stats?.completedTasks || 0;

  const pieData = [
    {
      name: "Completed",
      value: completedCount,
      color: "#10b981", // Vibrant green
      icon: "✓"
    },
    {
      name: "Pending",
      value: pendingNonOverdue,
      color: "#f59e0b", // Vibrant orange
      icon: "○"
    },
    {
      name: "Overdue",
      value: overdueCount,
      color: "#ef4444", // Vibrant red
      icon: "!"
    },
  ].filter(item => item.value > 0); // Only show segments with data

  // Custom label render function
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    if (percent < 0.05) return null; // Don't show label if segment is too small

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="font-bold text-sm"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-sm mb-1">{data.name}</p>
          <p className="text-xs text-muted-foreground">
            {data.value} task{data.value !== 1 ? 's' : ''} ({((data.value / (stats?.totalTasks || 1)) * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate stacked bar data for each project
  const stackedBarData = projects?.map((project: any) => {
    const projectTasks = allTasks?.filter((task: any) => task.projectId === project.id) || [];

    const completed = projectTasks.filter((t: any) => t.status === 'completed').length;
    const overdue = projectTasks.filter((t: any) => t.isOverdue).length;
    const pending = projectTasks.filter((t: any) => t.status === 'pending' && !t.isOverdue).length;

    return {
      name: project.name.length > 20 ? project.name.substring(0, 20) + '...' : project.name,
      fullName: project.name,
      Completed: completed,
      Pending: pending,
      Overdue: overdue,
    };
  }) || [];

  // Calculate dynamic height based on number of projects
  const chartHeight = Math.max(350, stackedBarData.length * 50);

  const CustomStackedTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + entry.value, 0);
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-sm mb-2">{payload[0]?.payload?.fullName}</p>
          {payload.reverse().map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </div>
              <span className="font-medium">{entry.value}</span>
            </div>
          ))}
          <div className="border-t mt-2 pt-2 flex justify-between text-xs font-semibold">
            <span>Total:</span>
            <span>{total}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Row 1: Overview Statistics (4 Columns) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Projects Card */}
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
                  <span className="text-xs text-muted-foreground">active</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completed Tasks Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
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

        {/* Pending Tasks Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-950">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-3xl font-bold">{stats?.pendingTasks || 0}</h3>
                  <span className="text-xs text-muted-foreground">to do</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Tasks Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <h3 className="text-3xl font-bold">{stats?.totalTasks || 0}</h3>
                  <span className="text-xs text-muted-foreground">overall</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Task Status Distribution | Overdue Tasks */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Task Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Task Status Distribution</CardTitle>
            <CardDescription>
              {stats?.totalTasks ? `${stats.totalTasks} total task${stats.totalTasks !== 1 ? 's' : ''}` : 'No tasks yet'}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                    animationBegin={0}
                    animationDuration={800}
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(value, entry: any) => (
                      <span className="text-sm">
                        {entry.payload.icon} {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No task data to display</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Tasks Card */}
        {overdueTasks && overdueTasks.length > 0 ? (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle>Overdue Tasks</CardTitle>
              </div>
              <CardDescription>
                You have {overdueTasks.length} overdue task{overdueTasks.length !== 1 ? 's' : ''} that need attention
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-[350px] overflow-y-auto">
              <div className="space-y-3">
                {overdueTasks.map((task: any) => (
                  <div
                    key={task.id}
                    onClick={() => navigate(`/projects/${task.projectId}`)}
                    className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{task.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {task.projectName && (
                          <Badge variant="outline" className="text-xs">
                            <FolderKanban className="h-3 w-3 mr-1" />
                            {task.projectName}
                          </Badge>
                        )}
                        <Badge variant="destructive" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <CardTitle>All Caught Up!</CardTitle>
              </div>
              <CardDescription>No overdue tasks</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[300px]">
              <div className="text-center">
                <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-600 opacity-50" />
                <p className="text-muted-foreground">You're doing great! No overdue tasks.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Row 3: Project Task Breakdown (Full Width) */}
      <Card>
        <CardHeader>
          <CardTitle>Project Task Breakdown</CardTitle>
          <CardDescription>Task status by project (all projects)</CardDescription>
        </CardHeader>
        <CardContent style={{ height: `${chartHeight}px` }}>
          {stackedBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stackedBarData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  width={180}
                />
                <Tooltip content={<CustomStackedTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                />
                <Bar dataKey="Completed" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Pending" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Overdue" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <FolderKanban className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No project data to display</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
