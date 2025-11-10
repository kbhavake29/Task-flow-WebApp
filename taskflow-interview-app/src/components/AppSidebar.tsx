import { LayoutDashboard, FolderKanban, Settings, LogOut, ChartNoAxesGantt, Shield, CheckSquare, Users } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/apiClient";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";

const items = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Settings", url: "/settings", icon: Settings },
];

const adminItems = [
  { title: "Admin Dashboard", url: "/admin", icon: Shield },
  { title: "All Tasks", url: "/admin/tasks", icon: CheckSquare },
  { title: "Users", url: "/admin/users", icon: Users },
];

interface AppSidebarProps {
  user: any;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showLogout, setShowLogout] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowLogout(false);
      }
    };

    if (showLogout) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLogout]);

  const handleLogout = async () => {
    try {
      await apiClient.signOut();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate("/auth");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to logout",
      });
    }
  };

  const toggleLogout = () => {
    setShowLogout(!showLogout);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Logo */}
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" className="cursor-default hover:bg-transparent">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <ChartNoAxesGantt className="size-5" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">TaskFlow</span>
                    <span className="text-xs text-muted-foreground">Project Manager</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Navigation Items */}
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-sidebar-accent cursor-pointer"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className="hover:bg-sidebar-accent cursor-pointer"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div ref={popupRef} className="relative">
              <SidebarMenuButton
                size="lg"
                onClick={toggleLogout}
                className="cursor-pointer"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm rounded-lg">
                    {user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-0.5 leading-none flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{user?.email?.split('@')[0]}</span>
                    {isAdmin && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                        Admin
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                </div>
              </SidebarMenuButton>
              {showLogout && (
                <div className="absolute bottom-0 left-full ml-2 bg-popover border rounded-md shadow-lg min-w-[200px] z-50">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full p-3 hover:bg-accent rounded-md cursor-pointer transition-colors text-sm"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
