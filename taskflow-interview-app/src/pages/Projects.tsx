import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "@/hooks/useProjects";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, FolderKanban, Search, LayoutGrid, List, ChevronLeft, ChevronRight, User } from "lucide-react";
import { ProjectDialog } from "@/components/ProjectDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { useUser } from "@/contexts/UserContext";

const ITEMS_PER_PAGE = 6;

const Projects = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const { setPageHeader } = usePageHeader();
  const { user } = useUser();

  const offset = (currentPage - 1) * ITEMS_PER_PAGE;
  const { projects, pagination, isLoading, deleteProject } = useProjects({ limit: ITEMS_PER_PAGE, offset });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const handleNewProject = useCallback(() => {
    setEditingProject(null);
    setDialogOpen(true);
  }, []);

  useEffect(() => {
    setPageHeader(
      "Projects",
      "Manage your projects and track progress",
      <Button onClick={handleNewProject}>
        <Plus className="mr-2 h-4 w-4" />
        New Project
      </Button>
    );
  }, [setPageHeader, handleNewProject]);

  const { data: taskStats } = useQuery({
    queryKey: ["task-stats"],
    queryFn: async () => {
      const tasks = await apiClient.getTasks();
      const stats: Record<string, { total: number; completed: number; percentage: number }> = {};

      tasks?.forEach((task: any) => {
        if (!stats[task.projectId]) {
          stats[task.projectId] = { total: 0, completed: 0, percentage: 0 };
        }
        stats[task.projectId].total += 1;
        if (task.status === 'completed') {
          stats[task.projectId].completed += 1;
        }
      });

      // Calculate percentages
      Object.keys(stats).forEach((projectId) => {
        const { total, completed } = stats[projectId];
        stats[projectId].percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      });

      return stats;
    },
  });

  // Filter projects based on search query (client-side)
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    if (!searchQuery.trim()) return projects;

    const query = searchQuery.toLowerCase();
    return projects.filter((project) =>
      project.name.toLowerCase().includes(query) ||
      project.description?.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  const displayProjects = searchQuery.trim() ? filteredProjects : projects;

  const handleEdit = (project: any) => {
    setEditingProject(project);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setProjectToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      deleteProject.mutate(projectToDelete);
      setDeleteDialogOpen(false);
      setProjectToDelete(null);
    }
  };

  const totalPages = Math.ceil(pagination.total / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      {/* Search Bar and View Toggle */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center border rounded-md">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("grid")}
            className="rounded-r-none cursor-pointer"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            onClick={() => setViewMode("list")}
            className="rounded-l-none cursor-pointer"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : displayProjects && displayProjects.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1" onClick={() => navigate(`/projects/${project.id}`)}>
                      <CardTitle className="flex items-center gap-2">
                        <FolderKanban className="h-5 w-5 text-primary" />
                        <span className="flex-1">{project.name}</span>
                      </CardTitle>
                      <CardDescription className="mt-1">{project.description || "No description"}</CardDescription>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(project)} className="cursor-pointer">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(project.id)} className="cursor-pointer">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent onClick={() => navigate(`/projects/${project.id}`)}>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                        {taskStats?.[project.id]?.total || 0} tasks
                      </Badge>
                      {project.userId !== user?.id && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                          <User className="h-3 w-3" />
                          {project.userName || project.userEmail?.split('@')[0] || 'Other'}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span className="font-medium">{taskStats?.[project.id]?.percentage || 0}%</span>
                      </div>
                      <Progress value={taskStats?.[project.id]?.percentage || 0} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {displayProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow group">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
                      <FolderKanban className="h-6 w-6 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">{project.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">{project.description || "No description"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                          {taskStats?.[project.id]?.total || 0} tasks
                        </Badge>
                        {project.userId !== user?.id && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                            <User className="h-3 w-3" />
                            {project.userName || project.userEmail?.split('@')[0] || 'Other'}
                          </Badge>
                        )}
                      </div>
                      <div className="w-32 space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-medium">{taskStats?.[project.id]?.percentage || 0}%</span>
                        </div>
                        <Progress value={taskStats?.[project.id]?.percentage || 0} className="h-2" />
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(project)} className="cursor-pointer">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(project.id)} className="cursor-pointer">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            {searchQuery ? (
              <>
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No projects found</h3>
                <p className="text-muted-foreground mb-4">
                  No projects match "{searchQuery}". Try a different search term.
                </p>
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  Clear Search
                </Button>
              </>
            ) : (
              <>
                <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-4">Get started by creating your first project</p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination Controls */}
      {!searchQuery && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1} to {Math.min(offset + ITEMS_PER_PAGE, pagination.total)} of {pagination.total} projects
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className="cursor-pointer min-w-[40px]"
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="cursor-pointer"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingProject(null);
        }}
        project={editingProject}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-3">
              {projectToDelete && projects && (
                <span className="block mb-2 font-medium text-foreground">
                  "{projects.find(p => p.id === projectToDelete)?.name}"
                </span>
              )}
              This will permanently delete this project and all its associated tasks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Projects;
