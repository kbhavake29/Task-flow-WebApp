import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePageHeader } from "@/contexts/PageHeaderContext";
import { useEffect } from "react";
import { Shield, User, CheckCircle, XCircle } from "lucide-react";

const AdminUsers = () => {
  const { setPageHeader } = usePageHeader();

  useEffect(() => {
    setPageHeader("User Management", "View and manage all system users", undefined);
  }, [setPageHeader]);

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      return await apiClient.getAllUsers();
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
          <CardDescription>System user overview</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user: any) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      {user.role === 'admin' ? (
                        <Shield className="h-5 w-5" />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{user.email}</h4>
                        {user.role === 'admin' && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            Admin
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        {user.name && <span>{user.name}</span>}
                        {user.name && <span>•</span>}
                        <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
                        {user.last_login_at && (
                          <>
                            <span>•</span>
                            <span>Last login: {new Date(user.last_login_at).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user.email_verified ? (
                      <Badge variant="default" className="gap-1 bg-green-600">
                        <CheckCircle className="h-3 w-3" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Unverified
                      </Badge>
                    )}
                    {user.is_active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
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

export default AdminUsers;
