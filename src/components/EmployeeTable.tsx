'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Loader2, AlertCircle, Users } from "lucide-react";
import ImportInfo from "@/components/ImportInfo";
import SearchAndReload from "@/components/SearchAndReload";
import { useRouter, useSearchParams } from "next/navigation";
import { DataTable } from "@/components/ui/DataTable";
import TableFooter from "@/components/TableFooter";
import CopyButton from "@/components/ui/CopyButton";
import { CellContext, ColumnDef, SortingState, Updater } from "@tanstack/react-table";
import { highlightText } from "@/lib/highlight";

interface Employee {
  id: number;
  name: string;
  position: string;
  department: string;
  employee_no: string | null;
  is_active: number;
}

interface EmployeeTableProps {
  importInfo?: {
    fileName: string;
    time: string;
  };
}

const PAGE_SIZE = 50;

const NameCell = ({ name, highlight = '' }: { name: string; highlight?: string }) => (
  <div className="flex items-center justify-between group w-full pr-4">
    <span className="font-semibold text-gray-800 truncate">{highlightText(name, highlight)}</span>
    <CopyButton text={name} />
  </div>
);

export default function EmployeeTable({ importInfo }: EmployeeTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mountedRef = useRef(true);
  const urlSearchRef = useRef<string | null>(null);
  
  // State
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Employee[] | null>(null);
  const [error, setError] = useState("");
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || "");
  const [debouncedQuery, setDebouncedQuery] = useState(() => searchParams.get('search') || "");
  const [highlightQuery, setHighlightQuery] = useState(() => searchParams.get('highlight') || searchParams.get('search') || "");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Sorting State
  const [sorting, setSorting] = useState<SortingState>([]);

  // Table State
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("employee_columnWidths");
      if (saved) return JSON.parse(saved);
    }
    return {
      "no": 60,
      "name": 350,
      "position": 250,
      "employee_no": 180
    };
  });

  // Debounce search
  useEffect(() => {
    const urlSearch = searchParams.get('search');
    const urlHighlight = searchParams.get('highlight');
    if (urlSearch !== null) {
      urlSearchRef.current = urlSearch;
      setSearchQuery(urlSearch);
      setDebouncedQuery(urlSearch);
      setHighlightQuery(urlHighlight || urlSearch);
      setPage(1);
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedQuery(searchQuery); if (searchQuery !== urlSearchRef.current) setHighlightQuery(searchQuery); }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle cross-tab refresh
  useEffect(() => {
    setIsMounted(true);
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "sintak_data_updated" || e.key === "employee_data_updated") {
        setRefreshKey(prev => prev + 1);
        router.refresh();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => { 
        mountedRef.current = false;
        window.removeEventListener("storage", handleStorageChange); 
    };
  }, [router]);

  // Fetch Data
  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      const startTime = performance.now();
      try {
        let sortBy = "";
        let sortDir = "";
        if (sorting.length > 0) {
          sortBy = sorting[0].id;
          sortDir = sorting[0].desc ? "desc" : "asc";
        }
        const sortParams = sortBy ? `&sortBy=${sortBy}&sortDir=${sortDir}` : "";
        const res = await fetch(`/api/employees?all=true&page=${page}&limit=${PAGE_SIZE}&search=${encodeURIComponent(debouncedQuery)}${sortParams}&_t=${Date.now()}`);
        if (!active) return;
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setLoadTime(Math.round(performance.now() - startTime));
            setTotalCount(json.total || 0);
            setData(json.data || []);
          }
        }
      } catch (e: unknown) {
        if (active) setError(e instanceof Error ? e.message : "Gagal memuat data");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => { active = false; };
  }, [page, debouncedQuery, refreshKey, sorting]);

  const [toggleLoading, setToggleLoading] = useState<Set<number>>(new Set());

  const notifyDataUpdated = useCallback(() => {
    localStorage.setItem('sintak_data_updated', Date.now().toString());
    window.dispatchEvent(new CustomEvent('sintak:data-updated'));
  }, []);

  const handleToggleActive = useCallback(async (employee: Employee) => {
    setToggleLoading(prev => new Set(prev).add(employee.id));
    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !employee.is_active })
      });
      if (res.ok) {
        setData(prev => prev?.map(e =>
          e.id === employee.id ? { ...e, is_active: employee.is_active ? 0 : 1 } : e
        ) || null);
        notifyDataUpdated();
      }
    } catch {} finally {
      setToggleLoading(prev => {
        const next = new Set(prev);
        next.delete(employee.id);
        return next;
      });
    }
  }, [notifyDataUpdated]);

  const columns = useMemo<ColumnDef<Employee>[]>(() => [
    {
      accessorKey: "no",
      header: "No.",
      cell: (info: CellContext<Employee, unknown>) => info.row.index + 1,
      size: 60,
      meta: { align: "center" },
      enableSorting: false
    },
    { 
        accessorKey: "name", 
        header: "Nama Karyawan",
        size: 320,
        cell: (info: CellContext<Employee, string>) => <NameCell name={info.getValue()} highlight={highlightQuery} />
    },
    { 
        accessorKey: "position", 
        header: "Jabatan",
        size: 220,
        cell: (info: CellContext<Employee, string>) => (
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 block w-fit truncate tracking-tight">
              {info.getValue()}
            </span>
        )
    },
    { 
        accessorKey: "employee_no", 
        header: "ID Karyawan",
        size: 150,
        meta: { align: "right" },
        cell: (info: CellContext<Employee, string | null>) => (
            <span className="font-mono font-bold text-gray-400">
                {info.getValue() || "---"}
            </span>
        )
    },
    {
        accessorKey: "is_active",
        header: "Status",
        size: 100,
        meta: { align: "center" },
        cell: (info: CellContext<Employee, number>) => {
            const employee = info.row.original;
            const loading = toggleLoading.has(employee.id);
            const isActive = employee.is_active === 1;
            return (
                <div className="flex items-center justify-center">
                    <button
                        type="button"
                        disabled={loading}
                        onClick={(e) => { e.stopPropagation(); handleToggleActive(employee); }}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            loading ? 'opacity-50 cursor-wait' :
                            isActive ? 'bg-emerald-500' : 'bg-gray-300'
                        }`}
                        role="switch"
                        aria-checked={isActive}
                    >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            isActive ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                    </button>
                </div>
            );
        }
    }
  ], [handleToggleActive, toggleLoading, highlightQuery]);

  // Handlers
  const handleResize = useCallback((widths: Record<string, number>) => {
    setColumnWidths(widths);
    localStorage.setItem("employee_columnWidths", JSON.stringify(widths));
  }, []);

  const handleSelection = useCallback((id: string | number) => {
    setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
    });
  }, []);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleSortingChange = useCallback((updaterOrValue: Updater<SortingState>) => {
    setSorting(prev => {
      const next = typeof updaterOrValue === 'function' ? updaterOrValue(prev) : updaterOrValue;
      return next;
    });
    setPage(1);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="h-full flex flex-col gap-3 overflow-hidden">
      <div className="flex flex-col gap-4 shrink-0 px-1">
        <div className="flex items-center justify-between gap-4 min-h-[32px]">
          <div className="flex items-center gap-5">
             <h3 className="text-[14px] font-bold text-gray-800 flex items-center gap-3 leading-none">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm shrink-0">
                  <Users size={16} />
                </div>
                <span>Data Master Karyawan</span>
             </h3>
             <ImportInfo info={importInfo} />
          </div>
          {loading && (data?.length || 0) > 0 && (
              <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 shadow-sm animate-pulse leading-none">
                <Loader2 size={12} className="animate-spin" />
                <span>Memproses Data...</span>
              </div>
          )}
        </div>

        <SearchAndReload 
          searchQuery={searchQuery}
          setSearchQuery={(v) => { setSearchQuery(v); setPage(1); }}
          onReload={() => setRefreshKey(k => k + 1)}
          loading={loading}
          placeholder="Cari nama, jabatan, atau ID karyawan..."
        />
      </div>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
         {error ? (
           <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl shadow-sm shadow-emerald-900/5">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-6 shadow-sm shadow-rose-900/5">
                  <AlertCircle size={40} />
              </div>
              <p className="text-lg font-bold text-gray-800 mb-2">Terjadi Kesalahan</p>
              <p className="text-sm text-gray-400 font-medium mb-8 max-w-md">{error}</p>
              <button 
                onClick={() => setRefreshKey(k => k + 1)}
                className="px-10 py-4 bg-emerald-600 text-white font-bold text-[13px] rounded-xl shadow-sm shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
              >
                Coba Muat Ulang
              </button>
           </div>
         ) : (
           <DataTable
             data={data || []}
             columns={columns}
             columnWidths={columnWidths}
             onColumnWidthChange={handleResize}
             isLoading={loading || data === null}
             selectedIds={selectedIds}
             onRowClick={handleSelection}
             rowHeight="h-11"
             sorting={sorting}
             onSortingChange={handleSortingChange}
           />
         )}
      </div>

      <TableFooter
        totalCount={totalCount}
        currentCount={data?.length || 0}
        label="karyawan"
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        loadTime={loadTime}
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}