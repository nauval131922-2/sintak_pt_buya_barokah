'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface PageHeaderState {
  title: string;
  description?: ReactNode;
  rightElement?: ReactNode;
  showHelp?: boolean;
}

interface PageHeaderContextValue extends PageHeaderState {
  setPageHeader: (state: PageHeaderState) => void;
}

const PageHeaderContext = createContext<PageHeaderContextValue | null>(null);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PageHeaderState>({
    title: '',
    description: undefined,
    rightElement: undefined,
    showHelp: true,
  });

  return (
    <PageHeaderContext.Provider value={{ ...state, setPageHeader: setState }}>
      {children}
    </PageHeaderContext.Provider>
  );
}

export function usePageHeader() {
  const context = useContext(PageHeaderContext);
  if (!context) throw new Error('usePageHeader must be used within PageHeaderProvider');
  return context;
}
