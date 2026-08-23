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

// Progress & penanda pekerjaan terakhir (SELESAI terakhir)/selanjutnya per order,
// urutan task berdasarkan tanggal mulai.
const summarizeOrderTasks = (tasks: SpreadsheetTask[], project: string) => {
  const sorted = [...tasks].sort(
    (a, b) =>
      parseDateToSort(a.startDate || "") -
        parseDateToSort(b.startDate || "") ||
      // ponytail: tanggal sama/kosong → ikuti urutan asli data (id asc)
      a.id - b.id
  );
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
    pekerjaanTerakhir: lastIdx >= 0 ? cleanTaskName(sorted[lastIdx].task || "", project) : "",
    pekerjaanSelanjutnya:
      nextIdx < total ? cleanTaskName(sorted[nextIdx].task || "", project) : "",
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

  // Tab & Form state
  const [activeTab, setActiveTab] = useState<"list" | "form">("list");
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingTask, setEditingTask] = useState<any>(null);
  const [formData, setFormData] = useState({
    task: "",
    bagian: "",
    orderProduksi: "",
    jenisPekerjaan: "",
    pic: "",
    priority: "Low",
    startDate: new Date() as Date | null,
    endDate: null as Date | null,
    workDays: "1",
    note: "",
    status: "",
  });

  const FORM_DRAFT_KEY = "laporan_pekerjaan_form_draft";

  // Reset form to blank state & clear saved draft
  const resetFormData = useCallback(() => {
    setFormData({
      task: "",
      bagian: "",
      orderProduksi: "",
      jenisPekerjaan: "",
      pic: "",
      priority: "Low",
      startDate: new Date(),
      endDate: null,
      workDays: "1",
      note: "",
      status: "",
    });
    setModalMode("create");
    setEditingTask(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(FORM_DRAFT_KEY);
    }
  }, []);

  // Restore form draft on mount / refresh
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = sessionStorage.getItem(FORM_DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.formData) {
          if (parsed.formData.startDate) parsed.formData.startDate = new Date(parsed.formData.startDate);
          if (parsed.formData.endDate) parsed.formData.endDate = new Date(parsed.formData.endDate);
          setFormData(parsed.formData);
        }
        if (parsed.modalMode) setModalMode(parsed.modalMode);
        if (parsed.editingTask) setEditingTask(parsed.editingTask);
      }
    } catch (e) {}
  }, []);

  // Auto-save form draft to sessionStorage when typed
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(
        FORM_DRAFT_KEY,
        JSON.stringify({
          formData,
          modalMode,
          editingTask,
        })
      );
    } catch (e) {}
  }, [formData, modalMode, editingTask]);

  // Dropdown options state
  const [sopdOptions, setSopdOptions] = useState<any[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<any[]>([]);
  const [pekerjaanOptions, setPekerjaanOptions] = useState<any[]>([]);

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

  // Modal Inline Edit & Add Task state
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [inlineEditData, setInlineEditData] = useState({
    task: "",
    bagian: "SETTING",
    pic: "",
    priority: "Low",
    startDate: "",
    endDate: "",
    status: "BELUM DIKERJAKAN",
    note: "",
  });
  const [isAddingTask, setIsAddingTask] = useState<boolean>(false);
  const [newTaskData, setNewTaskData] = useState({
    task: "",
    bagian: "SETTING",
    pic: "",
    priority: "Low",
    startDate: "",
    endDate: "",
    status: "BELUM DIKERJAKAN",
    note: "",
  });

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
  }, [isAnalyticsOpen, loading, tasks.length, activeTab]);

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
  // ponytail: lock 600ms anti loncat 2 halaman sekaligus saat wheel beruntun
  const lastAutoPageRef = useRef<number>(0);
  const pageNavDirRef = useRef<"top" | "bottom">("top");

  // Scroll ke atas (next) / bawah (prev) & reset row selection on page change
  useEffect(() => {
    const el = tableContainerRef.current;
    if (el) {
      el.scrollTop = pageNavDirRef.current === "bottom" ? el.scrollHeight : 0;
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

  // Auto pindah halaman saat overscroll: wheel bawah di dasar → next, wheel atas di puncak → prev
  const handleTableWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = tableContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
    const atTop = el.scrollTop <= 0;
    const goNext = e.deltaY > 0 && atBottom && currentPage < totalPages;
    const goPrev = e.deltaY < 0 && atTop && currentPage > 1;
    if (!goNext && !goPrev) return;
    const now = Date.now();
    if (now - lastAutoPageRef.current < 600) return;
    lastAutoPageRef.current = now;
    pageNavDirRef.current = goNext ? "top" : "bottom";
    setCurrentPage((p) =>
      goNext ? Math.min(p + 1, totalPages) : Math.max(p - 1, 1)
    );
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

  // CRUD Handlers
  const openCreateModal = () => {
    // Hanya reset jika modalMode bukan "create" (misalnya dari "edit")
    if (modalMode !== "create") {
      resetFormData();
      setModalMode("create");
      setEditingTask(null);
    }
    
    // Fetch dropdown options asynchronously without blocking tab transition
    fetchSopdOptions();
    fetchEmployeeOptions();
    
    setActiveTab("form");
  };

  const openEditModal = async (task: any) => {
    sessionStorage.removeItem(FORM_DRAFT_KEY);
    setModalMode("edit");
    setEditingTask(task);
    
    // Parse dates (bisa format '3-Jan-26', '03/01/2026', '2026-01-03')
    const parseFlexibleDate = (dateStr?: string) => {
      if (!dateStr || !dateStr.trim()) return null;
      const str = dateStr.trim();

      // Format spreadsheet: '3-Jan-26', '12-Feb-2026'
      const monthNames: Record<string, number> = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, mei: 4, jun: 5,
        jul: 6, aug: 7, agu: 7, sep: 8, oct: 9, okt: 9, nov: 10, dec: 11, des: 11
      };

      if (str.includes('-')) {
        const parts = str.split('-');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const monthKey = parts[1].toLowerCase().substring(0, 3);
          let year = parseInt(parts[2], 10);
          
          if (!isNaN(day) && monthNames[monthKey] !== undefined && !isNaN(year)) {
            if (year < 100) year += 2000;
            return new Date(year, monthNames[monthKey], day);
          }
          // Format ISO: '2026-01-03'
          const isoMonth = parseInt(parts[1], 10) - 1;
          if (!isNaN(day) && !isNaN(isoMonth) && !isNaN(year)) {
            return new Date(year, isoMonth, day);
          }
        }
      }

      // Format slash: '03/01/2026'
      if (str.includes('/')) {
        const parts = str.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          let year = parseInt(parts[2], 10);
          if (year < 100) year += 2000;
          if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            return new Date(year, month, day);
          }
        }
      }

      const d = new Date(str);
      return isNaN(d.getTime()) ? null : d;
    };

    const startDateObj = parseFlexibleDate(task.startDate);
    const endDateObj = parseFlexibleDate(task.endDate);

    const selectedBagian = (task as any).bagian || "";
    
    // Deteksi jenisPekerjaan jika nama task diawali dengan nama pekerjaan di master
    let detectedJenisPekerjaan = "";
    if (task.task && task.project && task.task.includes(task.project)) {
      detectedJenisPekerjaan = task.task.replace(task.project, "").trim();
    }
    
    setFormData({
      task: task.task || "",
      bagian: selectedBagian,
      orderProduksi: task.project || "",
      jenisPekerjaan: detectedJenisPekerjaan,
      pic: task.pic || "",
      priority: task.priority || "Low",
      startDate: startDateObj,
      endDate: endDateObj,
      workDays: task.workDays || "",
      note: task.note || "",
      status: task.status || "",
    });
    
    // Fetch dropdown options asynchronously without blocking tab transition
    fetchSopdOptions();
    fetchEmployeeOptions();
    if (selectedBagian) {
      fetchPekerjaanOptions(selectedBagian);
    }
    
    setActiveTab("form");
  };

  const fetchSopdOptions = async () => {
    try {
      const res = await fetch('/api/sopd/options?all=true');
      if (res.ok) {
        const json = await res.json();
        setSopdOptions(json.data || []);
      }
    } catch (err) {
      console.error('Gagal fetch SOPd:', err);
    }
  };

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

  const fetchPekerjaanOptions = async (bagian: string) => {
    if (!bagian) {
      setPekerjaanOptions([]);
      return;
    }
    
    const category = BAGIAN_CATEGORY_MAP[bagian];
    if (!category) {
      setPekerjaanOptions([]);
      return;
    }
    
    try {
      const res = await fetch(`/api/master-pekerjaan-jurnal-produksi?category=${encodeURIComponent(category)}&all=true`);
      const json = await res.json();
      if (json.success) {
        setPekerjaanOptions(json.data || []);
      }
    } catch (err) {
      console.error('Gagal fetch pekerjaan:', err);
    }
  };

  const closeModal = () => {
    setActiveTab("list");
  };

  const calcWorkDays = useCallback((start?: Date | null, end?: Date | null): string => {
    if (!start || !end) return "";
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const diffTime = e.getTime() - s.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? String(diffDays) : "";
  }, []);

  // Auto trigger workDays recalculation whenever startDate or endDate changes
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const calculated = calcWorkDays(formData.startDate, formData.endDate);
      if (calculated !== formData.workDays) {
        setFormData((prev) => ({ ...prev, workDays: calculated }));
      }
    }
  }, [formData.startDate, formData.endDate, calcWorkDays]);

  const handleSave = async () => {
    if (!confirm(modalMode === "create" ? "Yakin ingin menyimpan data pekerjaan baru ini?" : "Yakin ingin menyimpan perubahan data pekerjaan ini?")) {
      return;
    }

    const generatedTask = formData.jenisPekerjaan
      ? (formData.orderProduksi ? `${formData.jenisPekerjaan} ${formData.orderProduksi}` : formData.jenisPekerjaan)
      : (formData.task || (formData.orderProduksi ? `Pekerjaan ${formData.orderProduksi}` : "Pekerjaan Baru"));

    if (!generatedTask.trim()) {
      alert("Pilih Jenis Pekerjaan atau Order Produksi terlebih dahulu");
      return;
    }

    try {
      const url = modalMode === "create" ? "/api/laporan-pekerjaan" : "/api/laporan-pekerjaan";
      const method = modalMode === "create" ? "POST" : "PUT";
      
      // Format dates to dd/mm/yyyy
      const startDateStr = formData.startDate 
        ? `${String(formData.startDate.getDate()).padStart(2, '0')}/${String(formData.startDate.getMonth() + 1).padStart(2, '0')}/${formData.startDate.getFullYear()}`
        : "";
      const endDateStr = formData.endDate 
        ? `${String(formData.endDate.getDate()).padStart(2, '0')}/${String(formData.endDate.getMonth() + 1).padStart(2, '0')}/${formData.endDate.getFullYear()}`
        : "";
      
      const payload = {
        task: generatedTask,
        project: formData.orderProduksi,
        division: modalMode === "edit" ? (editingTask?.division || "") : "",
        bagian: formData.bagian,
        pic: formData.pic,
        priority: formData.priority,
        startDate: startDateStr,
        endDate: endDateStr,
        workDays: formData.workDays,
        note: formData.note,
        status: formData.status,
      };
      
      const body = modalMode === "edit" ? { ...payload, id: editingTask.id } : payload;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(modalMode === "create" ? "Data pekerjaan berhasil ditambahkan!" : "Data pekerjaan berhasil diperbarui!");
        await fetchData();
        resetFormData();
        closeModal();
      } else {
        toast.error(json.error || "Gagal menyimpan data");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus data pekerjaan ini?")) return;

    try {
      const res = await fetch(`/api/laporan-pekerjaan?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Data pekerjaan berhasil dihapus!");
        await fetchData();
      } else {
        toast.error(json.error || "Gagal menghapus data");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    }
  };

  // Modal Detail: Handlers untuk Inline Edit & Tambah Pekerjaan
  const startInlineEdit = (task: SpreadsheetTask) => {
    const proj = selectedProjectGroup?.project || "";
    const cleanedTask = cleanTaskName(task.task, proj) || task.task;
    setEditingTaskId(task.id || null);
    setInlineEditData({
      task: cleanedTask,
      bagian: (task as any).bagian || "SETTING",
      pic: task.pic || "",
      priority: task.priority || "Low",
      startDate: toInputDate(task.startDate),
      endDate: toInputDate(task.endDate),
      status: task.status || "BELUM DIKERJAKAN",
      note: task.note || "",
    });
  };

  const handleSaveInlineEdit = async (taskId: number) => {
    if (!inlineEditData.task.trim()) {
      toast.error("Nama pekerjaan wajib diisi");
      return;
    }

    const startDateStr = inlineEditData.startDate ? toDisplayDate(inlineEditData.startDate) : "";
    const endDateStr = inlineEditData.endDate ? toDisplayDate(inlineEditData.endDate) : "";

    let workDays = "";
    if (inlineEditData.startDate && inlineEditData.endDate) {
      const s = new Date(inlineEditData.startDate);
      const e = new Date(inlineEditData.endDate);
      const diffTime = e.getTime() - s.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays > 0) workDays = String(diffDays);
    }

    const proj = selectedProjectGroup?.project || "";
    const fullTaskName = inlineEditData.task.trim();
    const savedTaskName = proj && !fullTaskName.includes(proj)
      ? `${fullTaskName} ${proj}`
      : fullTaskName;

    try {
      const res = await fetch("/api/laporan-pekerjaan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: taskId,
          task: savedTaskName,
          project: proj,
          division: "",
          bagian: inlineEditData.bagian,
          pic: inlineEditData.pic,
          priority: inlineEditData.priority || "Low",
          startDate: startDateStr,
          endDate: endDateStr,
          workDays: workDays,
          note: inlineEditData.note,
          status: inlineEditData.status || "BELUM DIKERJAKAN",
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Pekerjaan berhasil diperbarui!");
        setEditingTaskId(null);
        await fetchData();
        setSelectedProjectGroup((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            tasks: prev.tasks.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    task: savedTaskName,
                    bagian: inlineEditData.bagian,
                    pic: inlineEditData.pic,
                    priority: inlineEditData.priority,
                    startDate: startDateStr,
                    endDate: endDateStr,
                    workDays: workDays,
                    status: inlineEditData.status,
                    note: inlineEditData.note,
                  }
                : t
            ),
          };
        });
      } else {
        toast.error(json.error || "Gagal menyimpan perubahan");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    }
  };

  const handleCreateInlineTask = async () => {
    if (!newTaskData.task.trim()) {
      toast.error("Nama pekerjaan wajib diisi");
      return;
    }

    const startDateStr = newTaskData.startDate ? toDisplayDate(newTaskData.startDate) : "";
    const endDateStr = newTaskData.endDate ? toDisplayDate(newTaskData.endDate) : "";

    let workDays = "";
    if (newTaskData.startDate && newTaskData.endDate) {
      const s = new Date(newTaskData.startDate);
      const e = new Date(newTaskData.endDate);
      const diffTime = e.getTime() - s.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays > 0) workDays = String(diffDays);
    }

    const proj = selectedProjectGroup?.project || "";
    const fullTaskName = newTaskData.task.trim();
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
          bagian: newTaskData.bagian || "SETTING",
          pic: newTaskData.pic,
          priority: newTaskData.priority || "Low",
          startDate: startDateStr,
          endDate: endDateStr,
          workDays: workDays,
          note: newTaskData.note,
          status: newTaskData.status || "BELUM DIKERJAKAN",
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Pekerjaan berhasil ditambahkan ke order!");
        setIsAddingTask(false);
        setNewTaskData({
          task: "",
          bagian: "SETTING",
          pic: "",
          priority: "Low",
          startDate: "",
          endDate: "",
          status: "BELUM DIKERJAKAN",
          note: "",
        });
        await fetchData();
        if (json.id) {
          const createdTask: SpreadsheetTask = {
            id: json.id,
            task: savedTaskName,
            project: proj,
            division: "",
            bagian: newTaskData.bagian || "SETTING",
            pic: newTaskData.pic,
            priority: newTaskData.priority || "Low",
            startDate: startDateStr,
            endDate: endDateStr,
            workDays: workDays,
            note: newTaskData.note,
            status: newTaskData.status || "BELUM DIKERJAKAN",
            source: "sintak",
          };
          setSelectedProjectGroup((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              tasks: [...prev.tasks, createdTask],
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
    try {
      const res = await fetch(`/api/laporan-pekerjaan?id=${taskId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Pekerjaan berhasil dihapus");
        if (editingTaskId === taskId) setEditingTaskId(null);
        await fetchData();
        setSelectedProjectGroup((prev) => {
          if (!prev) return null;
          const remaining = prev.tasks.filter((t) => t.id !== taskId);
          return { ...prev, tasks: remaining };
        });
      } else {
        toast.error(json.error || "Gagal menghapus data");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
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

  // Cache Order Produksi dropdown items to prevent re-computation on render
  const orderProduksiItems = useMemo(() => {
    return Array.from(new Set([
      ...sopdOptions.map(s => String(s.nama_order || s.nama_prd || '').trim()).filter(Boolean),
      ...sopdOptions.map(s => String(s.no_sopd || s.faktur || s.no_order || '').trim()).filter(Boolean),
      ...tasks.map(t => String(t.project || '').trim()).filter(Boolean)
    ]));
  }, [sopdOptions, tasks]);

  const orderProduksiItemLabels = useMemo(() => {
    return sopdOptions.reduce((acc, s) => {
      const code = String(s.no_sopd || s.faktur || s.no_order || '').trim();
      const name = String(s.nama_order || s.nama_prd || '').trim();
      if (code && name) {
        acc[code] = `${code} — ${name}`;
        acc[name] = `${name} (${code})`;
      } else if (code) {
        acc[code] = code;
      } else if (name) {
        acc[name] = name;
      }
      return acc;
    }, {} as Record<string, string>);
  }, [sopdOptions]);

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
          tasks: [t],
        });
      } else {
        const group = map.get(proj)!;
        if (!group.tglOrder && t.tglOrder) {
          group.tglOrder = t.tglOrder;
        }
        group.tasks.push(t);
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

  // Chart Data 1: Breakdown Pekerjaan per Status per PIC
  const picChartData = useMemo(() => {
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
  }, [filteredTasks]);

  // Chart Data 2: Pie Chart Status
  const statusPieData = useMemo(() => {
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
  }, [filteredTasks]);

  // Chart Data 3: Priority Distribution (breakdown per status)
  const priorityChartData = useMemo(() => {
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
  }, [filteredTasks]);

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

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === "BELUM DIKERJAKAN") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-300">
          <Clock className="w-3 h-3 text-slate-500" /> BELUM DIKERJAKAN
        </span>
      );
    }
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
    <div
      ref={clientContainerRef}
      className={`text-slate-800 ${
        activeTab === "form"
          ? "portrait:max-sm:h-full portrait:max-sm:flex portrait:max-sm:flex-col portrait:max-sm:min-h-0 portrait:max-sm:overflow-hidden md:flex md:flex-col md:flex-1 md:min-h-0 md:h-full md:overflow-hidden"
          : isAnalyticsOpen
          ? "flex flex-col gap-4 w-full pb-44 sm:pb-40 md:pb-24"
          : "space-y-3 pb-44 sm:max-md:pb-36 sm:pb-40 md:space-y-0 md:flex-1 md:min-h-0 md:flex md:flex-col md:gap-3 md:h-full md:overflow-hidden md:pb-0"
      }`}
    >
      {/* TABS Navigation (Gaya JHP) */}
      <div className="portrait:max-sm:sticky portrait:max-sm:-top-2 portrait:max-sm:z-40 portrait:max-sm:bg-[#f8fafc] portrait:max-sm:-mx-4 portrait:max-sm:px-4 portrait:max-sm:pt-2 static mx-0 px-0 pt-0 flex gap-2 sm:gap-6 border-b border-gray-100 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab("list")}
          className={`flex items-center justify-center gap-1.5 pb-3 px-2 text-[13px] font-bold border-b-2 transition-all flex-1 sm:flex-initial cursor-pointer ${
            activeTab === "list"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <ClipboardList size={14} />
          Daftar Pekerjaan
        </button>
        <button
          type="button"
          onClick={() => {
            if (activeTab !== "form") {
              if (modalMode !== "edit") {
                openCreateModal();
              } else {
                setActiveTab("form");
              }
            }
          }}
          className={`flex items-center justify-center gap-1.5 pb-3 px-2 text-[13px] font-bold border-b-2 transition-all flex-1 sm:flex-initial cursor-pointer ${
            activeTab === "form"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          {modalMode === "edit" && activeTab === "form" ? (
            <>
              <Edit2 size={14} />
              Edit Pekerjaan
            </>
          ) : (
            <>
              <PlusSquare size={14} />
              Tambah Pekerjaan
            </>
          )}
        </button>
      </div>

      {/* TAB 1: LIST DATA PEKERJAAN */}
      {activeTab === "list" && (
        <>
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
          onWheel={handleTableWheel}
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
        onPageChange={(p) => {
          pageNavDirRef.current = "top";
          setCurrentPage(p);
        }}
      />
      </>
      )}

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

      {/* TAB 2: FORM TAMBAH / EDIT PEKERJAAN (STYLE JHP FORM) */}
      <div className={activeTab === "form" ? "portrait:max-sm:flex-1 portrait:max-sm:min-h-0 portrait:max-sm:flex portrait:max-sm:flex-col portrait:max-sm:h-full portrait:max-sm:overflow-hidden max-sm:landscape:block max-sm:landscape:pb-40 sm:max-md:pb-36 md:flex md:flex-col md:flex-1 md:min-h-0 md:h-full md:overflow-hidden" : "hidden"}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="bg-white border border-gray-100 rounded-2xl shadow-sm animate-in slide-in-from-top-4 fade-in duration-300 portrait:max-sm:flex-1 portrait:max-sm:min-h-0 portrait:max-sm:flex portrait:max-sm:flex-col portrait:max-sm:overflow-hidden max-sm:landscape:block sm:max-md:block md:flex md:flex-col md:flex-1 md:min-h-0 md:h-full md:overflow-hidden"
        >
          {/* BODY SCROLLABLE: Isian Form JHP Style */}
          <div className="portrait:max-sm:flex-1 portrait:max-sm:min-h-0 portrait:max-sm:overflow-y-auto flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-6">
            
            {/* Section 1: Information Order & Pekerjaan */}
            <div>
              {/* Row 1: Bagian, Order Produksi, Jenis Pekerjaan */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-gray-600">
                    Bagian <span className="text-rose-400">*</span>
                  </label>
                  <SearchableDropdown
                    id="modal-bagian"
                    value={formData.bagian}
                    items={BAGIAN_LIST}
                    onChange={(val) => {
                      setFormData({ ...formData, bagian: val, jenisPekerjaan: "" });
                      if (val) fetchPekerjaanOptions(val);
                      else setPekerjaanOptions([]);
                    }}
                    placeholder="-- Pilih Bagian --"
                    allLabel="-- Pilih Bagian --"
                    triggerWidth="w-full"
                    panelWidth="w-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-gray-600">
                    Order Produksi
                  </label>
                  <SearchableDropdown
                    id="modal-order"
                    value={formData.orderProduksi}
                    items={orderProduksiItems}
                    itemLabels={orderProduksiItemLabels}
                    onChange={(val) => setFormData({ ...formData, orderProduksi: val })}
                    placeholder="-- Pilih Order --"
                    allLabel="-- Pilih Order --"
                    searchPlaceholder="Cari nomor order atau nama order (misal: OP.001)..."
                    triggerWidth="w-full"
                    panelWidth="w-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-gray-600">
                    Jenis Pekerjaan <span className="text-rose-400">*</span>
                  </label>
                  <SearchableDropdown
                    id="modal-pekerjaan"
                    value={formData.jenisPekerjaan}
                    items={pekerjaanOptions.filter(p => p.name).map(p => p.name)}
                    onChange={(val) => setFormData({ ...formData, jenisPekerjaan: val })}
                    placeholder={formData.bagian ? "-- Pilih Jenis Pekerjaan --" : "-- Pilih Bagian dulu --"}
                    allLabel={formData.bagian ? "-- Pilih Jenis Pekerjaan --" : "-- Pilih Bagian dulu --"}
                    triggerWidth="w-full"
                    panelWidth="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Header / Section Title 2: Penugasan & Waktu */}
            <div>
              <div className="flex items-center gap-2.5 mb-5">
                <span className="text-[13px] font-bold text-gray-700">Penugasan &amp; Jadwal</span>
                <div className="flex-1 h-px bg-gray-100"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-gray-600">
                    PIC (Karyawan)
                  </label>
                  <SearchableDropdown
                    id="modal-pic"
                    value={formData.pic}
                    items={employeeOptions.filter(e => e.name).map(e => e.name)}
                    itemLabels={employeeOptions.reduce((acc, e) => {
                      if (e.name) {
                        acc[e.name] = e.position ? `${e.name} — ${e.position}` : e.name;
                      }
                      return acc;
                    }, {} as Record<string, string>)}
                    onChange={(val) => setFormData({ ...formData, pic: val })}
                    placeholder="-- Pilih PIC --"
                    allLabel="-- Pilih PIC --"
                    searchPlaceholder="Cari nama karyawan / jabatan..."
                    triggerWidth="w-full"
                    panelWidth="w-full"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-gray-600">
                    Priority
                  </label>
                  <SearchableDropdown
                    id="modal-priority"
                    value={formData.priority}
                    items={["Low", "Medium", "High"]}
                    onChange={(val) => setFormData({ ...formData, priority: val || "Low" })}
                    placeholder="-- Pilih Priority --"
                    allLabel="-- Pilih Priority --"
                    triggerWidth="w-full"
                    panelWidth="w-full"
                  />
                </div>
              </div>

              {/* Start Date, End Date, Work Days */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-gray-600">
                    Start Date
                  </label>
                  <DatePicker
                    name="startDate"
                    value={formData.startDate}
                    onChange={(date) => {
                      const wDays = calcWorkDays(date, formData.endDate);
                      setFormData({ ...formData, startDate: date, workDays: wDays });
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-gray-600">
                    End Date
                  </label>
                  <DatePicker
                    name="endDate"
                    value={formData.endDate}
                    onChange={(date) => {
                      const wDays = calcWorkDays(formData.startDate, date);
                      setFormData({ ...formData, endDate: date, workDays: wDays });
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-gray-600">
                    Work Days <span className="text-[11px] font-normal text-gray-400">(otomatis)</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={formData.workDays ? `${formData.workDays} Hari` : ""}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px] font-medium text-emerald-800 outline-none cursor-not-allowed h-10"
                    placeholder="Auto hitung"
                  />
                </div>
              </div>
            </div>

            {/* Header / Section Title 3: Status & Note */}
            <div>
              <div className="flex items-center gap-2.5 mb-5">
                <span className="text-[13px] font-bold text-gray-700">Status &amp; Catatan</span>
                <div className="flex-1 h-px bg-gray-100"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-[12px] font-bold text-gray-600">
                    Status Pekerjaan
                  </label>
                  <SearchableDropdown
                    id="modal-status"
                    value={formData.status}
                    items={["BELUM DIKERJAKAN", "IN PROGRESS", "PENDING", "CANCEL", "SELESAI"]}
                    onChange={(val) => setFormData({ ...formData, status: val || "" })}
                    placeholder="-- Pilih Status --"
                    allLabel="-- Pilih Status --"
                    triggerWidth="w-full"
                    panelWidth="w-full"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[12px] font-bold text-gray-600">
                    Note / Catatan
                  </label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    rows={3}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px] font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none transition-all min-h-[70px] resize-y placeholder:text-gray-300"
                    placeholder="Catatan tambahan..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER FIXED: Action buttons (Persis JHP style & fixed layout) */}
          <div className="shrink-0 p-3 sm:p-4 pb-8 sm:pb-4 border-t border-gray-100 bg-white/95 backdrop-blur-md z-10 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 rounded-b-2xl">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetFormData}
                className="w-full sm:w-auto px-4 py-2.5 text-[13px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shrink-0 whitespace-nowrap"
                title="Reset / Kosongkan Isian Form"
              >
                <RotateCcw size={15} />
                Reset Form
              </button>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 sm:flex-initial px-5 py-2.5 text-[13px] font-bold text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all text-center cursor-pointer shrink-0 whitespace-nowrap"
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-initial px-5 py-2.5 text-[13px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 whitespace-nowrap"
              >
                <Save size={16} className="shrink-0" />
                <span className="shrink-0 whitespace-nowrap">
                  {modalMode === "create" ? "Simpan Data Baru" : "Simpan Perubahan"}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>

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

      {/* Modal Detail Task Order */}
      {selectedProjectGroup && (
        <Portal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden">
              {/* Datalist untuk dropdown PIC cepat */}
              <datalist id="modal-employee-list">
                {employeeOptions.map((e, idx) => (
                  <option key={idx} value={e.name || e.label || e} />
                ))}
              </datalist>

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
                    className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                    title="Tambah Pekerjaan ke Order ini"
                  >
                    <Plus size={14} />
                    <span className="hidden sm:inline">Tambah Pekerjaan</span>
                    <span className="sm:hidden">Tambah</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProjectGroup(null);
                      setEditingTaskId(null);
                      setIsAddingTask(false);
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all cursor-pointer"
                    title="Tutup Modal"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Body: Tabel List Task dari Order tersebut */}
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto p-4 sm:p-6 custom-scrollbar space-y-4">
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2.5 text-center w-12">No</th>
                        <th className="px-3 py-2.5 min-w-[160px]">Task / Aktivitas</th>
                        <th className="px-3 py-2.5 w-28">Bagian</th>
                        <th className="px-3 py-2.5 w-32">PIC</th>
                        <th className="px-3 py-2.5 w-24">Priority</th>
                        <th className="px-3 py-2.5 w-40">Start ~ End</th>
                        <th className="px-3 py-2.5 text-center w-20">Work Days</th>
                        <th className="px-3 py-2.5 w-32">Status</th>
                        <th className="px-3 py-2.5 min-w-[120px]">Note</th>
                        <th className="px-3 py-2.5 text-center w-20">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                      {/* Baris Tambah Pekerjaan Baru Inline */}
                      {isAddingTask && (
                        <tr className="bg-emerald-50/80 border-b-2 border-emerald-300">
                          <td className="px-2 py-2 text-center font-bold text-emerald-700 text-xs">
                            +
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              placeholder="Nama Pekerjaan..."
                              value={newTaskData.task}
                              onChange={(e) =>
                                setNewTaskData((p) => ({ ...p, task: e.target.value }))
                              }
                              className="w-full px-2 py-1 text-xs border border-emerald-400 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                              autoFocus
                            />
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={newTaskData.bagian}
                              onChange={(e) =>
                                setNewTaskData((p) => ({ ...p, bagian: e.target.value }))
                              }
                              className="w-full px-1.5 py-1 text-xs border border-emerald-400 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            >
                              {BAGIAN_LIST.map((b) => (
                                <option key={b} value={b}>
                                  {b}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              list="modal-employee-list"
                              type="text"
                              placeholder="Pilih / isi PIC..."
                              value={newTaskData.pic}
                              onChange={(e) =>
                                setNewTaskData((p) => ({ ...p, pic: e.target.value }))
                              }
                              className="w-full px-2 py-1 text-xs border border-emerald-400 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={newTaskData.priority}
                              onChange={(e) =>
                                setNewTaskData((p) => ({ ...p, priority: e.target.value }))
                              }
                              className="w-full px-1.5 py-1 text-xs border border-emerald-400 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            >
                              <option value="Low">Low</option>
                              <option value="Medium">Medium</option>
                              <option value="High">High</option>
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <div className="flex items-center gap-1">
                              <input
                                type="date"
                                value={newTaskData.startDate}
                                onChange={(e) =>
                                  setNewTaskData((p) => ({ ...p, startDate: e.target.value }))
                                }
                                className="w-full px-1 py-0.5 text-[11px] border border-emerald-400 rounded-md bg-white focus:outline-none"
                              />
                              <span className="text-slate-400 text-xs">~</span>
                              <input
                                type="date"
                                value={newTaskData.endDate}
                                onChange={(e) =>
                                  setNewTaskData((p) => ({ ...p, endDate: e.target.value }))
                                }
                                className="w-full px-1 py-0.5 text-[11px] border border-emerald-400 rounded-md bg-white focus:outline-none"
                              />
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <span className="text-[11px] font-semibold text-emerald-700">
                              {newTaskData.startDate && newTaskData.endDate
                                ? `${Math.max(
                                    1,
                                    Math.round(
                                      (new Date(newTaskData.endDate).getTime() -
                                        new Date(newTaskData.startDate).getTime()) /
                                        86400000
                                    ) + 1
                                  )} hr`
                                : "-"}
                            </span>
                          </td>
                          <td className="px-2 py-2">
                            <select
                              value={newTaskData.status}
                              onChange={(e) =>
                                setNewTaskData((p) => ({ ...p, status: e.target.value }))
                              }
                              className="w-full px-1.5 py-1 text-xs border border-emerald-400 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            >
                              <option value="BELUM DIKERJAKAN">BELUM DIKERJAKAN</option>
                              <option value="IN PROGRESS">IN PROGRESS</option>
                              <option value="PENDING">PENDING</option>
                              <option value="CANCEL">CANCEL</option>
                              <option value="SELESAI">SELESAI</option>
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              placeholder="Catatan..."
                              value={newTaskData.note}
                              onChange={(e) =>
                                setNewTaskData((p) => ({ ...p, note: e.target.value }))
                              }
                              className="w-full px-2 py-1 text-xs border border-emerald-400 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={handleCreateInlineTask}
                                className="p-1.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all cursor-pointer"
                                title="Simpan Pekerjaan Baru"
                              >
                                <Save size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsAddingTask(false)}
                                className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg transition-all cursor-pointer"
                                title="Batal"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}

                      {/* List Pekerjaan dari Order */}
                      {[...selectedProjectGroup.tasks]
                        .sort(
                          (a, b) =>
                            parseDateToSort(a.startDate || "") -
                              parseDateToSort(b.startDate || "") ||
                            a.id - b.id
                        )
                        .map((task, idx) => {
                          const isEditing = editingTaskId === task.id;

                          if (isEditing) {
                            return (
                              <tr key={task.id || idx} className="bg-sky-50/80 border-y-2 border-sky-300">
                                <td className="px-2 py-2 text-center font-medium text-slate-400 text-xs">
                                  {idx + 1}
                                </td>
                                <td className="px-2 py-2">
                                  <input
                                    type="text"
                                    value={inlineEditData.task}
                                    onChange={(e) =>
                                      setInlineEditData((p) => ({ ...p, task: e.target.value }))
                                    }
                                    className="w-full px-2 py-1 text-xs border border-sky-400 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                                  />
                                </td>
                                <td className="px-2 py-2">
                                  <select
                                    value={inlineEditData.bagian}
                                    onChange={(e) =>
                                      setInlineEditData((p) => ({ ...p, bagian: e.target.value }))
                                    }
                                    className="w-full px-1.5 py-1 text-xs border border-sky-400 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                                  >
                                    {BAGIAN_LIST.map((b) => (
                                      <option key={b} value={b}>
                                        {b}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-2 py-2">
                                  <input
                                    list="modal-employee-list"
                                    type="text"
                                    value={inlineEditData.pic}
                                    onChange={(e) =>
                                      setInlineEditData((p) => ({ ...p, pic: e.target.value }))
                                    }
                                    className="w-full px-2 py-1 text-xs border border-sky-400 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                                  />
                                </td>
                                <td className="px-2 py-2">
                                  <select
                                    value={inlineEditData.priority}
                                    onChange={(e) =>
                                      setInlineEditData((p) => ({ ...p, priority: e.target.value }))
                                    }
                                    className="w-full px-1.5 py-1 text-xs border border-sky-400 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                                  >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                  </select>
                                </td>
                                <td className="px-2 py-2">
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="date"
                                      value={inlineEditData.startDate}
                                      onChange={(e) =>
                                        setInlineEditData((p) => ({ ...p, startDate: e.target.value }))
                                      }
                                      className="w-full px-1 py-0.5 text-[11px] border border-sky-400 rounded-md bg-white focus:outline-none"
                                    />
                                    <span className="text-slate-400 text-xs">~</span>
                                    <input
                                      type="date"
                                      value={inlineEditData.endDate}
                                      onChange={(e) =>
                                        setInlineEditData((p) => ({ ...p, endDate: e.target.value }))
                                      }
                                      className="w-full px-1 py-0.5 text-[11px] border border-sky-400 rounded-md bg-white focus:outline-none"
                                    />
                                  </div>
                                </td>
                                <td className="px-2 py-2 text-center">
                                  <span className="text-[11px] font-semibold text-sky-700">
                                    {inlineEditData.startDate && inlineEditData.endDate
                                      ? `${Math.max(
                                          1,
                                          Math.round(
                                            (new Date(inlineEditData.endDate).getTime() -
                                              new Date(inlineEditData.startDate).getTime()) /
                                              86400000
                                          ) + 1
                                        )} hr`
                                      : "-"}
                                  </span>
                                </td>
                                <td className="px-2 py-2">
                                  <select
                                    value={inlineEditData.status}
                                    onChange={(e) =>
                                      setInlineEditData((p) => ({ ...p, status: e.target.value }))
                                    }
                                    className="w-full px-1.5 py-1 text-xs border border-sky-400 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                                  >
                                    <option value="BELUM DIKERJAKAN">BELUM DIKERJAKAN</option>
                                    <option value="IN PROGRESS">IN PROGRESS</option>
                                    <option value="PENDING">PENDING</option>
                                    <option value="CANCEL">CANCEL</option>
                                    <option value="SELESAI">SELESAI</option>
                                  </select>
                                </td>
                                <td className="px-2 py-2">
                                  <input
                                    type="text"
                                    value={inlineEditData.note}
                                    onChange={(e) =>
                                      setInlineEditData((p) => ({ ...p, note: e.target.value }))
                                    }
                                    className="w-full px-2 py-1 text-xs border border-sky-400 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                                  />
                                </td>
                                <td className="px-2 py-2 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveInlineEdit(task.id!)}
                                      className="p-1.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all cursor-pointer"
                                      title="Simpan Perubahan"
                                    >
                                      <Save size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingTaskId(null)}
                                      className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg transition-all cursor-pointer"
                                      title="Batal"
                                    >
                                      <X size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteInlineTask(task.id!)}
                                      className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg transition-all cursor-pointer"
                                      title="Hapus Pekerjaan Ini"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr
                              key={task.id || idx}
                              onDoubleClick={() => startInlineEdit(task)}
                              className="hover:bg-slate-50/80 transition-colors group cursor-default"
                            >
                              <td className="px-3 py-2.5 text-center font-medium text-slate-400">
                                {idx + 1}
                              </td>
                              <td
                                className="px-3 py-2.5 font-semibold text-slate-800"
                                title={cleanTaskName(task.task, selectedProjectGroup.project) || task.task}
                              >
                                {cleanTaskName(task.task, selectedProjectGroup.project) || task.task}
                              </td>
                              <td className="px-3 py-2.5 text-slate-600">
                                {(task as any).bagian || "-"}
                              </td>
                              <td className="px-3 py-2.5 font-bold text-emerald-700">
                                {task.pic || "-"}
                              </td>
                              <td className="px-3 py-2.5 text-slate-600">
                                {task.priority || "-"}
                              </td>
                              <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">
                                {task.startDate || "-"} ~ {task.endDate || "-"}
                              </td>
                              <td className="px-3 py-2.5 text-center font-medium text-slate-600">
                                {task.workDays ? `${task.workDays} hari` : "-"}
                              </td>
                              <td className="px-3 py-2.5 whitespace-nowrap">
                                {getStatusBadge(task.status)}
                              </td>
                              <td className="px-3 py-2.5 text-slate-500 max-w-[180px] truncate" title={task.note}>
                                {task.note || "-"}
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startInlineEdit(task);
                                    }}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                    title="Edit Pekerjaan Inline"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteInlineTask(task.id!);
                                    }}
                                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                    title="Hapus Pekerjaan"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
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
                  onClick={() => {
                    setSelectedProjectGroup(null);
                    setEditingTaskId(null);
                    setIsAddingTask(false);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
