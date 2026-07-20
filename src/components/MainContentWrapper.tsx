'use client';

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Sidebar from "./Sidebar";
import GlobalSearch from "./GlobalSearch";
import HelpButton from "./HelpButton";
import { ShieldAlert, X, Menu } from 'lucide-react';
import { PageHeaderProvider, usePageHeader } from '@/contexts/PageHeaderContext';
import type { PermissionMap } from '@/lib/permissions-constants';

interface MainContentWrapperProps {
  children: React.ReactNode;
  user: {
    name: string;
    username: string;
    role?: string;
    roles?: string[];
    photo?: string | null;
  } | null;
  permissions?: PermissionMap;
}

function MainContentInner({
  children,
  user,
  permissions = {},
}: MainContentWrapperProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isStaleRef = useRef(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { title, description, showHelp, rightElement } = usePageHeader();

  // Sync initial state from localStorage after mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar_expanded');
      if (saved !== null) {
        setIsCollapsed(!JSON.parse(saved));
      }
    }
  }, []);

  useEffect(() => {
    const handleToggle = (e: any) => {
      setIsCollapsed(e.detail.isCollapsed);
    };

    const handleRefresh = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        router.refresh();
        isStaleRef.current = false;
      } else {
        isStaleRef.current = true;
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sintak_profile_updated' || e.key === 'sintak_data_updated') {
        handleRefresh();
      }
    };

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible' && isStaleRef.current) {
        handleRefresh();
      }
    };

    window.addEventListener('sidebar-toggle', handleToggle);
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('sidebar-toggle', handleToggle);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router]);

  const isLoginPage = pathname ? pathname.startsWith('/login') : false;

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg-deep)]">
      <Sidebar user={user} permissions={permissions} />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Header with Title and Global Search */}
        <div className="flex items-center justify-between gap-4 px-4 xl:px-8 py-4 xl:py-5 bg-white border-b border-gray-100">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {/* Mobile Menu Button */}
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('sidebar-mobile-toggle'))}
              className="xl:hidden flex flex-col gap-1 p-2 -ml-2 mt-1 rounded-xl hover:bg-gray-100 text-gray-500 transition-all shrink-0 group active:scale-95"
              title="Menu"
            >
              <div className="w-5 h-0.5 bg-gray-400 group-hover:bg-green-600 rounded-full transition-all" />
              <div className="w-3 h-0.5 bg-gray-400 group-hover:bg-green-600 rounded-full transition-all" />
              <div className="w-5 h-0.5 bg-gray-400 group-hover:bg-green-600 rounded-full transition-all" />
            </button>

            {/* Title Section */}
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2 border-l-4 border-green-500 pl-3">
                <h1 className="text-[22px] font-extrabold text-gray-800 tracking-tight leading-none truncate">
                  {title || 'SINTAK ERP'}
                </h1>
                {showHelp && <HelpButton />}
              </div>

              {description && (
                <div className="pl-4 mt-2">
                  <div className="text-sm text-gray-400 font-medium tracking-tight leading-tight max-w-4xl">
                    {description}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Section: rightElement + Search */}
          <div className="flex items-center gap-4 shrink-0 min-w-0">
            {rightElement && <div className="shrink-0">{rightElement}</div>}
            <div className="w-[500px]">
              <GlobalSearch />
            </div>
          </div>
        </div>
        
        {/* Main Content - page scrolls naturally (body-level), not internal clip */}
        <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-deep)] px-4 xl:px-8 pt-2 xl:pt-3 pb-4 xl:pb-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function MainContentWrapper(props: MainContentWrapperProps) {
  return (
    <PageHeaderProvider>
      <MainContentInner {...props} />
    </PageHeaderProvider>
  );
}

















