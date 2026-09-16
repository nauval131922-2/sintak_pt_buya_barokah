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
  ChevronLeft,
  ChevronRight,
  Check,
  BarChart3,
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
  GripVertical,
  Eye,
  Calendar,
  AlertCircle,
} from "lucide-react";
import dynamic from "next/dynamic";
import TableFooter from "@/components/TableFooter";
import Portal, { getZoomScale } from "@/components/Portal";
import SquareDropdown from "@/components/SquareDropdown";
import DatePicker from "@/components/DatePicker";
import TimePicker from "@/components/TimePicker";
import FontSizeControl from "@/components/FontSizeControl";
import { toast } from "@/lib/toast";
import { type SpreadsheetTask } from "@/lib/google-sheets";
import { parseDateToSort } from "@/lib/date-sort";
import {
  LAPORAN_PEKERJAAN_COLUMNS,
  type RoleLaporanPekerjaanConfig,
} from "@/lib/permissions-laporan-pekerjaan-constants";

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
  CANCEL: "#f43f5e", // rose-500
  SELESAI: "#10b981", // emerald-500
};

// ponytail: grafik + recharts dimuat malas hanya saat panel analitik dibuka
const LaporanPekerjaanCharts = dynamic(() => import("./LaporanPekerjaanCharts"), {
  ssr: false,
  loading: () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-12 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-center text-slate-400 text-xs h-32">
        <RefreshCw className="w-4 h-4 animate-spin mr-2 text-emerald-600" />
        Memuat grafik...
      </div>
    </div>
  ),
});

// ponytail: parse tanggal diimpor dari lib bersama (dipakai juga oleh API & backfill via toNormDateString)
// ponytail: "HH:mm" -> menit agar "8:00" vs "08:00" tetap benar dibanding string biasa; kosong -> paling belakang
const parseTimeToMinutes = (str?: string): number => {
  if (!str || !str.trim()) return Number.MAX_SAFE_INTEGER;
  const m = str.trim().match(/(\d{1,2})\s*[:.]\s*(\d{1,2})/);
  if (m) return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  const h = str.trim().match(/(\d{1,2})/);
  if (h) return parseInt(h[1], 10) * 60;
  return Number.MAX_SAFE_INTEGER;
};

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
// Urutan kronologis detail pekerjaan: startDate -> startTime -> endDate -> endTime -> id (kosong selalu di belakang)
const compareTasksChronological = (a: SpreadsheetTask, b: SpreadsheetTask): number => {
  const sDateA = parseDateToSort(a.startDate || "") || Number.MAX_SAFE_INTEGER;
  const sDateB = parseDateToSort(b.startDate || "") || Number.MAX_SAFE_INTEGER;
  if (sDateA !== sDateB) return sDateA - sDateB;
  const sTimeA = parseTimeToMinutes(a.startTime);
  const sTimeB = parseTimeToMinutes(b.startTime);
  if (sTimeA !== sTimeB) return sTimeA - sTimeB;
  const eDateA = parseDateToSort(a.endDate || "") || Number.MAX_SAFE_INTEGER;
  const eDateB = parseDateToSort(b.endDate || "") || Number.MAX_SAFE_INTEGER;
  if (eDateA !== eDateB) return eDateA - eDateB;
  const eTimeA = parseTimeToMinutes(a.endTime);
  const eTimeB = parseTimeToMinutes(b.endTime);
  if (eTimeA !== eTimeB) return eTimeA - eTimeB;
  return (a.id || 0) - (b.id || 0);
};

// ponytail: manual menimpa auto — task yang pernah di-drag (sortOrder>0) selalu di atas, sisanya kronologis di bawah
const getSortOrderValue = (t: SpreadsheetTask): number =>
  typeof t.sortOrder === "number" && Number.isFinite(t.sortOrder) ? t.sortOrder : 0;

const compareTasksDisplay = (a: SpreadsheetTask, b: SpreadsheetTask): number => {
  const ao = getSortOrderValue(a);
  const bo = getSortOrderValue(b);
  if (ao > 0 || bo > 0) {
    if (ao > 0 && bo > 0 && ao !== bo) return ao - bo;
    if (ao > 0 !== bo > 0) return ao > 0 ? -1 : 1;
  }
  return compareTasksChronological(a, b);
};

// ponytail: selipkan 1 task ke posisi kronologisnya di dalam urutan tampil saat ini (urutan manual lain tidak diacak)
const insertTaskChronologically = (displayOrdered: SpreadsheetTask[], item: SpreadsheetTask): SpreadsheetTask[] => {
  const others = displayOrdered.filter((t) => t.id !== item.id);
  let idx = others.findIndex((t) => compareTasksChronological(item, t) < 0);
  if (idx === -1) idx = others.length;
  const next = [...others];
  next.splice(idx, 0, item);
  return next;
};

// ponytail: single-pass loop untuk hitung summary tasks (active, selesai, last, next, note) tanpa multi-filter loop
const summarizeOrderTasks = (tasks: SpreadsheetTask[], project: string) => {
  const sorted = [...tasks].sort(compareTasksDisplay);

  let activeCount = 0;
  let selesaiCount = 0;
  let lastSelesaiTask: SpreadsheetTask | undefined;
  let nextTask: SpreadsheetTask | undefined;
  let lastCancelTask: SpreadsheetTask | undefined;

  for (let i = 0; i < sorted.length; i++) {
    const t = sorted[i];
    const s = (t.status || "").toUpperCase();
    if (s !== "CANCEL") {
      activeCount++;
      if (s === "SELESAI") {
        selesaiCount++;
        lastSelesaiTask = t;
      } else if (!nextTask) {
        nextTask = t;
      }
    } else {
      lastCancelTask = t;
    }
  }

  // ponytail: penanda cancel kronologis-terakhir agar terlihat di ringkasan;
  // fallback cancel penuh hanya saat tidak ada task aktif tersisa (semua CANCEL)
  const lastSorted = sorted.length > 0 ? sorted[sorted.length - 1] : undefined;
  const isLastCancel = (lastSorted?.status || "").toUpperCase() === "CANCEL";
  const cancelFallback = !nextTask && !lastSelesaiTask ? lastCancelTask : undefined;
  const shownCancel = isLastCancel ? lastSorted : cancelFallback;
  const cancelName = shownCancel ? cleanTaskName(shownCancel.task || "", project) : "";

  // ponytail: gabung note agar note cancel tidak ketutup note selanjutnya
  const nextNote = nextTask?.note?.trim() || "";
  const cancelNoteText = shownCancel?.note?.trim() || "";
  const selesaiNote = !isLastCancel ? lastSelesaiTask?.note?.trim() || "" : "";
  const note =
    nextNote && cancelNoteText && nextNote !== cancelNoteText
      ? `${nextNote} / ${cancelNoteText}`
      : nextNote || cancelNoteText || selesaiNote || "-";

  return {
    progressPct:
      activeCount > 0
        ? Math.round((selesaiCount / activeCount) * 100)
        : 0,
    pekerjaanTerakhir: shownCancel && (isLastCancel || !lastSelesaiTask)
      ? cancelName ? `${cancelName} (Batal)` : "-"
      : lastSelesaiTask
        ? cleanTaskName(lastSelesaiTask.task || "", project)
        : "-",
    pekerjaanSelanjutnya: nextTask
      ? cleanTaskName(nextTask.task || "", project)
      : "-",
    note,
  };
};

// Tanggal order sort: tanggal ada vs kosong dipisah agar tanggal kosong selalu di paling akhir
const compareTglOrderDesc = (tglA?: string, tglB?: string) => {
  const timeA = parseDateToSort(tglA || "") || 0;
  const timeB = parseDateToSort(tglB || "") || 0;
  if (!timeA && !timeB) return 0;
  if (!timeA) return 1; // A kosong -> taruh belakang
  if (!timeB) return -1; // B kosong -> taruh belakang
  return timeB - timeA; // Terbaru ke terlama
};

const compareProjectNaturalDesc = (projA?: string, projB?: string) => {
  return (projB || "").localeCompare(projA || "", "id", { numeric: true, sensitivity: "base" });
};

const getStatusBadge = (status?: string) => {
  const s = (status || "").toUpperCase();
  if (s === "BELUM DIKERJAKAN") {
    return (
      <span className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-300 max-w-full truncate" title="BELUM DIKERJAKAN">
        <Clock className="w-3 h-3 text-slate-500 shrink-0" /> <span className="truncate">BELUM DIKERJAKAN</span>
      </span>
    );
  }
  if (s === "SELESAI") {
    return (
      <span className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 max-w-full truncate" title="SELESAI">
        <CheckCircle2 className="w-3 h-3 shrink-0" /> <span className="truncate">SELESAI</span>
      </span>
    );
  }
  if (s === "IN PROGRESS" || s === "PENDING") {
    return (
      <span className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80 max-w-full truncate" title="IN PROGRESS">
        <Clock className="w-3 h-3 shrink-0" /> <span className="truncate">IN PROGRESS</span>
      </span>
    );
  }
  if (s === "CANCEL") {
    return (
      <span className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 max-w-full truncate" title="CANCEL">
        <XCircle className="w-3 h-3 shrink-0" /> <span className="truncate">CANCEL</span>
      </span>
    );
  }
  return <span className="text-slate-400 text-xs">-</span>;
};

const getOrderStatusAccent = (group: { tasks: SpreadsheetTask[]; progressPct: number }) => {
  const tasks = group.tasks;
  if (tasks.length === 0) {
    return {
      status: "BELUM DIKERJAKAN",
      rowBg: "bg-slate-50/70",
      borderAccent: "shadow-[inset_4.5px_0_0_0_#94a3b8]",
      barColor: "bg-slate-400",
      rowHover: "hover:bg-slate-100/80",
      selectedBg: "bg-slate-200/90 shadow-[inset_5px_0_0_0_#475569]",
      badge: { bg: "bg-slate-200/90 text-slate-700 border-slate-300", label: "0% Belum Dikerjakan" },
    };
  }

  const allCancel = tasks.every((t) => (t.status || "").toUpperCase() === "CANCEL");
  if (allCancel) {
    return {
      status: "CANCEL",
      rowBg: "bg-rose-50/80",
      borderAccent: "shadow-[inset_4.5px_0_0_0_#f43f5e]",
      barColor: "bg-rose-500",
      rowHover: "hover:bg-rose-100/70",
      selectedBg: "bg-rose-200/90 shadow-[inset_5px_0_0_0_#e11d48]",
      badge: { bg: "bg-rose-100 text-rose-800 border-rose-300", label: "Dibatalkan" },
    };
  }

  const isSelesai = group.progressPct >= 100;
  if (isSelesai) {
    return {
      status: "SELESAI",
      rowBg: "bg-emerald-50/80",
      borderAccent: "shadow-[inset_4.5px_0_0_0_#059669]",
      barColor: "bg-emerald-600",
      rowHover: "hover:bg-emerald-100/70",
      selectedBg: "bg-emerald-200/90 shadow-[inset_5px_0_0_0_#059669]",
      badge: { bg: "bg-emerald-100 text-emerald-800 border-emerald-300", label: "100% Selesai" },
    };
  }

  const hasInProgress = tasks.some((t) => (t.status || "").toUpperCase() === "IN PROGRESS");
  if (hasInProgress || group.progressPct > 0) {
    return {
      status: "IN PROGRESS",
      rowBg: "bg-sky-50/80",
      borderAccent: "shadow-[inset_4.5px_0_0_0_#0ea5e9]",
      barColor: "bg-sky-500",
      rowHover: "hover:bg-sky-100/70",
      selectedBg: "bg-sky-200/90 shadow-[inset_5px_0_0_0_#0284c7]",
      badge: { bg: "bg-sky-100 text-sky-800 border-sky-300", label: `${group.progressPct}% In Progress` },
    };
  }

  return {
    status: "BELUM DIKERJAKAN",
    rowBg: "bg-slate-50/70",
    borderAccent: "shadow-[inset_4.5px_0_0_0_#94a3b8]",
    barColor: "bg-slate-400",
    rowHover: "hover:bg-slate-100/80",
    selectedBg: "bg-slate-200/90 shadow-[inset_5px_0_0_0_#475569]",
    badge: { bg: "bg-slate-200/90 text-slate-700 border-slate-300", label: "Belum Dikerjakan" },
  };
};

const truncatePicName = (name: string, maxLen = 20) => {
  if (!name) return "";
  let s = name.trim();
  if (s.toLowerCase().startsWith("muhammad ")) {
    s = "M. " + s.slice(9);
  } else if (s.toLowerCase().startsWith("mochammad ") || s.toLowerCase().startsWith("moch. ")) {
    s = "M. " + s.replace(/^moch(ammad|\.)\s*/i, "");
  } else if (s.toLowerCase().startsWith("achmad ") || s.toLowerCase().startsWith("ahmad ")) {
    s = "A. " + s.replace(/^(achmad|ahmad)\s*/i, "");
  }
  if (s.length <= maxLen) return s;
  return `${s.slice(0, Math.max(1, maxLen - 1))}…`;
};

