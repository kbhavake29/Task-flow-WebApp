import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { apiClient } from "@/lib/apiClient";
import { PageHeaderProvider, usePageHeader } from "@/contexts/PageHeaderContext";
import { UserProvider, useUser } from "@/contexts/UserContext";

interface LayoutProps {
  children: ReactNode;
}

function LayoutContent({ children }: LayoutProps) {
  const { title, description, actions } = usePageHeader();

  return (
    <>
      <header className="border-b bg-card">
        <div className="flex items-center px-6 py-4">
          <SidebarTrigger className="mr-4" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </>
  );
}

function LayoutWithUser({ children }: LayoutProps) {
  const navigate = useNavigate();
  const { user, isLoading } = useUser();

  useEffect(() => {
    // Check authentication status
    if (!apiClient.isAuthenticated()) {
      navigate("/auth");
      return;
    }

    // If we finished loading but have no user, redirect to auth
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [navigate, isLoading, user]);

  if (isLoading || !user) {
    return null; // Show nothing while checking auth
  }

  return (
    <PageHeaderProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar user={user} />
          <div className="flex-1 flex flex-col">
            <LayoutContent>{children}</LayoutContent>
          </div>
        </div>
      </SidebarProvider>
    </PageHeaderProvider>
  );
}

export default function Layout({ children }: LayoutProps) {
  return (
    <UserProvider>
      <LayoutWithUser>{children}</LayoutWithUser>
    </UserProvider>
  );
}
