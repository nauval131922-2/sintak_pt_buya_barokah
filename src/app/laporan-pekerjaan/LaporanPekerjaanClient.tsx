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
  ChevronUp,
  Check,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  ArrowLeft,
  ClipboardList,
  PlusSquare,
  RotateCcw,
  Eye,
  Calendar,
  AlertCircle,
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
import SearchableDropdown from "@/components/SearchableDropdown";
import SquareDropdown from "@/components/SquareDropdown";
import DatePicker from "@/components/DatePicker";
import { toast } from "@/lib/toast";
import { type SpreadsheetTask } from "@/lib/google-sheets";

const BAGIAN_LIST = ['SETTING', 'QUALITY CONTROL', 'CETAK', 'FINISHING', 'GUDANG', 'TEKNISI', 'MESIN'];

const BAGIAN_CATEGORY_MAP: Record<string, string> = {
  'SETTING':          'Setting',
  'QUALITY CONTROL':  'Quality Control',
  'CETAK':            'Cetak',
  'FINISHING':        'Finishing',
  'GUDANG':           'Gudang',
  'TEKNISI':          'Teknisi',
  'MESIN':            'Mesin',
};

export interface FilterOption {
  value: string;
  label: string;
}

const STATUS_COLORS: Record<string, string> = {
  "BELUM DIKERJAKAN": "#64748b", // slate-500
  "IN PROGRESS": "#0284c7", // sky-600
  PENDING: "#f59e0b", // amber-500
  CANCEL: "#f43f5e", // rose-500
  SELESAI: "#10b981", // emerald-500
};

const STATUS_LEGEND = [
  { name: "BELUM DIKERJAKAN", color: "#64748b" },
  { name: "IN PROGRESS", color: "#0ea5e9" },
  { name: "PENDING", color: "#f59e0b" },
  { name: "CANCEL", color: "#f43f5e" },
  { name: "SELESAI", color: "#10b981" },
];

const dateSortCache = new Map<string, number>();

const MONTH_MAP: Record<string, number> = {
  jan: 0, januari: 0, january: 0,
  feb: 1, februari: 1, february: 1,
  mar: 2, maret: 2, march: 2,
  apr: 3, april: 3,
  mei: 4, may: 4,
  jun: 5, juni: 5, june: 5,
  jul: 6, juli: 6, july: 6,
  agu: 7, ags: 7, agt: 7, aug: 7, agustus: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  okt: 9, oct: 9, oktober: 9, october: 9,
  nov: 10, november: 10,
  des: 11, dec: 11, desember: 11, december: 11,
};

function parseDateToSort(str: string): number {
  if (!str || !str.trim()) return 0;
  const s = str.trim();
  const cached = dateSortCache.get(s);
  if (cached !== undefined) return cached;

  let result = 0;

  // 1. Format text-month: "3-Jan-26", "18-Jan-2026", "9-Agu-26", "13-Mei-26", "30-Okt-25", "3.Jan.26", "3 Jan 26"
  const m1 = s.match(/^(\d{1,2})[\s\-\/\.]([a-zA-Z]+)[\s\-\/\.](\d{2,4})$/);
  if (m1) {
    const day = parseInt(m1[1], 10);
    const mStr = m1[2].toLowerCase();
    const month = MONTH_MAP[mStr];
    let year = parseInt(m1[3], 10);
    if (year < 100) year += 2000;
    if (month !== undefined && !isNaN(day) && !isNaN(year)) {
      result = new Date(year, month, day, 12, 0, 0).getTime();
    }
  }

  // 2. Format text-month reversed: "Jan-3-26", "Jan 3 2026"
  if (!result) {
    const mRev = s.match(/^([a-zA-Z]+)[\s\-\/\.](\d{1,2})[\s\-\/\.,\s]*(\d{2,4})$/);
    if (mRev) {
      const month = MONTH_MAP[mRev[1].toLowerCase()];
      const day = parseInt(mRev[2], 10);
      let year = parseInt(mRev[3], 10);
      if (year < 100) year += 2000;
      if (month !== undefined && !isNaN(day) && !isNaN(year)) {
        result = new Date(year, month, day, 12, 0, 0).getTime();
      }
    }
  }

  // 3. Format numerik DD/MM/YYYY atau DD-MM-YYYY atau D/M/YY (contoh: "03/01/2026", "3-1-26", "23-08-2026")
  if (!result) {
    const ddmmyyyy = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
    if (ddmmyyyy) {
      const day = parseInt(ddmmyyyy[1], 10);
      const month = parseInt(ddmmyyyy[2], 10) - 1;
      let year = parseInt(ddmmyyyy[3], 10);
      if (year < 100) year += 2000;
      if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
        result = new Date(year, month, day, 12, 0, 0).getTime();
      }
    }
  }

  // 4. Format YYYY-MM-DD
  if (!result) {
    const yyyymmdd = s.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
    if (yyyymmdd) {
      const year = parseInt(yyyymmdd[1], 10);
      const month = parseInt(yyyymmdd[2], 10) - 1;
      const day = parseInt(yyyymmdd[3], 10);
      result = new Date(year, month, day, 12, 0, 0).getTime();
    }
  }

  // 5. Fallback Date.parse
  if (!result) {
    const parsed = Date.parse(s);
    result = isNaN(parsed) ? 0 : parsed;
  }

  dateSortCache.set(s, result);
  return result;
}

