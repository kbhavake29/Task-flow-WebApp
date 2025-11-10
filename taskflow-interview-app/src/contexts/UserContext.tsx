import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiClient } from "@/lib/apiClient";

interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

interface UserContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  refetchUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    try {
      setIsLoading(true);

      // First try to get user from token (faster, no API call needed)
      const tokenUser = apiClient.getUserFromToken();

      if (!tokenUser) {
        setUser(null);
        return;
      }

      // Then fetch full user details from API
      const currentUser = await apiClient.getCurrentUser();

      setUser({
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role || 'user',
        emailVerified: currentUser.emailVerified,
        createdAt: currentUser.createdAt,
        lastLoginAt: currentUser.lastLoginAt,
      });
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (apiClient.isAuthenticated()) {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <UserContext.Provider value={{ user, isAdmin, isLoading, refetchUser: fetchUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}
