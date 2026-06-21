'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Loader2, AlertCircle, AlertTriangle, ClipboardList, RotateCcw, Filter, Plus, Trash2, Edit2, Save, X, CheckCircle2, ChevronDown, Search, PlusSquare, Copy, FileText, Download, BookOpen, FileSpreadsheet, Pencil } from 'lucide-react';
import SearchableDropdown from '@/components/SearchableDropdown';
import SearchAndReload from '@/components/SearchAndReload';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ViewActivityLogLink from '@/components/ViewActivityLogLink';
import { DataTable } from '@/components/ui/DataTable';
import TableFooter from '@/components/TableFooter';
import DatePicker from '@/components/DatePicker';
import BaseModal from '@/components/ui/BaseModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { persistDateStore, hydrateDateStore } from '@/lib/scraper-period';

// Mapping Bagian -> Category master_pekerjaan_jurnal_produksi
const BAGIAN_CATEGORY_MAP: Record<string, string> = {
  'SETTING':          'Setting',
  'QUALITY CONTROL':  'Quality Control',
  'CETAK':            'Cetak',
  'FINISHING':        'Finishing',
  'GUDANG':           'Gudang',
  'TEKNISI':          'Teknisi',
  'MESIN':            'Mesin',
};

const BAGIAN_LIST = ['SETTING', 'QUALITY CONTROL', 'CETAK', 'FINISHING', 'GUDANG', 'TEKNISI', 'MESIN'];

const SHIFT_JAM: Record<string, string> = {
  '1': '07:00 - 15:00',
  '2': '15:00 - 23:00',
  '3': '23:00 - 07:00',
};

const PAGE_SIZE = 50;

function formatIndoDateStr(tglStr: string) {
  if (!tglStr) return '';
  const parts = tglStr.split('-');
  if (parts.length === 3) {
    const d = new Date(`${parts[0]}-${parts[1]}-${parts[2]}T12:00:00Z`);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  }
  return tglStr;
}

