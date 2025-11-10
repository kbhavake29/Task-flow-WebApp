import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import apiClient from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Download, Trash2, User, Lock, BarChart3, FileJson, FileSpreadsheet, AlertTriangle } from "lucide-react";

export default function Settings() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Profile state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState("");

  // Fetch profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => apiClient.getProfile(),
    onSuccess: (data) => {
      setName(data.name || "");
      setEmail(data.email || "");
    },
  });

  // Fetch account stats
  const { data: stats } = useQuery({
    queryKey: ["accountStats"],
    queryFn: () => apiClient.getAccountStats(),
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: { name?: string; email?: string }) => apiClient.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Success", description: "Profile updated successfully" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: ({ current, newPass }: { current: string; newPass: string }) =>
      apiClient.changePassword(current, newPass),
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Success", description: "Password changed successfully" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: () => apiClient.deleteAccount(),
    onSuccess: () => {
      toast({ title: "Account deleted", description: "Your account has been permanently deleted" });
      navigate("/auth");
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ name, email });
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "Passwords do not match" });
      return;
    }
    changePasswordMutation.mutate({ current: currentPassword, newPass: newPassword });
  };

  const handleDeleteAccount = () => {
    if (deleteConfirm !== "DELETE") {
      toast({ variant: "destructive", title: "Error", description: 'Please type "DELETE" to confirm' });
      return;
    }
    deleteAccountMutation.mutate();
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportJSON = async () => {
    try {
      const blob = await apiClient.exportJSON();
      downloadFile(blob, `taskflow-export-${Date.now()}.json`);
      toast({ title: "Success", description: "Data exported as JSON" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleExportTasksCSV = async () => {
    try {
      const blob = await apiClient.exportTasksCSV();
      downloadFile(blob, `taskflow-tasks-${Date.now()}.csv`);
      toast({ title: "Success", description: "Tasks exported as CSV" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  const handleExportProjectsCSV = async () => {
    try {
      const blob = await apiClient.exportProjectsCSV();
      downloadFile(blob, `taskflow-projects-${Date.now()}.csv`);
      toast({ title: "Success", description: "Projects exported as CSV" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    }
  };

  if (profileLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="container max-w-4xl p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle>Profile</CardTitle>
          </div>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
            <Button type="submit" disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Password Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <CardTitle>Change Password</CardTitle>
          </div>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={changePasswordMutation.isPending}>
              {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account Stats */}
      {stats && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <CardTitle>Account Statistics</CardTitle>
            </div>
            <CardDescription>Your activity overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold">{stats.totalProjects}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{stats.totalTasks}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed Tasks</p>
                <p className="text-2xl font-bold">{stats.completedTasks}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{stats.completionRate}%</p>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Account Age</p>
                <p className="text-lg font-semibold">{stats.accountAge.days} days</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Most Productive Day</p>
                <p className="text-lg font-semibold">{stats.mostProductiveDay || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Data */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            <CardTitle>Export Data</CardTitle>
          </div>
          <CardDescription>Download your data in various formats</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={handleExportJSON} variant="outline" className="w-full justify-start">
            <FileJson className="h-4 w-4 mr-2" />
            Export All Data (JSON)
          </Button>
          <Button onClick={handleExportTasksCSV} variant="outline" className="w-full justify-start">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Tasks (CSV)
          </Button>
          <Button onClick={handleExportProjectsCSV} variant="outline" className="w-full justify-start">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Projects (CSV)
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </div>
          <CardDescription>Irreversible actions for your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              Deleting your account will permanently remove all your data including projects, tasks, and settings.
              This action cannot be undone.
            </AlertDescription>
          </Alert>
          <div className="space-y-2">
            <Label htmlFor="deleteConfirm">Type "DELETE" to confirm</Label>
            <Input
              id="deleteConfirm"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
            />
          </div>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={deleteAccountMutation.isPending || deleteConfirm !== "DELETE"}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
