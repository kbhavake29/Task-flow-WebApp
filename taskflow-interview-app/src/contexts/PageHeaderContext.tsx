import { createContext, useContext, useState, ReactNode, useCallback } from "react";

interface PageHeaderContextType {
  title: string;
  description?: string;
  actions?: ReactNode;
  setPageHeader: (title: string, description?: string, actions?: ReactNode) => void;
}

const PageHeaderContext = createContext<PageHeaderContextType | undefined>(undefined);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState("Dashboard");
  const [description, setDescription] = useState<string | undefined>();
  const [actions, setActions] = useState<ReactNode | undefined>();

  const setPageHeader = useCallback((newTitle: string, newDescription?: string, newActions?: ReactNode) => {
    setTitle(newTitle);
    setDescription(newDescription);
    setActions(newActions);
  }, []);

  return (
    <PageHeaderContext.Provider value={{ title, description, actions, setPageHeader }}>
      {children}
    </PageHeaderContext.Provider>
  );
}

export function usePageHeader() {
  const context = useContext(PageHeaderContext);
  if (!context) {
    throw new Error("usePageHeader must be used within PageHeaderProvider");
  }
  return context;
}