function evaluateMathExpression(expr: string): string {
  if (!expr.startsWith('=')) return expr;
  
  const rawFormula = expr.substring(1).trim();
  if (!rawFormula) return expr;

  // Hapus semua spasi
  let formula = rawFormula.replace(/\s+/g, '');

  // Helper untuk menormalkan angka berformat Indonesia/Inggris ke format standar JS
  const normalizeNumberString = (numStr: string): string => {
    if (numStr.includes(',')) {
      const cleanDots = numStr.replace(/\./g, '');
      return cleanDots.replace(/,/g, '.');
    }
    const dotCount = (numStr.match(/\./g) || []).length;
    if (dotCount > 1) {
      return numStr.replace(/\./g, '');
    }
    if (dotCount === 1) {
      if (/\.\d{3}$/.test(numStr)) {
        return numStr.replace(/\./g, '');
      } else {
        return numStr;
      }
    }
    return numStr;
  };

  // Normalisasi semua angka di dalam formula
  let processedFormula = formula.replace(/[0-9.,]+/g, (match) => {
    return normalizeNumberString(match);
  });

  // Validasi karakter aman untuk evaluasi matematika: digit, +, -, *, /, (, ), .
  if (!/^[0-9+\-*/().]+$/.test(processedFormula)) {
    return expr;
  }

  try {
    // Evaluasi ekspresi matematika dengan aman
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${processedFormula})`)();
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      const isInteger = Number.isInteger(result);
      if (isInteger) {
        return String(result).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      } else {
        const parts = String(Number(result.toFixed(4))).split('.');
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return parts[1] ? `${integerPart},${parts[1]}` : integerPart;
      }
    }
  } catch (e) {
    // Abaikan error parsing dan kembalikan nilai asli
  }

  return expr;
}

function formatFormulaNumbers(val: string): string {
  if (!val.startsWith('=')) return val;
  
  const rawFormula = val.substring(1);
  
  return '=' + rawFormula.replace(/[0-9.,]+/g, (numStr) => {
    if (numStr === '.' || numStr === ',') return numStr;
    
    if (numStr.includes(',')) {
      const parts = numStr.split(',');
      const integerPart = parts[0].replace(/\./g, '');
      const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      const decimalPart = parts.slice(1).join(',').replace(/\./g, '');
      return `${formattedInteger},${decimalPart}`;
    } else {
      const cleanInt = numStr.replace(/\./g, '');
      return cleanInt.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }
  });
}

// ─── Editable Cell untuk kolom Keterangan ───────────────────────────────────
function KeteranganEditableCell({
  row,
  onSave,
  canEdit,
  pasteActive = false,
  copiedValue,
  onCopyValue,
  onPasteDone,
}: {
  row: any;
  onSave: (id: number | string, value: string) => Promise<boolean>;
  canEdit: boolean;
  pasteActive?: boolean;
  copiedValue?: string | null;
  onCopyValue?: (value: string) => void;
  onPasteDone?: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState('');
  const [localVal, setLocalVal] = useState<string>(row.keterangan || '');
  const [isSaving, setIsSaving] = useState(false);
  const isSavingGuard = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync localVal jika data dari luar berubah (misal setelah refresh)
  useEffect(() => {
    setLocalVal(row.keterangan || '');
  }, [row.keterangan]);

  // Tutup editing saat mode paste aktif
  useEffect(() => {
    if (pasteActive) setIsEditing(false);
  }, [pasteActive]);

  const handleSave = useCallback(async () => {
    if (isSavingGuard.current) return;
    isSavingGuard.current = true;
    setIsEditing(false);

    // Tidak ada perubahan — tutup saja
    if (value === (row.keterangan || '')) {
      setTimeout(() => { isSavingGuard.current = false; }, 300);
      return;
    }

    setIsSaving(true);
    setLocalVal(value); // optimistic update

    const success = await onSave(row.id, value);
    if (!success) {
      setLocalVal(row.keterangan || ''); // rollback
    }

    setIsSaving(false);
    setTimeout(() => { isSavingGuard.current = false; }, 300);
  }, [value, row.id, row.keterangan, onSave]);

  // Tutup saat klik di luar
  useEffect(() => {
    if (!isEditing) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && wrapperRef.current.contains(e.target as HTMLElement)) return;
      handleSave();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isEditing, handleSave]);

  // Single return — semua kondisi di dalam satu wrapper agar React tidak
  // mount/unmount node yang berbeda (mencegah insertBefore NotFoundError)
  return (
    <div className="relative w-full min-h-[24px]">
      {/* Read-only */}
      {!canEdit && (
        <span className="font-medium text-gray-500 truncate block">
          {localVal || '-'}
        </span>
      )}

      {/* Saving indicator */}
      {canEdit && isSaving && (
        <div className="flex items-center gap-1.5 text-emerald-600 animate-pulse">
          <Loader2 size={12} className="animate-spin shrink-0" />
          <span className="text-[11px] font-bold">Menyimpan...</span>
        </div>
      )}

      {/* Editing input */}
      {canEdit && !isSaving && isEditing && (
        <div ref={wrapperRef} className="relative w-full z-[999]">
          <input
            ref={inputRef}
            type="text"
            autoFocus
            value={value}
            onChange={e => setValue(e.target.value)}
            onClick={e => e.stopPropagation()}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); handleSave(); }
              if (e.key === 'Escape') {
                isSavingGuard.current = true;
                setIsEditing(false);
                setTimeout(() => { isSavingGuard.current = false; }, 300);
              }
            }}
            className="w-full px-2 py-1 text-[12px] font-medium text-gray-800 bg-yellow-50 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400/40 transition-all"
            placeholder="Ketik keterangan..."
          />
        </div>
      )}

      {/* Paste mode */}
      {canEdit && !isSaving && !isEditing && pasteActive && (
        <div className="flex items-center gap-1 select-none">
          <span className={`font-medium truncate flex-1 text-[12px] ${localVal ? 'text-gray-600' : 'text-gray-300 italic'}`}>
            {localVal || '—'}
          </span>
          <button
            onClick={async e => {
              e.stopPropagation();
              if (copiedValue !== undefined && copiedValue !== null) {
                setIsSaving(true);
                setLocalVal(copiedValue);
                const success = await onSave(row.id, copiedValue);
                if (!success) setLocalVal(row.keterangan || '');
                setIsSaving(false);
              }
            }}
            className="p-1 rounded-md text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100 transition-all shrink-0"
            title="Tempel keterangan yang di-copy"
            tabIndex={-1}
          >
            <ClipboardList size={11} />
          </button>
        </div>
      )}

      {/* Normal display */}
      {canEdit && !isSaving && !isEditing && !pasteActive && (
        <div
          className="group flex items-center gap-1 cursor-pointer rounded-md px-1 -mx-1 hover:bg-yellow-50 transition-colors"
          onDoubleClick={e => {
            e.stopPropagation();
            isSavingGuard.current = false;
            setValue(localVal);
            setIsEditing(true);
          }}
          title="Klik 2x untuk edit keterangan"
        >
          <span className={`font-medium truncate flex-1 text-[12px] ${localVal ? 'text-gray-600' : 'text-gray-300 italic'}`}>
            {localVal || 'klik 2x untuk isi'}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onCopyValue?.(localVal); }}
            className="p-1 rounded-md text-gray-300 hover:text-yellow-500 hover:bg-yellow-100 transition-all shrink-0"
            title="Copy keterangan"
            tabIndex={-1}
          >
            <Copy size={10} />
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              isSavingGuard.current = false;
              setValue(localVal);
              setIsEditing(true);
            }}
            className="p-1 rounded-md text-gray-300 hover:text-yellow-500 hover:bg-yellow-100 transition-all shrink-0"
            title="Edit keterangan"
            tabIndex={-1}
          >
            <Pencil size={10} />
          </button>
        </div>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function JurnalClient({
  canInputTarget = true,
  canInputRealisasi = true,
  canCopyJadwal = false,
  isSuperAdmin = false,
  userRole = '',
}: {
  canInputTarget?: boolean;
  canInputRealisasi?: boolean;
  canCopyJadwal?: boolean;
  isSuperAdmin?: boolean;
  userRole?: string;
}) {
  const router = useRouter();
  
  // State
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatusText, setExportStatusText] = useState('');
  const [hasCopiedToday, setHasCopiedToday] = useState(true);
  const [isCopyingJadwal, setIsCopyingJadwal] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const [canRevert, setCanRevert] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);
  const [selectedExportYear, setSelectedExportYear] = useState('all');
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [yearsCount, setYearsCount] = useState<Record<string, number>>({});

  // Copy Jadwal Modal state
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyFrom, setCopyFrom] = useState<Date | null>(null);
  const [copyTo, setCopyTo] = useState<Date | null>(null);
  const [copyBagian, setCopyBagian] = useState<string[]>([]);
  const [copyKaryawan, setCopyKaryawan] = useState<string[]>([]);
  const [copyModalError, setCopyModalError] = useState('');
  const [copyBagianSearch, setCopyBagianSearch] = useState('');
  const [copyKaryawanSearch, setCopyKaryawanSearch] = useState('');

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Dropdown filters
  const [bagianFilter, setBagianFilter] = useState('');
  const [namaKaryawanFilter, setNamaKaryawanFilter] = useState('');
  const [belumRealisasiFilter, setBelumRealisasiFilter] = useState(false);
  const [totalRealisasi, setTotalRealisasi] = useState(0);
  const [totalRijek, setTotalRijek] = useState(0);
  const [bagianOptions, setBagianOptions] = useState<string[]>([]);
  const [karyawanByBagian, setKaryawanByBagian] = useState<Record<string, string[]>>({});
  const [allEmployeeNames, setAllEmployeeNames] = useState<string[]>([]);
  const [namaOptions, setNamaOptions] = useState<string[]>([]);
  const [noOrderFilter, setNoOrderFilter] = useState('');
  const [isBagianDropdownOpen, setIsBagianDropdownOpen] = useState(false);
  const [isNamaDropdownOpen, setIsNamaDropdownOpen] = useState(false);
  const [bagianSearchQuery, setBagianSearchQuery] = useState('');
  const [namaSearchQuery, setNamaSearchQuery] = useState('');

  // CRUD State
  const [activeTab, setActiveTab] = useState<'list' | 'form'>('list');
  const [formSubTab, setFormSubTab] = useState<'target' | 'realisasi'>('target');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [multiRealisasi, setMultiRealisasi] = useState<any[]>([]);
  const [isMultiRealisasiMode, setIsMultiRealisasiMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [actionMessage, setActionMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Confirm dialog for empty realisasi warning
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean; type: 'alert' | 'confirm' | 'success' | 'error' | 'danger';
    title: string; message: string; confirmLabel?: string; onConfirm?: () => void;
  }>({ isOpen: false, type: 'confirm', title: '', message: '' });
  const pendingSaveRef = useRef<(() => Promise<void>) | null>(null);
  const closeDialog = () => setDialogConfig(prev => ({ ...prev, isOpen: false }));

  // Trash / Restore state (Super Admin only)
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [trashData, setTrashData] = useState<any[]>([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [trashTotal, setTrashTotal] = useState(0);
  const [trashPage, setTrashPage] = useState(1);
  const [selectedTrashIds, setSelectedTrashIds] = useState<Set<number | string>>(new Set());
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeletingPermanently, setIsDeletingPermanently] = useState(false);
  const [isSelectedAllTrash, setIsSelectedAllTrash] = useState(false);

  // Dropdown data for form
  const [employees, setEmployees] = useState<any[]>([]);
  const [sopdList, setSopdList] = useState<any[]>([]);
  const [jenisPekerjaanList, setJenisPekerjaanList] = useState<string[]>([]);
  const [jenisPekerjaan2List, setJenisPekerjaan2List] = useState<string[]>([]);
  const [isLoadingForm, setIsLoadingForm] = useState(false);

  // Realisasi: pilih target row dulu
  const [selectedTargetRow, setSelectedTargetRow] = useState<any | null>(null);
  const [targetSearchQuery, setTargetSearchQuery] = useState('');
  const [targetRowOptions, setTargetRowOptions] = useState<any[]>([]);
  const [isTargetDropdownOpen, setIsTargetDropdownOpen] = useState(false);
  const targetDropdownRef = useRef<HTMLDivElement>(null);

  // Table State
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | number | null>(null);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jurnal_columnWidths_v2');
      if (saved) return JSON.parse(saved);
    }
    return {
      index: 60,
      posisi: 120,
      absensi: 80,
      tgl: 120,
      shift: 80,
      nama_karyawan: 200,
      no_order: 180,
      nama_order: 250,
      jenis_pekerjaan: 200,
      keterangan: 180,
      target: 100,
      realisasi: 100,
      no_order_2: 180,
      nama_order_2: 250,
      jenis_pekerjaan_2: 200,
      bahan_kertas: 150,
      jml_plate: 100,
      warna: 100,
      inscheet: 100,
      rijek: 100,
      jam: 100,
      kendala: 150,
      id: 60,
      bagian: 150
    };
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Outside click handling is now managed within SearchableDropdown

  useEffect(() => {
    setIsMounted(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hydrated = hydrateDateStore('jurnal_dates');
    if (hydrated.startDate && hydrated.endDate) {
      setStartDate(hydrated.startDate);
      setEndDate(hydrated.endDate);
      persistDateStore('jurnal_dates', hydrated.startDate, hydrated.endDate);
    } else {
      setStartDate(today);
      setEndDate(today);
      persistDateStore('jurnal_dates', today, today);
    }

    const handleDataUpdated = () => {
      setRefreshKey(prev => prev + 1);
      router.refresh();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sintak_data_updated') {
        handleDataUpdated();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('sintak:data-updated', handleDataUpdated);
    return () => { 
      window.removeEventListener('storage', handleStorageChange); 
      window.removeEventListener('sintak:data-updated', handleDataUpdated);
    };
  }, [router]);

  useEffect(() => {
    if (!isMounted) return;
    persistDateStore('jurnal_dates', startDate, endDate);
  }, [startDate, endDate, isMounted]);

  useEffect(() => {
    let active = true;
    async function loadData() {
      if (!isMounted) return;
      setLoading(true);
      const startTime = performance.now();
      try {
        const fmtDate = (d: Date | null) => {
           if (!d) return '';
           const y = d.getFullYear();
           const m = String(d.getMonth() + 1).padStart(2, '0');
           const day = String(d.getDate()).padStart(2, '0');
           return `${y}-${m}-${day}`;
        };
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: PAGE_SIZE.toString(),
          search: debouncedQuery,
          startDate: fmtDate(startDate),
          endDate: fmtDate(endDate),
          ...(bagianFilter ? { bagian: bagianFilter } : {}),
          ...(namaKaryawanFilter ? { namaKaryawan: namaKaryawanFilter } : {}),
          ...(noOrderFilter ? { noOrder: noOrderFilter } : {}),
          ...(belumRealisasiFilter ? { belumRealisasi: 'true' } : {}),
          ...((bagianFilter || namaKaryawanFilter || noOrderFilter || belumRealisasiFilter || debouncedQuery) ? { needTotals: 'true' } : {}),
          _r: refreshKey.toString() // hanya berubah saat data dimutasi, bukan setiap render
        });
        const res = await fetch(`/api/jurnal-harian-produksi?${queryParams.toString()}`);
        if (!active) return;
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setLoadTime(Math.round(performance.now() - startTime));
            setData(json.data || []);
            setTotalCount(json.total || 0);
            setTotalRealisasi(Number(json.totalRealisasi || 0));
            setTotalRijek(Number(json.totalRijek || 0));
            setError('');
          }
        }
      } catch (err: any) {
        if (active) setError(err.message || 'Gagal memuat data');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => { active = false; };
  }, [page, debouncedQuery, refreshKey, startDate, endDate, bagianFilter, namaKaryawanFilter, noOrderFilter, belumRealisasiFilter, isMounted]);

  // Fetch distinct bagian & nama karyawan for dropdowns
  useEffect(() => {
    async function fetchOptions() {
      try {
        const res = await fetch('/api/jurnal-harian-produksi/options');
        if (res.ok) {
          const json = await res.json();
          const filteredBagian: string[] = (json.bagian || []).filter((b: string) => b && !b.trim().startsWith('-'));
          const filteredKaryawan: string[] = (json.karyawan || []).filter((k: string) => k && !k.trim().startsWith('-'));

          setBagianOptions(filteredBagian);
          const employeeNames: string[] = Array.from(new Set(filteredKaryawan));
          setAllEmployeeNames(employeeNames);
          setNamaOptions(employeeNames);
          setAvailableYears(json.years || []);
          setYearsCount(json.yearsCount || {});
          setKaryawanByBagian(json.karyawanByBagian || {});
        }
      } catch {}
    }
    fetchOptions();
  }, [refreshKey]);

  // Fetch SOPD list for filter dropdown & form
  useEffect(() => {
    let active = true;
    async function loadSopd() {
      try {
        const res = await fetch('/api/sopd?all=true&limit=5000');
        if (!active) return;
        if (res.ok) {
          const j = await res.json();
          setSopdList(j.data || []);
        }
      } catch {}
    }
    loadSopd();
    return () => { active = false; };
  }, [refreshKey]);

  // Fetch employees for form dropdown (only when form is open)
  useEffect(() => {
    if (activeTab !== 'form') return;
    let active = true;
    async function loadFormData() {
      setIsLoadingForm(true);
      try {
        const res = await fetch('/api/employees?limit=5000');
        if (!active) return;
        if (res.ok) {
          const j = await res.json();
          setEmployees(j.data || []);
        }
      } catch {} finally {
        if (active) setIsLoadingForm(false);
      }
    }
    loadFormData();
    return () => { active = false; };
  }, [activeTab, refreshKey]);

  // Fetch jenis pekerjaan ketika bagian form berubah (section Target)
  useEffect(() => {
    if (!formData.bagian) { setJenisPekerjaanList([]); return; }
    const category = BAGIAN_CATEGORY_MAP[formData.bagian] || '';
    if (!category) { setJenisPekerjaanList([]); return; }
    fetch(`/api/master-pekerjaan-jurnal-produksi?category=${encodeURIComponent(category)}&limit=2000`)
      .then(r => r.json())
      .then(j => setJenisPekerjaanList((j.data || []).map((x: any) => x.name)))
      .catch(() => setJenisPekerjaanList([]));
  }, [formData.bagian, refreshKey]);

  // Fetch jenis pekerjaan untuk section Realisasi (ikut bagian dari target)
  useEffect(() => {
    const bagian = selectedTargetRow?.bagian || formData.bagian;
    if (!bagian) { setJenisPekerjaan2List([]); return; }
    const category = BAGIAN_CATEGORY_MAP[bagian] || '';
    if (!category) { setJenisPekerjaan2List([]); return; }
    fetch(`/api/master-pekerjaan-jurnal-produksi?category=${encodeURIComponent(category)}&limit=2000`)
      .then(r => r.json())
      .then(j => setJenisPekerjaan2List((j.data || []).map((x: any) => x.name)))
      .catch(() => setJenisPekerjaan2List([]));
  }, [selectedTargetRow, formData.bagian, refreshKey]);

  // Filter target rows for Realisasi dropdown
  useEffect(() => {
    if (!data) return;
    const q = targetSearchQuery.toLowerCase();
    const filtered = data.filter(row =>
      (row.nama_karyawan || '').toLowerCase().includes(q) ||
      (row.no_order || '').toLowerCase().includes(q) ||
      (row.nama_order || '').toLowerCase().includes(q) ||
      (row.tgl || '').includes(q)
    ).slice(0, 30);
    setTargetRowOptions(filtered);
  }, [targetSearchQuery, data]);

  // Close target dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (targetDropdownRef.current && !targetDropdownRef.current.contains(e.target as Node)) {
        setIsTargetDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // When bagian changes, filter nama options by bagian mapping
  useEffect(() => {
    if (!bagianFilter) {
      setNamaOptions(allEmployeeNames);
    } else {
      const names = karyawanByBagian[bagianFilter] || [];
      setNamaOptions(names);
      setNamaKaryawanFilter(prev => names.includes(prev) ? prev : '');
    }
  }, [bagianFilter, allEmployeeNames, karyawanByBagian]);

  const handleResetFilter = useCallback(() => {
    setBagianFilter('');
    setNamaKaryawanFilter('');
    setNoOrderFilter('');
    setBelumRealisasiFilter(false);
    setPage(1);
  }, []);

  const checkCopyStatus = useCallback(async () => {
    if (!canCopyJadwal) return;
    try {
      const res = await fetch(`/api/jurnal-harian-produksi/copy-jadwal`);
      const json = await res.json();
      if (json.success) {
        setHasCopiedToday(json.hasCopiedToday);
        setCanRevert(json.canRevert);
      }
    } catch {}
  }, [canCopyJadwal]);

  useEffect(() => {
    checkCopyStatus();
  }, [checkCopyStatus]);

  const handleCopyJadwal = async () => {
    if (!copyFrom || !copyTo) {
      setCopyModalError('Tanggal dari dan ke wajib diisi.');
      return;
    }
    setCopyModalError('');
    setIsCopyingJadwal(true);
    try {
      const fmtDate = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      const res = await fetch('/api/jurnal-harian-produksi/copy-jadwal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: fmtDate(copyFrom),
          to: fmtDate(copyTo),
          ...(copyBagian.length > 0 ? { bagian: copyBagian } : {}),
          ...(copyKaryawan.length > 0 ? { namaKaryawan: copyKaryawan } : {}),
        })
      });
      const result = await res.json();
      if (result.success) {
        showMessage('success', `Berhasil menyalin ${result.count} jadwal ke ${fmtDate(copyTo)}.`);
        setShowCopyModal(false);
        setCopyKaryawan([]);
        setCopyBagian([]);
        setCopyKaryawanSearch('');
        setCopyBagianSearch('');
        setCopyModalError('');
        setRefreshKey(k => k + 1);

        checkCopyStatus();
      } else {
        setCopyModalError(result.error || 'Gagal menyalin jadwal');
      }
    } catch (err: any) {
      setCopyModalError('Terjadi kesalahan sistem');
    } finally {
      setIsCopyingJadwal(false);
    }
  };

  const handleRevertCopyJadwal = async () => {
    setIsReverting(true);
    try {
      const res = await fetch('/api/jurnal-harian-produksi/copy-jadwal/revert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await res.json();
      if (result.success) {
        showMessage('success', `Berhasil membatalkan penyalinan. ${result.count} data jadwal telah dihapus.`);
        setRefreshKey(k => k + 1);
        checkCopyStatus();
        router.refresh();
      } else {
        showMessage('error', result.error || 'Gagal membatalkan penyalinan');
      }
    } catch (err: any) {
      showMessage('error', 'Terjadi kesalahan sistem');
    } finally {
      setIsReverting(false);
    }
  };

  const triggerRevertConfirm = () => {
    setDialogConfig({
      isOpen: true,
      type: 'confirm',
      title: 'Konfirmasi Revert Copy Jadwal',
      message: 'Apakah Anda yakin ingin membatalkan penyalinan jadwal terakhir? Tindakan ini akan menghapus semua data jadwal hasil copy terakhir.',
      confirmLabel: 'Ya, Batalkan Copy',
      onConfirm: () => {
        closeDialog();
        handleRevertCopyJadwal();
      }
    });
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => setActionMessage(null), 3000);
  };

  const handleSaveKeterangan = useCallback(async (id: number | string, value: string): Promise<boolean> => {
    try {
      // Ambil updated_at dari data lokal untuk optimistic concurrency check
      const currentRow = data?.find((r: any) => r.id === id);
      const updated_at = currentRow?.updated_at ?? null;

      const res = await fetch('/api/jurnal-harian-produksi', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updated_at, keterangan: value }),
      });
      if (!res.ok) return false;
      const result = await res.json();
      if (result.success) {
        // Update data lokal tanpa full refresh
        setData(prev => prev ? prev.map(r => r.id === id ? { ...r, keterangan: value } : r) : prev);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [data]);

  // State paste mode untuk kolom keterangan
  const [keteranganPasteActive, setKeteranganPasteActive] = useState(false);
  const [keteranganCopiedValue, setKeteranganCopiedValue] = useState<string | null>(null);

  const handleKeteranganCopy = useCallback((value: string) => {
    setKeteranganCopiedValue(value);
    setKeteranganPasteActive(true);
  }, []);

  const handleKeteranganPasteDone = useCallback(() => {
    setKeteranganPasteActive(false);
    setKeteranganCopiedValue(null);
  }, []);

  // Tekan Escape untuk keluar dari mode paste keterangan
  useEffect(() => {
    if (!keteranganPasteActive) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleKeteranganPasteDone();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [keteranganPasteActive, handleKeteranganPasteDone]);

  const startAdd = useCallback(() => {
    setActiveTab('form');
    // Jika tidak bisa input target tapi bisa realisasi, langsung ke tab realisasi
    setFormSubTab(!canInputTarget && canInputRealisasi ? 'realisasi' : 'target');
    setIsAdding(true);
    setEditingId(null);
    setSelectedTargetRow(null);
    setTargetSearchQuery('');
    setFormData({ tgl: new Date().toISOString().split('T')[0] });
    setIsMultiRealisasiMode(false);
    setMultiRealisasi([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [canInputTarget, canInputRealisasi]);

  const startEdit = useCallback((row: any) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const isBeforeTomorrow = row.tgl && row.tgl < tomorrowStr;
    const isPenjadwalan = userRole?.toLowerCase() === 'admin penjadwalan';

    const proceedEdit = () => {
      setActiveTab('form');
      // Admin Realisasi: langsung ke tab Realisasi. Admin Penjadwalan: ke tab Target.
      setFormSubTab(canInputRealisasi ? 'realisasi' : 'target');
      setIsAdding(false);
      setEditingId(row.id);
      setSelectedTargetRow(null);
      const formattedData = { ...row };
      if (formattedData.tgl && formattedData.tgl.includes('T')) {
        formattedData.tgl = formattedData.tgl.split('T')[0];
      }
      setFormData(formattedData);
      setIsMultiRealisasiMode(false);
      setMultiRealisasi([]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (isPenjadwalan && isBeforeTomorrow) {
      setDialogConfig({
        isOpen: true,
        type: 'confirm',
        title: 'Peringatan Edit Jadwal',
        message: `Anda sedang mencoba mengedit jadwal untuk tanggal ${formatIndoDateStr(row.tgl)} (sebelum besok). Perubahan pada data hari ini atau masa lalu dapat memengaruhi laporan realisasi. Apakah Anda yakin ingin melanjutkan?`,
        confirmLabel: 'Ya, Lanjutkan',
        onConfirm: () => {
          closeDialog();
          proceedEdit();
        }
      });
    } else {
      proceedEdit();
    }
  }, [canInputRealisasi, userRole]);

  const cancelForm = useCallback(() => {
    setActiveTab('list');
    setIsAdding(false);
    setEditingId(null);
    setFormData({});
    setSelectedTargetRow(null);
    setTargetSearchQuery('');
    setIsMultiRealisasiMode(false);
    setMultiRealisasi([]);
  }, []);

  const handleRealisasiChange = (index: number, field: string, value: any) => {
    if (isMultiRealisasiMode) {
      setMultiRealisasi(prev => {
        const next = [...prev];
        next[index] = { ...next[index], [field]: value };
        return next;
      });
    } else {
      setFormData((prev: any) => ({ ...prev, [field]: value }));
    }
  };

  const addCopyFromLastRealisasi = useCallback(() => {
    setMultiRealisasi(prev => {
      if (prev.length === 0) return [{}];
      const source = prev[prev.length - 1];
      const fieldsToCopy = ['no_order_2', 'nama_order_2', 'nama_order_manual_2', 'jenis_pekerjaan_2', 'bahan_kertas', 'jml_plate', 'warna', 'inscheet', 'jam'];
      const copied: Record<string, any> = {};
      for (const f of fieldsToCopy) {
        copied[f] = source[f] || '';
      }
      return [...prev, { ...copied }];
    });
  }, []);

  const startInputRealisasi = useCallback((row: any) => {
    setActiveTab('form');
    setFormSubTab('realisasi');
    setIsAdding(false);
    setEditingId(row.id);
    setSelectedTargetRow(row);
    setTargetSearchQuery('');
    
    const formattedData = { ...row };
    if (formattedData.tgl && formattedData.tgl.includes('T')) {
      formattedData.tgl = formattedData.tgl.split('T')[0];
    }

    setFormData({ ...formattedData });
    setIsMultiRealisasiMode(true);
    setMultiRealisasi([{
      target: row.target || '',
      realisasi: row.realisasi || '',
      no_order_2: row.no_order_2 || row.no_order || '',
      nama_order_2: row.nama_order_2 || row.nama_order || '',
      nama_order_manual_2: row.nama_order_manual_2 || '',
      jenis_pekerjaan_2: row.jenis_pekerjaan_2 || row.jenis_pekerjaan || '',
      bahan_kertas: row.bahan_kertas || '',
      jml_plate: row.jml_plate || '',
      warna: row.warna || '',
      inscheet: row.inscheet || '',
      rijek: row.rijek || '',
      jam: row.jam || SHIFT_JAM[String(row.shift)] || '',
      kendala: row.kendala || ''
    }]);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const startCopy = useCallback((row: any) => {
    setActiveTab('form');
    setFormSubTab('target');
    setIsAdding(true);
    setEditingId(null);
    setSelectedTargetRow(null);
    
    const formattedData = { ...row };
    delete formattedData.id;
    if (formattedData.tgl && formattedData.tgl.includes('T')) {
      formattedData.tgl = formattedData.tgl.split('T')[0];
    }
    
    // Clear realisasi fields
    formattedData.realisasi = '';
    formattedData.no_order_2 = '';
    formattedData.nama_order_2 = '';
    formattedData.jenis_pekerjaan_2 = '';
    formattedData.bahan_kertas = '';
    formattedData.jml_plate = '';
    formattedData.warna = '';
    formattedData.inscheet = '';
    formattedData.rijek = '';
    formattedData.jam = '';
    formattedData.kendala = '';
    formattedData.nama_order_manual = '';
    formattedData.nama_order_manual_2 = '';

    setFormData(formattedData);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const performSave = async () => {
    setIsSaving(true);
    try {
      const isEdit = editingId !== null;

      if (isMultiRealisasiMode) {
        const payload = {
          action: 'input_multi_realisasi',
          id: editingId,
          updated_at: (formData as any).updated_at || null,
          baseData: formData,
          multiRealisasi: multiRealisasi
        };
        const res = await fetch('/api/jurnal-harian-produksi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (result.success) {
          showMessage('success', 'Data realisasi berhasil disimpan');
          cancelForm();
          setRefreshKey(k => k + 1);
          router.refresh();
        } else {
          showMessage('error', result.error || 'Gagal menyimpan data');
        }
        return;
      }

      const method = isEdit ? 'PUT' : 'POST';
      let payloadToSubmit: any = { ...formData };
      
      if (isEdit) {
        if (canInputTarget && !canInputRealisasi) {
          const TARGET_FIELDS = ['tgl', 'shift', 'bagian', 'nama_karyawan', 'posisi', 'absensi', 'no_order', 'nama_order', 'jenis_pekerjaan', 'keterangan', 'target', 'nama_order_manual'];
          payloadToSubmit = {};
          TARGET_FIELDS.forEach(f => { if (formData[f] !== undefined) payloadToSubmit[f] = formData[f] });
        } else if (canInputRealisasi && !canInputTarget) {
          const REALISASI_FIELDS = [
            'no_order_2', 'nama_order_2', 'jenis_pekerjaan_2', 'bahan_kertas', 'jml_plate',
            'warna', 'inscheet', 'rijek', 'jam', 'kendala', 'realisasi', 'nama_order_manual_2',
            'no_order', 'nama_order', 'jenis_pekerjaan', 'target', 'nama_order_manual', 'keterangan',
          ];
          payloadToSubmit = {};
          REALISASI_FIELDS.forEach(f => { if (formData[f] !== undefined) payloadToSubmit[f] = formData[f] });
        }
        // Sync kolom target dari nilai realisasi — berlaku untuk semua role saat edit di tab realisasi
        if (formSubTab === 'realisasi') {
          payloadToSubmit.no_order = formData.no_order_2 || formData.no_order || '';
          payloadToSubmit.nama_order = formData.nama_order_manual_2 || formData.nama_order_2 || formData.nama_order_manual || formData.nama_order || '';
          payloadToSubmit.jenis_pekerjaan = formData.jenis_pekerjaan_2 || formData.jenis_pekerjaan || '';
        }
      }
      
      const payload = isEdit ? { id: editingId, updated_at: (formData as any).updated_at || null, ...payloadToSubmit } : { action: 'insert_single', data: payloadToSubmit };
      
      const res = await fetch('/api/jurnal-harian-produksi', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        showMessage('success', isEdit ? 'Data berhasil diupdate' : 'Data berhasil ditambahkan');
        cancelForm();
        setRefreshKey(k => k + 1);
        router.refresh();
      } else {
        if (res.status === 409) {
          showMessage('error', result.error || 'Konflik data. Silakan reload halaman.');
          return;
        }
        showMessage('error', result.error || 'Gagal menyimpan data');
      }
    } catch (err: any) {
      showMessage('error', 'Terjadi kesalahan sistem');
    } finally {
      setIsSaving(false);
    }
  };

  const saveForm = async () => {
    if (isSaving) return;

    // Cek realisasi kosong saat user sudah input jenis pekerjaan
    if (formSubTab === 'realisasi') {
      let hasEmptyRealisasi = false;
      let detailMsg = '';

      if (isMultiRealisasiMode) {
        const emptyRows = multiRealisasi
          .map((r, i) => ({ r, i }))
          .filter(({ r }) => (r.jenis_pekerjaan_2 || r.no_order_2) && !r.realisasi);
        if (emptyRows.length > 0) {
          hasEmptyRealisasi = true;
          detailMsg = `${emptyRows.length} baris realisasi memiliki jenis pekerjaan tetapi Realisasi masih kosong.`;
        }
      } else {
        if ((formData.jenis_pekerjaan_2 || formData.no_order_2) && !formData.realisasi) {
          hasEmptyRealisasi = true;
          detailMsg = 'Jenis pekerjaan sudah diisi tetapi Realisasi masih kosong.';
        }
      }

      if (hasEmptyRealisasi) {
        pendingSaveRef.current = performSave;
        setDialogConfig({
          isOpen: true,
          type: 'confirm',
          title: 'Realisasi Kosong',
          message: `${detailMsg}\n\nTetap simpan data?`,
          confirmLabel: 'Ya, Simpan',
          onConfirm: () => {
            closeDialog();
            pendingSaveRef.current?.();
            pendingSaveRef.current = null;
          }
        });
        return;
      }
    }

    await performSave();
  };

  const handleDelete = async (id: number | string) => {
    if (!window.confirm('Yakin ingin menghapus data ini?')) return;
    try {
      const res = await fetch('/api/jurnal-harian-produksi', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] })
      });
      if (res.ok) {
        showMessage('success', 'Data berhasil dihapus');
        setRefreshKey(k => k + 1);
        router.refresh();
      }
    } catch (err) {}
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Yakin ingin menghapus ${selectedIds.size} data terpilih?`)) return;
    try {
      const res = await fetch('/api/jurnal-harian-produksi', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      });
      if (res.ok) {
        showMessage('success', `${selectedIds.size} data berhasil dihapus`);
        setSelectedIds(new Set());
        setRefreshKey(k => k + 1);
        router.refresh();
      }
    } catch (err) {}
  };

  const [showShiftModal, setShowShiftModal] = useState(false);
  const [bulkShiftValue, setBulkShiftValue] = useState('1');

  const handleBulkShift = async () => {
    if (selectedIds.size === 0) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/jurnal-harian-produksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_update_shift',
          ids: Array.from(selectedIds),
          shift: bulkShiftValue
        })
      });
      const json = await res.json();
      if (json.success) {
        showMessage('success', `Shift ${selectedIds.size} data berhasil diubah ke Shift ${bulkShiftValue}`);
        setSelectedIds(new Set());
        setShowShiftModal(false);
        setRefreshKey(k => k + 1);
        router.refresh();
      } else {
        showMessage('error', json.error || 'Gagal mengubah shift');
      }
    } catch (err) {
      showMessage('error', 'Terjadi kesalahan sistem');
    } finally {
      setIsSaving(false);
    }
  };

  const fetchTrash = async (pg = 1) => {
    setTrashLoading(true);
    try {
      const res = await fetch(`/api/jurnal-harian-produksi/trash?page=${pg}&limit=50`);
      const json = await res.json();
      if (json.success) {
        setTrashData(json.data || []);
        setTrashTotal(json.total || 0);
        setTrashPage(pg);
        setSelectedTrashIds(new Set());
        setIsSelectedAllTrash(false);
      }
    } catch {} finally { setTrashLoading(false); }
  };

  const handleOpenTrash = () => { setShowTrashModal(true); fetchTrash(1); };

  const handleRestore = async () => {
    if (selectedTrashIds.size === 0) return;
    const confirmMsg = isSelectedAllTrash 
      ? `Restore SEMUA ${trashTotal} data yang terhapus?` 
      : `Restore ${selectedTrashIds.size} data yang terhapus?`;
    if (!window.confirm(confirmMsg)) return;
    setIsRestoring(true);
    try {
      const res = await fetch('/api/jurnal-harian-produksi/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isSelectedAllTrash ? { all: true } : { ids: Array.from(selectedTrashIds) })
      });
      const json = await res.json();
      if (json.success) {
        showMessage('success', `${json.restoredCount} data berhasil direstore`);
        setIsSelectedAllTrash(false);
        fetchTrash(trashPage);
        setRefreshKey(k => k + 1);
      } else {
        showMessage('error', json.error || 'Gagal restore data');
      }
    } catch { showMessage('error', 'Terjadi kesalahan'); }
    finally { setIsRestoring(false); }
  };

  const handlePermanentDelete = async () => {
    if (selectedTrashIds.size === 0) return;
    const confirmMsg = isSelectedAllTrash 
      ? `PERINGATAN: Hapus permanen SEMUA ${trashTotal} data ini?\nTindakan ini tidak dapat dibatalkan!` 
      : `PERINGATAN: Hapus permanen ${selectedTrashIds.size} data ini?\nTindakan ini tidak dapat dibatalkan!`;
    if (!window.confirm(confirmMsg)) return;
    setIsDeletingPermanently(true);
    try {
      const res = await fetch('/api/jurnal-harian-produksi/trash', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isSelectedAllTrash ? { all: true } : { ids: Array.from(selectedTrashIds) })
      });
      const json = await res.json();
      if (json.success) {
        showMessage('success', `${json.deletedCount} data berhasil dihapus permanen`);
        setIsSelectedAllTrash(false);
        fetchTrash(trashPage);
        // Refresh tabel utama (meski trash, terkadang update data perlu reset context)
        setRefreshKey(k => k + 1);
      } else {
        showMessage('error', json.error || 'Gagal menghapus permanen data');
      }
    } catch { showMessage('error', 'Terjadi kesalahan sistem'); }
    finally { setIsDeletingPermanently(false); }
  };

  const columns = useMemo(() => [
    {
      id: 'actions',
      header: 'Aksi',
      size: 140,
      meta: { align: 'center', headerBg: '#f8fafc', sticky: true },
      cell: ({ row }: any) => (
        <div className="flex items-center justify-center gap-2">
           {canInputTarget && (
             <button type="button" title="Duplikat Jadwal" onClick={(e) => { e.stopPropagation(); startCopy(row.original); }} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"><Copy size={14} /></button>
           )}
           {canInputRealisasi && (!row.original.no_order_2 && !row.original.jenis_pekerjaan_2) && (
             <button type="button" title="Input Realisasi" onClick={(e) => { e.stopPropagation(); startInputRealisasi(row.original); }} className="p-1.5 text-sky-600 hover:bg-sky-50 rounded transition-colors"><PlusSquare size={14} /></button>
           )}
           <button type="button" title="Edit Jurnal" onClick={(e) => { e.stopPropagation(); startEdit(row.original); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"><Edit2 size={14} /></button>
           <button type="button" title="Hapus Jurnal" onClick={(e) => { e.stopPropagation(); handleDelete(row.original.id); }} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"><Trash2 size={14} /></button>
        </div>
      )
    },
    {
      accessorKey: 'posisi',
      header: 'Posisi',
      size: columnWidths.posisi,
      meta: { headerBg: '#79f2c0' },
      cell: ({ getValue, row }: any) => <span className={`font-medium tracking-tight ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>{String(getValue() || '-')}</span>
    },
    {
      accessorKey: 'absensi',
      header: 'Abs.',
      size: columnWidths.absensi,
      meta: { headerBg: '#79f2c0' },
      cell: ({ getValue, row }: any) => <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>{Number(getValue() || 0)}</span>
    },
    { 
      accessorKey: 'tgl', 
      header: 'Tanggal',
      size: columnWidths.tgl,
      meta: { headerBg: '#79f2c0' },
      cell: ({ getValue, row }: any) => <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>{formatIndoDateStr(getValue() as string)}</span>
    },
    { 
      accessorKey: 'shift', 
      header: 'Sift',
      size: columnWidths.shift,
      meta: { headerBg: '#fef9c3' },
      cell: ({ getValue, row }: any) => <span className={`font-bold tracking-tight ${row.getIsSelected() ? 'text-green-600' : 'text-gray-700'}`}>{String(getValue() || '-')}</span>
    },
    { 
      accessorKey: 'nama_karyawan', 
      header: 'Nama Karyawan',
      size: columnWidths.nama_karyawan,
      meta: { headerBg: '#79f2c0' },
      cell: ({ getValue, row }: any) => <span className={`font-semibold tracking-tight ${row.getIsSelected() ? 'text-green-900' : 'text-gray-800'}`}>{String(getValue() || '-')}</span>
    },
    { 
      accessorKey: 'no_order', 
      header: 'NO. Order (PPIC)',
      size: columnWidths.no_order,
      meta: { headerBg: '#fef9c3' },
      cell: ({ getValue, row }: any) => <span className={`font-bold transition-colors truncate ${row.getIsSelected() ? 'text-green-600' : 'text-gray-600'}`}>{String(getValue() || '-')}</span>
    },
    { 
      accessorKey: 'nama_order', 
      header: 'Nama Order',
      size: columnWidths.nama_order,
      meta: { headerBg: '#fef9c3' },
      cell: ({ getValue, row }: any) => <span className={`font-semibold tracking-tight ${row.getIsSelected() ? 'text-green-900' : 'text-gray-800'}`}>{String(getValue() || '-')}</span>
    },
    { 
      accessorKey: 'jenis_pekerjaan', 
      header: 'Jenis Pekerjaan',
      size: columnWidths.jenis_pekerjaan,
      meta: { headerBg: '#fef9c3' },
      cell: ({ getValue }: any) => (
        <span className="text-[12px] font-bold bg-green-50 text-green-700 px-3 py-1 border border-green-100 rounded-lg block w-fit truncate tracking-tight">
          {String(getValue() || '-')}
        </span>
      )
    },
    { 
      accessorKey: 'keterangan', 
      header: 'Keterangan',
      size: columnWidths.keterangan,
      meta: { headerBg: '#fef9c3' },
      cell: ({ row }: any) => (
        <KeteranganEditableCell
          row={row.original}
          onSave={handleSaveKeterangan}
          canEdit={canInputTarget || canInputRealisasi}
          pasteActive={keteranganPasteActive}
          copiedValue={keteranganCopiedValue}
          onCopyValue={handleKeteranganCopy}
          onPasteDone={handleKeteranganPasteDone}
        />
      )
    },
    { 
      accessorKey: 'target', 
      header: 'Target',
      size: columnWidths.target,
      meta: { align: 'right', headerBg: '#fef9c3' },
      cell: ({ getValue, row }: any) => {
        const val = getValue();
        let display = '0';
        const isNum = val !== null && val !== undefined && val !== '' && !isNaN(Number(val));
        if (val !== null && val !== undefined && val !== '') {
          display = isNum ? Number(val).toLocaleString('id-ID') : String(val);
        }
        return (
          <div className={`font-bold whitespace-pre-wrap ${isNum ? 'tabular-nums text-right' : 'text-left'} ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>
            {display}
          </div>
        );
      }
    },
    { 
      accessorKey: 'realisasi', 
      header: 'Realisasi',
      size: columnWidths.realisasi,
      meta: { align: 'right', headerBg: '#bae6fd' },
      cell: ({ getValue, row }: any) => {
        const val = getValue();
        let display = '0';
        const isNum = val !== null && val !== undefined && val !== '' && !isNaN(Number(val));
        if (val !== null && val !== undefined && val !== '') {
          display = isNum ? Number(val).toLocaleString('id-ID') : String(val);
        }
        return (
          <div className={`font-semibold whitespace-pre-wrap ${isNum ? 'tabular-nums text-right' : 'text-left'} ${row.getIsSelected() ? 'text-green-700' : 'text-black'}`}>
            {display}
          </div>
        );
      }
    },
    {
      accessorKey: 'no_order_2',
      header: 'No. Order',
      size: columnWidths.no_order_2,
      meta: { headerBg: '#bae6fd' },
      cell: ({ getValue, row }: any) => <span className={`font-bold transition-colors truncate ${row.getIsSelected() ? 'text-green-600' : 'text-gray-600'}`}>{String(getValue() || '-')}</span>
    },
    {
      accessorKey: 'nama_order_2',
      header: 'Nama Order',
      size: columnWidths.nama_order_2,
      meta: { headerBg: '#bae6fd' },
      cell: ({ getValue, row }: any) => <span className={`font-semibold tracking-tight ${row.getIsSelected() ? 'text-green-900' : 'text-gray-800'}`}>{String(getValue() || '-')}</span>
    },
    {
      accessorKey: 'jenis_pekerjaan_2',
      header: 'Jenis Pekerjaan',
      size: columnWidths.jenis_pekerjaan_2,
      meta: { headerBg: '#bae6fd' },
      cell: ({ getValue }: any) => (
        <span className="text-[12px] font-bold bg-sky-50 text-sky-700 px-3 py-1 border border-sky-100 rounded-lg block w-fit truncate tracking-tight">
          {String(getValue() || '-')}
        </span>
      )
    },
    {
      accessorKey: 'bahan_kertas',
      header: 'Bahan Kertas',
      size: columnWidths.bahan_kertas,
      meta: { headerBg: '#bae6fd' },
      cell: ({ getValue, row }: any) => <span className={`font-medium tracking-tight ${row.getIsSelected() ? 'text-green-800' : 'text-gray-600'}`}>{String(getValue() || '-')}</span>
    },
    {
      accessorKey: 'jml_plate',
      header: 'Jml. Plate',
      size: columnWidths.jml_plate,
      meta: { align: 'right', headerBg: '#bae6fd' },
      cell: ({ getValue, row }: any) => {
        const val = getValue();
        let display = '0';
        const isNum = val !== null && val !== undefined && val !== '' && !isNaN(Number(val));
        if (val !== null && val !== undefined && val !== '') {
          display = isNum ? Number(val).toLocaleString('id-ID') : String(val);
        }
        return (
          <div className={`font-bold whitespace-pre-wrap ${isNum ? 'tabular-nums text-right' : 'text-left'} ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>
            {display}
          </div>
        );
      }
    },
    {
      accessorKey: 'warna',
      header: 'Warna',
      size: columnWidths.warna,
      meta: { headerBg: '#bae6fd' },
      cell: ({ getValue, row }: any) => <span className={`font-medium tracking-tight ${row.getIsSelected() ? 'text-green-800' : 'text-gray-600'}`}>{String(getValue() || '-')}</span>
    },
    {
      accessorKey: 'inscheet',
      header: 'Inscheet',
      size: columnWidths.inscheet,
      meta: { align: 'right', headerBg: '#bae6fd' },
      cell: ({ getValue, row }: any) => {
        const val = getValue();
        let display = '0';
        const isNum = val !== null && val !== undefined && val !== '' && !isNaN(Number(val));
        if (val !== null && val !== undefined && val !== '') {
          display = isNum ? Number(val).toLocaleString('id-ID') : String(val);
        }
        return (
          <div className={`font-bold whitespace-pre-wrap ${isNum ? 'tabular-nums text-right' : 'text-left'} ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>
            {display}
          </div>
        );
      }
    },
    {
      accessorKey: 'rijek',
      header: 'Rijek',
      size: columnWidths.rijek,
      meta: { align: 'right', headerBg: '#bae6fd' },
      cell: ({ getValue, row }: any) => {
        const val = getValue();
        let display = '0';
        const isNum = val !== null && val !== undefined && val !== '' && !isNaN(Number(val));
        if (val !== null && val !== undefined && val !== '') {
          display = isNum ? Number(val).toLocaleString('id-ID') : String(val);
        }
        return (
          <div className={`font-bold whitespace-pre-wrap ${isNum ? 'tabular-nums text-right' : 'text-left'} ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>
            {display}
          </div>
        );
      }
    },
    {
      accessorKey: 'jam',
      header: 'Jam',
      size: columnWidths.jam,
      meta: { headerBg: '#bae6fd' },
      cell: ({ getValue, row }: any) => <span className={`font-bold tabular-nums ${row.getIsSelected() ? 'text-green-700' : 'text-gray-700'}`}>{String(getValue() || '-')}</span>
    },
    {
      accessorKey: 'kendala',
      header: 'Kendala',
      size: columnWidths.kendala,
      meta: { headerBg: '#bae6fd' },
      cell: ({ getValue, row }: any) => <span className={`font-medium truncate block ${row.getIsSelected() ? 'text-green-800' : 'text-gray-500'}`}>{String(getValue() || '-')}</span>
    },
    {
      accessorKey: 'bagian',
      header: 'Bagian',
      size: columnWidths.bagian,
      meta: { headerBg: '#79f2c0' },
      cell: ({ getValue, row }: any) => <span className={`font-medium truncate block tracking-tight ${row.getIsSelected() ? 'text-green-800' : 'text-gray-600'}`}>{String(getValue() || '-')}</span>
    }
  ], [columnWidths, page, handleSaveKeterangan, canInputTarget, canInputRealisasi, keteranganPasteActive, keteranganCopiedValue, handleKeteranganCopy, handleKeteranganPasteDone, data]);

  const handleResize = useCallback((widths: any) => {
    setColumnWidths(widths);
    localStorage.setItem('jurnal_columnWidths_v2', JSON.stringify(widths));
  }, []);

  const handleSelection = useCallback((id: string | number, e?: React.MouseEvent) => {
    // Hanya proses seleksi baris jika ada modifier keys yang ditekan (Ctrl / Shift)
    const isCtrl = e?.ctrlKey || e?.metaKey;
    const isShift = e?.shiftKey;

    setSelectedIds(prev => {
        const next = new Set(prev);

        if (!isCtrl && !isShift) {
            // Klik biasa:
            // Jika baris tersebut sudah terpilih dan merupakan satu-satunya yang terpilih, maka batalkan pilihan.
            if (next.has(id) && next.size === 1) {
                next.clear();
            } else {
                // Jika tidak, bersihkan semua pilihan lalu pilih baris ini saja.
                next.clear();
                next.add(id);
            }
        } else if (isShift && lastSelectedId !== null && data) {
            const startIdx = data.findIndex(d => d.id === lastSelectedId);
            const endIdx = data.findIndex(d => d.id === id);
            
            if (startIdx !== -1 && endIdx !== -1) {
                const start = Math.min(startIdx, endIdx);
                const end = Math.max(startIdx, endIdx);
                
                if (!isCtrl) next.clear(); 
                
                for (let i = start; i <= end; i++) {
                    next.add(data[i].id);
                }
            }
        } else if (isCtrl) {
            if (next.has(id)) next.delete(id);
            else next.add(id);
        }
        
        setLastSelectedId(id);
        return next;
    });
  }, [data, lastSelectedId]);

  const handleExportExcel = () => {
    setSelectedExportYear('all');
    setShowYearModal(true);
  };

  const startExportProcess = async (year: string) => {
    if (isExporting) return;
    setIsExporting(true);
    setExportProgress(0);
    setExportStatusText('Menghubungkan ke database...');

    let progress = 0;
    const progressInterval = setInterval(() => {
      if (progress < 90) {
        if (progress < 30) {
          progress += Math.floor(Math.random() * 5) + 5; // Jump by 5-9%
        } else if (progress < 60) {
          progress += Math.floor(Math.random() * 3) + 2; // Jump by 2-4%
        } else if (progress < 80) {
          progress += 1; // Jump by 1%
        } else {
          progress += 0.5; // Jump by 0.5%
        }
        if (progress > 90) progress = 90;
        
        if (progress < 20) {
          setExportStatusText('Mengambil data dari database...');
        } else if (progress < 55) {
          setExportStatusText(
            year === 'all'
              ? `Membaca ${(yearsCount['all'] || 0).toLocaleString('id-ID')} data jurnal...`
              : `Membaca ${(yearsCount[year] || 0).toLocaleString('id-ID')} data jurnal tahun ${year}...`
          );
        } else if (progress < 80) {
          setExportStatusText('Menyusun Workbook & Tanggal (ExcelJS)...');
        } else {
          setExportStatusText('Menyelesaikan file ekspor...');
        }
        setExportProgress(Math.floor(progress));
      }
    }, 600);

    try {
      const urlParams = year !== 'all' ? `?year=${year}` : '';
      const res = await fetch(`/api/export-jurnal${urlParams}`);
      if (res.ok) {
        clearInterval(progressInterval);
        setExportProgress(100);
        setExportStatusText('Ekspor selesai! Mengunduh berkas...');
        
        // Tunggu sebentar agar animasi progress 100% selesai terlihat
        await new Promise((resolve) => setTimeout(resolve, 800));

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const downloadFilename = year === 'all'
          ? 'JADWAL PRODUKSI HARIAN.xlsx'
          : `JADWAL PRODUKSI HARIAN ${year}.xlsx`;

        a.download = downloadFilename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        clearInterval(progressInterval);
        alert('Gagal mengambil data untuk diexport');
      }
    } catch {
      clearInterval(progressInterval);
      alert('Gagal export excel');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in duration-700 overflow-hidden">
      {/* TABS Navigation */}
      <div className="flex gap-6 border-b border-gray-100 shrink-0 px-2 mt-1">
        <button 
          onClick={() => { setActiveTab('list'); cancelForm(); }} 
          className={`flex items-center gap-1.5 pb-3 px-2 text-[13px] font-bold border-b-2 transition-all ${activeTab === 'list' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <ClipboardList size={14} />
          Daftar Jurnal
        </button>
        <button 
          onClick={() => { if(activeTab !== 'form') startAdd(); }} 
          className={`flex items-center gap-1.5 pb-3 px-2 text-[13px] font-bold border-b-2 transition-all ${activeTab === 'form' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          {editingId ? <Edit2 size={14} /> : <PlusSquare size={14} />}
          {editingId ? 'Edit Jurnal' : 'Tambah Jurnal'}
        </button>
      </div>

      {/* TAB CONTENT: LIST */}
      <div className={`flex-1 flex flex-col gap-4 overflow-hidden ${activeTab === 'list' ? 'flex' : 'hidden'}`}>
        {/* Top Filter Bar */}
        <div className="shrink-0 bg-white rounded-2xl border border-gray-100 px-4 py-3 shadow-sm shadow-green-900/5 relative z-50 overflow-visible">
          <div className="flex flex-wrap items-center gap-2">
            {/* Rentang Tanggal */}
            <div className="flex items-center gap-1.5 shrink-0">
              <DatePicker
                name="startDate"
                value={startDate}
                onChange={(d) => { setStartDate(d); setPage(1); }}
                customTrigger={(toggle) => (
                  <button type="button" onClick={toggle}
                    className="h-9 px-3 bg-gray-50 border border-gray-100 rounded-lg text-[11px] font-semibold text-gray-700 flex items-center gap-2 hover:border-green-300 hover:bg-white transition-all whitespace-nowrap min-w-[120px]">
                    <Filter size={12} className="text-gray-400 shrink-0" />
                    {startDate ? startDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : <span className="text-gray-300">Dari</span>}
                  </button>
                )}
              />
              <span className="text-gray-300 text-[11px] font-bold">—</span>
              <DatePicker
                name="endDate"
                value={endDate}
                onChange={(d) => { setEndDate(d); setPage(1); }}
                popupAlign="right"
                customTrigger={(toggle) => (
                  <button type="button" onClick={toggle}
                    className="h-9 px-3 bg-gray-50 border border-gray-100 rounded-lg text-[11px] font-semibold text-gray-700 flex items-center gap-2 hover:border-green-300 hover:bg-white transition-all whitespace-nowrap min-w-[120px]">
                    <Filter size={12} className="text-gray-400 shrink-0" />
                    {endDate ? endDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : <span className="text-gray-300">Sampai</span>}
                  </button>
                )}
              />
            </div>

            {/* divider */}
            <div className="w-px h-5 bg-gray-200 shrink-0" />

            {/* Bagian Filter */}
            <SearchableDropdown
              id="jurnal-bagian"
              value={bagianFilter}
              items={bagianOptions}
              allLabel="Semua Bagian"
              searchPlaceholder="Cari bagian..."
              triggerWidth="w-[160px]"
              panelWidth="w-[260px]"
              compact
              icon={<Filter size={13} className={bagianFilter ? 'text-green-600' : 'text-gray-400'} />}
              onChange={(val) => { setBagianFilter(val); setPage(1); }}
            />

            {/* Nama Karyawan Filter */}
            <SearchableDropdown
              id="jurnal-karyawan"
              value={namaKaryawanFilter}
              items={namaOptions}
              allLabel="Semua Karyawan"
              searchPlaceholder="Cari karyawan..."
              triggerWidth="w-[170px]"
              panelWidth="w-[260px]"
              compact
              icon={<Filter size={13} className={namaKaryawanFilter ? 'text-green-600' : 'text-gray-400'} />}
              onChange={(val) => { setNamaKaryawanFilter(val); setPage(1); }}
            />

            {/* Nama Order Filter */}
            <SearchableDropdown
              id="jurnal-no-order"
              value={noOrderFilter}
              items={sopdList.map(s => s.nama_order ? `${s.no_sopd} — ${s.nama_order}` : s.no_sopd)}
              allLabel="Semua Order"
              searchPlaceholder="Cari no. order..."
              triggerWidth="w-[190px]"
              panelWidth="w-[320px]"
              compact
              icon={<Filter size={13} className={noOrderFilter ? 'text-green-600' : 'text-gray-400'} />}
              onChange={(val) => { setNoOrderFilter(val.split(' — ')[0]); setPage(1); }}
            />

            {/* Belum Realisasi Toggle */}
            <button
              onClick={() => { setBelumRealisasiFilter(prev => !prev); setPage(1); }}
              className={`h-9 px-3 rounded-lg border transition-all flex items-center gap-2 text-[11px] font-bold shrink-0 ${belumRealisasiFilter ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-amber-100 hover:text-amber-500'}`}
            >
              <Filter size={13} />
              {belumRealisasiFilter ? 'Belum Realisasi' : 'Semua Status'}
            </button>

            {/* Reset — ikut filter */}
            <button
              onClick={() => { handleResetFilter(); setSearchQuery(''); }}
              className="h-9 px-3 bg-white hover:bg-rose-50 text-gray-400 hover:text-rose-600 border border-gray-100 hover:border-rose-100 rounded-lg transition-all flex items-center gap-1.5 text-[11px] font-bold shrink-0"
            >
              <RotateCcw size={13} />
              Reset
            </button>

            {/* divider + Export sendiri di kanan */}
            <div className="w-px h-5 bg-gray-200 shrink-0 ml-auto" />
            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="h-9 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100 hover:border-emerald-200 rounded-lg transition-all flex items-center gap-1.5 text-[11px] font-bold disabled:opacity-50 shrink-0"
            >
              {isExporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              {isExporting ? 'Proses...' : 'Export'}
            </button>
          </div>
        </div>
      <div className="flex-1 flex flex-col gap-3 overflow-hidden relative min-h-0">
        <div className="flex flex-wrap items-center gap-2 shrink-0 px-1">
          {/* Judul + icon */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shadow-sm">
              <ClipboardList size={14} />
            </div>
            <span className="text-[13px] font-bold text-gray-800 leading-none tracking-tight whitespace-nowrap">Jurnal Harian Produksi</span>
            <ViewActivityLogLink tableName="jurnal_harian_produksi" />
          </div>

          {/* Copy Jadwal / Status / Revert */}
          {canCopyJadwal && (
            <>
              <div className="w-px h-5 bg-gray-200 shrink-0" />
              <div className="flex items-center gap-1.5">
                {hasCopiedToday ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold" title="Penyalinan jadwal untuk hari ini sudah pernah dilakukan">
                    <CheckCircle2 size={11} className="text-emerald-600" />
                    <span>Jadwal disalin</span>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      const today = new Date();
                      const tomorrow = new Date(today);
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setCopyFrom(today);
                      setCopyTo(tomorrow);
                      setCopyBagian([]);
                      setCopyKaryawan([]);
                      setCopyModalError('');
                      setCopyBagianSearch('');
                      setCopyKaryawanSearch('');
                      setShowCopyModal(true);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg border border-emerald-700 transition-all shadow-sm shadow-emerald-100 animate-pulse"
                    title="Copy jadwal ke tanggal lain"
                  >
                    <Copy size={11} />
                    Copy Jadwal
                  </button>
                )}
                {canRevert && (
                  <button
                    onClick={triggerRevertConfirm}
                    disabled={isReverting}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-200 transition-all disabled:opacity-50"
                    title="Batalkan penyalinan jadwal terakhir"
                  >
                    {isReverting ? <Loader2 size={11} className="animate-spin" /> : <RotateCcw size={11} />}
                    Revert
                  </button>
                )}
              </div>
            </>
          )}

          {/* Trash — Super Admin only */}
          {isSuperAdmin && (
            <>
              <div className="w-px h-5 bg-gray-200 shrink-0" />
              <button
                onClick={handleOpenTrash}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold rounded-lg border border-rose-200 transition-all"
                title="Lihat data terhapus"
              >
                <Trash2 size={11} />
                Trash
              </button>
            </>
          )}

          {/* Contextual — bulk actions */}
          {selectedIds.size > 0 && (
            <>
              <div className="w-px h-5 bg-gray-200 shrink-0" />
              <button onClick={() => setShowShiftModal(true)} className="flex items-center gap-1.5 px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-600 text-[10px] font-bold rounded-lg border border-sky-200 transition-all animate-in fade-in zoom-in duration-200">
                <RotateCcw size={11} /> Ganti Shift
              </button>
              <div className="w-px h-5 bg-gray-200 shrink-0" />
              <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-bold rounded-lg border border-rose-200 transition-all animate-in fade-in zoom-in duration-200">
                <Trash2 size={11} /> Hapus {selectedIds.size}
              </button>
            </>
          )}

          {/* Action message */}
          {actionMessage && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold animate-in fade-in slide-in-from-left-2 duration-300 ${actionMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
              {actionMessage.type === 'success' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
              {actionMessage.text}
            </div>
          )}

          {/* Loading badge */}
          {loading && (data?.length || 0) > 0 && (
            <div className="text-[10px] font-bold text-green-600 flex items-center gap-1.5 bg-green-50 px-3 py-1 rounded-full border border-green-100 animate-pulse leading-none">
              <Loader2 size={11} className="animate-spin" />
              <span>Memuat...</span>
            </div>
          )}

          {/* Stop Copy */}
          <button
            onClick={handleKeteranganPasteDone}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] leading-none font-bold transition-all ${
              keteranganPasteActive
                ? 'opacity-100 visible bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                : 'opacity-0 invisible pointer-events-none'
            }`}
          >
            <X size={11} />
            Stop Copy (Esc)
          </button>

        </div>

        {/* Search bar — 1 baris penuh di antara toolbar dan tabel */}
        <div className="shrink-0">
          <SearchAndReload
            searchQuery={searchQuery}
            setSearchQuery={(v) => { setSearchQuery(v); setPage(1); }}
            onReload={() => setRefreshKey(k => k + 1)}
            loading={loading}
            compact
            placeholder="Cari karyawan, nomor order, atau nama pekerjaan..."
          />
        </div>

        {/* Subtotal bar — tampil saat filter aktif */}
        {(bagianFilter || namaKaryawanFilter || noOrderFilter || belumRealisasiFilter || debouncedQuery) && (
          <div className="shrink-0 bg-gradient-to-r from-emerald-50 to-sky-50 border border-emerald-100 rounded-xl px-4 py-2 flex items-center gap-6">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
              <Filter size={12} />
              <span>Subtotal</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-gray-400">Realisasi:</span>
                <span className="text-[12px] font-bold text-sky-700 tabular-nums">{totalRealisasi.toLocaleString('id-ID')}</span>
              </div>
              <div className="w-px h-4 bg-emerald-200"></div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-gray-400">Rijek:</span>
                <span className="text-[12px] font-bold text-amber-700 tabular-nums">{totalRijek.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 flex flex-col gap-5 overflow-hidden relative">
           {error ? (
             <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm shadow-green-900/5">
                <div className="w-20 h-20 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm shadow-rose-900/5">
                    <AlertCircle className="text-rose-500" size={40} />
                </div>
                <p className="text-lg font-bold text-gray-800 uppercase tracking-tight mb-2">Gagal Memuat Data</p>
                <p className="text-sm text-gray-400 font-medium mb-8 max-w-md">{error}</p>
                <button
                  onClick={() => setRefreshKey(k => k + 1)}
                  className="px-10 py-4 bg-green-600 text-white font-bold rounded-xl shadow-sm shadow-green-100 hover:bg-green-700 transition-all active:scale-95 uppercase tracking-widest text-[13px]"
                >
                  Coba Muat Ulang
                </button>
             </div>
           ) : (
             <>
               <DataTable
                 data={data || []}
                 columns={columns}
                 columnWidths={columnWidths}
                 onColumnWidthChange={handleResize}
                 isLoading={loading || data === null}
                 selectedIds={selectedIds}
                 onRowClick={handleSelection}
                 rowHeight="h-11"
               />
             </>
           )}
        </div>
        <TableFooter
          totalCount={totalCount}
          currentCount={data?.length || 0}
          label="baris data"
          selectedCount={selectedIds.size}
          onClearSelection={() => setSelectedIds(new Set())}
          loadTime={loadTime}
          page={page}
          totalPages={Math.ceil(totalCount / PAGE_SIZE) || 1}
          onPageChange={setPage}
        />
      </div> {/* CLOSES Table Area */}
      </div> {/* CLOSES activeTab === 'list' */}

      {/* TAB CONTENT: FORM */}
      <div className={`flex-1 flex flex-col gap-4 overflow-y-auto pr-2 pb-10 ${activeTab === 'form' ? 'flex' : 'hidden'}`}>
          {(isAdding || editingId !== null) && (
          <form onSubmit={(e) => { e.preventDefault(); saveForm(); }} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-in slide-in-from-top-4 fade-in duration-300">

            {userRole?.toLowerCase() === 'admin penjadwalan' && editingId !== null && formData.tgl && (() => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              const tomorrowStr = tomorrow.toISOString().split('T')[0];
              if (formData.tgl < tomorrowStr) {
                return (
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-800 animate-in fade-in duration-300">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[12px] font-bold">Peringatan: Mengedit Data Masa Lalu / Hari Ini</p>
                      <p className="text-[11px] mt-0.5 leading-relaxed font-medium">
                        Jadwal ini untuk tanggal <b>{formatIndoDateStr(formData.tgl)}</b> (sebelum besok). Mengubah data jadwal yang sudah berjalan dapat memengaruhi laporan hasil produksi dan realisasi harian.
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Sub-tab: Target / Realisasi - hanya tampil jika punya akses keduanya */}
            {canInputTarget && canInputRealisasi && (
              <div className="flex gap-1 mb-6 bg-gray-50 p-1 rounded-xl w-fit border border-gray-100">
                <button
                  type="button"
                  onClick={() => setFormSubTab('target')}
                  className={`px-5 py-2 text-[12px] font-bold rounded-lg transition-all ${formSubTab === 'target' ? 'bg-white text-emerald-700 shadow-sm border border-emerald-100' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  🗓 Target / Penjadwalan
                </button>
                <button
                  type="button"
                  onClick={() => setFormSubTab('realisasi')}
                  className={`px-5 py-2 text-[12px] font-bold rounded-lg transition-all ${formSubTab === 'realisasi' ? 'bg-white text-sky-700 shadow-sm border border-sky-100' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  📋 Realisasi / Hasil Produksi
                </button>
              </div>
            )}

            {/* ---- SUB-TAB: TARGET ---- */}
            {formSubTab === 'target' && (
              <div className="animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5 mb-6">
                  <span className="text-[13px] font-bold text-gray-700">Data Penjadwalan</span>
                  <div className="flex-1 h-px bg-gray-100"></div>
                  <span className="text-[11px] font-semibold text-yellow-700 bg-yellow-100 px-2.5 py-1 rounded-full">Jadwal Produksi</span>
                </div>
                {/* Grup 1: Tanggal */}
                <div className="mb-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-gray-600">Tanggal <span className="text-rose-400">*</span></label>
                      <DatePicker
                        name="tgl"
                        value={formData.tgl ? new Date(formData.tgl + 'T12:00:00') : null}
                        onChange={d => setFormData({...formData, tgl: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`})}
                      />
                    </div>
                  </div>
                </div>

                {/* Grup 2: Shift, Bagian, Nama Karyawan, Posisi, Abs */}
                <div className="mb-5">
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="text-[13px] font-bold text-gray-700">Karyawan</span>
                    <div className="flex-1 h-px bg-gray-100"></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-gray-600">Shift <span className="text-rose-400">*</span></label>
                      <SearchableDropdown
                        id="form-shift"
                        value={formData.shift || ''}
                        items={['1 (07:00-15:00)', '2 (15:00-23:00)', '3 (23:00-07:00)']}
                        placeholder="-- Pilih Shift --"
                        allLabel="-- Pilih Shift --"
                        triggerWidth="w-full"
                        onChange={val => {
                          const shiftNum = val.split(' ')[0];
                          setFormData({...formData, shift: shiftNum});
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-gray-600">Bagian <span className="text-rose-400">*</span></label>
                      <SearchableDropdown
                        id="form-bagian"
                        value={formData.bagian || ''}
                        items={BAGIAN_LIST}
                        placeholder="-- Pilih Bagian --"
                        allLabel="-- Pilih Bagian --"
                        triggerWidth="w-full"
                        onChange={val => setFormData({...formData, bagian: val, jenis_pekerjaan: ''})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-gray-600">Nama Karyawan <span className="text-rose-400">*</span></label>
                      <SearchableDropdown
                        id="form-karyawan"
                        value={formData.nama_karyawan || ''}
                        items={employees.map(e => e.name).filter(Boolean)}
                        placeholder="-- Pilih Karyawan --"
                        allLabel="-- Pilih Karyawan --"
                        triggerWidth="w-full"
                        onChange={val => {
                          const emp = employees.find(x => x.name === val);
                          setFormData({...formData, nama_karyawan: val, posisi: emp?.position || '', absensi: emp?.employee_no || ''});
                        }}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-gray-600">Posisi <span className="text-[11px] font-normal text-gray-400">(otomatis)</span></label>
                      <input type="text" disabled className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px] font-medium text-gray-500 outline-none cursor-not-allowed h-11" value={formData.posisi || ''} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-gray-600">Abs. <span className="text-[11px] font-normal text-gray-400">(otomatis)</span></label>
                      <input type="text" disabled className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px] font-medium text-gray-500 outline-none cursor-not-allowed h-11" value={formData.absensi || ''} />
                    </div>
                  </div>
                </div>

                {/* Grup 3: No. Order, Nama Order, Jenis Pekerjaan */}
                <div className="mb-5">
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="text-[13px] font-bold text-gray-700">Order &amp; Pekerjaan</span>
                    <div className="flex-1 h-px bg-gray-100"></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-gray-600">No. Order (PPIC)</label>
                      <SearchableDropdown
                        id="form-no-order"
                        value={formData.no_order ? `${formData.no_order}${sopdList.find(s => s.no_sopd === formData.no_order)?.nama_order ? ' — ' + sopdList.find(s => s.no_sopd === formData.no_order)?.nama_order : ''}` : ''}
                        items={sopdList.map(s => s.nama_order ? `${s.no_sopd} — ${s.nama_order}` : s.no_sopd)}
                        placeholder="-- Pilih No. Order --"
                        allLabel="-- Pilih No. Order --"
                        triggerWidth="w-full"
                        onChange={val => {
                          const noSopd = val.split(' — ')[0];
                          const sopd = sopdList.find(x => x.no_sopd === noSopd);
                          // Pilih dari dropdown → clear nama_order_manual
                          setFormData((prev: any) => ({...prev, no_order: noSopd, nama_order: sopd?.nama_order || '', nama_order_manual: ''}));
                        }}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-gray-600">Nama Order <span className="text-[11px] font-normal text-gray-400">(manual)</span></label>
                      <input
                        type="text"
                        placeholder="Nama Order jika tidak ada di daftar No. Order (PPIC)"
                        className="w-full bg-yellow-50/50 border border-yellow-300 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500 outline-none h-11"
                        value={formData.nama_order_manual || ''}
                        onChange={e => {
                          // Isi manual → clear no_order dari dropdown
                          setFormData((prev: any) => ({...prev, nama_order_manual: e.target.value, no_order: '', nama_order: ''}));
                        }}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-gray-600">Jenis Pekerjaan</label>
                      <SearchableDropdown
                        id="form-jenis-pekerjaan"
                        value={formData.jenis_pekerjaan || ''}
                        items={jenisPekerjaanList}
                        placeholder={formData.bagian ? '-- Pilih Jenis Pekerjaan --' : '-- Pilih Bagian dulu --'}
                        allLabel={formData.bagian ? '-- Pilih Jenis Pekerjaan --' : '-- Pilih Bagian dulu --'}
                        triggerWidth="w-full"
                        onChange={val => setFormData({...formData, jenis_pekerjaan: val})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-gray-600">Target</label>
                      <input 
                        type="text" 
                        placeholder="0" 
                        className="w-full bg-yellow-50/50 border border-yellow-300 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500 outline-none h-11" 
                        value={formData.target || ''} 
                        onChange={e => {
                          const val = e.target.value;
                          if (val.startsWith('=')) {
                            const formatted = formatFormulaNumbers(val);
                            setFormData({...formData, target: formatted});
                          } else {
                            const clean = val.replace(/\./g, '');
                            if (/^\d+$/.test(clean)) {
                              const formatted = clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                              setFormData({...formData, target: formatted});
                            } else {
                              setFormData({...formData, target: val});
                            }
                          }
                        }} 
                        onBlur={() => {
                          const val = formData.target || '';
                          if (val.startsWith('=')) {
                            const evaluated = evaluateMathExpression(val);
                            setFormData({...formData, target: evaluated});
                          }
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            const val = formData.target || '';
                            if (val.startsWith('=')) {
                              e.preventDefault();
                              const evaluated = evaluateMathExpression(val);
                              setFormData({...formData, target: evaluated});
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Grup: Keterangan */}
                <div>
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="text-[13px] font-bold text-gray-700">Lainnya</span>
                    <div className="flex-1 h-px bg-gray-100"></div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-gray-600">Keterangan</label>
                      <textarea 
                        placeholder="Keterangan tambahan..." 
                        rows={3}
                        className="w-full bg-yellow-50/50 border border-yellow-300 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500 outline-none min-h-[80px] resize-none" 
                        value={formData.keterangan || ''} 
                        onChange={e => setFormData({...formData, keterangan: e.target.value})} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ---- SUB-TAB: REALISASI ---- */}
            {formSubTab === 'realisasi' && (
              <div className="animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5 mb-6">
                  <span className="text-[13px] font-bold text-gray-700">Data Realisasi</span>
                  <div className="flex-1 h-px bg-gray-100"></div>
                  <span className="text-[11px] font-semibold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full">Hasil Produksi</span>
                </div>

                {/* Data Target Terpilih */}
                {selectedTargetRow ? (
                  <div className="mb-6 p-4 bg-sky-50/50 border border-sky-200 rounded-xl">
                    <p className="text-[12px] font-bold text-sky-800 mb-3">Data Target yang sedang diisi Realisasinya:</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      {[
                        { label: 'Tanggal', val: formatIndoDateStr(selectedTargetRow.tgl) },
                        { label: 'Shift', val: selectedTargetRow.shift },
                        { label: 'Karyawan', val: selectedTargetRow.nama_karyawan },
                        { label: 'Order', val: selectedTargetRow.no_order ? `${selectedTargetRow.no_order} — ${selectedTargetRow.nama_order || '-'}` : '' },
                        { label: 'Bagian', val: selectedTargetRow.bagian },
                      ].map(item => item.val ? (
                        <span key={item.label} className="text-[11px] font-bold bg-white text-sky-700 px-2.5 py-1 rounded-md border border-sky-100 shadow-sm">{item.label}: {item.val}</span>
                      ) : null)}
                    </div>
                  </div>
                ) : isAdding ? (
                  /* Mode tambah baru: tampilkan ringkasan data Target yang sudah diisi */
                  <div className="mb-6 p-4 bg-yellow-50/50 border border-yellow-200 rounded-xl">
                    <p className="text-[12px] font-bold text-yellow-800 mb-3">Data Target dari form yang sedang diisi:</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      {[
                        { label: 'Tanggal', val: formData.tgl ? formatIndoDateStr(formData.tgl) : '' },
                        { label: 'Shift', val: formData.shift ? String(formData.shift) : '' },
                        { label: 'Karyawan', val: formData.nama_karyawan || '' },
                        { label: 'Order', val: formData.no_order ? `${formData.no_order}${formData.nama_order ? ' — ' + formData.nama_order : ''}` : '' },
                        { label: 'Bagian', val: formData.bagian || '' },
                      ].map(item => item.val ? (
                        <span key={item.label} className="text-[11px] font-bold bg-white text-yellow-700 px-2.5 py-1 rounded-md border border-yellow-200 shadow-sm">{item.label}: {item.val}</span>
                      ) : null)}
                    </div>
                    {![formData.tgl, formData.shift, formData.nama_karyawan].some(Boolean) && (
                      <p className="text-[11px] text-yellow-600 mt-2">Kembali ke tab Target untuk melengkapi data penjadwalan.</p>
                    )}
                  </div>
                ) : (
                  /* Mode edit jurnal lama tanpa memilih target dari tabel */
                  <div className="mb-6 p-4 bg-sky-50 border border-sky-100 rounded-xl flex items-start gap-3">
                    <AlertCircle size={16} className="text-sky-600 shrink-0 mt-0.5" />
                    <p className="text-[12px] font-medium text-sky-800 leading-relaxed">
                      Anda sedang mengisi form Realisasi secara manual tanpa mengacu pada Data Target tertentu. Untuk mengisi Realisasi berdasarkan Target yang sudah ada, silakan kembali ke tab <b>Daftar Jurnal</b> dan klik tombol <b>Input Realisasi (+)</b> pada kolom Aksi di baris yang diinginkan.
                    </p>
                  </div>
                )}

                {(isMultiRealisasiMode ? multiRealisasi : [formData]).map((rData, rIndex) => (
                  <div key={rIndex} className={`mb-6 ${isMultiRealisasiMode ? 'p-5 pt-7 border-2 border-dashed border-sky-200 bg-sky-50/20 rounded-xl relative' : ''}`}>
                    {isMultiRealisasiMode && (
                      <div className="absolute -top-3 left-4 bg-sky-100 text-sky-800 px-3 py-0.5 rounded-full text-[11px] font-bold border border-sky-200">
                        Realisasi #{rIndex + 1} {rIndex === 0 ? '(Utama)' : '(Baris Baru)'}
                      </div>
                    )}
                    {isMultiRealisasiMode && rIndex > 0 && (
                      <button type="button" onClick={() => setMultiRealisasi(prev => prev.filter((_, i) => i !== rIndex))} className="absolute -top-3 right-4 bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full text-[11px] font-bold hover:bg-rose-200 border border-rose-200 transition-colors">
                        Hapus
                      </button>
                    )}

                    {/* Grup 1: Order & Pekerjaan */}
                    <div className="mb-5">
                      <div className="flex items-center gap-2.5 mb-4">
                        <span className="text-[13px] font-bold text-gray-700">Order &amp; Pekerjaan</span>
                        <div className="flex-1 h-px bg-gray-100"></div>
                      </div>
                      <div className="space-y-4">
                        {/* Baris 1: No. Order — full width */}
                        <div className="space-y-1.5">
                          <label className="text-[12px] font-bold text-gray-600">No. Order</label>
                          <SearchableDropdown
                            id={`form-no-order-2-${rIndex}`}
                            value={rData.no_order_2 ? `${rData.no_order_2}${sopdList.find(s => s.no_sopd === rData.no_order_2)?.nama_order ? ' — ' + sopdList.find(s => s.no_sopd === rData.no_order_2)?.nama_order : ''}` : ''}
                            items={sopdList.map(s => s.nama_order ? `${s.no_sopd} — ${s.nama_order}` : s.no_sopd)}
                            placeholder="-- Pilih No. Order --"
                            allLabel="-- Pilih No. Order --"
                            triggerWidth="w-full"
                            onChange={val => {
                              const noSopd = val.split(' — ')[0];
                              const sopd = sopdList.find(x => x.no_sopd === noSopd);
                              handleRealisasiChange(rIndex, 'no_order_2', noSopd);
                              handleRealisasiChange(rIndex, 'nama_order_2', sopd?.nama_order || '');
                              handleRealisasiChange(rIndex, 'nama_order_manual_2', '');
                            }}
                          />
                        </div>
                        {/* Baris 2: Nama Order Manual + Jenis Pekerjaan */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[12px] font-bold text-gray-600">Nama Order <span className="text-[11px] font-normal text-gray-400">(manual)</span></label>
                            <input type="text" placeholder="Nama Order jika tidak ada di daftar No. Order" className="w-full bg-sky-50/40 border border-sky-200 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none h-11" value={rData.nama_order_manual_2 || ''} onChange={e => { handleRealisasiChange(rIndex, 'no_order_2', ''); handleRealisasiChange(rIndex, 'nama_order_2', ''); handleRealisasiChange(rIndex, 'nama_order_manual_2', e.target.value); }} />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[12px] font-bold text-gray-600">Jenis Pekerjaan</label>
                            <SearchableDropdown
                              id={`form-jenis-pekerjaan-2-${rIndex}`}
                              value={rData.jenis_pekerjaan_2 || ''}
                              items={jenisPekerjaan2List}
                              placeholder="-- Pilih Jenis Pekerjaan --"
                              allLabel="-- Pilih Jenis Pekerjaan --"
                              triggerWidth="w-full"
                              onChange={val => handleRealisasiChange(rIndex, 'jenis_pekerjaan_2', val)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Grup 2: Detail Produksi */}
                    <div className="mb-5">
                      <div className="flex items-center gap-2.5 mb-4">
                        <span className="text-[13px] font-bold text-gray-700">Detail Produksi</span>
                        <div className="flex-1 h-px bg-gray-100"></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[12px] font-bold text-gray-600">Bahan Kertas</label>
                          <input type="text" placeholder="Jenis bahan kertas..." className="w-full bg-sky-50/40 border border-sky-200 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none h-11" value={rData.bahan_kertas || ''} onChange={e => handleRealisasiChange(rIndex, 'bahan_kertas', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[12px] font-bold text-gray-600">Jml. Plate</label>
                          <textarea
                            placeholder="0" rows={2}
                            className="w-full bg-sky-50/40 border border-sky-200 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none resize-y min-h-[44px]"
                            value={rData.jml_plate || ''}
                            onChange={e => {
                              const c = e.target.value.replace(/\./g, '');
                              handleRealisasiChange(rIndex, 'jml_plate', /^\d+$/.test(c) ? c.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : e.target.value);
                            }}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[12px] font-bold text-gray-600">Warna</label>
                          <input type="text" placeholder="Warna cetak..." className="w-full bg-sky-50/40 border border-sky-200 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none h-11" value={rData.warna || ''} onChange={e => handleRealisasiChange(rIndex, 'warna', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[12px] font-bold text-gray-600">Inscheet</label>
                          <textarea
                            placeholder="0" rows={2}
                            className="w-full bg-sky-50/40 border border-sky-200 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none resize-y min-h-[44px]"
                            value={rData.inscheet || ''}
                            onChange={e => {
                              const c = e.target.value.replace(/\./g, '');
                              handleRealisasiChange(rIndex, 'inscheet', /^\d+$/.test(c) ? c.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : e.target.value);
                            }}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[12px] font-bold text-gray-600">Rijek</label>
                          <textarea
                            placeholder="0" rows={2}
                            className="w-full bg-sky-50/40 border border-sky-200 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none resize-y min-h-[44px]"
                            value={rData.rijek || ''}
                            onChange={e => {
                              const val = e.target.value;
                              if (val.startsWith('=')) {
                                handleRealisasiChange(rIndex, 'rijek', formatFormulaNumbers(val));
                              } else {
                                const c = val.replace(/\./g, '');
                                handleRealisasiChange(rIndex, 'rijek', /^\d+$/.test(c) ? c.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : val);
                              }
                            }}
                            onBlur={() => {
                              const val = rData.rijek || '';
                              if (val.startsWith('=')) handleRealisasiChange(rIndex, 'rijek', evaluateMathExpression(val));
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                const val = rData.rijek || '';
                                if (val.startsWith('=')) { e.preventDefault(); handleRealisasiChange(rIndex, 'rijek', evaluateMathExpression(val)); }
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Grup 3: Waktu & Kendala */}
                    <div className="mb-5">
                      <div className="flex items-center gap-2.5 mb-4">
                        <span className="text-[13px] font-bold text-gray-700">Waktu &amp; Kendala</span>
                        <div className="flex-1 h-px bg-gray-100"></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[12px] font-bold text-gray-600">Jam Kerja</label>
                          <input type="text" placeholder="07:00 - 15:00" className="w-full bg-sky-50/40 border border-sky-200 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none h-11" value={rData.jam || ''} onChange={e => handleRealisasiChange(rIndex, 'jam', e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[12px] font-bold text-gray-600">Kendala</label>
                          <textarea placeholder="Kendala yang ditemukan..." rows={3} className="w-full bg-sky-50/40 border border-sky-200 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none min-h-[80px] resize-none" value={rData.kendala || ''} onChange={e => handleRealisasiChange(rIndex, 'kendala', e.target.value)} />
                        </div>
                      </div>
                    </div>

                    {/* Grup 4: Hasil */}
                    <div>
                      <div className="flex items-center gap-2.5 mb-4">
                        <span className="text-[13px] font-bold text-gray-700">Hasil</span>
                        <div className="flex-1 h-px bg-gray-100"></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[12px] font-bold text-gray-600">Target</label>
                          <input
                            type="text"
                            placeholder="0"
                            className="w-full bg-yellow-50/50 border border-yellow-300 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-yellow-500/30 focus:border-yellow-500 outline-none h-11"
                            value={rData.target || ''}
                            onChange={e => {
                              const val = e.target.value;
                              if (val.startsWith('=')) {
                                handleRealisasiChange(rIndex, 'target', formatFormulaNumbers(val));
                              } else {
                                const c = val.replace(/\./g, '');
                                handleRealisasiChange(rIndex, 'target', /^\d+$/.test(c) ? c.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : val);
                              }
                            }}
                            onBlur={() => {
                              const val = rData.target || '';
                              if (val.startsWith('=')) handleRealisasiChange(rIndex, 'target', evaluateMathExpression(val));
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                const val = rData.target || '';
                                if (val.startsWith('=')) { e.preventDefault(); handleRealisasiChange(rIndex, 'target', evaluateMathExpression(val)); }
                              }
                            }}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[12px] font-bold text-gray-600">Realisasi <span className="text-rose-400">*</span></label>
                          <input
                            type="text"
                            placeholder="0"
                            className="w-full bg-sky-50/50 border border-sky-300 rounded-lg px-3 py-2 text-[13px] font-medium focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 outline-none h-11"
                            value={rData.realisasi || ''}
                            onChange={e => {
                              const val = e.target.value;
                              if (val.startsWith('=')) {
                                handleRealisasiChange(rIndex, 'realisasi', formatFormulaNumbers(val));
                              } else {
                                const c = val.replace(/\./g, '');
                                handleRealisasiChange(rIndex, 'realisasi', /^\d+$/.test(c) ? c.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : val);
                              }
                            }}
                            onBlur={() => {
                              const val = rData.realisasi || '';
                              if (val.startsWith('=')) handleRealisasiChange(rIndex, 'realisasi', evaluateMathExpression(val));
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                const val = rData.realisasi || '';
                                if (val.startsWith('=')) { e.preventDefault(); handleRealisasiChange(rIndex, 'realisasi', evaluateMathExpression(val)); }
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                ))}

                {isMultiRealisasiMode && (
                  <div className="flex gap-3 mb-4">
                    <button type="button" onClick={() => setMultiRealisasi(prev => [...prev, {}])} className="flex-1 py-3 border-2 border-dashed border-sky-200 text-sky-600 rounded-xl font-bold text-[13px] hover:bg-sky-50 hover:border-sky-300 transition-colors flex items-center justify-center gap-2">
                      <PlusSquare size={16} /> Tambah Realisasi Lainnya
                    </button>
                    <button type="button" onClick={addCopyFromLastRealisasi} className="py-3 px-5 border-2 border-dashed border-emerald-200 text-emerald-600 rounded-xl font-bold text-[13px] hover:bg-emerald-50 hover:border-emerald-300 transition-colors flex items-center justify-center gap-2 whitespace-nowrap">
                      <Copy size={16} /> Copy dari Realisasi Sebelumnya
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-between items-center gap-3 pt-5 mt-5 border-t border-gray-100">
              <div className="flex gap-2">
                {formSubTab === 'target' && canInputRealisasi && (
                  <button type="button" onClick={() => setFormSubTab('realisasi')} className="px-4 py-2 text-[12px] font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-lg border border-sky-200 transition-all">
                    Lanjut ke Realisasi →
                  </button>
                )}
                {formSubTab === 'realisasi' && canInputTarget && (
                  <button type="button" onClick={() => setFormSubTab('target')} className="px-4 py-2 text-[12px] font-bold text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-lg border border-yellow-200 transition-all">
                    ← Kembali ke Target
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={cancelForm} className="px-5 py-2.5 text-[13px] font-bold text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all">Batal</button>
                <button type="submit" disabled={isSaving} className="px-5 py-2.5 text-[13px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-sm transition-all flex items-center gap-2">
                  {isSaving ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> : <><Save size={16} /> Simpan Data</>}
                </button>
              </div>
            </div>

          </form>
        )}
      </div> {/* CLOSES activeTab === 'form' */}

      {/* ===== COPY JADWAL MODAL ===== */}
      <BaseModal
        isOpen={showCopyModal}
        onClose={() => {
          setShowCopyModal(false);
          setCopyKaryawan([]);
          setCopyBagian([]);
          setCopyKaryawanSearch('');
          setCopyBagianSearch('');
          setCopyModalError('');
        }}
        title="Copy Jadwal"
        subtitle="Salin jadwal dari satu tanggal ke tanggal lain"
        icon={Copy}
        footer={
          <>
            <button
              onClick={() => {
                setShowCopyModal(false);
                setCopyKaryawan([]);
                setCopyBagian([]);
                setCopyKaryawanSearch('');
                setCopyBagianSearch('');
                setCopyModalError('');
              }}
              className="px-5 py-2.5 text-[13px] font-bold text-gray-500 hover:text-gray-700 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 transition-all"
            >
              Batal
            </button>
            <button
              onClick={handleCopyJadwal}
              disabled={isCopyingJadwal || !copyFrom || !copyTo}
              className="px-6 py-2.5 text-[13px] font-bold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              {isCopyingJadwal ? (
                <><Loader2 size={15} className="animate-spin" /> Menyalin...</>
              ) : (
                <><Copy size={15} /> Salin Jadwal</>
              )}
            </button>
          </>
        }
      >
        {/* Tanggal Dari & Ke */}
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-[12px] font-bold text-gray-600 mb-2">
              Copy Dari Tanggal <span className="text-rose-400">*</span>
            </label>
            <DatePicker
              name="copyFrom"
              value={copyFrom}
              onChange={d => setCopyFrom(d)}
            />
          </div>
          <div className="flex items-center pb-3 shrink-0">
            <div className="w-6 h-0.5 bg-green-200 rounded-full" />
          </div>
          <div className="flex-1">
            <label className="block text-[12px] font-bold text-gray-600 mb-2">
              Ke Tanggal <span className="text-rose-400">*</span>
            </label>
            <DatePicker
              name="copyTo"
              value={copyTo}
              onChange={d => setCopyTo(d)}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Filter Opsional</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        {/* Filter Bagian — inline select with search */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[12px] font-bold text-gray-600">
              Filter Bagian
              {copyBagian.length > 0 && (
                <span className="ml-1.5 text-[10px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">
                  {copyBagian.length}
                </span>
              )}
            </label>
            {copyBagian.length > 0 && (
              <button
                type="button"
                onClick={() => { setCopyBagian([]); setCopyKaryawan([]); setCopyBagianSearch(''); }}
                className="flex items-center gap-1 text-[10px] font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-0.5 rounded-md transition-all"
              >
                <X size={10} /> Hapus filter
              </button>
            )}
          </div>
          {/* Search input */}
          <div className="relative mb-2">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari bagian..."
              value={copyBagianSearch}
              onChange={e => setCopyBagianSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-[12px] font-medium bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-green-400 focus:outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
            {bagianOptions
              .filter(opt => opt.toLowerCase().includes(copyBagianSearch.toLowerCase()))
              .map(opt => {
                const isBagianSelected = copyBagian.includes(opt);
                return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setCopyBagian(prev => prev.includes(opt) ? prev.filter(b => b !== opt) : [...prev, opt]);
                    setCopyKaryawan([]);
                  }}
                  className={`px-3 py-2 rounded-lg text-[12px] font-bold text-left transition-all border ${
                    isBagianSelected
                      ? 'bg-green-600 text-white border-green-700 shadow-sm'
                      : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-green-50 hover:text-green-700 hover:border-green-200'
                  }`}
                >
                  {isBagianSelected ? '✓ ' : ''}{opt}
                </button>
                );
              })}
            {bagianOptions.filter(opt => opt.toLowerCase().includes(copyBagianSearch.toLowerCase())).length === 0 && (
              <p className="col-span-2 text-[11px] text-gray-400 italic py-2 px-1">Tidak ditemukan</p>
            )}
          </div>
          {copyBagian.length > 0 && (
            <p className="text-[10px] text-green-600 font-semibold mt-2 ml-0.5">
              ✓ Hanya bagian <b>{copyBagian.join(', ')}</b> yang akan disalin
            </p>
          )}
        </div>

        {/* Filter Karyawan — inline select with search */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[12px] font-bold text-gray-600">
              Filter Karyawan
              {copyKaryawan.length > 0 && (
                <span className="ml-1.5 text-[10px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">
                  {copyKaryawan.length}
                </span>
              )}
            </label>
            {copyKaryawan.length > 0 && (
              <button
                type="button"
                onClick={() => setCopyKaryawan([])}
                className="flex items-center gap-1 text-[10px] font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-0.5 rounded-md transition-all"
              >
                <X size={10} /> Hapus filter
              </button>
            )}
          </div>
          {(() => {
            const karyawanForBagian = copyBagian.length > 0
              ? [...new Set(copyBagian.flatMap(b => karyawanByBagian[b] || []))]
              : [];
            const karyawanList = (copyBagian.length > 0 ? karyawanForBagian : namaOptions)
              .filter(nama => nama.toLowerCase().includes(copyKaryawanSearch.toLowerCase()));
            const allList = copyBagian.length > 0 ? karyawanForBagian : namaOptions;
            return allList.length === 0 ? (
              <p className="text-[11px] text-gray-400 font-medium italic px-1">
                Tidak ada data karyawan
              </p>
            ) : (
              <>
                {/* Search input */}
                <div className="relative mb-2">
                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Cari karyawan..."
                    value={copyKaryawanSearch}
                    onChange={e => setCopyKaryawanSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-[12px] font-medium bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-green-400 focus:outline-none transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                  {karyawanList.length === 0 ? (
                    <p className="text-[11px] text-gray-400 italic py-1 px-1">Tidak ditemukan</p>
                  ) : karyawanList.map(nama => {
                    const isSelected = copyKaryawan.includes(nama);
                    return (
                      <button
                        key={nama}
                        type="button"
                        onClick={() => setCopyKaryawan(prev => prev.includes(nama) ? prev.filter(n => n !== nama) : [...prev, nama])}
                        className={`px-3 py-2 rounded-lg text-[12px] font-semibold text-left transition-all border ${
                          isSelected
                            ? 'bg-green-600 text-white border-green-700 shadow-sm'
                            : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-green-50 hover:text-green-700 hover:border-green-200'
                        }`}
                      >
                        {isSelected ? '✓ ' : ''}{nama}
                      </button>
                    );
                  })}
                </div>
              </>
            );
          })()}
          {copyKaryawan.length > 0 && (
            <p className="text-[10px] text-green-600 font-semibold mt-2 ml-0.5">
              ✓ Hanya karyawan <b>{copyKaryawan.join(', ')}</b> yang akan disalin
            </p>
          )}
        </div>

        {/* Clear all filters */}
        {(copyBagian.length > 0 || copyKaryawan.length > 0) && (
          <button
            type="button"
            onClick={() => { setCopyBagian([]); setCopyKaryawan([]); }}
            className="self-start flex items-center gap-1.5 text-[11px] font-bold text-gray-400 hover:text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-rose-100 transition-all -mt-2"
          >
            <X size={12} /> Hapus semua filter
          </button>
        )}

        {/* Error Message */}
        {copyModalError && (
          <div className="flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-200 rounded-xl animate-in fade-in duration-200">
            <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
            <p className="text-[12px] font-semibold text-rose-700">{copyModalError}</p>
          </div>
        )}
      </BaseModal>

      {/* Trash Modal — Super Admin only */}
      {isSuperAdmin && showTrashModal && (
        <BaseModal
          isOpen={showTrashModal}
          onClose={() => setShowTrashModal(false)}
          title="Data Terhapus (Trash)"
          icon={Trash2}
          maxWidth="max-w-5xl"
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-gray-500">
                Total <span className="font-bold text-gray-700">{trashTotal}</span> data terhapus
              </p>
              {selectedTrashIds.size > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={handlePermanentDelete}
                    disabled={isDeletingPermanently || isRestoring}
                    className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-bold rounded-lg transition-all disabled:opacity-50"
                  >
                    {isDeletingPermanently ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    {isSelectedAllTrash ? `Hapus Permanen Semua ${trashTotal} Data` : `Hapus Permanen ${selectedTrashIds.size} Data`}
                  </button>
                  <button
                    onClick={handleRestore}
                    disabled={isRestoring || isDeletingPermanently}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold rounded-lg transition-all disabled:opacity-50"
                  >
                    {isRestoring ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                    {isSelectedAllTrash ? `Restore Semua ${trashTotal} Data` : `Restore ${selectedTrashIds.size} Data`}
                  </button>
                </div>
              )}
            </div>

            {selectedTrashIds.size === trashData.length && trashTotal > trashData.length && (
              <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-[12px] flex items-center justify-between text-yellow-800 animate-in fade-in slide-in-from-top-1 duration-200">
                <div>
                  <span>Semua <b>{selectedTrashIds.size}</b> data di halaman ini telah terpilih. </span>
                  {isSelectedAllTrash ? (
                    <span>Semua <b>{trashTotal}</b> data di Trash telah terpilih.</span>
                  ) : (
                    <span>Apakah Anda ingin memilih semua <b>{trashTotal}</b> data di Trash?</span>
                  )}
                </div>
                <div>
                  {isSelectedAllTrash ? (
                    <button 
                      type="button" 
                      onClick={() => setIsSelectedAllTrash(false)} 
                      className="text-emerald-700 hover:text-emerald-800 font-bold underline"
                    >
                      Batalkan pilihan semua data
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => setIsSelectedAllTrash(true)} 
                      className="text-yellow-700 hover:text-yellow-800 font-bold underline"
                    >
                      Pilih semua {trashTotal} data
                    </button>
                  )}
                </div>
              </div>
            )}

            {trashLoading ? (
              <div className="h-40 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-gray-400" />
              </div>
            ) : trashData.length === 0 ? (
              <div className="h-40 flex items-center justify-center">
                <p className="text-[13px] text-gray-400 font-semibold">Tidak ada data yang terhapus.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="min-w-full text-left text-[11px]">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-3 py-2 w-8">
                        <input type="checkbox"
                          checked={selectedTrashIds.size === trashData.length && trashData.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTrashIds(new Set(trashData.map((r: any) => r.id)));
                            } else {
                              setSelectedTrashIds(new Set());
                              setIsSelectedAllTrash(false);
                            }
                          }}
                          className="rounded"
                        />
                      </th>
                      <th className="px-3 py-2 font-bold text-gray-400">Tgl. Jurnal</th>
                      <th className="px-3 py-2 font-bold text-gray-400">Shift</th>
                      <th className="px-3 py-2 font-bold text-gray-400">Karyawan</th>
                      <th className="px-3 py-2 font-bold text-gray-400">Bagian</th>
                      <th className="px-3 py-2 font-bold text-gray-400">Pekerjaan</th>
                      <th className="px-3 py-2 font-bold text-gray-400">Order Realisasi</th>
                      <th className="px-3 py-2 font-bold text-gray-400 text-right">Target / Real</th>
                      <th className="px-3 py-2 font-bold text-gray-400">Dihapus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {trashData.map((row: any) => (
                      <tr key={row.id}
                        className={`transition-colors cursor-pointer ${
                          selectedTrashIds.has(row.id) ? 'bg-rose-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          const next = new Set(selectedTrashIds);
                          if (next.has(row.id)) {
                            next.delete(row.id);
                            setIsSelectedAllTrash(false);
                          } else {
                            next.add(row.id);
                          }
                          setSelectedTrashIds(next);
                        }}
                      >
                        <td className="px-3 py-2">
                          <input type="checkbox" readOnly checked={selectedTrashIds.has(row.id)} className="rounded pointer-events-none" />
                        </td>
                        <td className="px-3 py-2 font-semibold text-gray-700 whitespace-nowrap">{formatIndoDateStr(row.tgl) || '-'}</td>
                        <td className="px-3 py-2 text-gray-600">{row.shift || '-'}</td>
                        <td className="px-3 py-2 font-semibold text-gray-700">{row.nama_karyawan || '-'}</td>
                        <td className="px-3 py-2 text-gray-600">{row.bagian || '-'}</td>
                        <td className="px-3 py-2 text-gray-600 max-w-[140px] truncate">{row.jenis_pekerjaan_2 || row.jenis_pekerjaan || '-'}</td>
                        <td className="px-3 py-2 text-gray-600 max-w-[140px] truncate">{row.nama_order_2 || row.no_order_2 || '-'}</td>
                        <td className="px-3 py-2 text-right font-bold tabular-nums">
                          <span className="text-gray-800">{Number(row.realisasi || 0).toLocaleString('id-ID')}</span>
                          <span className="text-gray-400 font-normal ml-1">/ {Number(row.target || 0).toLocaleString('id-ID')}</span>
                        </td>
                        <td className="px-3 py-2 text-rose-500 whitespace-nowrap">
                          {row.deleted_at ? new Intl.DateTimeFormat('id-ID', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta'
                          }).format(new Date(row.deleted_at.includes('T') ? row.deleted_at : row.deleted_at.replace(' ', 'T') + 'Z')) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination trash */}
            {trashTotal > 50 && (
              <div className="flex items-center justify-center gap-2">
                <button disabled={trashPage <= 1} onClick={() => fetchTrash(trashPage - 1)}
                  className="px-3 py-1 text-[11px] font-bold border rounded-lg disabled:opacity-40 hover:bg-gray-50">
                  ← Prev
                </button>
                <span className="text-[11px] text-gray-500">Hal. {trashPage}</span>
                <button disabled={trashPage * 50 >= trashTotal} onClick={() => fetchTrash(trashPage + 1)}
                  className="px-3 py-1 text-[11px] font-bold border rounded-lg disabled:opacity-40 hover:bg-gray-50">
                  Next →
                </button>
              </div>
            )}
          </div>
        </BaseModal>
      )}
      {/* Export Progress Overlay */}
      {isExporting && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 border border-gray-100 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            
            {/* Animated Spreadsheet Icon */}
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 relative overflow-hidden">
              <FileSpreadsheet size={32} className={exportProgress < 100 ? "animate-pulse" : ""} />
              {exportProgress < 100 && (
                <div className="absolute inset-0 border-2 border-emerald-500/20 rounded-2xl animate-ping opacity-75"></div>
              )}
            </div>
            
            <h3 className="text-[16px] font-bold text-gray-800 tracking-tight mb-1">
              {exportProgress === 100 ? 'Ekspor Berhasil!' : 'Mengekspor Data Jurnal'}
            </h3>
            <p className="text-[12px] text-gray-500 font-medium mb-5 max-w-[280px]">
              {exportProgress === 100 
                ? 'File Excel sedang diunduh ke perangkat Anda...'
                : selectedExportYear === 'all'
                ? `Sedang memproses ${(yearsCount['all'] || 0).toLocaleString('id-ID')} baris jurnal ke file Excel.`
                : `Sedang memproses ${(yearsCount[selectedExportYear] || 0).toLocaleString('id-ID')} baris jurnal tahun ${selectedExportYear} ke file Excel.`
              }
            </p>

            {/* Progress Bar Container */}
            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden mb-2 relative">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${exportProgress}%` }}
              ></div>
            </div>

            <div className="flex justify-between w-full text-[11px] text-gray-400 font-semibold mb-6">
              <span>{exportStatusText}</span>
              <span className="text-emerald-600 font-bold text-xs">{exportProgress}%</span>
            </div>

            <div className="text-[10px] text-gray-400 font-normal italic">
              Mohon jangan menutup halaman ini sampai proses selesai.
            </div>
          </div>
        </div>
      )}

      {/* Modal Pilih Tahun Ekspor */}
      {showYearModal && (
        <BaseModal
          isOpen={showYearModal}
          onClose={() => setShowYearModal(false)}
          title="Ekspor Excel Jurnal Harian"
          subtitle="Pilih tahun data yang ingin diexport ke Excel"
          icon={FileSpreadsheet}
          bodyClassName="overflow-visible"
          footer={
            <>
              <button
                onClick={() => setShowYearModal(false)}
                className="px-5 py-2.5 text-[13px] font-bold text-gray-500 hover:text-gray-700 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 transition-all"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setShowYearModal(false);
                  startExportProcess(selectedExportYear);
                }}
                className="px-6 py-2.5 text-[13px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all flex items-center gap-2"
              >
                <Download size={15} /> Mulai Ekspor
              </button>
            </>
          }
        >
          <div className="py-2 pb-28 min-h-[160px]">
            <SearchableDropdown
              id="export-year-select"
              label="Pilih Tahun"
              value={selectedExportYear === 'all' ? '' : selectedExportYear}
              items={availableYears}
              allLabel="Semua Tahun"
              placeholder="Semua Tahun"
              searchPlaceholder="Cari tahun..."
              triggerWidth="w-full"
              panelWidth="w-full"
              onChange={(val) => setSelectedExportYear(val === '' ? 'all' : val)}
            />
            <p className="mt-2.5 text-[11px] text-gray-400 font-medium ml-1">
              {selectedExportYear === 'all'
                ? `Data yang diekspor adalah ${(yearsCount['all'] || 0).toLocaleString('id-ID')} baris jurnal dari seluruh tahun.`
                : `Data yang diekspor adalah ${(yearsCount[selectedExportYear] || 0).toLocaleString('id-ID')} baris jurnal tahun ${selectedExportYear}.`
              }
            </p>
          </div>
        </BaseModal>
      )}

      {/* Shift Bulk Modal */}
      {showShiftModal && (
        <BaseModal
          isOpen={showShiftModal}
          onClose={() => setShowShiftModal(false)}
          title="Ganti Shift"
          subtitle={`${selectedIds.size} data terpilih`}
          icon={RotateCcw}
          bodyClassName="overflow-visible"
          footer={
            <>
              <button
                onClick={() => setShowShiftModal(false)}
                className="px-5 py-2.5 text-[13px] font-bold text-gray-500 hover:text-gray-700 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleBulkShift}
                disabled={isSaving}
                className="px-6 py-2.5 text-[13px] font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <><Loader2 size={15} className="animate-spin" /> Memproses...</> : <><RotateCcw size={15} /> Ganti Shift</>}
              </button>
            </>
          }
        >
          <div className="py-2 pb-28 min-h-[120px]">
            <div className="space-y-2">
              <p className="text-[13px] font-semibold text-gray-700">Pilih Shift baru:</p>
              <div className="flex flex-col gap-2">
                {[
                  { value: '1', label: 'Shift 1 (07:00 - 15:00)' },
                  { value: '2', label: 'Shift 2 (15:00 - 23:00)' },
                  { value: '3', label: 'Shift 3 (23:00 - 07:00)' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setBulkShiftValue(opt.value)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-[13px] font-bold border transition-all ${
                      bulkShiftValue === opt.value
                        ? 'bg-sky-50 border-sky-300 text-sky-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </BaseModal>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={dialogConfig.isOpen}
        type={dialogConfig.type}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmLabel={dialogConfig.confirmLabel}
        onConfirm={() => {
          dialogConfig.onConfirm?.();
        }}
        onCancel={closeDialog}
      />

    </div>
  );
}

