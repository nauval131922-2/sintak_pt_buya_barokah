'use client';

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Sidebar from "./Sidebar";
import GlobalSearch from "./GlobalSearch";
import HelpButton from "./HelpButton";
import ChangelogButton from "./ChangelogButton";
import PageChangelogModal from "./PageChangelogModal";
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
  const [showDescTooltip, setShowDescTooltip] = useState(false);
  const [descTooltipPos, setDescTooltipPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!showDescTooltip) return;
    const handleDocClick = () => setShowDescTooltip(false);
    const timer = setTimeout(() => {
      window.addEventListener('click', handleDocClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleDocClick);
    };
  }, [showDescTooltip]);

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
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-deep)] md:[zoom:0.82] md:w-[121.95vw] md:h-[121.95vh] 2xl:[zoom:1] 2xl:w-screen 2xl:h-screen">
      <Sidebar user={user} permissions={permissions} />
      <div className="flex-1 flex flex-col min-w-0 h-screen md:h-full overflow-hidden">
        {/* Header with Title and Global Search */}
        <div className="flex items-center justify-between gap-4 px-4 xl:px-8 py-4 xl:py-5 bg-white border-b border-gray-100">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {/* Mobile Menu Button */}
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('sidebar-mobile-toggle'))}
              className="xl:hidden flex items-center justify-center w-10 h-10 -ml-2 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all shrink-0 active:scale-95"
              title="Menu"
            >
              <Menu size={18} />
            </button>

            {/* Title Section */}
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
                <h1 className="text-[16px] sm:text-[22px] font-extrabold text-gray-800 tracking-tight leading-none whitespace-nowrap">
                  {title || 'SINTAK-PT. Buya Barokah'}
                </h1>
                {showHelp && <HelpButton />}
                <ChangelogButton />
              </div>

              {description && (
                <div className="pl-4 mt-1.5 min-w-0 max-w-full">
                  <div 
                    className="text-sm text-gray-400 font-medium tracking-tight leading-tight truncate cursor-pointer hover:text-gray-600 transition-colors select-none"
                    title={typeof description === 'string' ? description : undefined}
                    onClick={(e) => {
                      const textEl = e.currentTarget;
                      if (textEl.scrollWidth > textEl.clientWidth) {
                        const rect = textEl.getBoundingClientRect();
                        setDescTooltipPos({ top: rect.bottom + 4, left: Math.max(12, rect.left) });
                        setShowDescTooltip(prev => !prev);
                      } else if (showDescTooltip) {
                        setShowDescTooltip(false);
                      }
                    }}
                  >
                    {description}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Section: rightElement + Search */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0 justify-end">
            {rightElement && <div className="shrink-0">{rightElement}</div>}
            <div className="w-auto sm:w-64 lg:w-80 xl:w-[380px] shrink-0">
              <GlobalSearch />
            </div>
          </div>
        </div>
        
        {/* Main Content - internal scroll area (fixed layout) */}
        <div id="main-content-scroll" className="flex-1 min-h-0 flex flex-col min-w-0 overflow-y-auto custom-scrollbar bg-[var(--bg-deep)] px-4 xl:px-8 pt-2 xl:pt-3 pb-4 xl:pb-6">
          {children}
        </div>
      </div>
      <PageChangelogModal />
      {showDescTooltip && typeof document !== 'undefined' && createPortal(
        <div 
          style={{ top: `${descTooltipPos.top}px`, left: `${descTooltipPos.left}px` }}
          className="fixed z-[999999] bg-gray-900 text-white text-[11px] font-semibold px-3 py-2 rounded-lg shadow-xl w-max max-w-[calc(100vw-24px)] sm:max-w-xl break-words pointer-events-none animate-in fade-in duration-100 leading-snug"
        >
          {description}
        </div>,
        document.body
      )}
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

