const fmtTglOrder = (s?: string): string => {
  if (!s || !s.trim()) return "-";
  const time = parseDateToSort(s);
  if (!time) return s;
  return new Date(time).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const cleanTaskName = (name?: string, project?: string) => {
  if (!name) return "";
  if (!project) return name;
  return name.includes(project)
    ? name.replace(project, "").replace(/\s+/g, " ").trim()
    : name;
};

const toInputDate = (str?: string): string => {
  if (!str || !str.trim()) return "";
  const time = parseDateToSort(str);
  if (!time) return "";
  const d = new Date(time);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const toDisplayDate = (str?: string): string => {
  if (!str || !str.trim()) return "";
  const parts = str.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
  }
  return str;
};

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const parseDateToDateObj = (str?: string): Date | null => {
  if (!str || !str.trim()) return null;
  const time = parseDateToSort(str);
  return time ? new Date(time) : null;
};

const formatDateDisplay = (val?: Date | string | null): string => {
  if (!val) return "";
  if (val instanceof Date) {
    const day = val.getDate();
    const month = MONTHS_SHORT[val.getMonth()];
    const year = String(val.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  }
  const time = parseDateToSort(val);
  if (time) {
    const d = new Date(time);
    const day = d.getDate();
    const month = MONTHS_SHORT[d.getMonth()];
    const year = String(d.getFullYear()).slice(-2);
    return `${day}-${month}-${year}`;
  }
  return String(val);
};

const formatDateForApi = (val?: Date | string | null): string => {
  return formatDateDisplay(val);
};

// Progress & penanda pekerjaan terakhir (SELESAI terakhir)/selanjutnya per order,
// urutan task berdasarkan tanggal mulai (yang tanpa start_date ditaruh di paling bawah).
const summarizeOrderTasks = (tasks: SpreadsheetTask[], project: string) => {
  const sorted = [...tasks].sort((a, b) => {
    const timeA = parseDateToSort(a.startDate || "") || Number.MAX_SAFE_INTEGER;
    const timeB = parseDateToSort(b.startDate || "") || Number.MAX_SAFE_INTEGER;
    if (timeA !== timeB) return timeA - timeB;
    return a.id - b.id;
  });
  const total = sorted.length;
  const selesaiCount = sorted.filter(
    (t) => (t.status || "").toUpperCase() === "SELESAI"
  ).length;

  let lastIdx = -1;
  for (let i = total - 1; i >= 0; i--) {
    if ((sorted[i].status || "").toUpperCase() === "SELESAI") {
      lastIdx = i;
      break;
    }
  }

  // Task CANCEL tidak dianggap sebagai pekerjaan selanjutnya
  const isCancel = (t: SpreadsheetTask) =>
    (t.status || "").toUpperCase() === "CANCEL";
  let nextIdx = lastIdx + 1;
  while (nextIdx < total && isCancel(sorted[nextIdx])) nextIdx++;

  return {
    progressPct: total > 0 ? Math.round((selesaiCount / total) * 100) : 0,
    // ponytail: lastIdx -1 (belum ada yg selesai) → selanjutnya = task pertama
    pekerjaanTerakhir: lastIdx >= 0 ? cleanTaskName(sorted[lastIdx].task || "", project) : "-",
    pekerjaanSelanjutnya:
      total === 0
        ? "-"
        : nextIdx < total
        ? cleanTaskName(sorted[nextIdx].task || "", project)
        : "Semua Selesai",
  };
};

// Tanggal kosong/tak valid = Infinity agar selalu urut paling akhir
const tglOrderSortTime = (s?: string) => parseDateToSort(s || "") || Number.MAX_SAFE_INTEGER;

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

const getStatusBadge = (status?: string) => {
  const s = (status || "").toUpperCase();
  if (s === "BELUM DIKERJAKAN") {
    return (
      <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-slate-100 text-slate-700 border border-slate-300 whitespace-nowrap">
        <Clock className="w-3 h-3 text-slate-500 shrink-0" /> <span>BELUM DIKERJAKAN</span>
      </span>
    );
  }
  if (s === "SELESAI") {
    return (
      <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 whitespace-nowrap">
        <CheckCircle2 className="w-3 h-3 shrink-0" /> <span>SELESAI</span>
      </span>
    );
  }
  if (s === "IN PROGRESS") {
    return (
      <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80 whitespace-nowrap">
        <Clock className="w-3 h-3 shrink-0" /> <span>IN PROGRESS</span>
      </span>
    );
  }
  if (s === "PENDING") {
    return (
      <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 whitespace-nowrap">
        <AlertTriangle className="w-3 h-3 shrink-0" /> <span>PENDING</span>
      </span>
    );
  }
  if (s === "CANCEL") {
    return (
      <span className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 whitespace-nowrap">
        <XCircle className="w-3 h-3 shrink-0" /> <span>CANCEL</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[10.5px] font-medium bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
      {status || "-"}
    </span>
  );
};

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
    "Belum Dikerjakan": "#64748b",
    Selesai: "#10b981",
    "In Progress": "#0284c7",
    Pending: "#f59e0b",
    Cancel: "#f43f5e",
    "BELUM DIKERJAKAN": "#64748b",
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

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loadTime, setLoadTime] = useState<number | null>(null);

  // Dropdown options state
  const [employeeOptions, setEmployeeOptions] = useState<any[]>([]);

  // Conflict state
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [currentConflict, setCurrentConflict] = useState<any>(null);

  // Detail Modal state
  const [selectedProjectGroup, setSelectedProjectGroup] = useState<{
    project: string;
    tglOrder: string;
    tasks: SpreadsheetTask[];
  } | null>(null);

  // Filters & Analytics state
  const [selectedPic, setSelectedPic] = useState<string>("ALL");
  const [selectedBagianFilter, setSelectedBagianFilter] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const deferredSearchTerm = useDeferredValue(searchTerm);

  // Persistent Mobile Header Card state (default collapsed on mobile)
  const [isHeaderOpenMobile, setIsHeaderOpenMobile] = useState<boolean>(false);

  // Persistent Accordion state (default collapsed false)
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedHeader = localStorage.getItem("laporan_pekerjaan_header_open_mobile");
      if (savedHeader !== null) {
        setIsHeaderOpenMobile(savedHeader === "true");
      }
      const savedAnalytics = localStorage.getItem("laporan_pekerjaan_analytics_open");
      if (savedAnalytics !== null) {
        setIsAnalyticsOpen(savedAnalytics === "true");
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const toggleHeaderMobile = () => {
    setIsHeaderOpenMobile((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("laporan_pekerjaan_header_open_mobile", String(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const toggleAnalytics = () => {
    setIsAnalyticsOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("laporan_pekerjaan_analytics_open", String(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const handleCardStatusClick = (status: string) => {
    setSelectedStatus((prev) => (prev === status ? "ALL" : status));
    setCurrentPage(1);
  };

  const clientContainerRef = useRef<HTMLDivElement>(null);

  // Floating Navigation Up & Down state
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [showBottomBtn, setShowBottomBtn] = useState(false);
  const [isNavActive, setIsNavActive] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkScrollPosition = () => {
      const el = document.getElementById("main-content-scroll");
      const scrollTop = el ? el.scrollTop : (typeof window !== "undefined" ? window.scrollY : 0);
      const scrollHeight = el ? el.scrollHeight : (typeof document !== "undefined" ? document.body.scrollHeight : 0);
      const clientHeight = el ? el.clientHeight : (typeof window !== "undefined" ? window.innerHeight : 0);

      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      const isScrollable = isMobile || isAnalyticsOpen || scrollHeight > clientHeight + 80;

      if (isScrollable) {
        setShowTopBtn(scrollTop > 100);
        setShowBottomBtn(scrollTop + clientHeight < scrollHeight - 80);
      } else {
        setShowTopBtn(false);
        setShowBottomBtn(false);
      }
    };

    const handleUserScroll = () => {
      checkScrollPosition();
      setIsNavActive(true);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        setIsNavActive(false);
      }, 1500);
    };

    const scrollEl = document.getElementById("main-content-scroll");

    scrollEl?.addEventListener("scroll", handleUserScroll, { passive: true });
    window.addEventListener("scroll", handleUserScroll, { passive: true });
    window.addEventListener("resize", checkScrollPosition, { passive: true });
    
    // Initial check tanpa mengaktifkan idle timer
    checkScrollPosition();
    const t1 = setTimeout(checkScrollPosition, 200);
    const t2 = setTimeout(checkScrollPosition, 600);

    return () => {
      scrollEl?.removeEventListener("scroll", handleUserScroll);
      window.removeEventListener("scroll", handleUserScroll);
      window.removeEventListener("resize", checkScrollPosition);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isAnalyticsOpen, loading, tasks.length]);

  const scrollToTop = () => {
    const el = document.getElementById("main-content-scroll");
    if (el) el.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    const el = document.getElementById("main-content-scroll");
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(50);
  type SortField =
    | "tglOrder"
    | "project"
    | "progress"
    | "terakhir"
    | "selanjutnya";
  const [sortField, setSortField] = useState<SortField | null>(null);
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

  // Scroll ke atas & reset row selection saat ganti halaman
  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTop = 0;
    }
    setSelectedRowIndex(null);
  }, [currentPage]);

  const handleSort = (field: SortField) => {
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
      const url = force ? "/api/laporan-pekerjaan?sync=true" : "/api/laporan-pekerjaan";
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setTasks(json.data);
        setLastUpdated(new Date());
        setLoadTime(Math.round(performance.now() - startTime));
        
        // Handle conflicts
        if (json.conflicts && json.conflicts.length > 0) {
          setConflicts(json.conflicts);
          setCurrentConflict(json.conflicts[0]);
          setShowConflictModal(true);
        }
      } else {
        setError(json.error || "Gagal mengambil data laporan pekerjaan");
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchData();
    fetchEmployeeOptions();
  }, [fetchData]);

  const fetchEmployeeOptions = async () => {
    try {
      const res = await fetch('/api/employees?all=true');
      const json = await res.json();
      if (json.success) {
        setEmployeeOptions(json.data || []);
      }
    } catch (err) {
      console.error('Gagal fetch employees:', err);
    }
  };

  // Modal Detail: Handlers untuk Inline Edit & Tambah Pekerjaan (Optimistic Update tanpa re-fetch lambat)
  const handleSaveInlineEdit = async (taskId: number, data: any) => {
    if (!data.task.trim()) {
      toast.error("Nama pekerjaan wajib diisi");
      return;
    }

    const startDateStr = formatDateForApi(data.startDate);
    const endDateStr = formatDateForApi(data.endDate);

    let workDays = "";
    if (data.startDate && data.endDate) {
      const s = data.startDate instanceof Date ? data.startDate : new Date(data.startDate);
      const e = data.endDate instanceof Date ? data.endDate : new Date(data.endDate);
      const diffTime = e.getTime() - s.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays > 0) workDays = String(diffDays);
    }

    const proj = selectedProjectGroup?.project || "";
    const fullTaskName = data.task.trim();
    const savedTaskName = proj && !fullTaskName.includes(proj)
      ? `${fullTaskName} ${proj}`
      : fullTaskName;

    // Optimistic update langsung di memori
    const updatedTaskData = {
      task: savedTaskName,
      bagian: data.bagian,
      pic: data.pic,
      priority: data.priority || "Low",
      startDate: startDateStr,
      endDate: endDateStr,
      workDays: workDays,
      note: data.note,
      status: data.status || "BELUM DIKERJAKAN",
    };

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updatedTaskData } : t))
    );

    setSelectedProjectGroup((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === taskId ? { ...t, ...updatedTaskData } : t
        ),
      };
    });

    try {
      const res = await fetch("/api/laporan-pekerjaan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: taskId,
          task: savedTaskName,
          project: proj,
          division: "",
          bagian: data.bagian,
          pic: data.pic,
          priority: data.priority || "Low",
          startDate: startDateStr,
          endDate: endDateStr,
          workDays: workDays,
          note: data.note,
          status: data.status || "BELUM DIKERJAKAN",
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Pekerjaan berhasil diperbarui!");
      } else {
        toast.error(json.error || "Gagal menyimpan perubahan");
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
      fetchData();
    }
  };

  const handleCreateInlineTask = async (data: any) => {
    if (!data.task.trim()) {
      toast.error("Nama pekerjaan wajib diisi");
      return;
    }

    const startDateStr = formatDateForApi(data.startDate);
    const endDateStr = formatDateForApi(data.endDate);

    let workDays = "";
    if (data.startDate && data.endDate) {
      const s = data.startDate instanceof Date ? data.startDate : new Date(data.startDate);
      const e = data.endDate instanceof Date ? data.endDate : new Date(data.endDate);
      const diffTime = e.getTime() - s.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays > 0) workDays = String(diffDays);
    }

    const proj = selectedProjectGroup?.project || "";
    const fullTaskName = data.task.trim();
    const savedTaskName = proj && !fullTaskName.includes(proj)
      ? `${fullTaskName} ${proj}`
      : fullTaskName;

    try {
      const res = await fetch("/api/laporan-pekerjaan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: savedTaskName,
          project: proj,
          division: "",
          bagian: data.bagian || "SETTING",
          pic: data.pic,
          priority: data.priority || "Low",
          startDate: startDateStr,
          endDate: endDateStr,
          workDays: workDays,
          note: data.note,
          status: data.status || "BELUM DIKERJAKAN",
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Pekerjaan berhasil ditambahkan ke order!");
        if (json.id) {
          const createdTask: SpreadsheetTask = {
            id: json.id,
            task: savedTaskName,
            project: proj,
            division: "",
            bagian: data.bagian || "SETTING",
            pic: data.pic,
            priority: data.priority || "Low",
            startDate: startDateStr,
            endDate: endDateStr,
            workDays: workDays,
            note: data.note,
            status: data.status || "BELUM DIKERJAKAN",
            source: "sintak",
            tglOrder: selectedProjectGroup?.tglOrder || "",
          };
          setTasks((prev) => {
            const remaining = prev.filter((t) => !(t.project === proj && !t.task));
            return [createdTask, ...remaining];
          });
          setSelectedProjectGroup((prev) => {
            if (!prev) return null;
            const validTasks = prev.tasks.filter((t) => !!t.task);
            return {
              ...prev,
              tasks: [...validTasks, createdTask],
            };
          });
        }
      } else {
        toast.error(json.error || "Gagal menambahkan pekerjaan");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    }
  };

  const handleDeleteInlineTask = async (taskId: number) => {
    if (!confirm("Yakin ingin menghapus aktivitas pekerjaan ini?")) return;

    const proj = selectedProjectGroup?.project || "";
    // Optimistic delete
    setTasks((prev) => {
      const remaining = prev.filter((t) => t.id !== taskId);
      const stillHasProjectTasks = remaining.some((t) => t.project === proj && !!t.task);
      if (!stillHasProjectTasks && proj) {
        return [
          {
            id: -Date.now(),
            task: "",
            project: proj,
            division: "",
            bagian: "",
            pic: "",
            priority: "Low",
            startDate: "",
            endDate: "",
            workDays: "",
            note: "",
            status: "BELUM DIKERJAKAN",
            source: "sopd",
            tglOrder: selectedProjectGroup?.tglOrder || "",
          },
          ...remaining,
        ];
      }
      return remaining;
    });

    setSelectedProjectGroup((prev) => {
      if (!prev) return null;
      const remaining = prev.tasks.filter((t) => t.id !== taskId);
      return { ...prev, tasks: remaining };
    });

    try {
      const res = await fetch(`/api/laporan-pekerjaan?id=${taskId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Pekerjaan berhasil dihapus");
      } else {
        toast.error(json.error || "Gagal menghapus data");
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
      fetchData();
    }
  };

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPic, selectedStatus, searchTerm]);

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

  // Saling-terkait filter options (Bagian, PIC, Status)
  const bagianOptions = useMemo<FilterOption[]>(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (selectedPic !== "ALL" && t.pic.toUpperCase() !== selectedPic.toUpperCase()) return;
      if (selectedStatus !== "ALL" && t.status.toUpperCase() !== selectedStatus.toUpperCase()) return;
      if (t.bagian) set.add(t.bagian);
    });
    const sorted = Array.from(set).sort();
    return [
      { value: "ALL", label: "Semua Bagian" },
      ...sorted.map((b) => ({ value: b, label: b })),
    ];
  }, [tasks, selectedPic, selectedStatus]);

  const picOptions = useMemo<FilterOption[]>(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (selectedBagianFilter !== "ALL" && (t.bagian || "").toUpperCase() !== selectedBagianFilter.toUpperCase()) return;
      if (selectedStatus !== "ALL" && t.status.toUpperCase() !== selectedStatus.toUpperCase()) return;
      if (t.pic) set.add(t.pic);
    });
    const sorted = Array.from(set).sort();
    return [
      { value: "ALL", label: "Semua PIC" },
      ...sorted.map((p) => ({ value: p, label: p })),
    ];
  }, [tasks, selectedBagianFilter, selectedStatus]);

  const statusOptions = useMemo<FilterOption[]>(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (selectedBagianFilter !== "ALL" && (t.bagian || "").toUpperCase() !== selectedBagianFilter.toUpperCase()) return;
      if (selectedPic !== "ALL" && t.pic.toUpperCase() !== selectedPic.toUpperCase()) return;
      if (t.status) set.add(t.status.toUpperCase());
    });
    const allStatuses = ["BELUM DIKERJAKAN", "IN PROGRESS", "PENDING", "CANCEL", "SELESAI"];
    const available = allStatuses.filter((s) => set.has(s));
    return [
      { value: "ALL", label: "Semua Status" },
      ...available.map((s) => ({ value: s, label: s })),
    ];
  }, [tasks, selectedBagianFilter, selectedPic]);

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
        selectedBagianFilter !== "ALL" &&
        (t.bagian || "").toUpperCase() !== selectedBagianFilter.toUpperCase()
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
  }, [tasks, selectedPic, selectedBagianFilter, selectedStatus, deferredSearchTerm]);

  // Group filtered tasks by unique project order
  const groupedOrders = useMemo(() => {
    const map = new Map<string, { project: string; tglOrder: string; tasks: SpreadsheetTask[] }>();

    filteredTasks.forEach((t) => {
      const proj = t.project || "Tanpa Project Order";
      if (!map.has(proj)) {
        map.set(proj, {
          project: proj,
          tglOrder: t.tglOrder || "",
          tasks: t.task ? [t] : [],
        });
      } else {
        const group = map.get(proj)!;
        if (!group.tglOrder && t.tglOrder) {
          group.tglOrder = t.tglOrder;
        }
        if (t.task) {
          group.tasks.push(t);
        }
      }
    });

    return Array.from(map.values()).map((g) => ({
      ...g,
      ...summarizeOrderTasks(g.tasks, g.project),
    }));
  }, [filteredTasks]);

  // Global Sorted Unique Orders
  // ponytail: tanpa sort pun tetap urut tgl order terlama dulu (fallback urutan dasar)
  const sortedGroupedOrders = useMemo(() => {
    if (!sortField) {
      return [...groupedOrders].sort((a, b) => {
        const timeA = tglOrderSortTime(a.tglOrder);
        const timeB = tglOrderSortTime(b.tglOrder);
        if (timeA !== timeB) return timeA - timeB;
        return (a.project || "").localeCompare(b.project || "", "id", { numeric: true });
      });
    }
    return [...groupedOrders].sort((a, b) => {
      if (sortField === "tglOrder") {
        const timeA = tglOrderSortTime(a.tglOrder);
        const timeB = tglOrderSortTime(b.tglOrder);
        if (timeA !== timeB) {
          return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
        }
      }
      let comp = 0;
      if (sortField === "progress") {
        comp = a.progressPct - b.progressPct;
      } else if (sortField === "terakhir") {
        comp = (a.pekerjaanTerakhir || "").localeCompare(
          b.pekerjaanTerakhir || "",
          "id",
          { numeric: true }
        );
      } else if (sortField === "selanjutnya") {
        comp = (a.pekerjaanSelanjutnya || "").localeCompare(
          b.pekerjaanSelanjutnya || "",
          "id",
          { numeric: true }
        );
      } else {
        comp = (a.project || "").localeCompare(b.project || "", "id", {
          numeric: true,
        });
      }
      if (comp !== 0) return sortOrder === "asc" ? comp : -comp;
      // Tie-breaker: urutan dasar tgl order terlama
      return tglOrderSortTime(a.tglOrder) - tglOrderSortTime(b.tglOrder);
    });
  }, [groupedOrders, sortField, sortOrder]);

  // Pagination calculation based on unique orders
  const totalPages = Math.ceil(sortedGroupedOrders.length / pageSize) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedGroupedOrders.slice(start, start + pageSize);
  }, [sortedGroupedOrders, currentPage, pageSize]);

  // Tasks filtered by PIC and search term (for stat card counts)
  const tasksForCounts = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.task) return false;
      if (
        selectedPic !== "ALL" &&
        t.pic.toUpperCase() !== selectedPic.toUpperCase()
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
  }, [tasks, selectedPic, deferredSearchTerm]);

  // Counts based on tasksForCounts
  const counts = useMemo(() => {
    const total = tasksForCounts.length;
    let belumDikerjakan = 0;
    let selesai = 0;
    let inProgress = 0;
    let pending = 0;
    let cancel = 0;

    tasksForCounts.forEach((t) => {
      const s = (t.status || "").trim().toUpperCase();
      if (s === "BELUM DIKERJAKAN") belumDikerjakan++;
      else if (s === "SELESAI") selesai++;
      else if (s === "IN PROGRESS") inProgress++;
      else if (s === "PENDING") pending++;
      else if (s === "CANCEL") cancel++;
    });

    return { total, belumDikerjakan, selesai, inProgress, pending, cancel };
  }, [tasksForCounts]);

  // Chart Data 1: Breakdown Pekerjaan per Status per PIC (Lazy: hanya dihitung saat accordion terbuka)
  const picChartData = useMemo(() => {
    if (!isAnalyticsOpen) return [];
    const map: Record<
      string,
      { name: string; BelumDikerjakan: number; Selesai: number; InProgress: number; Pending: number; Cancel: number; Total: number }
    > = {};
    filteredTasks.forEach((t) => {
      const pic = t.pic ? t.pic.toUpperCase() : "TANPA PIC";
      if (!map[pic]) {
        map[pic] = { name: pic, BelumDikerjakan: 0, Selesai: 0, InProgress: 0, Pending: 0, Cancel: 0, Total: 0 };
      }
      map[pic].Total++;
      const s = (t.status || "").trim().toUpperCase();
      if (s === "BELUM DIKERJAKAN") map[pic].BelumDikerjakan++;
      else if (s === "SELESAI") map[pic].Selesai++;
      else if (s === "IN PROGRESS") map[pic].InProgress++;
      else if (s === "PENDING") map[pic].Pending++;
      else if (s === "CANCEL") map[pic].Cancel++;
    });
    return Object.values(map).sort((a, b) => b.Total - a.Total);
  }, [filteredTasks, isAnalyticsOpen]);

  // Chart Data 2: Pie Chart Status (Lazy: hanya dihitung saat accordion terbuka)
  const statusPieData = useMemo(() => {
    if (!isAnalyticsOpen) return [];
    const map: Record<string, number> = {
      "BELUM DIKERJAKAN": 0,
      "IN PROGRESS": 0,
      PENDING: 0,
      CANCEL: 0,
      SELESAI: 0,
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
  }, [filteredTasks, isAnalyticsOpen]);

  // Chart Data 3: Priority Distribution (Lazy: hanya dihitung saat accordion terbuka)
  const priorityChartData = useMemo(() => {
    if (!isAnalyticsOpen) return [];
    const map: Record<
      string,
      { name: string; BelumDikerjakan: number; Selesai: number; InProgress: number; Pending: number; Cancel: number; Total: number }
    > = {};
    filteredTasks.forEach((t) => {
      const p = t.priority ? t.priority.trim() : "Low";
      if (!map[p]) {
        map[p] = { name: p, BelumDikerjakan: 0, Selesai: 0, InProgress: 0, Pending: 0, Cancel: 0, Total: 0 };
      }
      map[p].Total++;
      const s = (t.status || "").trim().toUpperCase();
      if (s === "BELUM DIKERJAKAN") map[p].BelumDikerjakan++;
      else if (s === "SELESAI") map[p].Selesai++;
      else if (s === "IN PROGRESS") map[p].InProgress++;
      else if (s === "PENDING") map[p].Pending++;
      else if (s === "CANCEL") map[p].Cancel++;
    });
    return Object.values(map).sort((a, b) => b.Total - a.Total);
  }, [filteredTasks, isAnalyticsOpen]);

  // Resizable columns state with localStorage persistence
  const DEFAULT_COL_WIDTHS = useMemo(
    () => ({
      aksi: 130,
      tglOrder: 165,
      project: 550,
      progress: 140,
      terakhir: 220,
      selanjutnya: 220,
    }),
    []
  );

  const [colWidths, setColWidths] = useState<Record<string, number>>(DEFAULT_COL_WIDTHS);

  // Lebar tabel = jumlah lebar kolom (min. selebar container) supaya resize
  // satu kolom tidak mendistribusikan ulang lebar kolom lain.
  const applyTableWidth = (
    widths: Record<string, number>,
    container: HTMLDivElement | null
  ) => {
    if (!container) return;
    const table = container.querySelector("table");
    if (!table) return;
    const sum = Object.values(widths).reduce((a, b) => a + b, 0);
    table.style.width = `${Math.max(sum, container.clientWidth)}px`;
  };

  // Sync lebar tabel saat colWidths / layout berubah atau window di-resize
  useEffect(() => {
    applyTableWidth(colWidths, tableContainerRef.current);
    const onWinResize = () =>
      applyTableWidth(colWidths, tableContainerRef.current);
    window.addEventListener("resize", onWinResize);
    return () => window.removeEventListener("resize", onWinResize);
  }, [colWidths, isAnalyticsOpen]);

  // Load saved column widths from localStorage on mount
  // (aksi & tglOrder tidak resizable → selalu pakai default)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("laporan_pekerjaan_col_widths");
      if (saved) {
        const parsed = JSON.parse(saved);
        const { aksi: _a, tglOrder: _t, ...rest } = parsed;
        setColWidths((prev) => ({ ...prev, ...rest }));
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
        applyTableWidth(
          { ...colWidths, [field]: finalWidth },
          tableContainerRef.current
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
    field: SortField,
    label: string,
    alignCenter = false,
    enableResize = true
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
        {enableResize && (
          <div
            onMouseDown={(resizeEvt) => handleResizeStart(field, resizeEvt)}
            onClick={(resizeEvt) => resizeEvt.stopPropagation()}
            className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-emerald-500/50 active:bg-emerald-600 z-20 group-hover:bg-slate-300/80 transition-colors"
            title="Geser untuk mengatur lebar kolom"
          />
        )}
      </th>
    );
  };

  return (
    <div
      ref={clientContainerRef}
      className={`text-slate-800 ${
        isAnalyticsOpen
          ? "flex flex-col gap-4 w-full pb-44 sm:pb-40 md:pb-24"
          : "space-y-3 pb-44 sm:max-md:pb-36 sm:pb-40 md:space-y-0 md:flex-1 md:min-h-0 md:flex md:flex-col md:gap-3 md:h-full md:overflow-hidden md:pb-0"
      }`}
    >
      {/* Accordion: Statistik & Grafik Analisis */}
      <div className="shrink-0 bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden transition-all">
        <button
          type="button"
          onClick={toggleAnalytics}
          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between bg-slate-50/70 hover:bg-slate-100/80 transition-colors text-left focus:outline-none gap-2"
        >
          <div className="flex items-center space-x-2 min-w-0 flex-1 overflow-hidden">
            <BarChart3 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-[11px] sm:text-xs font-bold text-slate-800 truncate">
              Ringkasan Statistik & Grafik Analisis
            </span>
            {selectedStatus !== "ALL" && (
              <span className="shrink-0 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold bg-emerald-100 text-emerald-700 rounded-full">
                {selectedStatus}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1.5 text-slate-500 text-[10.5px] sm:text-xs font-medium shrink-0">
            <span>{isAnalyticsOpen ? "Sembunyikan" : "Tampilkan"}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 ${
                isAnalyticsOpen ? "rotate-180" : ""
              }`}
            />
          </div>
        </button>

        {isAnalyticsOpen && (
          <div className="p-4 border-t border-slate-100 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
            {/* Cards Statistik (Klik untuk Filter Status) */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
              {/* Total Task */}
              <div
                onClick={() => handleCardStatusClick("ALL")}
                className={`p-3 rounded-xl border transition-all cursor-pointer select-none hover:shadow-md ${
                  selectedStatus === "ALL"
                    ? "bg-slate-100 border-slate-400 ring-2 ring-slate-400/50 shadow-sm"
                    : "bg-white border-slate-200/80 hover:bg-slate-50 shadow-sm"
                }`}
                title="Klik untuk lihat semua status"
              >
                <div className="flex items-center justify-between text-slate-500 mb-0.5">
                  <span className="text-[11px] font-semibold">Total Task</span>
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-black text-slate-800">
                    {counts.total.toLocaleString("id-ID")}
                  </span>
                  {selectedStatus === "ALL" && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded">
                      Aktif
                    </span>
                  )}
                </div>
              </div>

              {/* Belum Dikerjakan */}
              <div
                onClick={() => handleCardStatusClick("BELUM DIKERJAKAN")}
                className={`p-3 rounded-xl border transition-all cursor-pointer select-none hover:shadow-md ${
                  selectedStatus === "BELUM DIKERJAKAN"
                    ? "bg-slate-200/80 border-slate-500 ring-2 ring-slate-500/50 shadow-sm"
                    : "bg-gradient-to-br from-white to-slate-50/30 border-slate-200/80 hover:border-slate-400 shadow-sm"
                }`}
                title="Klik untuk filter status BELUM DIKERJAKAN"
              >
                <div className="flex items-center justify-between text-slate-600 mb-0.5">
                  <span className="text-[11px] font-semibold">Belum Dikerjakan</span>
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-black text-slate-700">
                    {counts.belumDikerjakan.toLocaleString("id-ID")}
                  </span>
                  {selectedStatus === "BELUM DIKERJAKAN" && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-700 bg-slate-200/80 px-1.5 py-0.5 rounded">
                      Aktif
                    </span>
                  )}
                </div>
              </div>

              {/* In Progress */}
              <div
                onClick={() => handleCardStatusClick("IN PROGRESS")}
                className={`p-3 rounded-xl border transition-all cursor-pointer select-none hover:shadow-md ${
                  selectedStatus === "IN PROGRESS"
                    ? "bg-sky-100/80 border-sky-500 ring-2 ring-sky-500/50 shadow-sm"
                    : "bg-gradient-to-br from-white to-sky-50/30 border-sky-200/80 hover:border-sky-400 shadow-sm"
                }`}
                title="Klik untuk filter status IN PROGRESS"
              >
                <div className="flex items-center justify-between text-sky-600 mb-0.5">
                  <span className="text-[11px] font-semibold">In Progress</span>
                  <Clock className="w-3.5 h-3.5 text-sky-500" />
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-black text-sky-700">
                    {counts.inProgress.toLocaleString("id-ID")}
                  </span>
                  {selectedStatus === "IN PROGRESS" && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-sky-700 bg-sky-200/80 px-1.5 py-0.5 rounded">
                      Aktif
                    </span>
                  )}
                </div>
              </div>

              {/* Pending */}
              <div
                onClick={() => handleCardStatusClick("PENDING")}
                className={`p-3 rounded-xl border transition-all cursor-pointer select-none hover:shadow-md ${
                  selectedStatus === "PENDING"
                    ? "bg-amber-100/80 border-amber-500 ring-2 ring-amber-500/50 shadow-sm"
                    : "bg-gradient-to-br from-white to-amber-50/30 border-amber-200/80 hover:border-amber-400 shadow-sm"
                }`}
                title="Klik untuk filter status PENDING"
              >
                <div className="flex items-center justify-between text-amber-600 mb-0.5">
                  <span className="text-[11px] font-semibold">Pending</span>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-black text-amber-700">
                    {counts.pending.toLocaleString("id-ID")}
                  </span>
                  {selectedStatus === "PENDING" && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-200/80 px-1.5 py-0.5 rounded">
                      Aktif
                    </span>
                  )}
                </div>
              </div>

              {/* Cancel */}
              <div
                onClick={() => handleCardStatusClick("CANCEL")}
                className={`p-3 rounded-xl border transition-all cursor-pointer select-none hover:shadow-md ${
                  selectedStatus === "CANCEL"
                    ? "bg-rose-100/80 border-rose-500 ring-2 ring-rose-500/50 shadow-sm"
                    : "bg-gradient-to-br from-white to-rose-50/30 border-rose-200/80 hover:border-rose-400 shadow-sm"
                }`}
                title="Klik untuk filter status CANCEL"
              >
                <div className="flex items-center justify-between text-rose-600 mb-0.5">
                  <span className="text-[11px] font-semibold">Cancel</span>
                  <XCircle className="w-3.5 h-3.5 text-rose-500" />
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-black text-rose-700">
                    {counts.cancel.toLocaleString("id-ID")}
                  </span>
                  {selectedStatus === "CANCEL" && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-rose-700 bg-rose-200/80 px-1.5 py-0.5 rounded">
                      Aktif
                    </span>
                  )}
                </div>
              </div>

              {/* Selesai */}
              <div
                onClick={() => handleCardStatusClick("SELESAI")}
                className={`p-3 rounded-xl border transition-all cursor-pointer select-none hover:shadow-md ${
                  selectedStatus === "SELESAI"
                    ? "bg-emerald-100/80 border-emerald-500 ring-2 ring-emerald-500/50 shadow-sm"
                    : "bg-gradient-to-br from-white to-emerald-50/30 border-emerald-200/80 hover:border-emerald-400 shadow-sm"
                }`}
                title="Klik untuk filter status SELESAI"
              >
                <div className="flex items-center justify-between text-emerald-600 mb-0.5">
                  <span className="text-[11px] font-semibold">Selesai</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-black text-emerald-700">
                    {counts.selesai.toLocaleString("id-ID")}
                  </span>
                  {selectedStatus === "SELESAI" && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-200/80 px-1.5 py-0.5 rounded">
                      Aktif
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Visualisasi Dashboard Recharts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Bar Chart 1: Beban Kerja per PIC */}
              <div className="lg:col-span-6 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 gap-2">
                  <div className="flex items-center space-x-2 min-w-0 flex-1 overflow-hidden">
                    <BarChart3 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <h3 className="text-xs font-bold text-slate-800 truncate">
                      Beban Kerja Per PIC (Status Lengkap)
                    </h3>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium shrink-0 hidden sm:inline">
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
                          <linearGradient id="gradBelumDikerjakan" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#64748b" stopOpacity={0.7} />
                          </linearGradient>
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
                          dataKey="BelumDikerjakan"
                          fill="url(#gradBelumDikerjakan)"
                          radius={[6, 6, 0, 0]}
                          name="BELUM DIKERJAKAN"
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
                        <Bar
                          dataKey="Selesai"
                          fill="url(#gradSelesai)"
                          radius={[6, 6, 0, 0]}
                          name="SELESAI"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <ChartLegend items={STATUS_LEGEND} />
              </div>

              {/* Donut Chart 1: Proporsi Status */}
              <div className="lg:col-span-6 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 gap-2">
                  <div className="flex items-center space-x-2 min-w-0 flex-1 overflow-hidden">
                    <PieChartIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                    <h3 className="text-xs font-bold text-slate-800 truncate">
                      Proporsi Status Pekerjaan
                    </h3>
                  </div>
                  <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium shrink-0 hidden sm:inline">
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
                          <linearGradient id="gradStatusBelumDikerjakan" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#94a3b8" stopOpacity={1} />
                            <stop offset="100%" stopColor="#64748b" stopOpacity={0.85} />
                          </linearGradient>
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
                              "BELUM DIKERJAKAN": "url(#gradStatusBelumDikerjakan)",
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
            </div>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="portrait:max-sm:sticky portrait:max-sm:top-7 portrait:max-sm:z-30 portrait:max-sm:bg-[#f8fafc] portrait:max-sm:-mx-4 portrait:max-sm:px-4 portrait:max-sm:pt-1 portrait:max-sm:pb-2 portrait:max-sm:mb-1 portrait:max-sm:shadow-md portrait:max-sm:border-b portrait:max-sm:border-slate-200/80 static p-0 mx-0 mb-0 shadow-none border-none bg-transparent">
        <div className="shrink-0 bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
          <div className="flex items-center gap-2 flex-1 w-full">
            {/* Tombol Reload Data di Samping Kiri Search Bar */}
            <button
              type="button"
              onClick={() => fetchData(true)}
              disabled={loading}
              className="h-8 px-3 text-xs font-bold text-slate-600 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50 rounded-lg border border-slate-200 transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer shadow-sm"
              title="Reload Data Laporan Pekerjaan"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
              <span className="hidden sm:inline">Reload</span>
            </button>

            {/* Input Search */}
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
          </div>

          <div className="flex items-center space-x-2 w-full md:w-auto min-w-0">
            <div className="flex items-center text-xs text-slate-500 font-medium shrink-0">
              <Filter className="w-3.5 h-3.5 mr-1 text-slate-400" /> Filter:
            </div>

            {(selectedBagianFilter !== "ALL" || selectedPic !== "ALL" || selectedStatus !== "ALL" || searchTerm !== "") && (
              <button
                type="button"
                onClick={() => {
                  setSelectedBagianFilter("ALL");
                  setSelectedPic("ALL");
                  setSelectedStatus("ALL");
                  setSearchTerm("");
                }}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors shrink-0"
                title="Reset Semua Filter"
              >
                <X size={12} /> Reset
              </button>
            )}

            <SquareDropdown
              options={bagianOptions}
              value={selectedBagianFilter}
              onChange={setSelectedBagianFilter}
              searchPlaceholder="Cari Bagian..."
              widthClass="w-44"
            />

            <SquareDropdown
              options={picOptions}
              value={selectedPic}
              onChange={setSelectedPic}
              searchPlaceholder="Cari PIC..."
              widthClass="w-44"
            />

            <SquareDropdown
              options={statusOptions}
              value={selectedStatus}
              onChange={setSelectedStatus}
              searchPlaceholder="Cari Status..."
              widthClass="w-44"
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Tabel Data Pekerjaan (Desktop & Tablet) / Card View (HP) */}
      <div
        className={`bg-white rounded-xl border border-slate-200/80 shadow-sm relative ${
          isAnalyticsOpen
            ? "shrink-0"
            : "md:flex-1 md:min-h-0 md:flex md:flex-col md:overflow-hidden"
        }`}
      >
        {/* Tampilan Card khusus HP Portrait (Sembunyi di Landscape & Desktop) */}
        <div className="block landscape:hidden md:hidden divide-y divide-slate-100 p-3 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
              Memuat data laporan pekerjaan...
            </div>
          ) : paginatedOrders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Tidak ada data order pekerjaan yang ditemukan.
            </div>
          ) : (
            paginatedOrders.map((group, idx) => {
              const totalTask = group.tasks.length;
              const selesaiTask = group.tasks.filter((t) => (t.status || "").toUpperCase() === "SELESAI").length;

              return (
                <div
                  key={idx}
                  className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80 hover:border-slate-300 hover:bg-slate-100/50 transition-all select-none space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-800 leading-snug min-w-0 flex-1 break-words">
                      {group.project}
                    </h4>
                    <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {selesaiTask}/{totalTask} Selesai
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200/60">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Tanggal Order</span>
                      <span className="font-semibold text-slate-700">
                        {fmtTglOrder(group.tglOrder)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Total Aktivitas</span>
                      <span className="font-bold text-emerald-700">
                        {totalTask} Task
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-slate-400 font-semibold">Progress</span>
                      <span className="font-bold text-emerald-700">{group.progressPct}%</span>
                    </div>
                    <div className="h-2 bg-slate-200/70 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          group.progressPct >= 100 ? "bg-emerald-600" : "bg-emerald-500"
                        }`}
                        style={{ width: `${group.progressPct}%` }}
                      />
                    </div>
                  </div>

                  {(group.pekerjaanTerakhir || group.pekerjaanSelanjutnya) && (
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 space-y-1.5 text-[11px]">
                      <div className="flex gap-2">
                        <span className="text-slate-400 shrink-0 w-20">Terakhir</span>
                        <span className="font-semibold text-slate-700 min-w-0 break-words">
                          {group.pekerjaanTerakhir || "-"}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-slate-400 shrink-0 w-20">Selanjutnya</span>
                        <span className="font-semibold text-slate-700 min-w-0 break-words">
                          {group.pekerjaanSelanjutnya || "-"}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedProjectGroup(group)}
                      className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Eye size={13} />
                      Detail
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Tampilan Tabel khusus HP Landscape, Tablet, & Desktop */}
        <div
          ref={tableContainerRef}
          className={`hidden landscape:block md:block overflow-x-auto overflow-y-auto custom-scrollbar transition-all duration-200 ${
            isAnalyticsOpen
              ? "max-h-[300px] sm:max-h-[480px] shrink-0"
              : "flex-1 min-h-[220px] md:max-h-none max-h-[calc(100vh-130px)]"
          }`}
          style={
            {
              "--col-aksi": `${colWidths.aksi || 110}px`,
              "--col-tglOrder": `${colWidths.tglOrder || 150}px`,
              "--col-project": `${colWidths.project || 550}px`,
              "--col-progress": `${colWidths.progress || 140}px`,
              "--col-terakhir": `${colWidths.terakhir || 220}px`,
              "--col-selanjutnya": `${colWidths.selanjutnya || 220}px`,
            } as React.CSSProperties
          }
        >
          <table className="text-left text-xs border-collapse table-fixed">
            <thead className="sticky top-0 z-20 bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 shadow-sm">
              <tr>
                <th
                  style={{ width: "130px", minWidth: "130px" }}
                  className="relative px-3 py-2.5 text-center bg-slate-50 sticky top-0 z-10 border-b border-slate-200 select-none group"
                >
                  <span className="truncate">Aksi</span>
                </th>
                {renderSortableHeader("tglOrder", "Tanggal Order", false, false)}
                {renderSortableHeader("project", "Project Order")}
                {renderSortableHeader("progress", "Progress")}
                {renderSortableHeader("terakhir", "Pekerjaan Terakhir")}
                {renderSortableHeader("selanjutnya", "Pekerjaan Selanjutnya")}
                {/* Spacer: menyerap sisa lebar tabel agar resize tidak menggeser kolom lain */}
                <th className="px-0" aria-hidden />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-16 text-center text-slate-400"
                  >
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    Memuat data laporan pekerjaan...
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-16 text-center text-slate-400"
                  >
                    Tidak ada data order pekerjaan yang ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((group, idx) => {
                  const isSelected = selectedRowIndex === idx;
                  return (
                    <tr
                      key={idx}
                      onClick={() =>
                        setSelectedRowIndex((prev) => (prev === idx ? null : idx))
                      }
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? "bg-emerald-100/70 shadow-[inset_4px_0_0_0_#059669] font-semibold"
                          : "hover:bg-emerald-50/50"
                      }`}
                    >
                      <td
                        style={{
                          width: "var(--col-aksi)",
                          maxWidth: "var(--col-aksi)",
                        }}
                        className="px-2 py-2.5 text-center truncate"
                      >
                        <div className="flex items-center justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProjectGroup(group);
                            }}
                            className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                            title="Lihat Detail Task Order"
                          >
                            <Eye size={13} />
                            Detail
                          </button>
                        </div>
                      </td>
                      <td
                        title={group.tglOrder || "-"}
                        style={{
                          width: "var(--col-tglOrder)",
                          maxWidth: "var(--col-tglOrder)",
                        }}
                        className="px-3 py-2.5 whitespace-nowrap text-slate-600 truncate font-medium"
                      >
                        {fmtTglOrder(group.tglOrder)}
                      </td>
                      <td
                        title={group.project}
                        style={{
                          width: "var(--col-project)",
                          maxWidth: "var(--col-project)",
                        }}
                        className={`px-3 py-2.5 truncate ${
                          isSelected ? "text-emerald-950 font-bold" : "font-semibold text-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="truncate">{group.project}</span>
                          <span className="shrink-0 text-[10.5px] font-normal px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {group.tasks.length} task
                          </span>
                        </div>
                      </td>
                      <td
                        title={`${group.progressPct}% selesai`}
                        style={{
                          width: "var(--col-progress)",
                          maxWidth: "var(--col-progress)",
                        }}
                        className="px-3 py-2.5"
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden min-w-[36px]">
                            <div
                              className={`h-full rounded-full transition-all ${
                                group.progressPct >= 100 ? "bg-emerald-600" : "bg-emerald-500"
                              }`}
                              style={{ width: `${group.progressPct}%` }}
                            />
                          </div>
                          <span className="shrink-0 text-[11px] font-bold text-slate-600 w-9 text-right">
                            {group.progressPct}%
                          </span>
                        </div>
                      </td>
                      <td
                        title={group.pekerjaanTerakhir}
                        style={{
                          width: "var(--col-terakhir)",
                          maxWidth: "var(--col-terakhir)",
                        }}
                        className="px-3 py-2.5 truncate text-slate-600"
                      >
                        {group.pekerjaanTerakhir || "-"}
                      </td>
                      <td
                        title={group.pekerjaanSelanjutnya}
                        style={{
                          width: "var(--col-selanjutnya)",
                          maxWidth: "var(--col-selanjutnya)",
                        }}
                        className="px-3 py-2.5 truncate text-slate-600"
                      >
                        {group.pekerjaanSelanjutnya || "-"}
                      </td>
                      <td className="px-0" aria-hidden />
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Sintak Standard TableFooter (Mandiri di luar card tabel, samakan 100% dengan SOPd) */}
      <TableFooter
        totalCount={groupedOrders.length}
        currentCount={paginatedOrders.length}
        label="Order"
        selectedCount={selectedRowIndex !== null ? 1 : 0}
        onClearSelection={() => setSelectedRowIndex(null)}
        loadTime={loadTime}
        page={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Floating Scroll Navigation (Ke Atas & Ke Bawah - Fade total saat idle) */}
      {(showTopBtn || showBottomBtn) && (
        <Portal>
          <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchEnd={() => {
              if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
              idleTimerRef.current = setTimeout(() => {
                setIsHovered(false);
                setIsNavActive(false);
              }, 1200);
            }}
            className={`fixed bottom-6 right-6 z-[80] transition-all duration-300 ease-out ${
              isNavActive || isHovered
                ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                : "opacity-0 translate-y-4 scale-90 pointer-events-none"
            }`}
          >
            <div className={`bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl shadow-emerald-950/20 rounded-full p-1.5 flex flex-col transition-all duration-300 ring-1 ring-black/5 ${showTopBtn && showBottomBtn ? "gap-1.5" : "gap-0"}`}>
              {showTopBtn && (
                <button
                  type="button"
                  onClick={() => {
                    scrollToTop();
                    setTimeout(() => setIsHovered(false), 300);
                  }}
                  className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 hover:shadow-emerald-600/50 hover:scale-110 active:scale-95 transition-all duration-300 ease-out cursor-pointer"
                  title="Ke Paling Atas"
                  aria-label="Ke Paling Atas"
                >
                  <ChevronUp size={20} strokeWidth={2.5} />
                </button>
              )}
              {showBottomBtn && (
                <button
                  type="button"
                  onClick={() => {
                    scrollToBottom();
                    setTimeout(() => setIsHovered(false), 300);
                  }}
                  className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/30 hover:bg-emerald-600 hover:shadow-emerald-600/40 hover:scale-110 active:scale-95 transition-all duration-300 ease-out cursor-pointer"
                  title="Ke Paling Bawah"
                  aria-label="Ke Paling Bawah"
                >
                  <ChevronDown size={20} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>
        </Portal>
      )}

      {/* Conflict Resolution Modal */}
      {showConflictModal && currentConflict && (
        <Portal>
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-amber-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-amber-100 bg-gradient-to-r from-amber-50 to-amber-50 shrink-0 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-gray-800 tracking-tight">
                      ⚠️ Conflict Detected
                    </h3>
                    <p className="text-[11px] text-gray-500 font-medium">
                      Data berubah di Spreadsheet & SINTAK. Pilih versi mana yang mau dipakai.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowConflictModal(false);
                    setCurrentConflict(null);
                  }}
                  className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white/80 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  {/* Versi Manual (SINTAK) */}
                  <div className="border-2 border-emerald-200 rounded-xl p-4 bg-emerald-50/50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-emerald-700">Versi SINTAK (Manual)</h4>
                      <span className="text-xs text-emerald-600 font-semibold">
                        {currentConflict.manual.updated_at ? new Date(currentConflict.manual.updated_at).toLocaleString('id-ID') : 'N/A'}
                      </span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div><span className="font-bold text-gray-600">Task:</span> {currentConflict.manual.task}</div>
                      <div><span className="font-bold text-gray-600">Project:</span> {currentConflict.manual.project || '-'}</div>
                      <div><span className="font-bold text-gray-600">Bagian:</span> {currentConflict.manual.division || '-'}</div>
                      <div><span className="font-bold text-gray-600">PIC:</span> {currentConflict.manual.pic || '-'}</div>
                      <div><span className="font-bold text-gray-600">Priority:</span> {currentConflict.manual.priority || '-'}</div>
                      <div><span className="font-bold text-gray-600">Status:</span> {currentConflict.manual.status || '-'}</div>
                      <div><span className="font-bold text-gray-600">Note:</span> {currentConflict.manual.note || '-'}</div>
                    </div>
                  </div>

                  {/* Versi Spreadsheet */}
                  <div className="border-2 border-blue-200 rounded-xl p-4 bg-blue-50/50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-blue-700">Versi Spreadsheet</h4>
                      <span className="text-xs text-blue-600 font-semibold">Terbaru dari Sheet</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div><span className="font-bold text-gray-600">Task:</span> {currentConflict.spreadsheet.task}</div>
                      <div><span className="font-bold text-gray-600">Project:</span> {currentConflict.spreadsheet.project || '-'}</div>
                      <div><span className="font-bold text-gray-600">Bagian:</span> {currentConflict.spreadsheet.division || '-'}</div>
                      <div><span className="font-bold text-gray-600">PIC:</span> {currentConflict.spreadsheet.pic || '-'}</div>
                      <div><span className="font-bold text-gray-600">Priority:</span> {currentConflict.spreadsheet.priority || '-'}</div>
                      <div><span className="font-bold text-gray-600">Status:</span> {currentConflict.spreadsheet.status || '-'}</div>
                      <div><span className="font-bold text-gray-600">Note:</span> {currentConflict.spreadsheet.note || '-'}</div>
                    </div>
                  </div>
                </div>

                {conflicts.length > 1 && (
                  <div className="text-xs text-gray-500 text-center font-medium">
                    Conflict {conflicts.indexOf(currentConflict) + 1} dari {conflicts.length}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 shrink-0 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => {
                    const nextIdx = conflicts.indexOf(currentConflict) + 1;
                    if (nextIdx < conflicts.length) {
                      setCurrentConflict(conflicts[nextIdx]);
                    } else {
                      setShowConflictModal(false);
                      setCurrentConflict(null);
                      setConflicts([]);
                    }
                  }}
                  className="px-5 py-2.5 text-[13px] font-bold text-gray-500 hover:text-gray-700 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 transition-all"
                >
                  Skip
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      const nextIdx = conflicts.indexOf(currentConflict) + 1;
                      if (nextIdx < conflicts.length) {
                        setCurrentConflict(conflicts[nextIdx]);
                      } else {
                        setShowConflictModal(false);
                        setCurrentConflict(null);
                        setConflicts([]);
                        await fetchData();
                      }
                    }}
                    className="px-6 py-2.5 text-[13px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all flex items-center gap-2"
                  >
                    <Check size={15} />
                    Pakai Versi SINTAK
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/laporan-pekerjaan', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            id: currentConflict.manual.id,
                            task: currentConflict.spreadsheet.task,
                            project: currentConflict.spreadsheet.project,
                            division: currentConflict.spreadsheet.division,
                            pic: currentConflict.spreadsheet.pic,
                            priority: currentConflict.spreadsheet.priority,
                            startDate: currentConflict.spreadsheet.startDate,
                            endDate: currentConflict.spreadsheet.endDate,
                            workDays: currentConflict.spreadsheet.workDays,
                            note: currentConflict.spreadsheet.note,
                            status: currentConflict.spreadsheet.status,
                          }),
                        });
                        
                        const json = await res.json();
                        if (json.success) {
                          const nextIdx = conflicts.indexOf(currentConflict) + 1;
                          if (nextIdx < conflicts.length) {
                            setCurrentConflict(conflicts[nextIdx]);
                          } else {
                            setShowConflictModal(false);
                            setCurrentConflict(null);
                            setConflicts([]);
                            await fetchData();
                          }
                        } else {
                          alert(json.error || 'Gagal update data');
                        }
                      } catch (err: any) {
                        alert(err.message || 'Terjadi kesalahan');
                      }
                    }}
                    className="px-6 py-2.5 text-[13px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all flex items-center gap-2"
                  >
                    <FileSpreadsheet size={15} />
                    Pakai Versi Spreadsheet
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal Detail Task Order (Isolated Component untuk performa 60 FPS tanpa lag render) */}
      {selectedProjectGroup && (
        <TaskDetailModal
          selectedProjectGroup={selectedProjectGroup}
          onClose={() => setSelectedProjectGroup(null)}
          employeeOptions={employeeOptions}
          onSaveTask={handleSaveInlineEdit}
          onCreateTask={handleCreateInlineTask}
          onDeleteTask={handleDeleteInlineTask}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// Isolated Subcomponents untuk Modal Detail & Inline Editing
// Memisahkan state input ke row level agar ketikan tidak memicu re-render
// seluruh halaman (grafik, tabel utama ribuan data, dll).
// ----------------------------------------------------------------------

const fetchPekerjaanForCategory = async (bagian: string): Promise<string[]> => {
  if (!bagian) return [];
  const category = BAGIAN_CATEGORY_MAP[bagian];
  if (!category) return [];
  try {
    const res = await fetch(
      `/api/master-pekerjaan-jurnal-produksi?category=${encodeURIComponent(category)}&all=true`
    );
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data.filter((p: any) => p.name).map((p: any) => p.name);
    }
  } catch (err) {
    console.error("Gagal fetch pekerjaan:", err);
  }
  return [];
};

function TaskDetailModal({
  selectedProjectGroup,
  onClose,
  employeeOptions,
  onSaveTask,
  onCreateTask,
  onDeleteTask,
}: {
  selectedProjectGroup: {
    project: string;
    tglOrder: string;
    tasks: SpreadsheetTask[];
  };
  onClose: () => void;
  employeeOptions: any[];
  onSaveTask: (taskId: number, data: any) => Promise<void>;
  onCreateTask: (data: any) => Promise<void>;
  onDeleteTask: (taskId: number) => Promise<void>;
}) {
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [isAddingTask, setIsAddingTask] = useState<boolean>(false);

  const sortedTasks = useMemo(() => {
    return [...selectedProjectGroup.tasks].sort((a, b) => {
      const timeA = parseDateToSort(a.startDate || "") || Number.MAX_SAFE_INTEGER;
      const timeB = parseDateToSort(b.startDate || "") || Number.MAX_SAFE_INTEGER;
      if (timeA !== timeB) return timeA - timeB;
      return a.id - b.id;
    });
  }, [selectedProjectGroup.tasks]);

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full max-w-[96vw] 2xl:max-w-7xl bg-white rounded-2xl shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] overflow-hidden">
          {/* Header Modal */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0 gap-3">
            <div className="min-w-0 flex-1 pr-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {selectedProjectGroup.tglOrder ? `Tgl: ${fmtTglOrder(selectedProjectGroup.tglOrder)}` : "Tgl: -"}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {selectedProjectGroup.tasks.length} Aktivitas Pekerjaan
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800 truncate" title={selectedProjectGroup.project}>
                {selectedProjectGroup.project}
              </h3>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsAddingTask(true);
                  setEditingTaskId(null);
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Tambah Pekerjaan ke Order ini"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">Tambah Pekerjaan</span>
                <span className="sm:hidden">Tambah</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all cursor-pointer"
                title="Tutup Modal"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Body: Tabel List Task dari Order tersebut */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-4">
            <div className="border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs border-collapse table-fixed">
                <colgroup>
                  <col style={{ width: '3%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '7%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '5%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '4%' }} />
                </colgroup>
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-1.5 py-2.5 text-center">No</th>
                    <th className="px-1.5 py-2.5">Bagian</th>
                    <th className="px-1.5 py-2.5">PIC</th>
                    <th className="px-1.5 py-2.5">Task / Aktivitas</th>
                    <th className="px-1.5 py-2.5">Priority</th>
                    <th className="px-1.5 py-2.5">Start ~ End</th>
                    <th className="px-1.5 py-2.5 text-center">Work Days</th>
                    <th className="px-1.5 py-2.5">Status</th>
                    <th className="px-1.5 py-2.5">Note</th>
                    <th className="px-1.5 py-2.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                  {/* List Pekerjaan dari Order */}
                  {sortedTasks.map((task, idx) =>
                    editingTaskId === task.id ? (
                      <InlineEditRow
                        key={task.id || idx}
                        idx={idx}
                        task={task}
                        project={selectedProjectGroup.project}
                        employeeOptions={employeeOptions}
                        onSave={async (data) => {
                          await onSaveTask(task.id!, data);
                          setEditingTaskId(null);
                        }}
                        onCancel={() => setEditingTaskId(null)}
                        onDelete={() => onDeleteTask(task.id!)}
                      />
                    ) : (
                      <tr
                        key={task.id || idx}
                        onDoubleClick={() => setEditingTaskId(task.id || null)}
                        className="hover:bg-slate-50/80 transition-colors group cursor-default"
                      >
                        <td className="px-1.5 py-2 text-center font-medium text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="px-1.5 py-2 text-slate-700 font-medium break-words leading-tight">
                          {(task as any).bagian || "-"}
                        </td>
                        <td className="px-1.5 py-2 font-bold text-emerald-700 break-words leading-tight">
                          {task.pic || "-"}
                        </td>
                        <td
                          className="px-1.5 py-2 font-semibold text-slate-800 break-words leading-snug"
                          title={cleanTaskName(task.task, selectedProjectGroup.project) || task.task}
                        >
                          {cleanTaskName(task.task, selectedProjectGroup.project) || task.task}
                        </td>
                        <td className="px-1.5 py-2 text-slate-600 break-words leading-tight">
                          {task.priority || "-"}
                        </td>
                        <td className="px-1.5 py-2 text-center whitespace-nowrap text-slate-500 text-[10.5px]">
                          {task.startDate ? formatDateDisplay(task.startDate) : "-"} ~ {task.endDate ? formatDateDisplay(task.endDate) : "-"}
                        </td>
                        <td className="px-1.5 py-2 text-center font-medium text-slate-600 text-[11px] whitespace-nowrap">
                          {task.workDays ? `${task.workDays} hari` : "-"}
                        </td>
                        <td className="px-1.5 py-2 text-center whitespace-nowrap">
                          {getStatusBadge(task.status)}
                        </td>
                        <td className="px-1.5 py-2 text-slate-600 break-words whitespace-pre-wrap leading-tight text-[11px]">
                          {task.note || "-"}
                        </td>
                        <td className="px-1.5 py-2 text-center">
                          <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTaskId(task.id || null);
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                              title="Edit Pekerjaan Inline"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteTask(task.id!);
                              }}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Hapus Pekerjaan"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}

                  {/* Empty state jika belum ada aktivitas pekerjaan */}
                  {sortedTasks.length === 0 && !isAddingTask && (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <AlertCircle className="w-8 h-8 text-slate-300" />
                          <p className="font-semibold text-slate-600 text-sm">Belum ada aktivitas pekerjaan untuk order ini</p>
                          <p className="text-xs text-slate-400 max-w-md">
                            Klik tombol <b className="text-emerald-600 font-bold">+ Tambah Pekerjaan</b> di pojok kanan atas untuk mulai membuat aktivitas pekerjaan pertama.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Baris Tambah Pekerjaan Baru di Bawah */}
                  {isAddingTask && (
                    <InlineAddRow
                      employeeOptions={employeeOptions}
                      onSave={async (data) => {
                        await onCreateTask(data);
                        setIsAddingTask(false);
                      }}
                      onCancel={() => setIsAddingTask(false)}
                    />
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Modal */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-3 border-t border-slate-100 bg-slate-50/80 shrink-0">
            <span className="text-xs text-slate-500">
              Total: <b className="text-slate-800">{selectedProjectGroup.tasks.length}</b> task aktivitas
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-sm"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

function InlineEditRow({
  idx,
  task,
  project,
  employeeOptions,
  onSave,
  onCancel,
  onDelete,
}: {
  idx: number;
  task: SpreadsheetTask;
  project: string;
  employeeOptions: any[];
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const initialBagian = (task as any).bagian || "SETTING";
  const initialTask = cleanTaskName(task.task, project) || task.task;

  const initialStartDateObj = parseDateToDateObj(task.startDate);
  const initialEndDateObj = parseDateToDateObj(task.endDate);

  const [form, setForm] = useState(() => ({
    bagian: initialBagian,
    pic: task.pic || "",
    task: initialTask,
    priority: task.priority || "Low",
    startDate: initialStartDateObj,
    endDate: initialEndDateObj,
    status: task.status || "BELUM DIKERJAKAN",
    note: task.note || "",
  }));

  const rowRef = useRef<HTMLTableRowElement>(null);
  const formRef = useRef(form);
  formRef.current = form;
  const isSavingRef = useRef(false);

  const [pekerjaanList, setPekerjaanList] = useState<string[]>([]);

  // Load master pekerjaan on mount & when bagian changes
  useEffect(() => {
    if (form.bagian) {
      fetchPekerjaanForCategory(form.bagian).then(setPekerjaanList);
    } else {
      setPekerjaanList([]);
    }
  }, [form.bagian]);

  const saveCurrentForm = useCallback(async () => {
    if (isSavingRef.current) return;

    // Cek apakah ada perubahan data (isDirty)
    const current = formRef.current;
    const isDirty =
      current.bagian !== initialBagian ||
      current.pic !== (task.pic || "") ||
      current.task.trim() !== initialTask.trim() ||
      current.priority !== (task.priority || "Low") ||
      formatDateForApi(current.startDate) !== formatDateForApi(initialStartDateObj) ||
      formatDateForApi(current.endDate) !== formatDateForApi(initialEndDateObj) ||
      current.status !== (task.status || "BELUM DIKERJAKAN") ||
      current.note.trim() !== (task.note || "").trim();

    // Jika tidak ada perubahan, langsung keluar dari mode edit tanpa panggil API
    if (!isDirty) {
      onCancel();
      return;
    }

    isSavingRef.current = true;
    try {
      await onSave(current);
    } finally {
      isSavingRef.current = false;
    }
  }, [initialBagian, initialTask, initialStartDateObj, initialEndDateObj, task, onSave, onCancel]);

  // Auto-save saat klik di luar baris yang sedang diedit
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rowRef.current && rowRef.current.contains(target)) return;

      // Jangan tutup jika klik terjadi di dalam portal panel (dropdown/datepicker di luar DOM row)
      const isPortalPopup = (target as Element)?.closest?.('[class*="z-[10000]"]') ||
        (target as Element)?.closest?.('[data-date-picker-trigger]');
      if (isPortalPopup) return;

      saveCurrentForm();
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [saveCurrentForm]);

  const workDaysDisplay = useMemo(() => {
    if (!form.startDate || !form.endDate) return "-";
    const s = new Date(form.startDate.getFullYear(), form.startDate.getMonth(), form.startDate.getDate());
    const e = new Date(form.endDate.getFullYear(), form.endDate.getMonth(), form.endDate.getDate());
    const diffDays = Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
    return diffDays > 0 ? `${diffDays} hari` : "-";
  }, [form.startDate, form.endDate]);

  const taskOptions = useMemo(() => {
    const list = [...pekerjaanList];
    if (form.task && !list.includes(form.task)) {
      list.unshift(form.task);
    }
    return list.map((p) => ({ value: p, label: p }));
  }, [pekerjaanList, form.task]);

  const picOptions = useMemo(() => {
    const uniqueNames = Array.from(
      new Set(
        employeeOptions
          .map((e) => (typeof e === "string" ? e : e?.name || e?.label || ""))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, "id"));
    return uniqueNames.map((name) => ({ value: name, label: name }));
  }, [employeeOptions]);

  return (
    <tr ref={rowRef} className="bg-sky-50/90 border-y-2 border-sky-300">
      <td className="px-1 py-1.5 text-center font-bold text-sky-700 text-xs">
        {idx + 1}
      </td>
      {/* 1. Bagian */}
      <td className="px-1 py-1.5">
        <SquareDropdown
          options={BAGIAN_LIST.map((b) => ({ value: b, label: b }))}
          value={form.bagian}
          onChange={(val) => {
            setForm((p) => ({ ...p, bagian: val, task: "" }));
          }}
          searchPlaceholder="Cari Bagian..."
          widthClass="w-full"
          usePortal={true}
        />
      </td>
      {/* 2. PIC */}
      <td className="px-1 py-1.5">
        <SquareDropdown
          options={picOptions}
          value={form.pic}
          onChange={(val) => setForm((p) => ({ ...p, pic: val }))}
          searchPlaceholder="Cari PIC..."
          widthClass="w-full"
          usePortal={true}
        />
      </td>
      {/* 3. Task / Aktivitas */}
      <td className="px-1 py-1.5">
        <SquareDropdown
          options={
            taskOptions.length > 0
              ? taskOptions
              : [{ value: "", label: "-- Pilih Bagian dulu --" }]
          }
          value={form.task}
          onChange={(val) => setForm((p) => ({ ...p, task: val }))}
          searchPlaceholder="Cari Task / Pekerjaan..."
          widthClass="w-full"
          usePortal={true}
        />
      </td>
      {/* 4. Priority */}
      <td className="px-1 py-1.5">
        <SquareDropdown
          options={[
            { value: "Low", label: "Low" },
            { value: "Medium", label: "Medium" },
            { value: "High", label: "High" },
          ]}
          value={form.priority}
          onChange={(val) => setForm((p) => ({ ...p, priority: val }))}
          searchPlaceholder="Priority..."
          widthClass="w-full"
          usePortal={true}
        />
      </td>
      {/* 5. Start ~ End */}
      <td className="px-1 py-1.5">
        <div className="flex items-center gap-0.5 w-full">
          <div className="flex-1 min-w-0">
            <DatePicker
              name="start_date"
              value={form.startDate}
              onChange={(d) => setForm((p) => ({ ...p, startDate: d }))}
              usePortal={true}
              customTrigger={(toggle) => (
                <button
                  type="button"
                  onClick={toggle}
                  className="w-full h-7 bg-white border border-slate-200 hover:border-emerald-500 rounded-md px-1 text-[10px] font-medium flex items-center justify-between shadow-2xs transition-colors"
                >
                  <span className="truncate">{form.startDate ? formatDateDisplay(form.startDate) : 'Pilih'}</span>
                  <Calendar size={11} className="text-slate-400 shrink-0" />
                </button>
              )}
            />
          </div>
          <span className="text-slate-300 text-[10px] font-bold shrink-0">~</span>
          <div className="flex-1 min-w-0">
            <DatePicker
              name="end_date"
              value={form.endDate}
              onChange={(d) => setForm((p) => ({ ...p, endDate: d }))}
              usePortal={true}
              customTrigger={(toggle) => (
                <button
                  type="button"
                  onClick={toggle}
                  className="w-full h-7 bg-white border border-slate-200 hover:border-emerald-500 rounded-md px-1 text-[10px] font-medium flex items-center justify-between shadow-2xs transition-colors"
                >
                  <span className="truncate">{form.endDate ? formatDateDisplay(form.endDate) : 'Pilih'}</span>
                  <Calendar size={11} className="text-slate-400 shrink-0" />
                </button>
              )}
            />
          </div>
        </div>
      </td>
      {/* 6. Work Days */}
      <td className="px-1 py-1.5 text-center whitespace-nowrap">
        <span className="text-[11px] font-bold text-sky-700">
          {workDaysDisplay}
        </span>
      </td>
      {/* 7. Status */}
      <td className="px-1 py-1.5">
        <SquareDropdown
          options={[
            { value: "BELUM DIKERJAKAN", label: "BELUM DIKERJAKAN" },
            { value: "IN PROGRESS", label: "IN PROGRESS" },
            { value: "PENDING", label: "PENDING" },
            { value: "CANCEL", label: "CANCEL" },
            { value: "SELESAI", label: "SELESAI" },
          ]}
          value={form.status}
          onChange={(val) => setForm((p) => ({ ...p, status: val }))}
          searchPlaceholder="Status..."
          widthClass="w-full"
          usePortal={true}
        />
      </td>
      {/* 8. Note */}
      <td className="px-1 py-1.5">
        <textarea
          value={form.note}
          rows={1}
          placeholder="Catatan..."
          onChange={(e) => {
            setForm((p) => ({ ...p, note: e.target.value }));
            e.target.style.height = "auto";
            e.target.style.height = `${Math.max(30, e.target.scrollHeight)}px`;
          }}
          ref={(el) => {
            if (el) {
              el.style.height = "auto";
              el.style.height = `${Math.max(30, el.scrollHeight)}px`;
            }
          }}
          className="w-full min-h-[30px] px-2 py-1 text-[11px] border border-sky-400 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 custom-scrollbar resize-y break-words leading-tight"
        />
      </td>
      {/* 9. Aksi */}
      <td className="px-1 py-1.5 text-center whitespace-nowrap">
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={onDelete}
            className="p-1 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-all cursor-pointer border border-rose-200"
            title="Hapus Pekerjaan Ini"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function InlineAddRow({
  employeeOptions,
  onSave,
  onCancel,
}: {
  employeeOptions: any[];
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    bagian: "",
    pic: "",
    task: "",
    priority: "",
    startDate: null as Date | null,
    endDate: null as Date | null,
    status: "",
    note: "",
  });

  const [pekerjaanList, setPekerjaanList] = useState<string[]>([]);
  const rowRef = useRef<HTMLTableRowElement>(null);
  const formRef = useRef(form);
  formRef.current = form;
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (form.bagian) {
      fetchPekerjaanForCategory(form.bagian).then(setPekerjaanList);
    } else {
      setPekerjaanList([]);
    }
  }, [form.bagian]);

  const saveCurrentForm = useCallback(async () => {
    if (isSavingRef.current) return;
    const current = formRef.current;
    
    // Jika task belum diisi, langsung batalkan mode tambah tanpa panggil API
    if (!current.task.trim()) {
      onCancel();
      return;
    }

    isSavingRef.current = true;
    try {
      await onSave(current);
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave, onCancel]);

  // Auto-save saat klik di luar baris tambah pekerjaan
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (rowRef.current && rowRef.current.contains(target)) return;

      // Jangan trigger jika klik terjadi di dalam portal panel (dropdown/datepicker di luar DOM row)
      const isPortalPopup =
        (target as Element)?.closest?.('[class*="z-[10000]"]') ||
        (target as Element)?.closest?.('[data-date-picker-trigger]');
      if (isPortalPopup) return;

      saveCurrentForm();
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [saveCurrentForm]);

  const workDaysDisplay = useMemo(() => {
    if (!form.startDate || !form.endDate) return "-";
    const s = new Date(form.startDate.getFullYear(), form.startDate.getMonth(), form.startDate.getDate());
    const e = new Date(form.endDate.getFullYear(), form.endDate.getMonth(), form.endDate.getDate());
    const diffDays = Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
    return diffDays > 0 ? `${diffDays} hari` : "-";
  }, [form.startDate, form.endDate]);

  const taskOptions = useMemo(() => {
    const list = [...pekerjaanList];
    if (form.task && !list.includes(form.task)) {
      list.unshift(form.task);
    }
    return list.map((p) => ({ value: p, label: p }));
  }, [pekerjaanList, form.task]);

  const picOptions = useMemo(() => {
    const uniqueNames = Array.from(
      new Set(
        employeeOptions
          .map((e) => (typeof e === "string" ? e : e?.name || e?.label || ""))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, "id"));
    return uniqueNames.map((name) => ({ value: name, label: name }));
  }, [employeeOptions]);

  return (
    <tr ref={rowRef} className="bg-emerald-50/90 border-y-2 border-emerald-300">
      <td className="px-1 py-1.5 text-center font-bold text-emerald-700 text-xs">
        +
      </td>
      {/* 1. Bagian */}
      <td className="px-1 py-1.5">
        <SquareDropdown
          options={BAGIAN_LIST.map((b) => ({ value: b, label: b }))}
          value={form.bagian}
          onChange={(val) => {
            setForm((p) => ({ ...p, bagian: val, task: "" }));
          }}
          placeholder="Pilih Bagian..."
          searchPlaceholder="Cari Bagian..."
          widthClass="w-full"
          usePortal={true}
        />
      </td>
      {/* 2. PIC */}
      <td className="px-1 py-1.5">
        <SquareDropdown
          options={picOptions}
          value={form.pic}
          onChange={(val) => setForm((p) => ({ ...p, pic: val }))}
          placeholder="Pilih PIC..."
          searchPlaceholder="Cari PIC..."
          widthClass="w-full"
          usePortal={true}
        />
      </td>
      {/* 3. Task / Aktivitas */}
      <td className="px-1 py-1.5">
        <SquareDropdown
          options={
            taskOptions.length > 0
              ? taskOptions
              : [{ value: "", label: "-- Pilih Bagian dulu --" }]
          }
          value={form.task}
          onChange={(val) => setForm((p) => ({ ...p, task: val }))}
          placeholder={form.bagian ? "Pilih Task..." : "-- Pilih Bagian dulu --"}
          searchPlaceholder="Cari Task / Pekerjaan..."
          widthClass="w-full"
          usePortal={true}
        />
      </td>
      {/* 4. Priority */}
      <td className="px-1 py-1.5">
        <SquareDropdown
          options={[
            { value: "Low", label: "Low" },
            { value: "Medium", label: "Medium" },
            { value: "High", label: "High" },
          ]}
          value={form.priority}
          onChange={(val) => setForm((p) => ({ ...p, priority: val }))}
          placeholder="Priority..."
          searchPlaceholder="Priority..."
          widthClass="w-full"
          usePortal={true}
        />
      </td>
      {/* 5. Start ~ End */}
      <td className="px-1 py-1.5">
        <div className="flex items-center gap-0.5 w-full">
          <div className="flex-1 min-w-0">
            <DatePicker
              name="new_start_date"
              value={form.startDate}
              onChange={(d) => setForm((p) => ({ ...p, startDate: d }))}
              usePortal={true}
              customTrigger={(toggle) => (
                <button
                  type="button"
                  onClick={toggle}
                  className="w-full h-7 bg-white border border-slate-200 hover:border-emerald-500 rounded-md px-1 text-[10px] font-medium flex items-center justify-between shadow-2xs transition-colors"
                >
                  <span className={`truncate ${!form.startDate ? 'text-slate-400 font-normal' : ''}`}>
                    {form.startDate ? formatDateDisplay(form.startDate) : 'Pilih'}
                  </span>
                  <Calendar size={11} className="text-slate-400 shrink-0" />
                </button>
              )}
            />
          </div>
          <span className="text-slate-300 text-[10px] font-bold shrink-0">~</span>
          <div className="flex-1 min-w-0">
            <DatePicker
              name="new_end_date"
              value={form.endDate}
              onChange={(d) => setForm((p) => ({ ...p, endDate: d }))}
              usePortal={true}
              customTrigger={(toggle) => (
                <button
                  type="button"
                  onClick={toggle}
                  className="w-full h-7 bg-white border border-slate-200 hover:border-emerald-500 rounded-lg px-1 text-[10px] font-medium flex items-center justify-between shadow-2xs transition-colors"
                >
                  <span className={`truncate ${!form.endDate ? 'text-slate-400 font-normal' : ''}`}>
                    {form.endDate ? formatDateDisplay(form.endDate) : 'Pilih'}
                  </span>
                  <Calendar size={11} className="text-slate-400 shrink-0" />
                </button>
              )}
            />
          </div>
        </div>
      </td>
      {/* 6. Work Days */}
      <td className="px-1 py-1.5 text-center whitespace-nowrap">
        <span className="text-[11px] font-bold text-emerald-700">
          {workDaysDisplay}
        </span>
      </td>
      {/* 7. Status */}
      <td className="px-1 py-1.5">
        <SquareDropdown
          options={[
            { value: "BELUM DIKERJAKAN", label: "BELUM DIKERJAKAN" },
            { value: "IN PROGRESS", label: "IN PROGRESS" },
            { value: "PENDING", label: "PENDING" },
            { value: "CANCEL", label: "CANCEL" },
            { value: "SELESAI", label: "SELESAI" },
          ]}
          value={form.status}
          onChange={(val) => setForm((p) => ({ ...p, status: val }))}
          placeholder="Status..."
          searchPlaceholder="Status..."
          widthClass="w-full"
          usePortal={true}
        />
      </td>
      {/* 8. Note */}
      <td className="px-1 py-1.5">
        <textarea
          value={form.note}
          rows={1}
          placeholder="Catatan..."
          onChange={(e) => {
            setForm((p) => ({ ...p, note: e.target.value }));
            e.target.style.height = "auto";
            e.target.style.height = `${Math.max(30, e.target.scrollHeight)}px`;
          }}
          ref={(el) => {
            if (el) {
              el.style.height = "auto";
              el.style.height = `${Math.max(30, e.target.scrollHeight)}px`;
            }
          }}
          className="w-full min-h-[30px] px-2 py-1 text-[11px] border border-emerald-400 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 custom-scrollbar resize-y break-words leading-tight"
        />
      </td>
      {/* 9. Aksi */}
      <td className="px-1 py-1.5 text-center whitespace-nowrap">
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            title="Batal Tambah Pekerjaan"
          >
            <X size={13} />
          </button>
        </div>
      </td>
    </tr>
  );
}
