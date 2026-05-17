'use client';

import { useState, useCallback, useEffect } from 'react';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import RecordsForm from './RecordsForm';
import InfractionsTable from './InfractionsTable/InfractionsTable';
import { ClipboardList, PlusSquare, Pencil } from 'lucide-react';

type RecordsTabsProps = {
  employees: any[];
  orders: any[];
  infractions: any[];
  initialPeriod: { start: string; end: string };
};

export default function RecordsTabs({ employees, orders, infractions: initialInfractions, initialPeriod }: RecordsTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const tabParam = searchParams.get('tab');
  const activeTab = tabParam === 'form' ? 'form' : 'list';

  const [editingInfraction, setEditingInfraction] = useState<any | null>(null);
  // Local state for infractions — updated client-side after save, no full page reload needed
  const [localInfractions, setLocalInfractions] = useState<any[]>(initialInfractions);
  const [currentPeriod, setCurrentPeriod] = useState(initialPeriod);

  const setActiveTab = (tab: 'list' | 'form') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Lightweight client-side refetch for the current period (no full page reload)
  const refreshInfractions = useCallback(async (period?: { start: string; end: string }) => {
    const p = period || currentPeriod;
    try {
      const res = await fetch(`/api/infractions?start=${p.start}&end=${p.end}`);
      if (res.ok) {
        const json = await res.json();
        setLocalInfractions(json.data || []);
      }
    } catch (e) {
      console.error('Failed to refresh infractions', e);
    }
  }, [currentPeriod]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sintak_data_updated') {
        refreshInfractions();
        router.refresh();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshInfractions, router]);


  const handleEdit = useCallback((inf: any) => {
    setEditingInfraction(inf);
    setActiveTab('form');
  }, [pathname, searchParams, router]);

  const handleCancelEdit = useCallback(() => {
    setEditingInfraction(null);
  }, []);

  const handlePeriodChange = useCallback((start: string, end: string) => {
    setCurrentPeriod({ start, end });
  }, []);


  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in duration-700 overflow-hidden">
      {/* Tab Navigation - Underline Style (mengikuti pola JHP) */}
      <div className="flex gap-6 border-b border-gray-100 shrink-0 px-2 mt-1">
        <button
          onClick={() => {
            setActiveTab('list');
            handleCancelEdit();
          }}
          className={`flex items-center gap-1.5 pb-3 px-2 text-[13px] font-bold border-b-2 transition-all ${
            activeTab === 'list'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ClipboardList size={14} />
          <span>Daftar Kesalahan</span>
        </button>
        <button
          onClick={() => { setActiveTab('form'); handleCancelEdit(); }}
          className={`flex items-center gap-1.5 pb-3 px-2 text-[13px] font-bold border-b-2 transition-all ${
            activeTab === 'form'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {editingInfraction ? <Pencil size={14} /> : <PlusSquare size={14} />}
          <span>{editingInfraction ? 'Edit Data' : 'Tambah Data'}</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className={`flex-1 flex flex-col gap-6 overflow-hidden ${activeTab === 'list' ? 'flex' : 'hidden'}`}>
        <InfractionsTable
          infractions={localInfractions}
          onEdit={handleEdit}
          onPeriodChange={handlePeriodChange}
          onRefresh={refreshInfractions}
          initialStartDate={currentPeriod.start}
          initialEndDate={currentPeriod.end}
        />
      </div>

      <div className={`flex-1 flex flex-col overflow-hidden ${activeTab === 'form' ? 'flex' : 'hidden'}`}>
        <div className="overflow-auto animate-in fade-in slide-in-from-bottom-2 duration-300 pb-10">
          <RecordsForm
            employees={employees}
            orders={orders}
            editingInfraction={editingInfraction}
            onCancelEdit={() => {
              handleCancelEdit();
              setActiveTab('list');
            }}
            onSuccessEdit={() => { handleCancelEdit(); setActiveTab('list'); }}
            onRefreshInfractions={refreshInfractions}
          />
        </div>
      </div>
    </div>
  );
}

