export default function LaporanPekerjaanClient({
  roleConfig,
}: {
  roleConfig?: RoleLaporanPekerjaanConfig;
} = {}) {
  const [tasks, setTasks] = useState<SpreadsheetTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRangeLoading, setIsRangeLoading] = useState<boolean>(false);
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

  // Filters & Analytics state (Inisialisasi konsisten dengan server untuk cegah hydration mismatch)
  const [selectedPic, setSelectedPic] = useState<string>("ALL");
  const [selectedBagianFilter, setSelectedBagianFilter] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
  });
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  });
  const [filterStartTime, setFilterStartTime] = useState<string>("");
  const [filterEndTime, setFilterEndTime] = useState<string>("");
  const [isFilterHydrated, setIsFilterHydrated] = useState<boolean>(false);
  const [tableFontSize, setTableFontSize] = useState<number>(12);

  // Restore filter tanggal & jam dari localStorage setelah client mounted
  useEffect(() => {
    try {
      const today = new Date();
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      const savedDateDay = localStorage.getItem("laporan_pekerjaan_filter_saved_day");
      
      if (savedDateDay === todayKey) {
        const savedStart = localStorage.getItem("laporan_pekerjaan_filter_start_date");
        const savedEnd = localStorage.getItem("laporan_pekerjaan_filter_end_date");
        const savedStartTime = localStorage.getItem("laporan_pekerjaan_filter_start_time");
        const savedEndTime = localStorage.getItem("laporan_pekerjaan_filter_end_time");

        if (savedStart === "EMPTY") {
          setFilterStartDate(null);
        } else if (savedStart) {
          const parsed = new Date(savedStart);
          if (!isNaN(parsed.getTime())) setFilterStartDate(parsed);
        }

        if (savedEnd === "EMPTY") {
          setFilterEndDate(null);
        } else if (savedEnd) {
          const parsed = new Date(savedEnd);
          if (!isNaN(parsed.getTime())) setFilterEndDate(parsed);
        }

        if (savedStartTime) setFilterStartTime(savedStartTime);
        if (savedEndTime) setFilterEndTime(savedEndTime);
      }
    } catch {} finally {
      setIsFilterHydrated(true);
    }
  }, []);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const deferredSearchTerm = useDeferredValue(searchTerm);

  // Sync filter date/time ke localStorage dengan penanda tanggal hari ini
  useEffect(() => {
    if (!isFilterHydrated) return;
    try {
      const today = new Date();
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      localStorage.setItem("laporan_pekerjaan_filter_saved_day", todayKey);
      if (filterStartDate) {
        localStorage.setItem("laporan_pekerjaan_filter_start_date", filterStartDate.toISOString());
      } else {
        localStorage.setItem("laporan_pekerjaan_filter_start_date", "EMPTY");
      }
      if (filterEndDate) {
        localStorage.setItem("laporan_pekerjaan_filter_end_date", filterEndDate.toISOString());
      } else {
        localStorage.setItem("laporan_pekerjaan_filter_end_date", "EMPTY");
      }
      if (filterStartTime) {
        localStorage.setItem("laporan_pekerjaan_filter_start_time", filterStartTime);
      } else {
        localStorage.removeItem("laporan_pekerjaan_filter_start_time");
      }
      if (filterEndTime) {
        localStorage.setItem("laporan_pekerjaan_filter_end_time", filterEndTime);
      } else {
        localStorage.removeItem("laporan_pekerjaan_filter_end_time");
      }
    } catch {}
  }, [filterStartDate, filterEndDate, filterStartTime, filterEndTime, isFilterHydrated]);

  // Modal Tambah Order Manual state
  const [showAddOrderModal, setShowAddOrderModal] = useState<boolean>(false);
  // ponytail: modal rincian flat pekerjaan yang lolos filter aktif
  const [showFilterDetailModal, setShowFilterDetailModal] = useState<boolean>(false);
  const [newOrderProject, setNewOrderProject] = useState<string>("");
  const [newOrderTgl, setNewOrderTgl] = useState<Date | null>(new Date());
  const [isSubmittingOrder, setIsSubmittingOrder] = useState<boolean>(false);

  // Persistent Mobile Search & Filter Toolbar state (default collapsed false di mobile)
  const [isFilterOpenMobile, setIsFilterOpenMobile] = useState<boolean>(true);

  // Persistent Accordion state (default collapsed false)
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedFilterMobile = localStorage.getItem("laporan_pekerjaan_filter_open_mobile");
      if (savedFilterMobile !== null) {
        setIsFilterOpenMobile(savedFilterMobile === "true");
      }
      const savedAnalytics = localStorage.getItem("laporan_pekerjaan_analytics_open");
      if (savedAnalytics !== null) {
        setIsAnalyticsOpen(savedAnalytics === "true");
      }
      const savedFontSize = localStorage.getItem("laporan_pekerjaan_table_font_size");
      if (savedFontSize) {
        const num = parseInt(savedFontSize, 10);
        if (!isNaN(num) && num >= 6 && num <= 48) {
          setTableFontSize(num);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const changeTableFontSize = (size: number) => {
    const clamped = Math.max(6, Math.min(48, size));
    setTableFontSize(clamped);
    try {
      localStorage.setItem("laporan_pekerjaan_table_font_size", String(clamped));
    } catch {}
  };

  const toggleFilterMobile = () => {
    setIsFilterOpenMobile((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("laporan_pekerjaan_filter_open_mobile", String(next));
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
      const isLandscapeMobile = typeof window !== "undefined" && window.matchMedia('(orientation: landscape) and (max-height: 500px)').matches;
      
      let docScrollTop = 0;
      let docScrollHeight = 0;
      let docClientHeight = 0;

      if (isLandscapeMobile) {
        docScrollTop = window.scrollY || document.documentElement.scrollTop || 0;
        docScrollHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
        docClientHeight = window.innerHeight;
      } else {
        const el = clientContainerRef.current || document.getElementById("main-content-scroll");
        if (!el) return;
        docScrollTop = el.scrollTop;
        docScrollHeight = el.scrollHeight;
        docClientHeight = el.clientHeight;
      }

      const isDocScrollable = isAnalyticsOpen || docScrollHeight > docClientHeight + 40;

      if (isDocScrollable) {
        const canScrollUp = docScrollTop > 30;
        const canScrollDown = docScrollTop + docClientHeight < docScrollHeight - 30;
        setShowTopBtn(Boolean(canScrollUp));
        setShowBottomBtn(Boolean(canScrollDown));
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

    const scrollEl = clientContainerRef.current;
    const mainEl = document.getElementById("main-content-scroll");

    scrollEl?.addEventListener("scroll", handleUserScroll, { passive: true });
    mainEl?.addEventListener("scroll", handleUserScroll, { passive: true });
    window.addEventListener("scroll", handleUserScroll, { passive: true });
    window.addEventListener("resize", checkScrollPosition, { passive: true });
    
    // Initial check tanpa mengaktifkan idle timer
    checkScrollPosition();
    const t1 = setTimeout(checkScrollPosition, 200);
    const t2 = setTimeout(checkScrollPosition, 600);

    return () => {
      scrollEl?.removeEventListener("scroll", handleUserScroll);
      mainEl?.removeEventListener("scroll", handleUserScroll);
      window.removeEventListener("scroll", handleUserScroll);
      window.removeEventListener("resize", checkScrollPosition);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isAnalyticsOpen, loading, tasks.length]);

  const scrollToTop = () => {
    if (clientContainerRef.current) {
      clientContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    const el = document.getElementById("main-content-scroll");
    if (el) el.scrollTo({ top: 0, behavior: "smooth" });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const scrollToBottom = () => {
    if (clientContainerRef.current) {
      clientContainerRef.current.scrollTo({ top: clientContainerRef.current.scrollHeight, behavior: "smooth" });
    }
    const el = document.getElementById("main-content-scroll");
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }
  };

  // Pagination & Sorting
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(50);
  type SortField =
    | "tglOrder"
    | "project"
    | "progress"
    | "terakhir"
    | "selanjutnya"
    | "note";
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
  const tableTheadRef = useRef<HTMLTableSectionElement>(null);
  const fixedHeaderTableRef = useRef<HTMLTableElement>(null);
  const [showFixedLandscapeHeader, setShowFixedLandscapeHeader] = useState(false);
  const [fixedHeaderTop, setFixedHeaderTop] = useState(0);
  const [fixedHeaderRect, setFixedHeaderRect] = useState({ left: 0, width: 0 });

  // Fixed thead di viewport atas khusus saat mobile landscape + reset scroll saat kembali portrait
  useEffect(() => {
    const updateFixedHeader = () => {
      const thead = tableTheadRef.current;
      const container = tableContainerRef.current;
      if (!thead || !container) return;
      const isLandscapeMobile = window.matchMedia('(orientation: landscape) and (max-height: 500px)').matches;
      if (!isLandscapeMobile) {
        setShowFixedLandscapeHeader(false);
        // ponytail: reset document scroll saat kembali ke portrait agar header halaman tidak stuck hidden
        if (window.scrollY > 0) window.scrollTo(0, 0);
        return;
      }
      const containerRect = container.getBoundingClientRect();
      const theadH = thead.offsetHeight;
      if (containerRect.top <= 0 && containerRect.bottom > theadH) {
        setShowFixedLandscapeHeader(true);
        setFixedHeaderTop(0);
        setFixedHeaderRect({ left: containerRect.left, width: container.clientWidth });
      } else if (containerRect.top <= 0 && containerRect.bottom <= theadH && containerRect.bottom > 0) {
        setShowFixedLandscapeHeader(true);
        setFixedHeaderTop(containerRect.bottom - theadH);
        setFixedHeaderRect({ left: containerRect.left, width: container.clientWidth });
      } else {
        setShowFixedLandscapeHeader(false);
      }
    };
    window.addEventListener('scroll', updateFixedHeader, { passive: true });
    window.addEventListener('resize', updateFixedHeader, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateFixedHeader);
      window.removeEventListener('resize', updateFixedHeader);
    };
  }, []);

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

  const fetchAbortRef = useRef<AbortController | null>(null);
  // ponytail: from/to = filter tanggal server-side (YYYY-MM-DD); quiet = ganti tanggal tanpa skeleton penuh
  const fetchData = useCallback(async (force = false, from?: string | null, to?: string | null, quiet = false) => {
    // Batalkan request lama yang masih jalan agar tidak menumpuk saat filter berubah cepat
    fetchAbortRef.current?.abort();
    const ctrl = new AbortController();
    fetchAbortRef.current = ctrl;
    const startTime = performance.now();
    if (quiet) setIsRangeLoading(true);
    else setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (force) params.set("sync", "true");
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const qs = params.toString();
      const url = qs ? `/api/laporan-pekerjaan?${qs}` : "/api/laporan-pekerjaan";
      const res = await fetch(url, { signal: ctrl.signal });
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
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Terjadi kesalahan koneksi");
    } finally {
      // ponytail: request terakhir yang selesai selalu mematikan SEMUA indikator —
      // request lama yang di-abort oleh refetch rentang tidak boleh menyisakan skeleton menyala
      if (fetchAbortRef.current === ctrl) {
        setLoading(false);
        setIsRangeLoading(false);
      }
    }
  }, []);

  const toISODateParam = (d: Date | null): string | null => {
    if (!d || isNaN(d.getTime())) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const refetchWithCurrentRange = (force = false, quiet = false) =>
    fetchData(force, toISODateParam(filterStartDate), toISODateParam(filterEndDate), quiet);

  // Initial fetch: tunggu restore filter localStorage selesai agar tidak double-fetch
  // (restore membuat objek Date baru walau nilainya sama, yang akan memicu refetch sia-sia)
  useEffect(() => {
    if (!isFilterHydrated) return;
    refetchWithCurrentRange(false);
    fetchEmployeeOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, isFilterHydrated]);

  // Ganti rentang tanggal -> refetch ringan (debounce; tanpa skeleton penuh)
  const rangeFetchArmed = useRef(false);
  useEffect(() => {
    if (!isFilterHydrated) return;
    if (!rangeFetchArmed.current) {
      rangeFetchArmed.current = true; // fetch awal sudah diurus efek di atas
      return;
    }
    const t = setTimeout(() => {
      refetchWithCurrentRange(false, true);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStartDate, filterEndDate, isFilterHydrated]);

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

    // Deteksi perubahan tanggal/jam untuk auto-slip di mode manual
    const oldInlineTask = selectedProjectGroup?.tasks.find((t) => t.id === taskId);
    const inlineDatesChanged =
      !!oldInlineTask &&
      (startDateStr !== (oldInlineTask.startDate || "") ||
        endDateStr !== (oldInlineTask.endDate || "") ||
        (data.startTime || "") !== (oldInlineTask.startTime || "") ||
        (data.endTime || "") !== (oldInlineTask.endTime || ""));

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
      startTime: data.startTime || "",
      endTime: data.endTime || "",
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
          startTime: data.startTime || "",
          endTime: data.endTime || "",
          workDays: workDays,
          note: data.note,
          status: data.status || "BELUM DIKERJAKAN",
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Pekerjaan berhasil diperbarui!");
        // Auto-slip: tanggal/jam berubah + project sudah mode manual -> selipkan ke posisi kronologis
        const siblings = (selectedProjectGroup?.tasks || []).filter((t) => !!t.task && (t.id || 0) > 0);
        if (inlineDatesChanged && siblings.some((t) => t.id !== taskId && getSortOrderValue(t) > 0) && oldInlineTask) {
          const updated: SpreadsheetTask = { ...oldInlineTask, ...updatedTaskData };
          const next = insertTaskChronologically(
            siblings.filter((t) => t.id !== taskId).sort(compareTasksDisplay),
            updated
          );
          handleReorderInlineTasks(proj, next.map((t) => t.id || 0).filter((id) => id > 0));
        }
      } else {
        toast.error(json.error || "Gagal menyimpan perubahan");
        refetchWithCurrentRange();
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
      refetchWithCurrentRange();
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
          bagian: data.bagian || (roleConfig?.allowed_bagian && roleConfig.allowed_bagian.length === 1 ? roleConfig.allowed_bagian[0] : "SETTING"),
          pic: data.pic || (roleConfig?.allowed_pic && roleConfig.allowed_pic.length === 1 ? roleConfig.allowed_pic[0] : ""),
          priority: data.priority || "Low",
          startDate: startDateStr,
          endDate: endDateStr,
          startTime: data.startTime || "",
          endTime: data.endTime || "",
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
            startTime: data.startTime || "",
            endTime: data.endTime || "",
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
          // Auto-slip: project sudah mode manual -> selipkan task baru ke posisi kronologisnya
          const createSiblings = (selectedProjectGroup?.tasks || []).filter((t) => !!t.task && (t.id || 0) > 0);
          if (createSiblings.some((t) => getSortOrderValue(t) > 0)) {
            const next = insertTaskChronologically(
              [...createSiblings].sort(compareTasksDisplay),
              createdTask
            );
            handleReorderInlineTasks(proj, next.map((t) => t.id || 0).filter((id) => id > 0));
          }
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
        refetchWithCurrentRange();
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
      refetchWithCurrentRange();
    }
  };

  // Drag-to-sort permanen: urutan manual disimpan ke DB dan menimpa urutan kronologis
  // ponytail: fungsi biasa (bukan useCallback) agar refetch selalu pakai rentang tanggal terbaru
  const handleReorderInlineTasks = async (project: string, orderedIds: number[]) => {
    const orderMap = new Map(orderedIds.map((id, i) => [id, i + 1]));
    setTasks((prev) =>
      prev.map((t) =>
        t.project === project && orderMap.has(t.id || 0)
          ? { ...t, sortOrder: orderMap.get(t.id || 0)! }
          : t
      )
    );
    setSelectedProjectGroup((prev) =>
      prev && prev.project === project
        ? {
            ...prev,
            tasks: prev.tasks.map((t) =>
              orderMap.has(t.id || 0) ? { ...t, sortOrder: orderMap.get(t.id || 0)! } : t
            ),
          }
        : prev
    );
    try {
      const res = await fetch("/api/laporan-pekerjaan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project, orderedIds }),
      });
      const json = await res.json();
      if (!json.success) {
        toast.error(json.error || "Gagal menyimpan urutan");
        refetchWithCurrentRange();
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal menyimpan urutan");
      refetchWithCurrentRange();
    }
  };

  const handleCreateOrderManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const proj = newOrderProject.trim();
    if (!proj) {
      toast.error("Nama Order / Project wajib diisi");
      return;
    }

    const tglOrderStr = newOrderTgl ? formatDateForApi(newOrderTgl) : "";
    setIsSubmittingOrder(true);

    try {
      const res = await fetch("/api/laporan-pekerjaan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
          tglOrder: tglOrderStr,
          isOrderOnly: true,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`Order "${proj}" berhasil dibuat!`);
        setShowAddOrderModal(false);
        setNewOrderProject("");
        setNewOrderTgl(new Date());

        const placeholderTask: SpreadsheetTask = {
          id: json.id || -Date.now(),
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
          source: "sintak",
          tglOrder: tglOrderStr,
        };

        setTasks((prev) => [placeholderTask, ...prev]);

        // Langsung buka modal detail untuk order tersebut agar user bisa langsung menambah pekerjaan jika diinginkan
        setSelectedProjectGroup({
          project: proj,
          tglOrder: tglOrderStr,
          tasks: [],
        });
      } else {
        toast.error(json.error || "Gagal menambahkan order manual");
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan koneksi");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleDeleteOrder = async (projectName: string) => {
    if (!projectName) return;
    if (!confirm(`Yakin ingin menghapus order "${projectName}" beserta seluruh aktivitas pekerjaannya?`)) {
      return;
    }

    // Optimistic delete order
    setTasks((prev) => prev.filter((t) => (t.project || "") !== projectName));
    if (selectedProjectGroup?.project === projectName) {
      setSelectedProjectGroup(null);
    }

    try {
      const res = await fetch(`/api/laporan-pekerjaan?project=${encodeURIComponent(projectName)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Order "${projectName}" berhasil dihapus`);
      } else {
        toast.error(json.error || "Gagal menghapus order");
        refetchWithCurrentRange();
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
      refetchWithCurrentRange();
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

  // Scope helper dari Role Permissions (O(1) Set lookup tanpa array allocation di tiap iterasi)
  const allowedBagianSet = useMemo(() => {
    if (!roleConfig?.allowed_bagian || roleConfig.allowed_bagian.length === 0) return null;
    return new Set(roleConfig.allowed_bagian.map((b) => b.toUpperCase()));
  }, [roleConfig?.allowed_bagian]);

  const allowedPicSet = useMemo(() => {
    if (!roleConfig?.allowed_pic || roleConfig.allowed_pic.length === 0) return null;
    return new Set(roleConfig.allowed_pic.map((p) => p.toLowerCase()));
  }, [roleConfig?.allowed_pic]);

  const excludedPicSet = useMemo(() => {
    if (!roleConfig?.excluded_pic || roleConfig.excluded_pic.length === 0) return null;
    return new Set(roleConfig.excluded_pic.map((p) => p.toLowerCase()));
  }, [roleConfig?.excluded_pic]);
  const isBagianAllowedByRole = useCallback(
    (bagian?: string | null, source?: string | null, taskName?: string | null) => {
      // Order baru (dari SOPD maupun manual placeholder tanpa task) yang belum memiliki subtask/bagian boleh dilihat agar bisa ditambah pekerjaan
      if (source === 'sopd' || (!bagian && !taskName)) return true;
      if (!allowedBagianSet) return true;
      if (!bagian) return false;
      return allowedBagianSet.has(bagian.toUpperCase());
    },
    [allowedBagianSet]
  );

  const isPicAllowedByRole = useCallback(
    (pic?: string | null, source?: string | null, taskName?: string | null) => {
      // Order baru (dari SOPD maupun manual placeholder tanpa task) hanya diizinkan untuk role yang bisa tambah pekerjaan (can_add)
      if (source === 'sopd' || (!pic && !taskName)) {
        return roleConfig?.can_add !== false;
      }
      if (pic && excludedPicSet && excludedPicSet.has(pic.toLowerCase().trim())) {
        return false;
      }
      if (!allowedPicSet) return true;
      if (!pic || pic.trim() === "") {
        return (
          allowedPicSet.has("@unassigned") ||
          allowedPicSet.has("tanpa pic")
        );
      }
      return allowedPicSet.has(pic.toLowerCase().trim());
    },
    [allowedPicSet, excludedPicSet, roleConfig?.can_add]
  );

  // Helper pencocokan task dengan pilihan filter PIC
  const isPicMatchingSelection = useCallback((taskPic: string | undefined | null, selected: string) => {
    if (selected === "ALL") return true;
    const isSelectedUnassigned =
      selected.toUpperCase() === "TANPA PIC" ||
      selected === "__UNASSIGNED__" ||
      selected === "@unassigned";
    const isTaskUnassigned = !taskPic || taskPic.trim() === "" || taskPic.toUpperCase() === "TANPA PIC";
    if (isSelectedUnassigned) {
      return isTaskUnassigned;
    }
    if (isTaskUnassigned) return false;
    return taskPic.toUpperCase() === selected.toUpperCase();
  }, []);

  // Sembunyikan filter jika role terkunci hanya pada 1 Bagian atau 1 PIC
  const showBagianFilter = !roleConfig?.allowed_bagian || roleConfig.allowed_bagian.length !== 1;
  const showPicFilter = !roleConfig?.allowed_pic || roleConfig.allowed_pic.length !== 1;

  // Saling-terkait filter options (Bagian, PIC, Status)
  const bagianOptions = useMemo<FilterOption[]>(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (!isBagianAllowedByRole(t.bagian, t.source, t.task) || !isPicAllowedByRole(t.pic, t.source, t.task)) return;
      if (!isPicMatchingSelection(t.pic, selectedPic)) return;
      if (selectedStatus !== "ALL" && t.status.toUpperCase() !== selectedStatus.toUpperCase()) return;
      if (t.bagian) set.add(t.bagian);
    });
    if (roleConfig?.allowed_bagian && roleConfig.allowed_bagian.length > 0) {
      roleConfig.allowed_bagian.forEach((b) => set.add(b));
    }
    const sorted = Array.from(set).sort();
    return [
      { value: "ALL", label: "Semua Bagian" },
      ...sorted.map((b) => ({ value: b, label: b })),
    ];
  }, [tasks, selectedPic, selectedStatus, isBagianAllowedByRole, isPicAllowedByRole, roleConfig, isPicMatchingSelection]);

  const picOptions = useMemo<FilterOption[]>(() => {
    const set = new Set<string>();
    let hasUnassignedTask = false;

    tasks.forEach((t) => {
      if (!isBagianAllowedByRole(t.bagian, t.source, t.task) || !isPicAllowedByRole(t.pic, t.source, t.task)) return;
      if (selectedBagianFilter !== "ALL" && (t.bagian || "").toUpperCase() !== selectedBagianFilter.toUpperCase()) return;
      if (selectedStatus !== "ALL" && t.status.toUpperCase() !== selectedStatus.toUpperCase()) return;
      if (!t.pic || t.pic.trim() === "" || t.pic.toUpperCase() === "TANPA PIC") {
        hasUnassignedTask = true;
      } else {
        if (!excludedPicSet || !excludedPicSet.has(t.pic.toLowerCase().trim())) {
          set.add(t.pic.trim());
        }
      }
    });

    if (roleConfig?.allowed_pic && roleConfig.allowed_pic.length > 0) {
      roleConfig.allowed_pic.forEach((p) => {
        if (p === "@unassigned" || p.toLowerCase() === "tanpa pic") {
          hasUnassignedTask = true;
        } else if (!p.startsWith("@")) {
          if (!excludedPicSet || !excludedPicSet.has(p.toLowerCase().trim())) {
            set.add(p);
          }
        }
      });
    }
    const sorted = Array.from(set).sort((a, b) => a.localeCompare(b, "id"));
    const options: FilterOption[] = [
      { value: "ALL", label: "Semua PIC" },
      ...sorted.map((p) => ({ value: p, label: p })),
    ];

    if (hasUnassignedTask) {
      options.push({ value: "Tanpa PIC", label: "Tanpa PIC" });
    }

    return options;
  }, [tasks, selectedBagianFilter, selectedStatus, isBagianAllowedByRole, isPicAllowedByRole, roleConfig]);

  const statusOptions = useMemo<FilterOption[]>(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (!isBagianAllowedByRole(t.bagian, t.source, t.task) || !isPicAllowedByRole(t.pic, t.source, t.task)) return;
      if (selectedBagianFilter !== "ALL" && (t.bagian || "").toUpperCase() !== selectedBagianFilter.toUpperCase()) return;
      if (!isPicMatchingSelection(t.pic, selectedPic)) return;
      if (t.status) set.add(t.status.toUpperCase());
    });
    const allStatuses = ["BELUM DIKERJAKAN", "IN PROGRESS", "CANCEL", "SELESAI"];
    const available = allStatuses.filter((s) => set.has(s));
    return [
      { value: "ALL", label: "Semua Status" },
      ...available.map((s) => ({ value: s, label: s })),
    ];
  }, [tasks, selectedBagianFilter, selectedPic, isBagianAllowedByRole, isPicAllowedByRole, isPicMatchingSelection]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    // Siapkan boundary timestamp untuk filter rentang tanggal
    const startFilterTime = filterStartDate
      ? new Date(filterStartDate.getFullYear(), filterStartDate.getMonth(), filterStartDate.getDate(), 0, 0, 0).getTime()
      : null;
    const endFilterTime = filterEndDate
      ? new Date(filterEndDate.getFullYear(), filterEndDate.getMonth(), filterEndDate.getDate(), 23, 59, 59, 999).getTime()
      : null;

    // Siapkan rentang jam (format string HH:mm langsung bisa dibandingkan leksikografis)
    const hasStartTimeFilter = Boolean(filterStartTime);
    const hasEndTimeFilter = Boolean(filterEndTime);

    return tasks.filter((t) => {
      // Role scope restrictions
      if (!isBagianAllowedByRole(t.bagian, t.source, t.task)) return false;
      if (!isPicAllowedByRole(t.pic, t.source, t.task)) return false;
      if (!isPicMatchingSelection(t.pic, selectedPic)) {
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

      // Filter Rentang Tanggal (berdasarkan startDate / endDate task, atau tglOrder jika placeholder order baru)
      if (startFilterTime !== null || endFilterTime !== null) {
        const taskStartTime = parseDateToSort(t.startDate || "") || (!t.task ? parseDateToSort(t.tglOrder || "") : 0);
        const taskEndTime = parseDateToSort(t.endDate || "") || taskStartTime;

        // Jika task / order tidak memiliki tanggal sama sekali, skip jika filter tanggal aktif
        if (!taskStartTime && !taskEndTime) return false;

        // Cek overlap: task rentang [taskStartTime, taskEndTime] vs filter rentang [startFilterTime, endFilterTime]
        const effectiveTaskStart = taskStartTime || taskEndTime;
        const effectiveTaskEnd = taskEndTime || taskStartTime;

        if (startFilterTime !== null && effectiveTaskEnd < startFilterTime) {
          return false;
        }
        if (endFilterTime !== null && effectiveTaskStart > endFilterTime) {
          return false;
        }
      }

      // Filter Rentang Jam (berdasarkan startTime / endTime task)
      if (hasStartTimeFilter || hasEndTimeFilter) {
        const taskStartT = t.startTime || "";
        const taskEndT = t.endTime || taskStartT;

        if (!taskStartT && !taskEndT) return false;

        const effectiveTaskStartT = taskStartT || taskEndT;
        const effectiveTaskEndT = taskEndT || taskStartT;

        if (hasStartTimeFilter && effectiveTaskEndT < filterStartTime) {
          return false;
        }
        if (hasEndTimeFilter && effectiveTaskStartT > filterEndTime) {
          return false;
        }
      }

      if (deferredSearchTerm) {
        const term = deferredSearchTerm.toLowerCase();
        const matchTask = t.task.toLowerCase().includes(term);
        const matchProj = t.project.toLowerCase().includes(term);
        if (!matchTask && !matchProj) return false;
      }
      return true;
    });
  }, [
    tasks,
    selectedPic,
    selectedBagianFilter,
    selectedStatus,
    filterStartDate,
    filterEndDate,
    filterStartTime,
    filterEndTime,
    deferredSearchTerm,
    isBagianAllowedByRole,
    isPicAllowedByRole,
    isPicMatchingSelection,
  ]);

  // Group filtered tasks by unique project order
  // ponytail: progress dihitung dari SELURUH task order (role-scoped, abaikan filter UI)
  // agar konsisten dengan modal Detail; filter hanya menentukan order mana yang tampil
  const groupedOrders = useMemo(() => {
    const fullMap = new Map<string, { project: string; tglOrder: string; tasks: SpreadsheetTask[] }>();
    tasks.forEach((t) => {
      if (!isBagianAllowedByRole(t.bagian, t.source, t.task)) return;
      if (!isPicAllowedByRole(t.pic, t.source, t.task)) return;
      const proj = t.project || "Tanpa Project Order";
      const entry = fullMap.get(proj);
      if (!entry) {
        fullMap.set(proj, {
          project: proj,
          tglOrder: t.tglOrder || "",
          tasks: t.task ? [t] : [],
        });
      } else {
        if (!entry.tglOrder && t.tglOrder) {
          entry.tglOrder = t.tglOrder;
        }
        if (t.task) {
          entry.tasks.push(t);
        }
      }
    });

    const map = new Map<string, { project: string; tglOrder: string }>();
    filteredTasks.forEach((t) => {
      const proj = t.project || "Tanpa Project Order";
      if (!map.has(proj)) {
        map.set(proj, {
          project: proj,
          tglOrder: t.tglOrder || fullMap.get(proj)?.tglOrder || "",
        });
      } else {
        const group = map.get(proj)!;
        if (!group.tglOrder && t.tglOrder) {
          group.tglOrder = t.tglOrder;
        }
      }
    });

    return Array.from(map.values()).map((g) => {
      const full = fullMap.get(g.project);
      const allTasks = full?.tasks ?? [];
      return {
        project: g.project,
        tglOrder: g.tglOrder || full?.tglOrder || "",
        tasks: allTasks,
        ...summarizeOrderTasks(allTasks, g.project),
      };
    });
  }, [tasks, filteredTasks, isBagianAllowedByRole, isPicAllowedByRole]);

  // Global Sorted Unique Orders
  // ponytail: tanpa sort pun default urut tgl order terbaru dulu, lalu nomor project order terbesar (terbaru) dulu
  const sortedGroupedOrders = useMemo(() => {
    if (!sortField) {
      return [...groupedOrders].sort((a, b) => {
        const tglComp = compareTglOrderDesc(a.tglOrder, b.tglOrder);
        if (tglComp !== 0) return tglComp;
        return compareProjectNaturalDesc(a.project, b.project);
      });
    }
    return [...groupedOrders].sort((a, b) => {
      if (sortField === "tglOrder") {
        const timeA = parseDateToSort(a.tglOrder || "") || 0;
        const timeB = parseDateToSort(b.tglOrder || "") || 0;
        if (!timeA && !timeB) return compareProjectNaturalDesc(a.project, b.project);
        if (!timeA) return 1;
        if (!timeB) return -1;
        const diff = sortOrder === "asc" ? timeA - timeB : timeB - timeA;
        if (diff !== 0) return diff;
        return compareProjectNaturalDesc(a.project, b.project);
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
      } else if (sortField === "note") {
        comp = (a.note || "").localeCompare(
          b.note || "",
          "id",
          { numeric: true }
        );
      } else {
        comp = (a.project || "").localeCompare(b.project || "", "id", {
          numeric: true,
        });
      }
      if (comp !== 0) return sortOrder === "asc" ? comp : -comp;
      // Tie-breaker: urutan dasar tgl order terbaru & nomor project terbesar
      const tglComp = compareTglOrderDesc(a.tglOrder, b.tglOrder);
      if (tglComp !== 0) return tglComp;
      return compareProjectNaturalDesc(a.project, b.project);
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
    // Siapkan boundary timestamp untuk filter rentang tanggal
    const startFilterTime = filterStartDate
      ? new Date(filterStartDate.getFullYear(), filterStartDate.getMonth(), filterStartDate.getDate(), 0, 0, 0).getTime()
      : null;
    const endFilterTime = filterEndDate
      ? new Date(filterEndDate.getFullYear(), filterEndDate.getMonth(), filterEndDate.getDate(), 23, 59, 59, 999).getTime()
      : null;

    const hasStartTimeFilter = Boolean(filterStartTime);
    const hasEndTimeFilter = Boolean(filterEndTime);

    return tasks.filter((t) => {
      if (!t.task) return false;
      if (!isBagianAllowedByRole(t.bagian, t.source, t.task)) return false;
      if (!isPicAllowedByRole(t.pic, t.source, t.task)) return false;
      if (!isPicMatchingSelection(t.pic, selectedPic)) {
        return false;
      }

      // Filter Rentang Tanggal
      if (startFilterTime !== null || endFilterTime !== null) {
        const taskStartTime = parseDateToSort(t.startDate || "");
        const taskEndTime = parseDateToSort(t.endDate || "") || taskStartTime;

        if (!taskStartTime && !taskEndTime) return false;

        const effectiveTaskStart = taskStartTime || taskEndTime;
        const effectiveTaskEnd = taskEndTime || taskStartTime;

        if (startFilterTime !== null && effectiveTaskEnd < startFilterTime) {
          return false;
        }
        if (endFilterTime !== null && effectiveTaskStart > endFilterTime) {
          return false;
        }
      }

      // Filter Rentang Jam
      if (hasStartTimeFilter || hasEndTimeFilter) {
        const taskStartT = t.startTime || "";
        const taskEndT = t.endTime || taskStartT;

        if (!taskStartT && !taskEndT) return false;

        const effectiveTaskStartT = taskStartT || taskEndT;
        const effectiveTaskEndT = taskEndT || taskStartT;

        if (hasStartTimeFilter && effectiveTaskEndT < filterStartTime) {
          return false;
        }
        if (hasEndTimeFilter && effectiveTaskStartT > filterEndTime) {
          return false;
        }
      }

      if (deferredSearchTerm) {
        const term = deferredSearchTerm.toLowerCase();
        const matchTask = t.task.toLowerCase().includes(term);
        const matchProj = t.project.toLowerCase().includes(term);
        if (!matchTask && !matchProj) return false;
      }
      return true;
    });
  }, [
    tasks,
    selectedPic,
    filterStartDate,
    filterEndDate,
    filterStartTime,
    filterEndTime,
    deferredSearchTerm,
    isBagianAllowedByRole,
    isPicAllowedByRole,
    isPicMatchingSelection,
  ]);

  // Counts based on tasksForCounts
  const counts = useMemo(() => {
    const total = tasksForCounts.length;
    let belumDikerjakan = 0;
    let selesai = 0;
    let inProgress = 0;
    let cancel = 0;

    tasksForCounts.forEach((t) => {
      const s = (t.status || "").trim().toUpperCase();
      if (s === "BELUM DIKERJAKAN") belumDikerjakan++;
      else if (s === "SELESAI") selesai++;
      else if (s === "IN PROGRESS" || s === "PENDING") inProgress++;
      else if (s === "CANCEL") cancel++;
    });

    return { total, belumDikerjakan, selesai, inProgress, cancel };
  }, [tasksForCounts]);

  // ponytail: daftar flat pekerjaan lolos filter untuk modal rincian (placeholder order tanpa task dikecualikan);
  // urut kronologis sama seperti modal list pekerjaan (tgl/jam mulai -> selesai -> id; kosong di belakang)
  const detailTasksAll = useMemo(() => filteredTasks.filter((t) => !!t.task).sort(compareTasksChronological), [filteredTasks]);

  // ponytail: lebar kolom modal rincian (mandiri dari tabel utama, tersimpan di localStorage)
  const DETAIL_COL_DEFAULTS = useMemo(() => ({ no: 44, tanggal: 150, jam: 110, project: 220, bagian: 100, pic: 140, task: 220, status: 120, note: 200 }), []);
  const [detailColWidths, setDetailColWidths] = useState<Record<string, number>>(DETAIL_COL_DEFAULTS);
  const detailTableWrapRef = useRef<HTMLDivElement>(null);
  // ponytail: paginasi 100/halaman agar buka modal tetap ringan saat data ribuan (5x lebih sedikit node)
  const DETAIL_PAGE_SIZE = 100;
  const [detailPage, setDetailPage] = useState<number>(1);
  const detailTotalPages = Math.max(1, Math.ceil(detailTasksAll.length / DETAIL_PAGE_SIZE));
  const safeDetailPage = Math.min(detailPage, detailTotalPages);
  const detailPageRows = useMemo(
    () => detailTasksAll.slice((safeDetailPage - 1) * DETAIL_PAGE_SIZE, safeDetailPage * DETAIL_PAGE_SIZE),
    [detailTasksAll, safeDetailPage]
  );

  // Chart Data 1: Breakdown Pekerjaan per Status per PIC (Lazy: hanya dihitung saat accordion terbuka)
  const picChartData = useMemo(() => {
    if (!isAnalyticsOpen) return [];
    const map: Record<
      string,
      { name: string; fullName: string; BelumDikerjakan: number; Selesai: number; InProgress: number; Cancel: number; Total: number }
    > = {};
    filteredTasks.forEach((t) => {
      const rawPic = t.pic ? t.pic.trim() : "Tanpa PIC";
      const picKey = rawPic.toUpperCase();
      if (!map[picKey]) {
        map[picKey] = {
          name: rawPic,
          fullName: rawPic,
          BelumDikerjakan: 0,
          Selesai: 0,
          InProgress: 0,
          Cancel: 0,
          Total: 0,
        };
      }
      map[picKey].Total++;
      const s = (t.status || "").trim().toUpperCase();
      if (s === "BELUM DIKERJAKAN") map[picKey].BelumDikerjakan++;
      else if (s === "SELESAI") map[picKey].Selesai++;
      else if (s === "IN PROGRESS" || s === "PENDING") map[picKey].InProgress++;
      else if (s === "CANCEL") map[picKey].Cancel++;
    });

    const entries = Object.values(map).sort((a, b) => b.Total - a.Total);
    const totalPicCount = entries.length;

    // Auto-truncate adaptif: jika PIC ramai potong nama panggilan agar tidak bertumpuk di mobile
    const maxLen = totalPicCount <= 3 ? 18 : totalPicCount <= 5 ? 12 : totalPicCount <= 7 ? 9 : 7;
    return entries.map((item) => ({
      ...item,
      name: truncatePicName(item.fullName, maxLen),
    }));
  }, [filteredTasks, isAnalyticsOpen]);

  // Chart Data 2: Pie Chart Status (Lazy: hanya dihitung saat accordion terbuka)
  const statusPieData = useMemo(() => {
    if (!isAnalyticsOpen) return [];
    const map: Record<string, number> = {
      "BELUM DIKERJAKAN": 0,
      "IN PROGRESS": 0,
      CANCEL: 0,
      SELESAI: 0,
    };
    filteredTasks.forEach((t) => {
      let s = (t.status || "").trim().toUpperCase();
      if (s === "PENDING") s = "IN PROGRESS";
      if (map[s] !== undefined) map[s]++;
    });

    return Object.keys(map).map((k) => ({
      name: k,
      value: map[k],
      color: STATUS_COLORS[k] || "#94a3b8",
    }));
  }, [filteredTasks, isAnalyticsOpen]);

  // Resizable columns state with localStorage persistence
  const DEFAULT_COL_WIDTHS = useMemo(
    () => ({
      aksi: 130,
      tglOrder: 165,
      project: 450,
      progress: 140,
      terakhir: 200,
      selanjutnya: 200,
      note: 200,
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

  // ponytail: muat + terapkan lebar kolom modal rincian (efek terpisah agar tidak mengaduk tabel utama)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("laporan_pekerjaan_detail_col_widths");
      if (saved) {
        setDetailColWidths((prev) => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  useEffect(() => {
    if (!showFilterDetailModal) return;
    const container = detailTableWrapRef.current;
    if (!container) return;
    Object.entries(detailColWidths).forEach(([f, w]) => {
      container.style.setProperty(`--dcol-${f}`, `${w}px`);
    });
    applyTableWidth(detailColWidths, container);
  }, [showFilterDetailModal, detailColWidths]);

  // ponytail: 1 fungsi resize dipakai tabel utama + modal rincian (beda state/ref/prefix var/storage key)
  const handleResizeStart = (
    field: string,
    e: React.MouseEvent<HTMLDivElement>,
    opts?: {
      widths: Record<string, number>;
      setWidths: React.Dispatch<React.SetStateAction<Record<string, number>>>;
      getContainer: () => HTMLDivElement | null;
      varPrefix: string;
      storageKey: string;
      minWidth?: number;
    }
  ) => {
    e.stopPropagation();
    e.preventDefault();
    isResizingRef.current = true;

    const widths = opts?.widths ?? colWidths;
    const setWidths = opts?.setWidths ?? setColWidths;
    const getContainer = opts?.getContainer ?? (() => tableContainerRef.current);
    const varPrefix = opts?.varPrefix ?? "col";
    const storageKey = opts?.storageKey ?? "laporan_pekerjaan_col_widths";
    const minW = opts?.minWidth ?? 60;

    const startX = e.clientX;
    const startWidth = widths[field] || 100;
    let finalWidth = startWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      finalWidth = Math.max(minW, startWidth + delta);
      const container = getContainer();
      if (container) {
        container.style.setProperty(
          `--${varPrefix}-${field}`,
          `${finalWidth}px`
        );
        applyTableWidth(
          { ...widths, [field]: finalWidth },
          container
        );
      }
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      setWidths((prev) => {
        const updated = { ...prev, [field]: finalWidth };
        try {
          localStorage.setItem(
            storageKey,
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

  // ponytail: header kolom modal rincian (resize + tooltip), 1 helper untuk 9 kolom
  const renderDetailTh = (field: string, label: string, className = "") => (
    <th
      style={{
        width: `var(--dcol-${field}, ${detailColWidths[field] || 100}px)`,
        minWidth: `var(--dcol-${field}, ${detailColWidths[field] || 100}px)`,
      }}
      className={`relative px-2 py-2.5 bg-slate-50 group ${className}`}
      title={label}
    >
      <span className="block truncate">{label}</span>
      <div
        onMouseDown={(resizeEvt) =>
          handleResizeStart(field, resizeEvt, {
            widths: detailColWidths,
            setWidths: setDetailColWidths,
            getContainer: () => detailTableWrapRef.current,
            varPrefix: "dcol",
            storageKey: "laporan_pekerjaan_detail_col_widths",
            minWidth: 40,
          })
        }
        onClick={(resizeEvt) => resizeEvt.stopPropagation()}
        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-emerald-500/50 active:bg-emerald-600 z-20 group-hover:bg-slate-300/80 transition-colors"
        title="Geser untuk mengatur lebar kolom"
      />
    </th>
  );

  return (
    <div
      ref={clientContainerRef}
      className={`text-slate-800 flex-1 min-h-0 flex flex-col gap-3 laporan-pekerjaan-client-root ${
        isAnalyticsOpen ? "overflow-y-auto pb-16" : "overflow-hidden"
      }`}
    >
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
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
              {/* Total Task (span 2 pada mobile agar layout simetris rapi) */}
              <div
                onClick={() => handleCardStatusClick("ALL")}
                className={`col-span-2 sm:col-span-1 p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer select-none hover:shadow-md ${
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

            {/* Visualisasi Dashboard Recharts (lazy: recharts diunduh hanya saat panel dibuka) */}
            <LaporanPekerjaanCharts
              picChartData={picChartData}
              statusPieData={statusPieData}
              loading={loading}
            />
          </div>
        )}
      </div>

      {/* Filter & Search Bar (Bisa Collapse/Expand di Mobile, Selalu Terbuka di Desktop) */}
      <div className="shrink-0 bg-white rounded-xl border border-slate-200/80 shadow-sm transition-all">
        {/* Toggle Bar Khusus Layar Mobile (<sm) */}
        <div className="sm:hidden flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50/70 hover:bg-slate-100/80 transition-colors rounded-t-xl">
          <button
            type="button"
            onClick={toggleFilterMobile}
            className="flex items-center space-x-2 text-xs font-bold text-slate-800 hover:text-emerald-700 transition-colors focus:outline-none flex-1 text-left min-w-0"
          >
            <Filter className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-[11px] sm:text-xs font-bold text-slate-800 truncate">Pencarian & Filter</span>
            {(selectedBagianFilter !== "ALL" ||
              selectedPic !== "ALL" ||
              selectedStatus !== "ALL" ||
              searchTerm !== "" ||
              filterStartDate !== null ||
              filterEndDate !== null ||
              filterStartTime !== "" ||
              filterEndTime !== "") && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Filter aktif" />
            )}
            <div className="flex items-center space-x-1.5 text-slate-500 text-[10.5px] font-medium ml-auto pr-2 shrink-0">
              <span>{isFilterOpenMobile ? "Sembunyikan" : "Tampilkan"}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200 ${
                  isFilterOpenMobile ? "rotate-180" : ""
                }`}
              />
            </div>
          </button>

          {/* Tombol Tambah Order Cepat di Header Mobile */}
          {roleConfig?.can_add !== false && (
            <button
              type="button"
              onClick={() => {
                setNewOrderProject("");
                setNewOrderTgl(new Date());
                setShowAddOrderModal(true);
              }}
              className="h-7 px-2.5 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-xs ml-1"
              title="Input Order Produksi Manual"
            >
              <Plus size={13} />
              <span>Tambah</span>
            </button>
          )}
        </div>

        {/* Content Toolbar (Search & Filter Inputs) */}
        <div
          className={`${
            isFilterOpenMobile ? "flex flex-col" : "hidden sm:flex sm:flex-col"
          } p-3.5 sm:p-3 space-y-3 sm:space-y-0 gap-0 sm:gap-2.5 border-t border-slate-100 sm:border-t-0 animate-in fade-in slide-in-from-top-1 duration-200`}
        >
          {/* Baris 1: Search & Reload */}
          <div className="flex items-center gap-2 w-full">
            {/* Tombol Reload Data */}
            <button
              type="button"
              onClick={() => refetchWithCurrentRange(true)}
              disabled={loading || isRangeLoading}
              className="h-9 px-3 text-xs font-bold text-slate-700 hover:text-emerald-800 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer shadow-sm"
              title="Reload Data Laporan Pekerjaan"
            >
              <RefreshCw className={`w-4 h-4 ${loading || isRangeLoading ? "animate-spin text-emerald-600" : ""}`} />
              <span className="hidden sm:inline">Reload</span>
            </button>
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kata kunci task atau nomor OP (misal: OP.007)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 h-9 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
              />
            </div>

            {/* Tombol Tambah Order Baru Manual di Baris 1 Kanan (Khusus Layar Desktop/Tablet) */}
            {roleConfig?.can_add !== false && (
              <button
                type="button"
                onClick={() => {
                  setNewOrderProject("");
                  setNewOrderTgl(new Date());
                  setShowAddOrderModal(true);
                }}
                className="hidden sm:flex h-9 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
                title="Input Order Produksi Manual"
              >
                <Plus size={15} />
                <span>Tambah Order</span>
              </button>
            )}
          </div>
          {/* Baris 2: Controls Filter (Tanggal, Jam, Dropdown, Reset) */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:pt-2 sm:border-t sm:border-slate-100">
            <div className="hidden sm:flex items-center text-xs text-slate-500 font-medium shrink-0">
              <Filter className="w-3.5 h-3.5 mr-1 text-slate-400" /> Filter:
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-1.5 w-full sm:w-auto">
              {/* Filter Rentang Tanggal (Task) */}
              <div className="flex items-center justify-between gap-1 bg-slate-50 p-1 sm:p-0.5 rounded-lg border border-slate-200 min-w-0">
                <div className="flex-1 min-w-0">
                  <DatePicker
                    name="filterStartDate"
                    value={filterStartDate}
                    onChange={(d) => setFilterStartDate(d)}
                    popupAlign="left"
                    customTrigger={() => (
                      <div
                        className="h-7 px-1.5 sm:px-2 bg-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-700 hover:text-emerald-700 hover:border-emerald-500 transition-all flex items-center gap-1 shadow-xs cursor-pointer w-full"
                        title={filterStartDate ? `Dari Tgl: ${formatDateDisplay(filterStartDate)}` : "Filter Dari Tgl Task"}
                      >
                        <Calendar size={11} className="text-slate-400 shrink-0" />
                        <span className={`truncate ${!filterStartDate ? "text-slate-400 font-normal" : ""}`}>
                          {filterStartDate ? formatDateDisplay(filterStartDate) : "Dari Tgl"}
                        </span>
                      </div>
                    )}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-bold px-0.5 shrink-0">-</span>
                <div className="flex-1 min-w-0">
                  <DatePicker
                    name="filterEndDate"
                    value={filterEndDate}
                    onChange={(d) => setFilterEndDate(d)}
                    popupAlign="left"
                    customTrigger={() => (
                      <div
                        className="h-7 px-1.5 sm:px-2 bg-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-700 hover:text-emerald-700 hover:border-emerald-500 transition-all flex items-center gap-1 shadow-xs cursor-pointer w-full"
                        title={filterEndDate ? `Sampai Tgl: ${formatDateDisplay(filterEndDate)}` : "Filter Sampai Tgl Task"}
                      >
                        <Calendar size={11} className="text-slate-400 shrink-0" />
                        <span className={`truncate ${!filterEndDate ? "text-slate-400 font-normal" : ""}`}>
                          {filterEndDate ? formatDateDisplay(filterEndDate) : "Sampai Tgl"}
                        </span>
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* Filter Rentang Jam (Task) */}
              <div className="flex items-center justify-between gap-1 bg-slate-50 p-1 sm:p-0.5 rounded-lg border border-slate-200 min-w-0">
                <div className="flex-1 min-w-0">
                  <TimePicker
                    name="filterStartTime"
                    value={filterStartTime}
                    onChange={(val) => setFilterStartTime(val)}
                    popupAlign="left"
                    customTrigger={() => (
                      <div
                        className="h-7 px-1.5 sm:px-2 bg-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-700 hover:text-emerald-700 hover:border-emerald-500 transition-all flex items-center gap-1 shadow-xs cursor-pointer w-full"
                        title={filterStartTime ? `Dari Jam: ${filterStartTime}` : "Filter Dari Jam Task"}
                      >
                        <Clock size={11} className="text-slate-400 shrink-0" />
                        <span className={`truncate ${!filterStartTime ? "text-slate-400 font-normal" : ""}`}>
                          {filterStartTime || "Dari Jam"}
                        </span>
                      </div>
                    )}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-bold px-0.5 shrink-0">-</span>
                <div className="flex-1 min-w-0">
                  <TimePicker
                    name="filterEndTime"
                    value={filterEndTime}
                    onChange={(val) => setFilterEndTime(val)}
                    popupAlign="left"
                    customTrigger={() => (
                      <div
                        className="h-7 px-1.5 sm:px-2 bg-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-700 hover:text-emerald-700 hover:border-emerald-500 transition-all flex items-center gap-1 shadow-xs cursor-pointer w-full"
                        title={filterEndTime ? `Sampai Jam: ${filterEndTime}` : "Filter Sampai Jam Task"}
                      >
                        <Clock size={11} className="text-slate-400 shrink-0" />
                        <span className={`truncate ${!filterEndTime ? "text-slate-400 font-normal" : ""}`}>
                          {filterEndTime || "Sampai Jam"}
                        </span>
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Baris Filter Bagian (Melar di Mobile Landscape via laporan-pekerjaan-filter-stretch, tetap compact di Desktop) */}
            {showBagianFilter && (
              <div className="w-full sm:w-auto laporan-pekerjaan-filter-stretch">
                <SquareDropdown
                  options={bagianOptions}
                  value={selectedBagianFilter}
                  onChange={setSelectedBagianFilter}
                  searchPlaceholder="Cari Bagian..."
                  widthClass="w-full sm:w-28 md:w-32 lg:w-36"
                />
              </div>
            )}

            {/* Baris Filter PIC & Status: 1 Row 50-50 di Mobile Portrait, PIC melar di Mobile Landscape */}
            <div className="grid grid-cols-2 gap-2 sm:contents w-full sm:w-auto">
              {showPicFilter && (
                <div className="w-full sm:w-auto laporan-pekerjaan-filter-stretch">
                  <SquareDropdown
                    options={picOptions}
                    value={selectedPic}
                    onChange={setSelectedPic}
                    searchPlaceholder="Cari PIC..."
                    widthClass="w-full sm:w-28 md:w-32 lg:w-36"
                  />
                </div>
              )}
              <div className="w-full sm:w-auto">
                <SquareDropdown
                  options={statusOptions}
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  searchPlaceholder="Cari Status..."
                  widthClass="w-full sm:w-28 md:w-32 lg:w-36"
                />
              </div>
            </div>

            {/* Pengatur Ukuran Font Tabel Utama (Desktop) */}
            <FontSizeControl
              value={tableFontSize}
              onChange={changeTableFontSize}
              className="hidden sm:flex"
            />

            {/* Tombol Reset Filter: 100% penuh di baris bawah pada Mobile, auto di Desktop */}
            {(selectedBagianFilter !== "ALL" ||
              selectedPic !== "ALL" ||
              selectedStatus !== "ALL" ||
              searchTerm !== "" ||
              filterStartDate !== null ||
              filterEndDate !== null ||
              filterStartTime !== "" ||
              filterEndTime !== "" ||
              tableFontSize !== 12) && (
              <div className="w-full sm:w-auto flex items-center shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBagianFilter("ALL");
                    setSelectedPic("ALL");
                    setSelectedStatus("ALL");
                    setSearchTerm("");
                    setFilterStartDate(null);
                    setFilterEndDate(null);
                    setFilterStartTime("");
                    setFilterEndTime("");
                    changeTableFontSize(12);
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-1 px-3 h-8 text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors shrink-0 cursor-pointer shadow-xs"
                  title="Reset Semua Filter & Ukuran Font"
                >
                  <X size={12} /> Reset
                </button>
              </div>
            )}
            {/* Tombol Rincian Pekerjaan sesuai filter aktif */}
            <div className="w-full sm:w-auto flex items-center shrink-0">
              <button
                type="button"
                onClick={() => { setDetailPage(1); setShowFilterDetailModal(true); }}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 h-8 text-[11px] font-bold text-slate-700 hover:text-emerald-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all shrink-0 cursor-pointer shadow-xs"
                title="Lihat rincian pekerjaan sesuai filter aktif"
              >
                <Eye className="w-3.5 h-3.5" />
                Detail
                <span className="px-1.5 py-0.5 text-[10px] font-black bg-emerald-100 text-emerald-700 rounded-full">
                  {detailTasksAll.length}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
      {error && (
        <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Tabel Data Pekerjaan (Desktop & Tablet) / Card View (HP) */}
      <div
        className={`bg-white rounded-xl border border-slate-200/80 shadow-sm relative laporan-pekerjaan-table-card ${
          isAnalyticsOpen
            ? "shrink-0 min-h-[300px]"
            : "flex-1 min-h-0 flex flex-col overflow-hidden"
        }`}
      >
        {/* Cloned Fixed Header untuk Mobile Landscape (tanpa Portal, sinkron via translateX) */}
        {showFixedLandscapeHeader && (
          <div
            className="hidden sm:block fixed z-40 overflow-hidden shadow-sm bg-slate-50 border-b border-slate-200 pointer-events-none select-none"
            style={{ top: fixedHeaderTop, left: fixedHeaderRect.left, width: fixedHeaderRect.width }}
          >
            <table
              ref={fixedHeaderTableRef}
              className="text-left border-collapse table-fixed"
              style={{
                fontSize: `${tableFontSize}px`,
                width: tableContainerRef.current?.querySelector("table")?.offsetWidth
                  ? `${tableContainerRef.current.querySelector("table")!.offsetWidth}px`
                  : "100%",
                "--col-aksi": `${colWidths.aksi || 110}px`,
                "--col-tglOrder": `${colWidths.tglOrder || 150}px`,
                "--col-project": `${colWidths.project || 450}px`,
                "--col-progress": `${colWidths.progress || 140}px`,
                "--col-terakhir": `${colWidths.terakhir || 200}px`,
                "--col-selanjutnya": `${colWidths.selanjutnya || 200}px`,
                "--col-note": `${colWidths.note || 200}px`,
              } as React.CSSProperties}
            >
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 shadow-sm">
                <tr className="bg-slate-50">
                  <th style={{ width: "var(--col-aksi, 130px)", minWidth: "var(--col-aksi, 130px)" }} className="relative px-3 py-2.5 text-center bg-slate-50 border-b border-slate-200 select-none group">
                    <span className="truncate">Aksi</span>
                  </th>
                  {renderSortableHeader("tglOrder", "Tanggal Order", false, false)}
                  {renderSortableHeader("project", "Project Order")}
                  {renderSortableHeader("progress", "Progress")}
                  {renderSortableHeader("terakhir", "Pekerjaan Terakhir")}
                  {renderSortableHeader("selanjutnya", "Pekerjaan Selanjutnya")}
                  {renderSortableHeader("note", "Note")}
                  <th className="px-0" aria-hidden />
                </tr>
              </thead>
            </table>
          </div>
        )}
        {/* Tampilan Card khusus Layar Kecil (Mobile) */}
        <div className="block sm:hidden divide-y divide-slate-100 p-3 space-y-3 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
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
              const accent = getOrderStatusAccent(group);

              return (
                <div
                  key={idx}
                  className={`${accent.rowBg} p-3.5 rounded-xl border border-slate-200/80 ${accent.borderAccent} hover:border-slate-300 transition-all select-none space-y-2.5`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-800 leading-snug min-w-0 flex-1 break-words">
                      {group.project}
                    </h4>
                    <span className={`shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-md border ${accent.badge.bg}`}>
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
                      <span className="font-bold text-slate-700">{group.progressPct}%</span>
                    </div>
                    <div className="h-2 bg-slate-200/70 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${accent.barColor}`}
                        style={{ width: `${group.progressPct}%` }}
                      />
                    </div>
                  </div>

                  {(group.pekerjaanTerakhir || group.pekerjaanSelanjutnya || (group.note && group.note !== "-")) && (
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
                      {group.note && group.note !== "-" && (
                        <div className="flex gap-2">
                          <span className="text-slate-400 shrink-0 w-20">Note</span>
                          <span className="font-normal text-slate-600 min-w-0 break-words whitespace-pre-wrap">
                            {group.note}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedProjectGroup(group)}
                      className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Eye size={13} />
                      Detail
                    </button>
                    {((roleConfig?.delete_scope === 'all' || roleConfig?.delete_scope === 'table_only') || (!roleConfig?.delete_scope && roleConfig?.can_delete !== false)) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteOrder(group.project);
                        }}
                        className="p-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors flex items-center justify-center cursor-pointer shadow-sm"
                        title="Hapus Order & Semua Pekerjaannya"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Tampilan Tabel khusus Tablet & Desktop */}
        <div
          ref={tableContainerRef}
          onScroll={(e) => { fixedHeaderTableRef.current?.style.setProperty("transform", `translateX(-${e.currentTarget.scrollLeft}px)`); }}
          className={`hidden sm:block overflow-x-auto overflow-y-auto custom-scrollbar transition-all duration-200 laporan-pekerjaan-table-container ${
            isAnalyticsOpen
              ? "max-h-[300px] sm:max-h-[480px] shrink-0"
              : "flex-1 min-h-0 h-full"
          }`}
          style={
            {
              "--col-aksi": `${colWidths.aksi || 110}px`,
              "--col-tglOrder": `${colWidths.tglOrder || 150}px`,
              "--col-project": `${colWidths.project || 450}px`,
              "--col-progress": `${colWidths.progress || 140}px`,
              "--col-terakhir": `${colWidths.terakhir || 200}px`,
              "--col-selanjutnya": `${colWidths.selanjutnya || 200}px`,
              "--col-note": `${colWidths.note || 200}px`,
            } as React.CSSProperties
          }
        >
          <table
            className="text-left border-collapse table-fixed"
            style={{ fontSize: `${tableFontSize}px` }}
          >

            <thead ref={tableTheadRef} className="sticky top-0 z-20 bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 shadow-sm">
              <tr className="bg-slate-50">
                <th
                  style={{ width: "var(--col-aksi, 130px)", minWidth: "var(--col-aksi, 130px)" }}
                  className="relative px-3 py-2.5 text-center bg-slate-50 sticky top-0 z-10 border-b border-slate-200 select-none group"
                >
                  <span className="truncate">Aksi</span>
                </th>
                {renderSortableHeader("tglOrder", "Tanggal Order", false, false)}
                {renderSortableHeader("project", "Project Order")}
                {renderSortableHeader("progress", "Progress")}
                {renderSortableHeader("terakhir", "Pekerjaan Terakhir")}
                {renderSortableHeader("selanjutnya", "Pekerjaan Selanjutnya")}
                {renderSortableHeader("note", "Note")}
                {/* Spacer: menyerap sisa lebar tabel agar resize tidak menggeser kolom lain */}
                <th className="px-0" aria-hidden />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-16 text-center text-slate-400"
                  >
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    Memuat data laporan pekerjaan...
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-16 text-center text-slate-400"
                  >
                    Tidak ada data order pekerjaan yang ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((group, idx) => {
                  const isSelected = selectedRowIndex === idx;
                  const accent = getOrderStatusAccent(group);
                  return (
                    <tr
                      key={idx}
                      onClick={() =>
                        setSelectedRowIndex((prev) => (prev === idx ? null : idx))
                      }
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? `${accent.selectedBg} font-semibold`
                          : `${accent.rowBg} ${accent.rowHover}`
                      }`}
                    >
                      <td
                        style={{
                          width: "var(--col-aksi)",
                          maxWidth: "var(--col-aksi)",
                        }}
                        className={`px-2 py-2.5 text-center truncate ${accent.borderAccent}`}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProjectGroup(group);
                            }}
                            className="px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                            title="Lihat Detail Task Order"
                          >
                            <Eye size={13} />
                            Detail
                          </button>
                          {((roleConfig?.delete_scope === 'all' || roleConfig?.delete_scope === 'table_only') || (!roleConfig?.delete_scope && roleConfig?.can_delete !== false)) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteOrder(group.project);
                              }}
                              className="p-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors flex items-center justify-center cursor-pointer shadow-sm"
                              title="Hapus Order & Semua Pekerjaannya"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
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
                          isSelected ? "text-slate-950 font-bold" : "font-semibold text-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="truncate">{group.project}</span>
                          <span
                            className={`shrink-0 font-normal px-2 py-0.5 rounded-full border ${accent.badge.bg}`}
                            style={{ fontSize: `${Math.max(9, Math.round(tableFontSize * 0.88))}px` }}
                          >
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
                              className={`h-full rounded-full transition-all ${accent.barColor}`}
                              style={{ width: `${group.progressPct}%` }}
                            />
                          </div>
                          <span
                            className="shrink-0 font-bold text-slate-600 w-9 text-right"
                            style={{ fontSize: `${Math.max(9, Math.round(tableFontSize * 0.92))}px` }}
                          >
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
                      <td
                        title={group.note}
                        style={{
                          width: "var(--col-note)",
                          maxWidth: "var(--col-note)",
                        }}
                        className="px-3 py-2.5 truncate text-slate-600"
                      >
                        {group.note || "-"}
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

      {/* Modal Rincian Pekerjaan sesuai filter aktif */}
      {showFilterDetailModal && (
        <Portal>
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowFilterDetailModal(false)}
          >
            <div
              className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[88vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-slate-50/80 shrink-0 gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-slate-800 truncate">
                    Rincian Pekerjaan{" "}
                    <span className="text-xs font-semibold text-slate-500">
                      ({detailTasksAll.length} task lolos filter)
                    </span>
                  </h3>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {selectedBagianFilter !== "ALL" && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-white text-slate-600 border border-slate-200 rounded-md">Bagian: {selectedBagianFilter}</span>
                    )}
                    {selectedPic !== "ALL" && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-white text-slate-600 border border-slate-200 rounded-md">PIC: {selectedPic}</span>
                    )}
                    {selectedStatus !== "ALL" && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-white text-slate-600 border border-slate-200 rounded-md">Status: {selectedStatus}</span>
                    )}
                    {deferredSearchTerm && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-white text-slate-600 border border-slate-200 rounded-md">Cari: {deferredSearchTerm}</span>
                    )}
                    {(filterStartDate || filterEndDate) && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-white text-slate-600 border border-slate-200 rounded-md">
                        Tgl: {filterStartDate ? formatDateDisplay(filterStartDate) : "…"} - {filterEndDate ? formatDateDisplay(filterEndDate) : "…"}
                      </span>
                    )}
                    {selectedBagianFilter === "ALL" && selectedPic === "ALL" && selectedStatus === "ALL" && !deferredSearchTerm && !filterStartDate && !filterEndDate && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-white text-slate-400 border border-slate-200 rounded-md">Tanpa filter (semua data)</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFilterDetailModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all cursor-pointer shrink-0"
                  title="Tutup Modal"
                >
                  <X size={18} />
                </button>
              </div>
              {/* Body */}
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden p-3 sm:p-4">
                <div ref={detailTableWrapRef} className="flex-1 min-h-0 border border-slate-200 rounded-xl overflow-x-auto overflow-y-auto bg-white">
                <table className="w-full text-left border-collapse" style={{ fontSize: tableFontSize }}>
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 sticky top-0 z-10 shadow-xs">
                    <tr className="bg-slate-50">
                      {renderDetailTh("no", "No", "text-center")}
                      {renderDetailTh("tanggal", "Tanggal")}
                      {renderDetailTh("jam", "Jam")}
                      {renderDetailTh("project", "Project / Order")}
                      {renderDetailTh("bagian", "Bagian")}
                      {renderDetailTh("pic", "PIC")}
                      {renderDetailTh("task", "Task / Aktivitas")}
                      {renderDetailTh("status", "Status")}
                      {renderDetailTh("note", "Note")}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                    {detailTasksAll.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-2 py-8 text-center text-slate-400">
                          Tidak ada pekerjaan yang lolos filter saat ini.
                        </td>
                      </tr>
                    ) : (
                      detailPageRows.map((t, idx) => (
                        <tr key={t.id || idx} className="hover:bg-slate-50/70">
                          <td className="px-2 py-1.5 text-center text-slate-400">{(safeDetailPage - 1) * DETAIL_PAGE_SIZE + idx + 1}</td>
                          <td className="px-2 py-1.5 whitespace-nowrap text-slate-500">
                            {t.startDate || t.endDate
                              ? `${t.startDate ? formatDateDisplay(t.startDate) : "-"}${t.endDate && t.endDate !== t.startDate ? ` ~ ${formatDateDisplay(t.endDate)}` : ""}`
                              : "-"}
                          </td>
                          <td className="px-2 py-1.5 whitespace-nowrap text-slate-500">
                            {t.startTime || t.endTime ? `${t.startTime || "-"} ~ ${t.endTime || "-"}` : "-"}
                          </td>
                          <td className="px-2 py-1.5 font-semibold max-w-[220px] truncate" title={t.project || ""}>{t.project || "-"}</td>
                          <td className="px-2 py-1.5 whitespace-nowrap">{t.bagian || "-"}</td>
                          <td className="px-2 py-1.5 whitespace-nowrap">{t.pic || "-"}</td>
                          <td className="px-2 py-1.5 max-w-[220px] truncate" title={t.task || ""}>{cleanTaskName(t.task || "", t.project || "")}</td>
                          <td className="px-2 py-1.5 whitespace-nowrap">{getStatusBadge(t.status)}</td>
                          <td className="px-2 py-1.5 max-w-[200px] truncate text-slate-500" title={t.note || ""}>{t.note || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                </div>
              </div>
              {/* Footer */}
              <div className="flex flex-wrap items-center justify-between px-4 sm:px-5 py-3 border-t border-slate-100 shrink-0 gap-2">
                <span className="text-xs text-slate-500">
                  {detailTasksAll.length === 0
                    ? "0 task"
                    : `${(safeDetailPage - 1) * DETAIL_PAGE_SIZE + 1}–${Math.min(safeDetailPage * DETAIL_PAGE_SIZE, detailTasksAll.length)} dari ${detailTasksAll.length} task`}
                </span>
                {detailTotalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={safeDetailPage <= 1}
                      onClick={() => { setDetailPage(safeDetailPage - 1); detailTableWrapRef.current?.scrollTo({ top: 0 }); }}
                      className="h-7 px-2 text-[11px] font-bold text-slate-600 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-all flex items-center gap-0.5 cursor-pointer disabled:opacity-40 disabled:cursor-default"
                      title="Halaman sebelumnya"
                    >
                      <ChevronLeft size={13} /> Prev
                    </button>
                    <span className="text-[11px] font-bold text-slate-500">
                      {safeDetailPage} / {detailTotalPages}
                    </span>
                    <button
                      type="button"
                      disabled={safeDetailPage >= detailTotalPages}
                      onClick={() => { setDetailPage(safeDetailPage + 1); detailTableWrapRef.current?.scrollTo({ top: 0 }); }}
                      className="h-7 px-2 text-[11px] font-bold text-slate-600 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-all flex items-center gap-0.5 cursor-pointer disabled:opacity-40 disabled:cursor-default"
                      title="Halaman berikutnya"
                    >
                      Next <ChevronRight size={13} />
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowFilterDetailModal(false)}
                  className="px-4 py-1.5 text-xs font-bold text-slate-600 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-all cursor-pointer"
                >
                  Tutup
                </button>
              </div>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 shrink-0 rounded-b-2xl">
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
                  className="px-5 py-2.5 text-[13px] font-bold text-gray-500 hover:text-gray-700 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 transition-all text-center"
                >
                  Skip
                </button>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
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
                        await refetchWithCurrentRange();
                      }
                    }}
                    className="px-6 py-2.5 text-[13px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
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
                            await refetchWithCurrentRange();
                          }
                        } else {
                          alert(json.error || 'Gagal update data');
                        }
                      } catch (err: any) {
                        alert(err.message || 'Terjadi kesalahan');
                      }
                    }}
                    className="px-6 py-2.5 text-[13px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
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

      {/* Modal Tambah Order Manual */}
      {showAddOrderModal && (
        <Portal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                    <Plus size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Tambah Order Produksi</h3>
                    <p className="text-[11px] text-slate-500">Input order manual ke Laporan Pekerjaan</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddOrderModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateOrderManual} className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Order / Project <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Buku Panduan, Box Kemasan, dll"
                    value={newOrderProject}
                    onChange={(e) => setNewOrderProject(e.target.value)}
                    autoFocus
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tanggal Order
                  </label>
                  <div className="relative">
                    <DatePicker
                      name="new_order_tgl"
                      value={newOrderTgl}
                      onChange={(d) => setNewOrderTgl(d)}
                      popupAlign="left"
                      usePortal={true}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddOrderModal(false)}
                    disabled={isSubmittingOrder}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingOrder || !newOrderProject.trim()}
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSubmittingOrder ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save size={14} />
                        Simpan Order
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal Detail Task Order (Isolated Component untuk performa 60 FPS tanpa lag render) */}
      {selectedProjectGroup && (
        <TaskDetailModal
          selectedProjectGroup={{
            project: selectedProjectGroup.project,
            tglOrder: selectedProjectGroup.tglOrder || "",
            // Ambil seluruh task lengkap dari database tasks untuk project ini agar semua status tetap muncul di modal
            tasks: tasks.filter((t) => (t.project || "Tanpa Project Order") === selectedProjectGroup.project && !!t.task),
          }}
          fontSize={tableFontSize}
          onClose={() => setSelectedProjectGroup(null)}
          employeeOptions={employeeOptions}
          onSaveTask={handleSaveInlineEdit}
          onCreateTask={handleCreateInlineTask}
          onDeleteTask={handleDeleteInlineTask}
          onReorder={handleReorderInlineTasks}
          roleConfig={roleConfig}
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

const pekerjaanCategoryCache = new Map<string, string[]>();

const fetchPekerjaanForCategory = async (bagian: string): Promise<string[]> => {
  if (!bagian) return [];
  const category = BAGIAN_CATEGORY_MAP[bagian];
  if (!category) return [];

  const cached = pekerjaanCategoryCache.get(category);
  if (cached !== undefined) return cached;

  try {
    const res = await fetch(
      `/api/master-pekerjaan-jurnal-produksi?category=${encodeURIComponent(category)}&all=true`
    );
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      const list = json.data.filter((p: any) => p.name).map((p: any) => p.name);
      pekerjaanCategoryCache.set(category, list);
      return list;
    }
  } catch (err) {
    console.error("Gagal fetch pekerjaan:", err);
  }
  return [];
};

function TaskDetailModal({
  selectedProjectGroup,
  fontSize,
  onClose,
  employeeOptions,
  onSaveTask,
  onCreateTask,
  onDeleteTask,
  onReorder,
  roleConfig,
}: {
  selectedProjectGroup: {
    project: string;
    tglOrder: string;
    tasks: SpreadsheetTask[];
  };
  fontSize?: number;
  onClose: () => void;
  employeeOptions: any[];
  onSaveTask: (taskId: number, data: any) => Promise<void>;
  onCreateTask: (data: any) => Promise<void>;
  onDeleteTask: (taskId: number) => Promise<void>;
  onReorder: (project: string, orderedIds: number[]) => Promise<void>;
  roleConfig?: RoleLaporanPekerjaanConfig;
}) {
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [isAddingTask, setIsAddingTask] = useState<boolean>(false);
  const [dragId, setDragId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);

  // Column visibility & min width (px) agar form input dan tanggal/jam tidak gepeng di layar sempit/tablet
  const COLUMN_MIN_WIDTHS: Record<string, number> = {
    no: 56,
    bagian: 140,
    pic: 150,
    task: 200,
    priority: 100,
    start_end: 175,
    work_days: 75,
    status: 150,
    note: 160,
    aksi: 65,
  };

  const canAdd = roleConfig?.can_add !== false;
  const canEdit = roleConfig?.can_edit !== false;
  const canDeleteInCard = (roleConfig?.delete_scope === 'all' || roleConfig?.delete_scope === 'card_only') || (!roleConfig?.delete_scope && roleConfig?.can_delete !== false);
  const hasRowAction = canEdit || canDeleteInCard;
  const visibleColKeys = useMemo(() => {
    if (!roleConfig?.visible_columns || roleConfig.visible_columns.length === 0) {
      return LAPORAN_PEKERJAAN_COLUMNS.map((c) => c.key);
    }
    return roleConfig.visible_columns;
  }, [roleConfig]);

  const isColVisible = useCallback(
    (key: string) => {
      if (key === 'aksi') {
        return hasRowAction;
      }
      return visibleColKeys.includes(key as any);
    },
    [visibleColKeys, hasRowAction]
  );

  const activeColumns = useMemo(() => {
    const list: Array<{ key: string; label: string }> = LAPORAN_PEKERJAAN_COLUMNS.filter((c) => isColVisible(c.key));
    if (hasRowAction) {
      list.push({ key: 'aksi', label: 'Aksi' });
    }
    return list.map((c) => ({
      ...c,
      minWidth: `${COLUMN_MIN_WIDTHS[c.key] || 100}px`,
    }));
  }, [isColVisible, hasRowAction]);

  // Filter tasks in modal by role allowed Bagian and PIC
  const sortedTasks = useMemo(() => {
    return [...selectedProjectGroup.tasks]
      .filter((t) => {
        if (roleConfig?.allowed_bagian && roleConfig.allowed_bagian.length > 0) {
          if (!t.bagian || !roleConfig.allowed_bagian.map((b) => b.toUpperCase()).includes(t.bagian.toUpperCase())) {
            return false;
          }
        }
        if (t.pic && roleConfig?.excluded_pic && roleConfig.excluded_pic.length > 0) {
          const isExcluded = roleConfig.excluded_pic.some(
            (p) => p.toLowerCase().trim() === t.pic.toLowerCase().trim()
          );
          if (isExcluded) return false;
        }
        if (roleConfig?.allowed_pic && roleConfig.allowed_pic.length > 0) {
          const hasUnassignedAllowed = roleConfig.allowed_pic.some(
            (p) => p === "@unassigned" || p.toLowerCase() === "tanpa pic"
          );
          if (!t.pic || t.pic.trim() === "") {
            if (!hasUnassignedAllowed) return false;
          } else if (!roleConfig.allowed_pic.map((p) => p.toLowerCase()).includes(t.pic.toLowerCase())) {
            return false;
          }
        }
        return true;
      })
      .sort(compareTasksDisplay);
  }, [selectedProjectGroup.tasks, roleConfig]);

  const hasManualOrder = useMemo(
    () => sortedTasks.some((t) => getSortOrderValue(t) > 0),
    [sortedTasks]
  );

  // ponytail: reorder lokal lalu persist via onReorder (optimistic sudah di parent)
  const persistOrder = (next: typeof sortedTasks) => {
    const orderedIds = next.map((t) => t.id || 0).filter((id) => id > 0);
    if (orderedIds.length === 0) return;
    onReorder(selectedProjectGroup.project, orderedIds);
  };

  const moveTask = (taskId: number, dir: -1 | 1) => {
    const idx = sortedTasks.findIndex((t) => t.id === taskId);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= sortedTasks.length) return;
    const next = [...sortedTasks];
    const [moved] = next.splice(idx, 1);
    next.splice(target, 0, moved);
    persistOrder(next);
  };

  const handleDropOnTask = (targetId: number) => {
    if (!dragId || dragId === targetId) return;
    const from = sortedTasks.findIndex((t) => t.id === dragId);
    const to = sortedTasks.findIndex((t) => t.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...sortedTasks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    persistOrder(next);
  };

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
                  {sortedTasks.length} Aktivitas Pekerjaan
                  {hasManualOrder && canEdit && (
                    <span className="ml-1.5 text-emerald-700 font-semibold" title="Urutan manual tersimpan dan menimpa urutan tanggal">
                      • Urutan manual
                    </span>
                  )}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800 truncate" title={selectedProjectGroup.project}>
                {selectedProjectGroup.project}
              </h3>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {canAdd && (
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
              )}
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
          <div className="flex-1 min-h-0 flex flex-col p-3 sm:p-6 overflow-hidden">
            <div className="flex-1 min-h-0 border border-slate-200 rounded-xl shadow-sm overflow-x-auto overflow-y-auto custom-scrollbar relative bg-white">
              <table
                className="w-full text-left border-collapse"
                style={{ fontSize: fontSize ? `${fontSize}px` : undefined }}
              >
                <colgroup>
                  {activeColumns.map((col) => (
                    <col key={col.key} style={{ minWidth: col.minWidth, width: col.minWidth }} />
                  ))}
                </colgroup>
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 sticky top-0 z-20 shadow-xs">
                  <tr className="bg-slate-50">
                    {activeColumns.map((col) => (
                      <th
                        key={col.key}
                        style={{ minWidth: col.minWidth, width: col.minWidth }}
                        className={`px-2 py-2.5 bg-slate-50 truncate ${
                          col.key === 'no' || col.key === 'work_days' || col.key === 'aksi'
                            ? 'text-center'
                            : ''
                        }`}
                        title={col.label}
                      >
                        <span>{col.label}</span>
                        {col.key === 'task' && (
                          <span className="text-rose-500 ml-0.5" title="Wajib diisi agar data tersimpan">*</span>
                        )}
                      </th>
                    ))}
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
                        isColVisible={isColVisible}
                        roleConfig={roleConfig}
                      />
                    ) : (
                      <tr
                        key={task.id || idx}
                        draggable={canEdit}
                        onDragStart={(e) => {
                          if (!canEdit) return;
                          setDragId(task.id || null);
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragOver={(e) => {
                          if (!canEdit || !dragId || dragId === task.id) return;
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                          setDropTargetId(task.id || null);
                        }}
                        onDragLeave={() => setDropTargetId((prev) => (prev === task.id ? null : prev))}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleDropOnTask(task.id || 0);
                          setDragId(null);
                          setDropTargetId(null);
                        }}
                        onDragEnd={() => {
                          setDragId(null);
                          setDropTargetId(null);
                        }}
                        onClick={() => setSelectedTaskId((prev) => (prev === task.id ? null : task.id || null))}
                        onDoubleClick={() => {
                          if (canEdit) {
                            setEditingTaskId(task.id || null);
                          }
                        }}
                        className={`transition-all group cursor-pointer ${
                          selectedTaskId === task.id
                            ? "bg-emerald-100/70 shadow-[inset_3px_0_0_0_#059669] font-semibold text-emerald-950"
                            : dropTargetId === task.id
                              ? "bg-emerald-50/80 shadow-[inset_0_2px_0_0_#059669]"
                              : "hover:bg-slate-50/80"
                        } ${dragId === task.id ? "opacity-50" : ""}`}
                      >
                        {isColVisible('no') && (
                          <td className="px-1 py-2 text-center font-medium text-slate-400">
                            <div className="flex flex-col items-center gap-0.5">
                              <div className="flex items-center gap-1">
                                {canEdit && (
                                  <span
                                    className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 touch-none"
                                    title="Geser untuk menyusun ulang urutan"
                                  >
                                    <GripVertical size={14} />
                                  </span>
                                )}
                                <span>{idx + 1}</span>
                              </div>
                              {canEdit && (
                                <div className="flex items-center gap-0.5">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveTask(task.id || 0, -1);
                                    }}
                                    className="p-0.5 rounded text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                                    title="Pindah ke atas"
                                  >
                                    <ChevronUp size={12} />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === sortedTasks.length - 1}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveTask(task.id || 0, 1);
                                    }}
                                    className="p-0.5 rounded text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                                    title="Pindah ke bawah"
                                  >
                                    <ChevronDown size={12} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        )}
                        {isColVisible('bagian') && (
                          <td className="px-1.5 py-2 text-slate-700 font-medium break-words leading-tight">
                            {(task as any).bagian || "-"}
                          </td>
                        )}
                        {isColVisible('pic') && (
                          <td className="px-1.5 py-2 font-bold text-emerald-700 break-words leading-tight">
                            {task.pic || "-"}
                          </td>
                        )}
                        {isColVisible('task') && (
                          <td
                            className="px-1.5 py-2 font-semibold text-slate-800 break-words leading-snug"
                            title={cleanTaskName(task.task, selectedProjectGroup.project) || task.task}
                          >
                            {cleanTaskName(task.task, selectedProjectGroup.project) || task.task}
                          </td>
                        )}
                        {isColVisible('priority') && (
                          <td className="px-1.5 py-2 text-slate-600 break-words leading-tight">
                            {task.priority || "-"}
                          </td>
                        )}
                        {isColVisible('start_end') && (
                          <td
                            className="px-1.5 py-2 text-center text-slate-500 break-words leading-tight"
                            style={{ fontSize: fontSize ? `${Math.max(9, Math.round(fontSize * 0.85))}px` : undefined }}
                          >
                            <div>
                              <span>{task.startDate ? formatDateDisplay(task.startDate) : "-"}</span>
                              {task.startTime && <span className="text-emerald-700 font-semibold ml-1">({task.startTime})</span>}
                              <span className="mx-1">~</span>
                              <span>{task.endDate ? formatDateDisplay(task.endDate) : "-"}</span>
                              {task.endTime && <span className="text-emerald-700 font-semibold ml-1">({task.endTime})</span>}
                            </div>
                          </td>
                        )}
                        {isColVisible('work_days') && (
                          <td
                            className="px-1.5 py-2 text-center font-medium text-slate-600 whitespace-nowrap"
                            style={{ fontSize: fontSize ? `${Math.max(9, Math.round(fontSize * 0.92))}px` : undefined }}
                          >
                            {task.workDays ? `${task.workDays} hari` : "-"}
                          </td>
                        )}
                        {isColVisible('status') && (
                          <td className="px-1.5 py-2 text-left overflow-hidden">
                            {getStatusBadge(task.status)}
                          </td>
                        )}
                        {isColVisible('note') && (
                          <td
                            className="px-1.5 py-2 text-slate-600 break-words whitespace-pre-wrap leading-tight"
                            style={{ fontSize: fontSize ? `${Math.max(9, Math.round(fontSize * 0.92))}px` : undefined }}
                          >
                            {task.note || "-"}
                          </td>
                        )}
                        {isColVisible('aksi') && (
                          <td className="px-1.5 py-2 text-center">
                            <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              {canEdit && (
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
                              )}
                              {canDeleteInCard && (
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
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  )}

                  {/* Empty state jika belum ada aktivitas pekerjaan */}
                  {sortedTasks.length === 0 && !isAddingTask && (
                    <tr>
                      <td colSpan={activeColumns.length} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <AlertCircle className="w-8 h-8 text-slate-300" />
                          <p className="font-semibold text-slate-600 text-sm">Belum ada aktivitas pekerjaan untuk order ini</p>
                          {canAdd && (
                            <p className="text-xs text-slate-400 max-w-md">
                              Klik tombol <b className="text-emerald-600 font-bold">+ Tambah Pekerjaan</b> di pojok kanan atas untuk mulai membuat aktivitas pekerjaan pertama.
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Baris Tambah Pekerjaan Baru di Bawah */}
                  {isAddingTask && canAdd && (
                    <InlineAddRow
                      employeeOptions={employeeOptions}
                      onSave={async (data) => {
                        await onCreateTask(data);
                        setIsAddingTask(false);
                      }}
                      onCancel={() => setIsAddingTask(false)}
                      isColVisible={isColVisible}
                      roleConfig={roleConfig}
                    />
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Modal */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-3 border-t border-slate-100 bg-slate-50/80 shrink-0">
            <span className="text-xs text-slate-500">
              Total: <b className="text-slate-800">{sortedTasks.length}</b> task aktivitas
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
  isColVisible,
  roleConfig,
}: {
  idx: number;
  task: SpreadsheetTask;
  project: string;
  employeeOptions: any[];
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  onDelete: () => void;
  isColVisible: (key: string) => boolean;
  roleConfig?: RoleLaporanPekerjaanConfig;
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
    startTime: task.startTime || "",
    endTime: task.endTime || "",
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
      (current.startTime || "") !== (task.startTime || "") ||
      (current.endTime || "") !== (task.endTime || "") ||
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

  const availableBagianList = useMemo(() => {
    if (roleConfig?.allowed_bagian && roleConfig.allowed_bagian.length > 0) {
      return roleConfig.allowed_bagian;
    }
    return BAGIAN_LIST;
  }, [roleConfig]);

  const picOptions = useMemo(() => {
    const uniqueNames = Array.from(
      new Set(
        employeeOptions
          .map((e) => (typeof e === "string" ? e : e?.name || e?.label || ""))
          .filter(Boolean)
      )
    ).filter((name) => {
      const lowerName = name.toLowerCase().trim();
      if (roleConfig?.excluded_pic && roleConfig.excluded_pic.length > 0) {
        if (roleConfig.excluded_pic.map(p => p.toLowerCase().trim()).includes(lowerName)) {
          return false;
        }
      }
      if (!roleConfig?.allowed_pic || roleConfig.allowed_pic.length === 0) return true;
      const explicitNames = roleConfig.allowed_pic.filter(p => !p.startsWith('@') && p.toLowerCase() !== 'tanpa pic');
      if (explicitNames.length === 0) return true;
      return explicitNames.map((p) => p.toLowerCase().trim()).includes(lowerName);
    }).sort((a, b) => a.localeCompare(b, "id"));
    return uniqueNames.map((name) => ({ value: name, label: name }));
  }, [employeeOptions, roleConfig]);

  return (
    <tr ref={rowRef} className="bg-sky-50/90 border-y-2 border-sky-300">
      {isColVisible('no') && (
        <td className="px-1 py-1.5 text-center font-bold text-sky-700 text-xs">
          {idx + 1}
        </td>
      )}
      {/* 1. Bagian */}
      {isColVisible('bagian') && (
        <td className="px-1 py-1.5">
          <SquareDropdown
            options={availableBagianList.map((b) => ({ value: b, label: b }))}
            value={form.bagian}
            onChange={(val) => {
              setForm((p) => ({ ...p, bagian: val, task: "" }));
            }}
            searchPlaceholder="Cari Bagian..."
            widthClass="w-full"
            usePortal={true}
          />
        </td>
      )}
      {/* 2. PIC */}
      {isColVisible('pic') && (
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
      )}
      {/* 3. Task / Aktivitas */}
      {isColVisible('task') && (
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
      )}
      {/* 4. Priority */}
      {isColVisible('priority') && (
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
      )}
      {/* 5. Start ~ End */}
      {isColVisible('start_end') && (
        <td className="px-1 py-1.5">
          <div className="flex flex-col gap-1 w-full">
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
                      <span className="truncate">{form.startDate ? formatDateDisplay(form.startDate) : 'Pilih Tgl'}</span>
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
                      <span className="truncate">{form.endDate ? formatDateDisplay(form.endDate) : 'Pilih Tgl'}</span>
                      <Calendar size={11} className="text-slate-400 shrink-0" />
                    </button>
                  )}
                />
              </div>
            </div>
            {/* Input Jam Start & End */}
            <div className="flex items-center gap-0.5 w-full">
              <div className="flex-1 min-w-0">
                <TimePicker
                  name="start_time"
                  value={form.startTime}
                  onChange={(val) => setForm((p) => ({ ...p, startTime: val }))}
                  placeholder="Jam mulai"
                  usePortal={true}
                />
              </div>
              <span className="text-slate-300 text-[10px] font-bold shrink-0">~</span>
              <div className="flex-1 min-w-0">
                <TimePicker
                  name="end_time"
                  value={form.endTime}
                  onChange={(val) => setForm((p) => ({ ...p, endTime: val }))}
                  placeholder="Jam selesai"
                  usePortal={true}
                />
              </div>
            </div>
          </div>
        </td>
      )}
      {/* 6. Work Days */}
      {isColVisible('work_days') && (
        <td className="px-1 py-1.5 text-center whitespace-nowrap">
          <span className="text-[11px] font-bold text-sky-700">
            {workDaysDisplay}
          </span>
        </td>
      )}
      {/* 7. Status */}
      {isColVisible('status') && (
        <td className="px-1 py-1.5">
          <SquareDropdown
            options={[
              { value: "BELUM DIKERJAKAN", label: "BELUM DIKERJAKAN" },
              { value: "IN PROGRESS", label: "IN PROGRESS" },
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
      )}
      {/* 8. Note */}
      {isColVisible('note') && (
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
      )}
      {/* 9. Aksi */}
      {isColVisible('aksi') && (
        <td className="px-1 py-1.5 text-center whitespace-nowrap">
          {((roleConfig?.delete_scope === 'all' || roleConfig?.delete_scope === 'card_only') || (!roleConfig?.delete_scope && roleConfig?.can_delete !== false)) && (
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
          )}
        </td>
      )}
    </tr>
  );
}

function InlineAddRow({
  employeeOptions,
  onSave,
  onCancel,
  isColVisible,
  roleConfig,
}: {
  employeeOptions: any[];
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  isColVisible: (key: string) => boolean;
  roleConfig?: RoleLaporanPekerjaanConfig;
}) {
  const defaultPic = useMemo(() => {
    if (!roleConfig?.allowed_pic || roleConfig.allowed_pic.length === 0) return "";
    const cleanPics = roleConfig.allowed_pic.filter((p) => !p.startsWith("@") && p.toLowerCase() !== "tanpa pic");
    if (cleanPics.length === 1) return cleanPics[0];
    return "";
  }, [roleConfig]);

  const defaultBagian = useMemo(() => {
    if (!roleConfig?.allowed_bagian || roleConfig.allowed_bagian.length === 0) return "";
    if (roleConfig.allowed_bagian.length === 1) return roleConfig.allowed_bagian[0];
    return "";
  }, [roleConfig]);

  const [form, setForm] = useState({
    bagian: defaultBagian,
    pic: defaultPic,
    task: "",
    priority: "",
    startDate: null as Date | null,
    endDate: null as Date | null,
    startTime: "",
    endTime: "",
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

  const availableBagianList = useMemo(() => {
    if (roleConfig?.allowed_bagian && roleConfig.allowed_bagian.length > 0) {
      return roleConfig.allowed_bagian;
    }
    return BAGIAN_LIST;
  }, [roleConfig]);

  const picOptions = useMemo(() => {
    const uniqueNames = Array.from(
      new Set(
        employeeOptions
          .map((e) => (typeof e === "string" ? e : e?.name || e?.label || ""))
          .filter(Boolean)
      )
    ).filter((name) => {
      const lowerName = name.toLowerCase().trim();
      if (roleConfig?.excluded_pic && roleConfig.excluded_pic.length > 0) {
        if (roleConfig.excluded_pic.map(p => p.toLowerCase().trim()).includes(lowerName)) {
          return false;
        }
      }
      if (!roleConfig?.allowed_pic || roleConfig.allowed_pic.length === 0) return true;
      const explicitNames = roleConfig.allowed_pic.filter(p => !p.startsWith('@') && p.toLowerCase() !== 'tanpa pic');
      if (explicitNames.length === 0) return true;
      return explicitNames.map((p) => p.toLowerCase().trim()).includes(lowerName);
    }).sort((a, b) => a.localeCompare(b, "id"));
    return uniqueNames.map((name) => ({ value: name, label: name }));
  }, [employeeOptions, roleConfig]);

  return (
    <tr ref={rowRef} className="bg-emerald-50/90 border-y-2 border-emerald-300">
      {isColVisible('no') && (
        <td className="px-1 py-1.5 text-center font-bold text-emerald-700 text-xs">
          +
        </td>
      )}
      {/* 1. Bagian */}
      {isColVisible('bagian') && (
        <td className="px-1 py-1.5">
          <SquareDropdown
            options={availableBagianList.map((b) => ({ value: b, label: b }))}
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
      )}
      {/* 2. PIC */}
      {isColVisible('pic') && (
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
      )}
      {/* 3. Task / Aktivitas */}
      {isColVisible('task') && (
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
      )}
      {/* 4. Priority */}
      {isColVisible('priority') && (
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
      )}
      {/* 5. Start ~ End */}
      {isColVisible('start_end') && (
        <td className="px-1 py-1.5">
          <div className="flex flex-col gap-1 w-full">
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
                        {form.startDate ? formatDateDisplay(form.startDate) : 'Pilih Tgl'}
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
                        {form.endDate ? formatDateDisplay(form.endDate) : 'Pilih Tgl'}
                      </span>
                      <Calendar size={11} className="text-slate-400 shrink-0" />
                    </button>
                  )}
                />
              </div>
            </div>
            {/* Input Jam Start & End */}
            <div className="flex items-center gap-0.5 w-full">
              <div className="flex-1 min-w-0">
                <TimePicker
                  name="new_start_time"
                  value={form.startTime}
                  onChange={(val) => setForm((p) => ({ ...p, startTime: val }))}
                  placeholder="Jam mulai"
                  usePortal={true}
                />
              </div>
              <span className="text-slate-300 text-[10px] font-bold shrink-0">~</span>
              <div className="flex-1 min-w-0">
                <TimePicker
                  name="new_end_time"
                  value={form.endTime}
                  onChange={(val) => setForm((p) => ({ ...p, endTime: val }))}
                  placeholder="Jam selesai"
                  usePortal={true}
                />
              </div>
            </div>
          </div>
        </td>
      )}
      {/* 6. Work Days */}
      {isColVisible('work_days') && (
        <td className="px-1 py-1.5 text-center whitespace-nowrap">
          <span className="text-[11px] font-bold text-emerald-700">
            {workDaysDisplay}
          </span>
        </td>
      )}
      {/* 7. Status */}
      {isColVisible('status') && (
        <td className="px-1 py-1.5">
          <SquareDropdown
            options={[
              { value: "BELUM DIKERJAKAN", label: "BELUM DIKERJAKAN" },
              { value: "IN PROGRESS", label: "IN PROGRESS" },
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
      )}
      {/* 8. Note */}
      {isColVisible('note') && (
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
            className="w-full min-h-[30px] px-2 py-1 text-[11px] border border-emerald-400 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 custom-scrollbar resize-y break-words leading-tight"
          />
        </td>
      )}
      {/* 9. Aksi */}
      {isColVisible('aksi') && (
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
      )}
    </tr>
  );
}
