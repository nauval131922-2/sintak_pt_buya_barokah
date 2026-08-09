"use client";

import { useState, useEffect, useMemo, useCallback, useRef, useDeferredValue } from "react";
import {
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  ExternalLink,
  Layers,
  Filter,
  ChevronDown,
  Check,
  BarChart3,
  PieChart as PieChartIcon,
  Flame,
  Boxes,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import TableFooter from "@/components/TableFooter";
import Portal, { getZoomScale } from "@/components/Portal";
import { SPREADSHEET_ID, type SpreadsheetTask } from "@/lib/google-sheets";

const REFRESH_INTERVAL = 2 * 60; // 2 menit cooldown

export interface FilterOption {
  value: string;
  label: string;
}

interface SquareDropdownProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  searchPlaceholder?: string;
  widthClass?: string;
  alignRight?: boolean;
}

function SquareDropdown({
  options,
  value,
  onChange,
  searchPlaceholder = "Cari...",
  widthClass = "w-48",
  alignRight = false,
}: SquareDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.label ?? options[0]?.label ?? "—";

  const filtered = search.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase())
      )
    : options;

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const update = () => {
      const rect = triggerRef.current!.getBoundingClientRect();
      const scale = getZoomScale();
      const posStyle: React.CSSProperties = {
        position: "fixed",
        top: (rect.bottom + 4) / scale,
        zIndex: 9999,
      };

      if (alignRight) {
        posStyle.right = (window.innerWidth - rect.right) / scale;
      } else {
        posStyle.left = rect.left / scale;
      }

      setPanelStyle(posStyle);
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, alignRight]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || panelRef.current?.contains(t))
        return;
      setOpen(false);
      setSearch("");
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setSearch("");
    }
  }, [open]);

  return (
    <div ref={triggerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 hover:bg-white hover:border-slate-300 focus:outline-none transition-all"
      >
        <span className="truncate max-w-[130px]">{displayLabel}</span>
        <ChevronDown
          size={14}
          className={`text-slate-400 shrink-0 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <Portal>
          <div
            ref={panelRef}
            style={panelStyle}
            className={`${widthClass} bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150`}
          >
            <div className="p-2 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white rounded-lg border border-slate-200">
                <Search size={12} className="text-slate-400 shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="flex-1 text-[11px] font-medium bg-transparent outline-none text-slate-700 placeholder:text-slate-400 min-w-0"
                />
              </div>
            </div>

            <div className="max-h-52 overflow-y-auto custom-scrollbar divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <p className="px-3 py-3 text-[11px] text-slate-400 font-medium text-center">
                  Tidak ditemukan
                </p>
              ) : (
                filtered.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold transition-colors ${
                      value === opt.value
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {value === opt.value && (
                      <Check
                        size={12}
                        className="text-emerald-600 shrink-0 ml-2"
                      />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  SELESAI: "#10b981", // emerald-500
  "IN PROGRESS": "#0284c7", // sky-600
  PENDING: "#f59e0b", // amber-500
  CANCEL: "#f43f5e", // rose-500
};

const STATUS_LEGEND = [
  { name: "SELESAI", color: "#10b981" },
  { name: "IN PROGRESS", color: "#0ea5e9" },
  { name: "PENDING", color: "#f59e0b" },
  { name: "CANCEL", color: "#f43f5e" },
];

function parseDateToSort(str: string): number {
  if (!str || !str.trim()) return 0;
  const s = str.trim();

  // Check DD/MM/YYYY or D/M/YYYY or DD-MM-YYYY
  const ddmmyyyy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1], 10);
    const month = parseInt(ddmmyyyy[2], 10) - 1;
    const year = parseInt(ddmmyyyy[3], 10);
    return new Date(year, month, day).getTime();
  }

  // Check YYYY-MM-DD
  const yyyymmdd = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (yyyymmdd) {
    const year = parseInt(yyyymmdd[1], 10);
    const month = parseInt(yyyymmdd[2], 10) - 1;
    const day = parseInt(yyyymmdd[3], 10);
    return new Date(year, month, day).getTime();
  }

  // Standard Date.parse fallback
  const parsed = Date.parse(s);
  return isNaN(parsed) ? 0 : parsed;
}

const fmtNumber = (n: number) =>
  Number(n).toLocaleString("id-ID", { maximumFractionDigits: 0 });

const ChartLegend = ({
  items,
}: {
  items: { name: string; color: string; value?: number }[];
}) => (
  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
    {items.map((it) => (
      <span
        key={it.name}
        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600"
      >
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: it.color }}
        />
        {it.name}
        {typeof it.value === "number" && (
          <span className="text-slate-400">({fmtNumber(it.value)})</span>
        )}
      </span>
    ))}
  </div>
);

const renderPieLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: any) => {
  if (!percent || percent <= 0) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="#ffffff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={11}
      fontWeight={700}
    >
      {`${Math.round(percent * 100)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  const COLOR_MAP: Record<string, string> = {
    Selesai: "#10b981",
    "In Progress": "#0284c7",
    Pending: "#f59e0b",
    Cancel: "#f43f5e",
    SELESAI: "#10b981",
    "IN PROGRESS": "#0284c7",
    PENDING: "#f59e0b",
    CANCEL: "#f43f5e",
    High: "#f43f5e",
    Medium: "#f59e0b",
    Low: "#3b82f6",
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-md text-xs min-w-[120px]">
      {label && (
        <p className="font-bold text-slate-800 border-b border-slate-100 pb-1 mb-1.5">
          {label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry: any, index: number) => {
          const name = entry.name || entry.dataKey;
          let color =
            entry.payload?.color || COLOR_MAP[name] || entry.color || "#6366f1";
          if (typeof color === "string" && color.startsWith("url(")) {
            color = COLOR_MAP[name] || "#6366f1";
          }
          return (
            <div
              key={`tt-${index}`}
              className="flex items-center justify-between gap-3 text-[11px]"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-slate-600 font-medium">{name}:</span>
              </div>
              <span className="font-bold text-slate-800">
                {fmtNumber(entry.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function LaporanPekerjaanClient() {
  const [tasks, setTasks] = useState<SpreadsheetTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(REFRESH_INTERVAL);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loadTime, setLoadTime] = useState<number | null>(null);

  // Filters
  const [selectedPic, setSelectedPic] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const deferredSearchTerm = useDeferredValue(searchTerm);

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(50);
  const [sortField, setSortField] = useState<keyof SpreadsheetTask | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Mobile card expand state & Table row selection state
  const [expandedCardIndices, setExpandedCardIndices] = useState<Set<number>>(new Set());
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  const toggleCardExpand = (idx: number) => {
    setExpandedCardIndices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const tableContainerRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef<boolean>(false);

  // Scroll to top of table & reset row selection on page change
  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
    setSelectedRowIndex(null);
  }, [currentPage]);

  const handleSort = (field: keyof SpreadsheetTask) => {
    if (isResizingRef.current) return;
    if (sortField === field) {
      if (sortOrder === "asc") {
        setSortOrder("desc");
      } else {
        setSortField(null);
        setSortOrder("asc");
      }
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const fetchData = useCallback(async (force = false) => {
    const startTime = performance.now();
    setLoading(true);
    setError(null);
    try {
      const url = force
        ? "/api/spreadsheet?gid=DATABASE_REPORT&refresh=true"
        : "/api/spreadsheet?gid=DATABASE_REPORT";
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setTasks(json.data);
        setCountdown(REFRESH_INTERVAL);
        setLastUpdated(new Date());
        setLoadTime(Math.round(performance.now() - startTime));
      } else {
        setError(json.error || "Gagal mengambil data dari Google Spreadsheet");
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto refresh interval
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Countdown timer tick per 1 detik
  useEffect(() => {
    const timer = setInterval(
      () => setCountdown((c) => Math.max(0, c - 1)),
      1000
    );
    return () => clearInterval(timer);
  }, []);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPic, selectedStatus, searchTerm]);

  // Format detik menjadi mm:ss
  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  // Format tanggal & waktu WIB
  const formattedLastUpdated = useMemo(() => {
    if (!lastUpdated) return null;
    const dateStr = lastUpdated.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    });
    const timeStr = lastUpdated.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta",
    });
    return `${dateStr}, ${timeStr} WIB`;
  }, [lastUpdated]);

  // Options PIC untuk SquareDropdown
  const picOptions = useMemo<FilterOption[]>(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.pic) set.add(t.pic);
    });
    const sorted = Array.from(set).sort();
    return [
      { value: "ALL", label: "Semua PIC" },
      ...sorted.map((p) => ({ value: p, label: p })),
    ];
  }, [tasks]);

  // Options Status untuk SquareDropdown
  const statusOptions = useMemo<FilterOption[]>(
    () => [
      { value: "ALL", label: "Semua Status" },
      { value: "SELESAI", label: "SELESAI" },
      { value: "IN PROGRESS", label: "IN PROGRESS" },
      { value: "PENDING", label: "PENDING" },
      { value: "CANCEL", label: "CANCEL" },
    ],
    []
  );

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (
        selectedPic !== "ALL" &&
        t.pic.toUpperCase() !== selectedPic.toUpperCase()
      ) {
        return false;
      }
      if (
        selectedStatus !== "ALL" &&
        t.status.toUpperCase() !== selectedStatus.toUpperCase()
      ) {
        return false;
      }
      if (deferredSearchTerm) {
        const term = deferredSearchTerm.toLowerCase();
        const matchTask = t.task.toLowerCase().includes(term);
        const matchProj = t.project.toLowerCase().includes(term);
        if (!matchTask && !matchProj) return false;
      }
      return true;
    });
  }, [tasks, selectedPic, selectedStatus, deferredSearchTerm]);

  // Global Sorted Tasks (across ALL pages)
  const sortedFilteredTasks = useMemo(() => {
    if (!sortField) return filteredTasks;
    return [...filteredTasks].sort((a, b) => {
      const rawA = a[sortField] || "";
      const rawB = b[sortField] || "";

      if (sortField === "startDate" || sortField === "endDate") {
        const timeA = parseDateToSort(rawA);
        const timeB = parseDateToSort(rawB);
        if (timeA !== timeB) {
          return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
        }
      }

      if (sortField === "workDays") {
        const numA = parseFloat(rawA) || 0;
        const numB = parseFloat(rawB) || 0;
        return sortOrder === "asc" ? numA - numB : numB - numA;
      }

      const valA = rawA.toString().toLowerCase();
      const valB = rawB.toString().toLowerCase();
      const comp = valA.localeCompare(valB, "id", { numeric: true });
      return sortOrder === "asc" ? comp : -comp;
    });
  }, [filteredTasks, sortField, sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil(sortedFilteredTasks.length / pageSize) || 1;
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedFilteredTasks.slice(start, start + pageSize);
  }, [sortedFilteredTasks, currentPage, pageSize]);

  // Counts
  const counts = useMemo(() => {
    let total = filteredTasks.length;
    let selesai = 0;
    let inProgress = 0;
    let pending = 0;
    let cancel = 0;

    filteredTasks.forEach((t) => {
      const s = (t.status || "").trim().toUpperCase();
      if (s === "SELESAI") selesai++;
      else if (s === "IN PROGRESS") inProgress++;
      else if (s === "PENDING") pending++;
      else if (s === "CANCEL") cancel++;
    });

    return { total, selesai, inProgress, pending, cancel };
  }, [filteredTasks]);

  // Chart Data 1: Breakdown Pekerjaan per Status per PIC
  const picChartData = useMemo(() => {
    const map: Record<
      string,
      { name: string; Selesai: number; InProgress: number; Pending: number; Cancel: number; Total: number }
    > = {};
    filteredTasks.forEach((t) => {
      const pic = t.pic ? t.pic.toUpperCase() : "TANPA PIC";
      if (!map[pic]) {
        map[pic] = { name: pic, Selesai: 0, InProgress: 0, Pending: 0, Cancel: 0, Total: 0 };
      }
      map[pic].Total++;
      const s = (t.status || "").trim().toUpperCase();
      if (s === "SELESAI") map[pic].Selesai++;
      else if (s === "IN PROGRESS") map[pic].InProgress++;
      else if (s === "PENDING") map[pic].Pending++;
      else if (s === "CANCEL") map[pic].Cancel++;
    });
    return Object.values(map).sort((a, b) => b.Total - a.Total);
  }, [filteredTasks]);

  // Chart Data 2: Pie Chart Status
  const statusPieData = useMemo(() => {
    const map: Record<string, number> = {
      SELESAI: 0,
      "IN PROGRESS": 0,
      PENDING: 0,
      CANCEL: 0,
    };
    filteredTasks.forEach((t) => {
      const s = (t.status || "").trim().toUpperCase();
      if (map[s] !== undefined) map[s]++;
    });

    return Object.keys(map).map((k) => ({
      name: k,
      value: map[k],
      color: STATUS_COLORS[k] || "#94a3b8",
    }));
  }, [filteredTasks]);

  // Chart Data 3: Priority Distribution (breakdown per status)
  const priorityChartData = useMemo(() => {
    const map: Record<
      string,
      { name: string; Selesai: number; InProgress: number; Pending: number; Cancel: number; Total: number }
    > = {};
    filteredTasks.forEach((t) => {
      const p = t.priority ? t.priority.trim() : "Low";
      if (!map[p]) {
        map[p] = { name: p, Selesai: 0, InProgress: 0, Pending: 0, Cancel: 0, Total: 0 };
      }
      map[p].Total++;
      const s = (t.status || "").trim().toUpperCase();
      if (s === "SELESAI") map[p].Selesai++;
      else if (s === "IN PROGRESS") map[p].InProgress++;
      else if (s === "PENDING") map[p].Pending++;
      else if (s === "CANCEL") map[p].Cancel++;
    });
    return Object.values(map).sort((a, b) => b.Total - a.Total);
  }, [filteredTasks]);

  // Chart Data 4: Division Distribution (breakdown per status)
  const divisionChartData = useMemo(() => {
    const map: Record<
      string,
      { name: string; Selesai: number; InProgress: number; Pending: number; Cancel: number; Total: number }
    > = {};
    filteredTasks.forEach((t) => {
      const div = t.division ? t.division.trim() : "Lainnya";
      if (!map[div]) {
        map[div] = { name: div, Selesai: 0, InProgress: 0, Pending: 0, Cancel: 0, Total: 0 };
      }
      map[div].Total++;
      const s = (t.status || "").trim().toUpperCase();
      if (s === "SELESAI") map[div].Selesai++;
      else if (s === "IN PROGRESS") map[div].InProgress++;
      else if (s === "PENDING") map[div].Pending++;
      else if (s === "CANCEL") map[div].Cancel++;
    });
    return Object.values(map).sort((a, b) => b.Total - a.Total);
  }, [filteredTasks]);

  // Resizable columns state with localStorage persistence
  const DEFAULT_COL_WIDTHS = useMemo(
    () => ({
      task: 240,
      project: 180,
      division: 120,
      pic: 110,
      priority: 95,
      startDate: 110,
      endDate: 110,
      workDays: 90,
      note: 180,
      status: 120,
    }),
    []
  );

  const [colWidths, setColWidths] = useState<Record<string, number>>(DEFAULT_COL_WIDTHS);

  // Load saved column widths from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("laporan_pekerjaan_col_widths");
      if (saved) {
        const parsed = JSON.parse(saved);
        setColWidths((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const handleResizeStart = (
    field: string,
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    e.stopPropagation();
    e.preventDefault();
    isResizingRef.current = true;

    const startX = e.clientX;
    const startWidth = colWidths[field] || 100;
    let finalWidth = startWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      finalWidth = Math.max(60, startWidth + delta);
      if (tableContainerRef.current) {
        tableContainerRef.current.style.setProperty(
          `--col-${field}`,
          `${finalWidth}px`
        );
      }
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      setColWidths((prev) => {
        const updated = { ...prev, [field]: finalWidth };
        try {
          localStorage.setItem(
            "laporan_pekerjaan_col_widths",
            JSON.stringify(updated)
          );
        } catch {
          // Ignore localStorage save errors
        }
        return updated;
      });
      setTimeout(() => {
        isResizingRef.current = false;
      }, 100);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const renderSortableHeader = (
    field: keyof SpreadsheetTask,
    label: string,
    alignCenter = false
  ) => {
    const isSorted = sortField === field;
    return (
      <th
        style={{
          width: `var(--col-${field}, ${colWidths[field] || 100}px)`,
          minWidth: `var(--col-${field}, ${colWidths[field] || 100}px)`,
        }}
        className={`relative px-3 py-2.5 bg-slate-50 cursor-pointer select-none hover:bg-slate-100/80 transition-colors group ${
          alignCenter ? "text-center" : ""
        }`}
        onClick={() => handleSort(field)}
        title={`Klik untuk mengurutkan berdasarkan ${label}`}
      >
        <div
          className={`flex items-center gap-1.5 truncate ${
            alignCenter ? "justify-center" : ""
          }`}
        >
          <span className="truncate">{label}</span>
          {isSorted ? (
            sortOrder === "asc" ? (
              <ArrowUp className="w-3 h-3 text-emerald-600 shrink-0" />
            ) : (
              <ArrowDown className="w-3 h-3 text-emerald-600 shrink-0" />
            )
          ) : (
            <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          )}
        </div>
        {/* Resizer Handle */}
        <div
          onMouseDown={(resizeEvt) => handleResizeStart(field, resizeEvt)}
          onClick={(resizeEvt) => resizeEvt.stopPropagation()}
          className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-emerald-500/50 active:bg-emerald-600 z-20 group-hover:bg-slate-300/80 transition-colors"
          title="Geser untuk mengatur lebar kolom"
        />
      </th>
    );
  };

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === "SELESAI") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
          <CheckCircle2 className="w-3 h-3" /> SELESAI
        </span>
      );
    }
    if (s === "IN PROGRESS") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80">
          <Clock className="w-3 h-3" /> IN PROGRESS
        </span>
      );
    }
    if (s === "PENDING") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
          <AlertTriangle className="w-3 h-3" /> PENDING
        </span>
      );
    }
    if (s === "CANCEL") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
          <XCircle className="w-3 h-3" /> CANCEL
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header Info & Action */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100 shrink-0 mt-0.5 sm:mt-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xs sm:text-sm font-bold text-slate-800 truncate">
              Laporan Pekerjaan Setting Buya 2026
            </h2>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
              <p className="text-[11px] text-slate-500">
                Data terhubung langsung dari Google Spreadsheet
              </p>
              {formattedLastUpdated && (
                <div className="flex items-center gap-1.5">
                  <span className="hidden sm:inline text-slate-300">•</span>
                  <span className="text-[10.5px] sm:text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100/80 whitespace-nowrap">
                    Update Terakhir: {formattedLastUpdated}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <span className="text-[11px] sm:text-[11.5px] text-slate-500 font-medium">
            Auto Refresh:{" "}
            <span
              className={
                countdown <= 10
                  ? "text-amber-600 font-bold"
                  : "font-semibold text-slate-700"
              }
            >
              {formatCountdown(countdown)}
            </span>
          </span>

          <div className="flex items-center gap-2">
            <a
              href={`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit?usp=sharing`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Spreadsheet
            </a>
            <button
              onClick={() => fetchData(true)}
              disabled={loading}
              className="inline-flex items-center px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-all shadow-sm whitespace-nowrap"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Memuat..." : "Refresh Live"}
            </button>
          </div>
        </div>
      </div>

      {/* Cards Statistik */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-0.5">
            <span className="text-[11px] font-semibold">Total Task</span>
            <Layers className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <span className="text-xl font-black text-slate-800">
            {counts.total.toLocaleString("id-ID")}
          </span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-emerald-200/80 shadow-sm bg-gradient-to-br from-white to-emerald-50/30">
          <div className="flex items-center justify-between text-emerald-600 mb-0.5">
            <span className="text-[11px] font-semibold">Selesai</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <span className="text-xl font-black text-emerald-700">
            {counts.selesai.toLocaleString("id-ID")}
          </span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-sky-200/80 shadow-sm bg-gradient-to-br from-white to-sky-50/30">
          <div className="flex items-center justify-between text-sky-600 mb-0.5">
            <span className="text-[11px] font-semibold">In Progress</span>
            <Clock className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <span className="text-xl font-black text-sky-700">
            {counts.inProgress.toLocaleString("id-ID")}
          </span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-amber-200/80 shadow-sm bg-gradient-to-br from-white to-amber-50/30">
          <div className="flex items-center justify-between text-amber-600 mb-0.5">
            <span className="text-[11px] font-semibold">Pending</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <span className="text-xl font-black text-amber-700">
            {counts.pending.toLocaleString("id-ID")}
          </span>
        </div>

        <div className="bg-white p-3 rounded-xl border border-rose-200/80 shadow-sm bg-gradient-to-br from-white to-rose-50/30 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-rose-600 mb-0.5">
            <span className="text-[11px] font-semibold">Cancel</span>
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <span className="text-xl font-black text-rose-700">
            {counts.cancel.toLocaleString("id-ID")}
          </span>
        </div>
      </div>

      {/* Visualisasi Dashboard Recharts (Bar Chart PIC, Divisi, Donut Status & Priority) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Bar Chart 1: Beban Kerja per PIC */}
        <div className="lg:col-span-6 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-800">
                Beban Kerja Per PIC (Status Lengkap)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Distribution per PIC
            </span>
          </div>

          <div className="h-64 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                <RefreshCw className="w-4 h-4 animate-spin mr-2 text-emerald-600" />{" "}
                Memuat grafik...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={picChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gradSelesai" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="gradInProgress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="gradPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="gradCancel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fb7185" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={{ stroke: "#cbd5e1" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => fmtNumber(v)}
                  />
                  <RechartsTooltip content={CustomTooltip} />
                  <Bar
                    dataKey="Selesai"
                    fill="url(#gradSelesai)"
                    radius={[6, 6, 0, 0]}
                    name="SELESAI"
                  />
                  <Bar
                    dataKey="InProgress"
                    fill="url(#gradInProgress)"
                    radius={[6, 6, 0, 0]}
                    name="IN PROGRESS"
                  />
                  <Bar
                    dataKey="Pending"
                    fill="url(#gradPending)"
                    radius={[6, 6, 0, 0]}
                    name="PENDING"
                  />
                  <Bar
                    dataKey="Cancel"
                    fill="url(#gradCancel)"
                    radius={[6, 6, 0, 0]}
                    name="CANCEL"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartLegend items={STATUS_LEGEND} />
        </div>

        {/* Bar Chart 2: Beban Kerja per Divisi */}
        <div className="lg:col-span-6 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Boxes className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-800">
                Distribusi Pekerjaan Per Divisi
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Task per Division
            </span>
          </div>

          <div className="h-64 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                <RefreshCw className="w-4 h-4 animate-spin mr-2 text-indigo-600" />{" "}
                Memuat grafik...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={divisionChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gradDivSelesai" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="gradDivProgress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="gradDivPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="gradDivCancel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fb7185" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={{ stroke: "#cbd5e1" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => fmtNumber(v)}
                  />
                  <RechartsTooltip content={CustomTooltip} />
                  <Bar dataKey="Selesai" fill="url(#gradDivSelesai)" radius={[6,6,0,0]} name="SELESAI" />
                  <Bar dataKey="InProgress" fill="url(#gradDivProgress)" radius={[6,6,0,0]} name="IN PROGRESS" />
                  <Bar dataKey="Pending" fill="url(#gradDivPending)" radius={[6,6,0,0]} name="PENDING" />
                  <Bar dataKey="Cancel" fill="url(#gradDivCancel)" radius={[6,6,0,0]} name="CANCEL" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartLegend items={STATUS_LEGEND} />
        </div>

        {/* Donut Chart 1: Proporsi Status */}
        <div className="lg:col-span-6 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <PieChartIcon className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-800">
                Proporsi Status Pekerjaan
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Overall Status
            </span>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            {loading ? (
              <div className="text-slate-400 text-xs flex items-center">
                <RefreshCw className="w-4 h-4 animate-spin mr-2 text-emerald-600" />{" "}
                Memuat grafik...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <linearGradient id="gradStatusSelesai" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.85} />
                    </linearGradient>
                    <linearGradient id="gradStatusInProgress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1} />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity={0.85} />
                    </linearGradient>
                    <linearGradient id="gradStatusPending" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.85} />
                    </linearGradient>
                    <linearGradient id="gradStatusCancel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fb7185" stopOpacity={1} />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.85} />
                    </linearGradient>
                  </defs>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={40}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    label={renderPieLabel}
                    labelLine={false}
                  >
                    {statusPieData.map((entry, index) => {
                      const gradMap: Record<string, string> = {
                        SELESAI: "url(#gradStatusSelesai)",
                        "IN PROGRESS": "url(#gradStatusInProgress)",
                        PENDING: "url(#gradStatusPending)",
                        CANCEL: "url(#gradStatusCancel)",
                      };
                      return (
                        <Cell key={`cell-${index}`} fill={gradMap[entry.name] || entry.color} />
                      );
                    })}
                  </Pie>
                  <RechartsTooltip content={CustomTooltip} />
                  </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartLegend
            items={statusPieData.map((d) => {
              const total = statusPieData.reduce((acc, x) => acc + x.value, 0);
              const pct = total ? Math.round((d.value / total) * 100) : 0;
              return {
                name: `${d.name} (${pct}%)`,
                color: d.color,
                value: d.value,
              };
            })}
          />
        </div>

        {/* Donut Chart 2: Priority Distribution */}
        <div className="lg:col-span-6 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Flame className="w-4 h-4 text-rose-500" />
              <h3 className="text-xs font-bold text-slate-800">
                Tingkat Prioritas Pekerjaan
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              High / Medium / Low
            </span>
          </div>

          <div className="h-60 w-full flex items-center justify-center">
            {loading ? (
              <div className="text-slate-400 text-xs flex items-center">
                <RefreshCw className="w-4 h-4 animate-spin mr-2 text-emerald-600" />{" "}
                Memuat grafik...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={priorityChartData}
                  layout="vertical"
                  margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gradPrioSelesai" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="gradPrioProgress" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="gradPrioPending" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="gradPrioCancel" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#fb7185" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={{ stroke: "#cbd5e1" }}
                    tickLine={false}
                    tickFormatter={(v: number) => fmtNumber(v)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={70}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip content={CustomTooltip} />
                  <Bar dataKey="Selesai" fill="url(#gradPrioSelesai)" radius={[0,6,6,0]} name="SELESAI" />
                  <Bar dataKey="InProgress" fill="url(#gradPrioProgress)" radius={[0,6,6,0]} name="IN PROGRESS" />
                  <Bar dataKey="Pending" fill="url(#gradPrioPending)" radius={[0,6,6,0]} name="PENDING" />
                  <Bar dataKey="Cancel" fill="url(#gradPrioCancel)" radius={[0,6,6,0]} name="CANCEL" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <ChartLegend items={STATUS_LEGEND} />
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kata kunci task atau nomor OP (misal: OP.007)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
          />
        </div>

        <div className="flex items-center space-x-2.5 w-full md:w-auto">
          <div className="flex items-center text-xs text-slate-500 font-medium mr-1">
            <Filter className="w-3.5 h-3.5 mr-1 text-slate-400" /> Filter:
          </div>

          <SquareDropdown
            options={picOptions}
            value={selectedPic}
            onChange={setSelectedPic}
            searchPlaceholder="Cari PIC..."
            widthClass="w-48"
          />

          <SquareDropdown
            options={statusOptions}
            value={selectedStatus}
            onChange={setSelectedStatus}
            searchPlaceholder="Cari Status..."
            widthClass="w-48"
            alignRight
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Tabel Data Pekerjaan (Desktop & Tablet) / Card View (HP) */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        {/* Tampilan Card khusus Layar HP (Mobile View) */}
        <div className="block md:hidden divide-y divide-slate-100 max-h-[550px] overflow-y-auto custom-scrollbar p-3 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
              Menghubungkan & memuat data Google Spreadsheet...
            </div>
          ) : paginatedTasks.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Tidak ada data pekerjaan yang ditemukan.
            </div>
          ) : (
            paginatedTasks.map((t, idx) => {
              const isExpanded = expandedCardIndices.has(idx);
              return (
                <div
                  key={idx}
                  onClick={() => toggleCardExpand(idx)}
                  className={`bg-slate-50/80 p-3.5 rounded-xl border transition-all cursor-pointer select-none space-y-2.5 ${
                    isExpanded
                      ? "border-emerald-300 ring-2 ring-emerald-500/10 bg-emerald-50/30"
                      : "border-slate-200/80 hover:border-slate-300 hover:bg-slate-100/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4
                      className={`text-xs font-bold text-slate-800 leading-snug ${
                        isExpanded ? "break-words" : "line-clamp-2"
                      }`}
                    >
                      {t.task}
                    </h4>
                    <div className="shrink-0">{getStatusBadge(t.status)}</div>
                  </div>

                  {t.project && (
                    <p
                      className={`text-[11px] text-slate-600 font-medium ${
                        isExpanded ? "break-words" : "truncate"
                      }`}
                    >
                      <span className="text-slate-400">Project:</span> {t.project}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-lg border border-slate-200/60">
                    <div className="min-w-0">
                      <span className="text-slate-400 block text-[10px]">Divisi</span>
                      <span
                        className={`font-semibold text-slate-700 block ${
                          isExpanded ? "break-words" : "truncate"
                        }`}
                      >
                        {t.division || "-"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-slate-400 block text-[10px]">PIC</span>
                      <span
                        className={`font-bold text-emerald-700 block ${
                          isExpanded ? "break-words" : "truncate"
                        }`}
                      >
                        {t.pic || "-"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-slate-400 block text-[10px]">Priority</span>
                      <span className="font-medium text-slate-700 block truncate">
                        {t.priority || "-"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-slate-400 block text-[10px]">Work Days</span>
                      <span className="font-semibold text-slate-700 block truncate">
                        {t.workDays ? `${t.workDays} hari` : "-"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[10.5px] text-slate-500 pt-1.5 border-t border-slate-200/60 gap-1">
                    <div>
                      <span className="text-slate-400">Periode:</span>{" "}
                      <span className="font-medium text-slate-600">
                        {t.startDate || "-"} ~ {t.endDate || "-"}
                      </span>
                    </div>
                    {t.note && (
                      <div
                        className={`text-slate-500 italic ${
                          isExpanded ? "break-words" : "truncate max-w-full"
                        }`}
                      >
                        <span className="text-slate-400 not-italic font-medium">
                          Note:
                        </span>{" "}
                        {t.note}
                      </div>
                    )}
                  </div>

                  <div className="text-[9.5px] font-semibold text-emerald-600/80 text-right pt-0.5">
                    {isExpanded ? "▲ Klik untuk ciutkan" : "▼ Klik untuk lihat teks lengkap"}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Tampilan Tabel Desktop & Tablet (Hidden di HP) */}
        <div
          ref={tableContainerRef}
          className="hidden md:block overflow-x-auto max-h-[500px]"
          style={
            {
              "--col-task": `${colWidths.task}px`,
              "--col-project": `${colWidths.project}px`,
              "--col-division": `${colWidths.division}px`,
              "--col-pic": `${colWidths.pic}px`,
              "--col-priority": `${colWidths.priority}px`,
              "--col-startDate": `${colWidths.startDate}px`,
              "--col-endDate": `${colWidths.endDate}px`,
              "--col-workDays": `${colWidths.workDays}px`,
              "--col-note": `${colWidths.note}px`,
              "--col-status": `${colWidths.status}px`,
            } as React.CSSProperties
          }
        >
          <table className="w-full text-left text-xs border-collapse table-fixed">
            <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 shadow-sm">
              <tr>
                {renderSortableHeader("task", "Task / Aktivitas")}
                {renderSortableHeader("project", "Project Order")}
                {renderSortableHeader("division", "Divisi")}
                {renderSortableHeader("pic", "PIC")}
                {renderSortableHeader("priority", "Priority")}
                {renderSortableHeader("startDate", "Start Date")}
                {renderSortableHeader("endDate", "End Date")}
                {renderSortableHeader("workDays", "Work Days", true)}
                {renderSortableHeader("note", "Note")}
                {renderSortableHeader("status", "Status", true)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-16 text-center text-slate-400"
                  >
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    Menghubungkan & memuat data Google Spreadsheet...
                  </td>
                </tr>
              ) : paginatedTasks.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-16 text-center text-slate-400"
                  >
                    Tidak ada data pekerjaan yang ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedTasks.map((t, idx) => {
                  const isSelected = selectedRowIndex === idx;
                  return (
                    <tr
                      key={idx}
                      onClick={() =>
                        setSelectedRowIndex((prev) => (prev === idx ? null : idx))
                      }
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? "bg-emerald-100/70 border-l-4 border-l-emerald-600 font-semibold"
                          : "hover:bg-emerald-50/50"
                      }`}
                    >
                      <td
                        title={t.task}
                        style={{
                          width: "var(--col-task)",
                          maxWidth: "var(--col-task)",
                        }}
                        className={`px-3 py-2.5 truncate ${
                          isSelected ? "text-emerald-950 font-bold" : "font-semibold text-slate-800"
                        }`}
                      >
                        {t.task}
                      </td>
                    <td
                      title={t.project}
                      style={{
                        width: "var(--col-project)",
                        maxWidth: "var(--col-project)",
                      }}
                      className="px-3 py-2.5 text-slate-600 truncate"
                    >
                      {t.project}
                    </td>
                    <td
                      title={t.division}
                      style={{
                        width: "var(--col-division)",
                        maxWidth: "var(--col-division)",
                      }}
                      className="px-3 py-2.5 text-slate-600 truncate"
                    >
                      {t.division}
                    </td>
                    <td
                      title={t.pic}
                      style={{
                        width: "var(--col-pic)",
                        maxWidth: "var(--col-pic)",
                      }}
                      className="px-3 py-2.5 font-bold text-emerald-700 truncate"
                    >
                      {t.pic}
                    </td>
                    <td
                      title={t.priority}
                      style={{
                        width: "var(--col-priority)",
                        maxWidth: "var(--col-priority)",
                      }}
                      className="px-3 py-2.5 text-slate-600 truncate"
                    >
                      {t.priority}
                    </td>
                    <td
                      title={t.startDate}
                      style={{
                        width: "var(--col-startDate)",
                        maxWidth: "var(--col-startDate)",
                      }}
                      className="px-3 py-2.5 whitespace-nowrap text-slate-500 truncate"
                    >
                      {t.startDate}
                    </td>
                    <td
                      title={t.endDate}
                      style={{
                        width: "var(--col-endDate)",
                        maxWidth: "var(--col-endDate)",
                      }}
                      className="px-3 py-2.5 whitespace-nowrap text-slate-500 truncate"
                    >
                      {t.endDate}
                    </td>
                    <td
                      title={t.workDays ? `${t.workDays} hari` : "-"}
                      style={{
                        width: "var(--col-workDays)",
                        maxWidth: "var(--col-workDays)",
                      }}
                      className="px-3 py-2.5 whitespace-nowrap text-center text-slate-600 font-medium truncate"
                    >
                      {t.workDays || "-"}
                    </td>
                    <td
                      title={t.note || "-"}
                      style={{
                        width: "var(--col-note)",
                        maxWidth: "var(--col-note)",
                      }}
                      className="px-3 py-2.5 text-slate-500 truncate"
                    >
                      {t.note || "-"}
                    </td>
                    <td
                      title={t.status}
                      style={{
                        width: "var(--col-status)",
                        maxWidth: "var(--col-status)",
                      }}
                      className="px-3 py-2.5 whitespace-nowrap text-center"
                    >
                      {getStatusBadge(t.status)}
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>

        {/* Footer Sintak Standard TableFooter */}
        <TableFooter
          totalCount={filteredTasks.length}
          currentCount={paginatedTasks.length}
          label="Task"
          loadTime={loadTime}
          page={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
