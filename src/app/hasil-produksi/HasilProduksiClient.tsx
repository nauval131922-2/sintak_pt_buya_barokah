'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BarChart3, Search, ChevronDown, Filter, RotateCcw, ClipboardList, TrendingUp, X, Target, AlertCircle, Package, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell 
} from 'recharts';
import DatePicker from '@/components/DatePicker';
import SearchableDropdown from '@/components/SearchableDropdown';
import TableFooter from '@/components/TableFooter';
import { persistDateStore, hydrateDateStore } from '@/lib/scraper-period';
import { useVirtualizer } from '@tanstack/react-virtual';

interface SopdOption {
  no_sopd: string;
  nama_order: string;
  qty: number;
  unit: string;
  pelanggan: string;
}

// Helper to format date strings to DD MMM YYYY (Indonesian)
const formatToDayMonthYear = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    let date: Date;
    if (dateStr.includes('-') && dateStr.split('-')[0].length === 4) {
      // YYYY-MM-DD (ISO style from Jurnal)
      date = new Date(dateStr);
    } else if (dateStr.includes('-')) {
      // DD-MM-YYYY (from Gudang)
      const [d, m, y] = dateStr.split('-');
      date = new Date(`${y}-${m}-${d}`);
    } else {
      return dateStr;
    }
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
};

const formatCellVal = (val: any) => {
  if (val === null || val === undefined || val === '') {
    return <div className="text-right tabular-nums">0</div>;
  }
  const isNum = !isNaN(Number(val));
  const display = isNum ? Number(val).toLocaleString('id-ID') : String(val);
  return (
    <div className={`whitespace-pre-wrap ${isNum ? 'text-right tabular-nums' : 'text-left'}`}>
      {display}
    </div>
  );
};

export default function HasilProduksiClient() {
  const [sopdOptions, setSopdOptions] = useState<SopdOption[]>([]);
  const [selectedSopd, setSelectedSopd] = useState<SopdOption | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingSopd, setLoadingSopd] = useState(false);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hydrated = hydrateDateStore('hasil_dates');
    if (hydrated.startDate && hydrated.endDate) {
      setStartDate(hydrated.startDate);
      setEndDate(hydrated.endDate);
      persistDateStore('hasil_dates', hydrated.startDate, hydrated.endDate);
    } else {
      setStartDate(today);
      setEndDate(today);
      persistDateStore('hasil_dates', today, today);
    }

    // Load persisted SOPd
    const savedSopd = localStorage.getItem('hasil_selectedSopd');
    if (savedSopd) {
      try {
        const parsed = JSON.parse(savedSopd);
        if (parsed && parsed.no_sopd) {
          setSelectedSopd(parsed);
        }
      } catch(e) {}
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    persistDateStore('hasil_dates', startDate, endDate);
  }, [startDate, endDate, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    if (selectedSopd) localStorage.setItem('hasil_selectedSopd', JSON.stringify(selectedSopd));
    else localStorage.removeItem('hasil_selectedSopd');
  }, [selectedSopd, isMounted]);
  
  const [results, setResults] = useState<any[]>([]);
  const [jurnalResults, setJurnalResults] = useState<any[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [grandTotalJurnal, setGrandTotalJurnal] = useState(0);
  const [grandTotalRijek, setGrandTotalRijek] = useState(0);
  const [grandTotalTarget, setGrandTotalTarget] = useState(0);
  const [unit, setUnit] = useState('');
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'barang_jadi' | 'jurnal'>('jurnal');
  const [selectedBagian, setSelectedBagian] = useState('');
  const [selectedPekerjaan, setSelectedPekerjaan] = useState('');
  const [availableBagian, setAvailableBagian] = useState<string[]>([]);
  const [availablePekerjaan, setAvailablePekerjaan] = useState<string[]>([]);
  const [showChart, setShowChart] = useState(false);
  const [hideGudang, setHideGudang] = useState(false);
  const [hideJurnal, setHideJurnal] = useState(false);
  const [detailLevel, setDetailLevel] = useState(2);
  const PAGE_SIZE = 20;
  const [barangJadiPage, setBarangJadiPage] = useState(1);
  // ponytail: multi-column sort + column resize
  const COL_DEFAULTS = [100, 160, 240, 280, 130, 150, 100, 100, 100, 100, 80, 200, 200, 100, 120];
  const COL_MIN = [80, 100, 120, 150, 80, 100, 60, 60, 60, 60, 60, 100, 100, 80, 80];
  const COL_PROPS: (string | null)[] = ['tgl','bagian','no_order_2','jenis_pekerjaan_2',null,'bahan_kertas','jml_plate','warna','inscheet','rijek','jam','kendala','keterangan','target','realisasi'];
  const [colWidths, setColWidths] = useState<number[]>(() => { try { const s = localStorage.getItem('hp-col-w'); return s ? JSON.parse(s) : COL_DEFAULTS; } catch { return COL_DEFAULTS; } });
  useEffect(() => { try { localStorage.setItem('hp-col-w', JSON.stringify(colWidths)); } catch {} }, [colWidths]);
  const [sorting, setSorting] = useState<{ i: number; desc: boolean }[]>(() => { try { const s = localStorage.getItem('hp-sort'); return s ? JSON.parse(s) : []; } catch { return []; } });
  useEffect(() => { try { localStorage.setItem('hp-sort', JSON.stringify(sorting)); } catch {} }, [sorting]);
  const resizingRef = useRef(false);
  const toggleSort = (i: number) => {
    if (resizingRef.current) return;
    setSorting(prev => {
      const existing = prev.find(x => x.i === i);
      if (!existing) return [...prev, { i, desc: false }];
      if (!existing.desc) return prev.map(x => x.i === i ? { ...x, desc: true } : x);
      return prev.filter(x => x.i !== i);
    });
  };
  const colResizeStart = (i: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = true;
    const startX = e.clientX, startW = colWidths[i];
    const move = (e: MouseEvent) => { const w = Math.max(COL_MIN[i], startW + e.clientX - startX); setColWidths(p => { const n = [...p]; n[i] = w; return n; }); };
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up); setTimeout(() => { resizingRef.current = false; }); };
    document.addEventListener('mousemove', move); document.addEventListener('mouseup', up);
  };
  const colAutoFit = (i: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const th = (e.target as HTMLElement).closest('th');
    if (!th) return;
    const tbody = th.closest('table')?.querySelector('tbody');
    let maxW = 0;
    const measure = (el: HTMLElement) => {
      const c = el.cloneNode(true) as HTMLElement;
      c.style.cssText = 'position:absolute;visibility:hidden;width:auto;min-width:auto;height:auto;left:-9999px;top:0';
      document.body.appendChild(c);
      const w = c.scrollWidth;
      document.body.removeChild(c);
      return w;
    };
    maxW = Math.max(maxW, measure(th));
    if (tbody) {
      tbody.querySelectorAll(`tr[data-index]:not(.bg-emerald-100) td:nth-child(${i+1})`).forEach(td => { maxW = Math.max(maxW, measure(td as HTMLElement)); });
    }
    setColWidths(p => { const n = [...p]; n[i] = Math.max(COL_MIN[i], maxW + 8); return n; });
  };
  const [ctxCol, setCtxCol] = useState<{ i: number; x: number; y: number; val: string } | null>(null);
  useEffect(() => {
    if (!ctxCol) return;
    const g = (e: KeyboardEvent) => { if (e.key === 'Escape') setCtxCol(null); };
    document.addEventListener('keydown', g);
    return () => { document.removeEventListener('keydown', g); };
  }, [ctxCol]);
  const colCtx = (i: number, e: React.MouseEvent) => {
    e.preventDefault();
    setCtxCol({ i, x: e.clientX, y: e.clientY, val: String(colWidths[i]) });
  };
  const SortIcon = ({ i }: { i: number }) => {
    const s = sorting.find(x => x.i === i);
    return s ? (s.desc ? <ArrowDown size={12} className="text-blue-500 shrink-0" /> : <ArrowUp size={12} className="text-blue-500 shrink-0" />) : <ArrowUpDown size={12} className="text-gray-300 shrink-0" />;
  };
  const sortedJurnalResults = useMemo(() => {
    const nd = (d: string) => {
      if (!d) return 0;
      const p = d.split('-');
      if (p.length === 3 && p[2].length === 4) return +(p[2] + p[1] + p[0]);
      if (p.length === 3 && p[0].length === 4) return +(p[0] + p[1] + p[2]);
      const dt = new Date(d);
      if (!isNaN(dt.getTime())) return +dt.toISOString().slice(0, 10).replace(/-/g, '');
      return 0;
    };
    if (sorting.length === 0) return jurnalResults;
    let res = jurnalResults;
    for (const s of sorting) {
      const dir = s.desc ? -1 : 1;
      if (s.i !== 4) {
        const key = COL_PROPS[s.i];
        if (!key) continue;
        const allItems = [...res.flatMap(g => g.items)].sort((a, b) => {
          if (s.i === 0) return dir * (nd(a[key]) - nd(b[key]));
          if (s.i === 1) { const va = (a.bagian||'')+'|'+(a.nama_karyawan||''), vb = (b.bagian||'')+'|'+(b.nama_karyawan||''); return dir * va.localeCompare(vb, 'id'); }
          const va = a[key], vb = b[key];
          if (va == null) return 1; if (vb == null) return -1;
          const na = Number(va), nb = Number(vb);
          if (!isNaN(na) && !isNaN(nb)) return dir * (na - nb);
          return dir * String(va).localeCompare(String(vb), 'id');
        });
        if (allItems.length === 0) { res = []; continue; }
        res = [{ job: '', code: '', date: allItems[0].tgl, items: allItems, totalRealisasi: 0, totalRijek: 0, totalTarget: 0 }];
        continue;
      }
      if (s.i === 4) { res = [...res].sort((a, b) => dir * ((a.code || '').localeCompare(b.code || '', 'id'))); continue; }
    }
    return res;
  }, [jurnalResults, sorting]);
  
  // Keyboard navigation states
  const [focusedSopdIndex, setFocusedSopdIndex] = useState(-1);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Table scroll sync refs
  const barangJadiBodyRef = useRef<HTMLDivElement>(null);
  const jurnalBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    async function fetchSopd() {
      setLoadingSopd(true);
      try {
        const url = new URL('/api/sopd/options', window.location.origin);
        if (debouncedSearchQuery) url.searchParams.set('search', debouncedSearchQuery);
        url.searchParams.set('limit', '50');
        
        const res = await fetch(url.toString());
        if (res.ok) {
          const json = await res.json();
          setSopdOptions(json.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch SOPd options", err);
      } finally {
        setLoadingSopd(false);
      }
    }
    fetchSopd();
  }, [debouncedSearchQuery]);

  // Memoized filtered lists for consistent indexing
  const filteredSopd = useMemo(() => {
    return sopdOptions.filter(opt => 
      (opt.no_sopd?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
      (opt.pelanggan?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (opt.nama_order?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    ).slice(0, 50);
  }, [sopdOptions, searchQuery]);

  // Reset indices when search or open state changes
  useEffect(() => { setFocusedSopdIndex(-1); }, [searchQuery, isDropdownOpen]);

  const fetchDetails = async () => {
    if (!selectedSopd) {
      setResults([]);
      setJurnalResults([]);
      setGrandTotal(0);
      setGrandTotalJurnal(0);
      return;
    }

    setLoadingDetails(true);
    setLoadTime(null);
    const startTime = performance.now();
    try {
      const fmtDate = (d: Date | null) => {
         if (!d) return '';
         const y = d.getFullYear();
         const m = String(d.getMonth() + 1).padStart(2, '0');
         const day = String(d.getDate()).padStart(2, '0');
         return `${y}-${m}-${day}`;
      };

      const url = `/api/hasil-produksi/details?no_sopd=${encodeURIComponent(selectedSopd.no_sopd)}&startDate=${fmtDate(startDate)}&endDate=${fmtDate(endDate)}&bagian=${encodeURIComponent(selectedBagian)}&pekerjaan=${encodeURIComponent(selectedPekerjaan)}&sort=default`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setResults(json.barang_jadi || []);
        setJurnalResults(json.jurnal || []);
        setBarangJadiPage(1);
        setGrandTotal(json.grandTotal || 0);
        setGrandTotalJurnal(json.grandTotalRealisasi || 0);
        setGrandTotalRijek(json.grandTotalRijek || 0);
        setGrandTotalTarget(json.grandTotalTarget || 0);
        setUnit(json.unit || selectedSopd.unit || '');
        setAvailableBagian(json.availableBagian || []);
        setAvailablePekerjaan(json.availablePekerjaan || []);
      }
    } catch (error) {
      console.error('Error fetching details:', error);
    } finally {
      setLoadingDetails(false);
      setLoadTime(performance.now() - startTime);
    }
  };

  // Reset pekerjaan when bagian or SOPd changes
  useEffect(() => {
    setSelectedPekerjaan('');
  }, [selectedBagian, selectedSopd]);

  useEffect(() => {
    fetchDetails();
  }, [selectedSopd, startDate, endDate, selectedBagian, selectedPekerjaan]);

  const resetFilters = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setSelectedSopd(null);
    setStartDate(today);
    setEndDate(today);
    setSelectedBagian('');
    setSelectedPekerjaan('');
    setSorting([]);
    setDetailLevel(2);
    persistDateStore('hasil_dates', today, today);
    localStorage.removeItem('hasil_selectedSopd');
  };

  // Prepare chart data
  const chartData = React.useMemo(() => {
    const dataMap: Record<string, { date: string, displayDate: string, gudang: number, jurnal: number }> = {};
    
    // Process Gudang (DD-MM-YYYY)
    results.forEach(group => {
      const parts = group.date.split('-');
      const isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      if (!dataMap[isoDate]) {
        dataMap[isoDate] = { 
          date: isoDate, 
          displayDate: formatToDayMonthYear(group.date), 
          gudang: 0, 
          jurnal: 0 
        };
      }
      dataMap[isoDate].gudang += group.total;
    });

    // Process Jurnal (YYYY-MM-DD)
    jurnalResults.forEach(group => {
      const isoDate = group.date;
      if (!dataMap[isoDate]) {
        dataMap[isoDate] = { 
          date: isoDate, 
          displayDate: formatToDayMonthYear(isoDate), 
          gudang: 0, 
          jurnal: 0 
        };
      }
      
      // Only total up if Pekerjaan is selected for accuracy (to avoid mixing different units/metrics)
      if (selectedPekerjaan) {
        dataMap[isoDate].jurnal += group.totalRealisasi;
      }
    });

    return Object.values(dataMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [results, jurnalResults, selectedBagian, selectedPekerjaan]);

  // Memoize operator stats
  const operatorStats = React.useMemo(() => {
    if (!jurnalResults || jurnalResults.length === 0) return [];
    const stats: Record<string, number> = {};
    jurnalResults.forEach(group => {
      group.items.forEach((item: any) => {
        const name = item.nama_karyawan || '';
        stats[name] = (stats[name] || 0) + Number(item.realisasi || 0);
      });
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [jurnalResults]);

  // Pre-compute flat rows (data + subtotals) for virtual scrolling
  const flatRows = React.useMemo(() => {
    const src = sortedJurnalResults;
    if (!src || src.length === 0) return [];

    // Pure sort: flatten all items, subtotals per pekerjaan
    if (sorting.some(s => s.i !== 4)) {
      const allItems = src.flatMap(g => (g.items || []).map((item: any) => ({ item, g })));
      const rows: any[] = [];
      let _sk = 0, streak: any[] = [], lastJobKey = '', lastTgl = '', streakCode = '';
      const flushStreak = () => {
        if (streak.length === 0) return;
        const totalR = streak.reduce((s, x) => s + Number(x.realisasi || 0), 0);
        const totalRijek = streak.reduce((s, x) => s + Number(x.rijek || 0), 0);
        const totalTarget = streak.reduce((s, x) => s + Number(x.target || 0), 0);
        if (streak.length > 1) {
          const dates = streak.map(x => x.tgl).filter(Boolean).sort();
          let dateLabel = formatToDayMonthYear(dates[0]);
          if (dates[0] && dates[dates.length-1] && dates[0] !== dates[dates.length-1]) dateLabel = `${formatToDayMonthYear(dates[0])} s.d. ${formatToDayMonthYear(dates[dates.length-1])}`;
          rows.push({ type: 'subtotal', jobDisplayName: streak[0]?.jenis_pekerjaan_2 || 'Pekerjaan', dateLabel, totalR, totalRijek, totalTarget, gIdx: 0, _sk: _sk++, code: streakCode });
        }
        streak = []; streakCode = '';
      };
      allItems.forEach(({ item, g }, i) => {
        const jobKey = (item.jenis_pekerjaan_2 || '').toLowerCase();
        if (streak.length > 0 && jobKey !== lastJobKey) flushStreak();
        if (!streakCode) streakCode = g?.code || '';
        lastJobKey = jobKey;
        const showDate = item.tgl !== lastTgl;
        lastTgl = item.tgl;
        rows.push({ type: 'data', item, group: g, iIdx: i, gIdx: 0, showDate });
        streak.push(item);
      });
      flushStreak();
      return rows;
    }

    const rows: any[] = [];
    let _sk = 0;

    src.forEach((group: any, gIdx: number) => {
      const items = group.items || [];
      let streak: any[] = [];
      let lastJobKey = '';

      const flushStreak = () => {
        if (streak.length === 0) return;
        const totalR = streak.reduce((s, x) => s + Number(x.realisasi || 0), 0);
        const totalRijek = streak.reduce((s, x) => s + Number(x.rijek || 0), 0);
        const totalTarget = streak.reduce((s, x) => s + Number(x.target || 0), 0);
        const dates = streak.map(x => x.tgl).filter(Boolean).sort();
        const minDate = dates[0];
        const maxDate = dates[dates.length - 1];
        let dateLabel = formatToDayMonthYear(minDate);
        if (minDate && maxDate && minDate !== maxDate) {
          dateLabel = `${formatToDayMonthYear(minDate)} s.d. ${formatToDayMonthYear(maxDate)}`;
        }
        const jobDisplayName = streak[0]?.jenis_pekerjaan_2 || 'Pekerjaan';
        rows.push({ type: 'subtotal', jobDisplayName, dateLabel, totalR, totalRijek, totalTarget, gIdx, _sk: _sk++, code: group?.code || '' });
        streak = [];
      };

      items.forEach((item: any, iIdx: number) => {
        const jobKey = (item.jenis_pekerjaan_2 || '').toLowerCase();
        if (streak.length > 0 && (jobKey !== lastJobKey || group.date !== streak[0].tgl)) {
          flushStreak();
        }
        lastJobKey = jobKey;

        const showDate = rows.length === 0 || item.tgl !== streak[streak.length - 1]?.tgl;
        rows.push({ type: 'data', item, group, iIdx, gIdx, showDate });
        streak.push(item);
      });

      flushStreak();
    });

    return rows;
  }, [sortedJurnalResults, sorting]);

  const displayRows = React.useMemo(() => {
    if (detailLevel === 1) return flatRows.filter(r => r.type === 'subtotal');
    return flatRows;
  }, [flatRows, detailLevel]);

  const rowVirtualizer = useVirtualizer({
    count: displayRows.length,
    getScrollElement: () => jurnalBodyRef.current,
    estimateSize: (i) => (displayRows[i]?.type === 'subtotal' ? 56 : 58),
    overscan: 15,
    measureElement: (el) => el.getBoundingClientRect().height,
  });

  const jurnalRowsContent = (() => {
    if (loadingDetails) {
      return (
        [...Array(8)].map((_, i) => (
          <tr key={i} className="animate-pulse">
            <td className="px-4 py-5"><div className="h-3 w-20 bg-gray-100 rounded-full"></div></td>
            <td className="px-4 py-5"><div className="h-4 w-32 bg-gray-50 rounded-full"></div></td>
            <td className="px-4 py-5"><div className="h-3 w-24 bg-gray-100 rounded-full"></div></td>
            <td className="px-4 py-5"><div className="h-4 w-16 bg-gray-50 rounded-full"></div></td>
            <td className="px-4 py-5"><div className="h-3 w-16 bg-gray-100 rounded-full"></div></td>
            <td className="px-4 py-5"><div className="h-3 w-20 bg-gray-100 rounded-full"></div></td>
            <td className="px-4 py-5"><div className="h-3 w-12 bg-gray-50 rounded-full"></div></td>
            <td className="px-4 py-5"><div className="h-3 w-12 bg-gray-100 rounded-full"></div></td>
            <td className="px-4 py-5"><div className="h-3 w-12 bg-gray-50 rounded-full"></div></td>
            <td className="px-4 py-5"><div className="h-3 w-12 bg-gray-100 rounded-full"></div></td>
            <td className="px-4 py-5"><div className="h-3 w-12 bg-gray-50 rounded-full"></div></td>
            <td className="px-4 py-5"><div className="h-3 w-20 bg-gray-100 rounded-full"></div></td>
            <td className="px-4 py-5"><div className="h-3 w-20 bg-gray-50 rounded-full"></div></td>
            <td className="px-4 py-5"><div className="h-4 w-16 bg-gray-100 rounded-full"></div></td>
            <td className="px-4 py-5 text-right"><div className="h-5 w-16 bg-emerald-100/50 rounded-lg ml-auto"></div></td>
          </tr>
        ))
      );
    }

    if (!jurnalResults || jurnalResults.length === 0) {
      const minW = '2160px';
      return (
        <tr style={{ display: 'block', width: '100%', minWidth: minW }}>
          <td style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', width: '100%' }}>
            <div className="flex flex-col items-center gap-3 opacity-30 py-20">
              <ClipboardList size={40} />
              <span className="text-sm font-semibold tracking-wide">Belum ada laporan operator</span>
            </div>
          </td>
        </tr>
      );
    }

    if (flatRows.length === 0) {
      const minW = '2160px';
      return (
        <tr style={{ display: 'block', width: '100%', minWidth: minW }}>
          <td style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', width: '100%' }}>
            <div className="flex flex-col items-center gap-4 opacity-30 py-24">
              <AlertCircle size={28} />
              <span className="text-[11px] font-bold tracking-wide">Tidak ada data</span>
            </div>
          </td>
        </tr>
      );
    }

    const virtualRows = rowVirtualizer.getVirtualItems();

    if (virtualRows.length === 0) return null;

    return virtualRows.map((virtualRow) => {
      const row = displayRows[virtualRow.index];

      if (row.type === 'subtotal') {
        const cols: [string, string, React.ReactNode?][] = [
          [`${colWidths.slice(0, 9).reduce((a, b) => a + b, 0)}px`, 'border-r border-emerald-200 bg-emerald-100 text-right',
            <span key="subtotal-label" className="inline-flex items-baseline gap-1.5"><span className="text-[13px] font-semibold text-emerald-700">Total</span>{row.code ? <span className="text-[13px] font-bold text-gray-500 font-mono">{row.code}</span> : null}<span className="text-[15px] font-extrabold text-gray-900 tracking-tight">{row.jobDisplayName || 'Pekerjaan'}</span><span className="text-[11px] font-semibold text-gray-400">—</span><span className="text-[12px] font-semibold text-gray-500">{row.dateLabel}</span></span>
          ],
          [`${colWidths[9]}px`, 'border-r border-emerald-200 bg-rose-100/60 text-right', row.totalRijek.toLocaleString('id-ID')],
          [`${colWidths.slice(10, 13).reduce((a, b) => a + b, 0)}px`, 'border-r border-emerald-200 bg-emerald-100', undefined],
          [`${colWidths[13]}px`, 'border-r border-emerald-200 bg-gray-100/60 text-right', row.totalTarget.toLocaleString('id-ID')],
          [`${colWidths[14]}px`, 'bg-emerald-200/60 text-right', row.totalR.toLocaleString('id-ID')],
        ];
        return (
          <tr key={`s-${row._sk}`}
            data-index={virtualRow.index}
            ref={rowVirtualizer.measureElement}
            className="bg-emerald-100"
            style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch', position: 'absolute', top: 0, left: 0, transform: `translateY(${virtualRow.start}px)`, width: '100%' }}>
            {cols.map(([w, cls, content], i) => (
              <td key={i} className={`px-4 py-3.5 ${cls}`} style={{ flex: `0 0 ${w}`, width: w, display: 'flex', alignItems: 'center', justifyContent: content ? 'flex-end' : 'flex-start' }}>
                {typeof content === 'string' ? <span className="text-[15px] font-extrabold tracking-tight tabular-nums">{content}</span> : content}
              </td>
            ))}
          </tr>
        );
      }

      const { item, group, iIdx, gIdx, showDate } = row;
      const isEven = virtualRow.index % 2 === 0;
      const rowBg = isEven ? 'bg-white' : 'bg-[#f9fafb]';
      const cw = (i: number) => `${colWidths[i]}px`;
      const sl = (i: number) => ({ left: `${colWidths.slice(0, i).reduce((a, b) => a + b, 0)}px` });
      return (
        <tr key={`${gIdx}-${iIdx}`}
          data-index={virtualRow.index}
          ref={rowVirtualizer.measureElement}
          className={`${rowBg} hover:bg-[#f0fdf4] transition-colors cursor-default`}
          style={{ display: 'table', width: '100%', tableLayout: 'fixed', borderSpacing: 0, position: 'absolute', top: 0, left: 0, transform: `translateY(${virtualRow.start}px)` }}>
          <td className="sticky left-0 z-10 px-4 py-3.5 text-[11px] xl:text-[12px] font-bold border-r border-gray-100 tabular-nums text-gray-800" style={{ width: cw(0), minWidth: cw(0), backgroundColor: isEven ? '#fff' : '#f9fafb' }}>
            {showDate ? formatToDayMonthYear(item.tgl) : ''}
          </td>
          <td className="md:sticky md:z-10 px-4 py-3.5 border-r border-gray-100" style={{ width: cw(1), minWidth: cw(1), backgroundColor: isEven ? '#fff' : '#f9fafb', ...sl(1) }}>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] xl:text-[10px] font-bold text-gray-400 uppercase leading-none mb-1 truncate" title={item.bagian}>{item.bagian}</span>
              <span className="text-[11px] xl:text-[12px] font-bold text-gray-800 leading-tight whitespace-nowrap truncate" title={item.nama_karyawan}>{item.nama_karyawan}</span>
            </div>
          </td>
          <td className="lg:sticky lg:z-10 px-4 py-3.5 border-r border-gray-100" style={{ width: cw(2), minWidth: cw(2), backgroundColor: isEven ? '#fff' : '#f9fafb', ...sl(2) }}>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] xl:text-[10px] font-bold text-gray-400 leading-none mb-1 truncate" title={item.no_order_2 || ''}>{item.no_order_2 || '-'}</span>
              <span className="text-[11px] xl:text-[12px] font-bold text-gray-700 leading-tight truncate" title={item.nama_order_2 || ''}>{item.nama_order_2 || '-'}</span>
            </div>
          </td>
          <td className="lg:sticky lg:z-10 px-4 py-3.5 text-[11px] xl:text-[12px] border-r border-gray-100" style={{ width: cw(3), minWidth: cw(3), backgroundColor: isEven ? '#fff' : '#f9fafb', ...sl(3) }}>
            <div className="font-bold bg-white px-2 py-1 rounded-lg border border-gray-100 shadow-sm text-gray-700 capitalize inline-block whitespace-nowrap align-middle" title={item.jenis_pekerjaan_2 || ''}>
              {(item.jenis_pekerjaan_2 || '-').toLowerCase()}
            </div>
          </td>
          <td className="lg:sticky lg:z-10 px-4 py-3.5 text-[10px] xl:text-[11px] font-mono font-bold border-r border-gray-100 text-emerald-700 truncate" style={{ width: cw(4), minWidth: cw(4), maxWidth: cw(4), backgroundColor: isEven ? '#fff' : '#f9fafb', ...sl(4) }} title={group.code || ''}>
              {group.code || '-'}
            </td>
          <td className="px-4 py-3.5 text-[10px] xl:text-[11px] font-bold border-r border-gray-100 truncate text-gray-600" style={{ width: cw(5), minWidth: cw(5), maxWidth: cw(5) }} title={item.bahan_kertas || ''}>{item.bahan_kertas || '-'}</td>
          <td className="px-4 py-3.5 text-[11px] xl:text-[12px] font-bold border-r border-gray-100 text-gray-700" style={{ width: cw(6), minWidth: cw(6) }}>{formatCellVal(item.jml_plate)}</td>
          <td className="px-4 py-3.5 text-[10px] xl:text-[11px] font-bold border-r border-gray-100 truncate text-gray-600" style={{ width: cw(7), minWidth: cw(7), maxWidth: cw(7) }} title={item.warna || ''}>{item.warna || '-'}</td>
          <td className="px-4 py-3.5 text-[11px] xl:text-[12px] font-bold border-r border-gray-100 text-gray-700" style={{ width: cw(8), minWidth: cw(8) }}>{formatCellVal(item.inscheet)}</td>
          <td className="px-4 py-3.5 text-[11px] xl:text-[12px] font-bold border-r border-gray-100 text-rose-600" style={{ width: cw(9), minWidth: cw(9) }}>{formatCellVal(item.rijek)}</td>
          <td className="px-4 py-3.5 text-[11px] xl:text-[12px] font-bold border-r border-gray-100 text-gray-700 truncate" style={{ width: cw(10), minWidth: cw(10) }} title={item.jam || ''}>{item.jam || '-'}</td>
          <td className="px-4 py-3.5 text-[10px] xl:text-[11px] font-bold border-r border-gray-100 truncate text-rose-600" style={{ width: cw(11), minWidth: cw(11) }} title={item.kendala || ''}>{item.kendala || '-'}</td>
          <td className="px-4 py-3.5 text-[10px] xl:text-[11px] font-bold border-r border-gray-100 text-gray-500 truncate" style={{ width: cw(12), minWidth: cw(12) }} title={item.keterangan || ''}>{item.keterangan || '-'}</td>
          <td className="px-4 py-3.5 text-[12px] xl:text-[13px] font-bold text-right tabular-nums border-r border-gray-100 text-gray-700" style={{ width: cw(13), minWidth: cw(13) }}>{Number(item.target).toLocaleString('id-ID')}</td>
          <td className="px-4 py-3.5 text-[13px] xl:text-[15px] font-semibold text-right tabular-nums bg-emerald-50 text-emerald-900" style={{ width: cw(14), minWidth: cw(14) }}>{Number(item.realisasi).toLocaleString('id-ID')}</td>
        </tr>
      );
    });
  })();

  const memoizedBarangJadiRows = useMemo(() => {
    if (loadingDetails) {
      return [...Array(6)].map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-4 py-3"><div className="h-4 w-20 bg-gray-100 rounded-full"></div></td>
          <td className="px-4 py-3"><div className="h-4 w-full bg-gray-50 rounded-full"></div></td>
          <td className="px-4 py-3"><div className="h-4 w-16 bg-gray-100 rounded-full"></div></td>
          <td className="px-4 py-3 text-right"><div className="h-4 w-10 bg-gray-50 rounded-full ml-auto"></div></td>
        </tr>
      ));
    }

    const allItems: Array<{ item: any; group: any; iIdx: number; gIdx: number; isLastInGroup: boolean }> = [];
    results.forEach((group: any, gIdx: number) => {
      group.items.forEach((item: any, iIdx: number) => {
        allItems.push({ item, group, iIdx, gIdx, isLastInGroup: iIdx === group.items.length - 1 });
      });
    });

    const startIdx = (barangJadiPage - 1) * PAGE_SIZE;
    const pageItems = allItems.slice(startIdx, startIdx + PAGE_SIZE);

    const renderedGroups: React.ReactNode[] = [];
    pageItems.forEach(({ item, group, iIdx, gIdx, isLastInGroup }) => {
      renderedGroups.push(
        <tr key={`${gIdx}-${iIdx}`} className="bg-white hover:bg-emerald-50/30 even:bg-gray-50/50 transition-colors group cursor-default">
          <td className="sticky left-0 z-10 px-4 py-3 xl:py-4 text-[11px] xl:text-[12px] font-bold text-gray-800 border-r border-gray-50 tabular-nums bg-white group-even:bg-[#f9fafb] group-hover:bg-[#f8faf9] shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">
            {iIdx === 0 ? formatToDayMonthYear(group.date) : ''}
          </td>
          <td className="px-4 py-3 xl:py-4 text-[11px] xl:text-[12px] font-bold text-gray-600 border-r border-gray-50 tracking-tight">
            <div className="truncate max-w-[400px]" title={item.nama_prd}>{item.nama_prd}</div>
          </td>
          <td className="px-4 py-3 xl:py-4 text-[10px] xl:text-[11px] font-bold text-gray-400 border-r border-gray-50 tabular-nums uppercase tracking-wide">
            {item.faktur}
          </td>
          <td className="px-4 py-3 xl:py-4 text-[13px] xl:text-[15px] font-bold text-emerald-900 bg-emerald-50 text-right tabular-nums">
            {Number(item.qty).toLocaleString('id-ID')} <span className="text-[9px] xl:text-[10px] font-bold text-emerald-600/50 ml-1 uppercase">{item.satuan || unit}</span>
          </td>
        </tr>
      );

      if (isLastInGroup && group.items.length > 1) {
        renderedGroups.push(
          <tr key={`${gIdx}-subtotal`} className="bg-emerald-100 border-t-2 border-emerald-200">
            <td colSpan={3} className="px-5 py-3.5 text-right text-[15px] font-extrabold tracking-tight text-emerald-900 border-r border-emerald-200">Total Harian {formatToDayMonthYear(group.date)}</td>
            <td className="px-5 py-3.5 text-right text-[17px] font-extrabold tabular-nums text-emerald-900 bg-emerald-200/60">
               {group.total.toLocaleString('id-ID')} <span className="text-[10px] opacity-40 ml-1 uppercase">{group.items[0].satuan || unit}</span>
            </td>
          </tr>
        );
      }
    });

    if (pageItems.length === 0 && !loadingDetails) {
      renderedGroups.push(
        <tr key="empty">
          <td colSpan={4} className="px-6 py-24 text-center">
            <div className="flex flex-col items-center gap-4 opacity-30">
              <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center text-gray-300">
                <BarChart3 size={32} />
              </div>
              <span className="text-[11px] font-bold text-gray-400 tracking-wide">Belum ada data barang jadi</span>
            </div>
          </td>
        </tr>
      );
    }

    return renderedGroups;
  }, [results, loadingDetails, barangJadiPage, unit]);

  // Close dropdown on outside click & Dynamic Sticky Calculation
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);

    // Dynamic Sticky Calculation
    const header = document.getElementById('sticky-page-header');
    const tabs = document.getElementById('sticky-tabs-container');
    
    const updateOffsets = () => {
      if (header) {
        const headerHeight = header.offsetHeight - 24; // subtract the -mt-6 (24px) pull-up offset
        document.documentElement.style.setProperty('--sticky-header-h', `${headerHeight}px`);
      }
      
      const isDesktop = window.innerWidth >= 1024;
      const desktopControlBar = document.getElementById('desktop-sticky-control-bar');
      const mobileTabs = document.getElementById('sticky-tabs-container');
      
      let stickyHeight = 0;
      if (isDesktop && desktopControlBar) {
        stickyHeight = desktopControlBar.offsetHeight;
      } else if (!isDesktop && mobileTabs) {
        stickyHeight = mobileTabs.offsetHeight;
      }
      
      document.documentElement.style.setProperty('--sticky-tabs-h', `${stickyHeight}px`);
    };

    const observer = new ResizeObserver(updateOffsets);
    if (header) observer.observe(header);
    const tabsContainer = document.getElementById('sticky-tabs-container');
    const desktopContainer = document.getElementById('desktop-sticky-control-bar');
    if (tabsContainer) observer.observe(tabsContainer);
    if (desktopContainer) observer.observe(desktopContainer);
    
    updateOffsets();
    window.addEventListener('scroll', updateOffsets);
    window.addEventListener('resize', updateOffsets);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      observer.disconnect();
      window.removeEventListener('scroll', updateOffsets);
      window.removeEventListener('resize', updateOffsets);
    };
  }, []);


  if (!isMounted) return null;

  const totalJurnalItems = flatRows.length;
  
  const totalBarangJadiItems = results.reduce((acc, group) => acc + group.items.length, 0);
  const totalBarangJadiPages = Math.max(1, Math.ceil(totalBarangJadiItems / PAGE_SIZE));

  return (
    <div className="flex flex-col h-full gap-3 animate-in fade-in duration-500">
      {/* 1. Header Section - Fixed */}
      <div id="filter-control-container" className="flex flex-col gap-3 shrink-0 relative bg-[var(--bg-deep)] pt-0 pb-1 -mx-4 px-4 lg:-mx-8 lg:px-8">
        {/* 1. Filter Control Center */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-3 flex flex-col 2xl:flex-row items-stretch 2xl:items-end gap-2 lg:gap-3 relative">
          {/* SOPd Selection Group */}
          <div className="flex-1 min-w-[300px]">
            <label className="block text-[11px] font-semibold text-gray-500 mb-1 ml-1 tracking-tight select-none">
              Pilih Order Produksi (SOPd)
            </label>
            <div className="relative sopd-dropdown-container" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className={`w-full h-9 px-3 bg-gray-50/50 border rounded-xl transition-all flex items-center justify-between group ${
                  selectedSopd 
                  ? 'border-emerald-100 bg-emerald-50/20' 
                  : 'border-gray-100 hover:border-emerald-500'
                }`}
              >
                {selectedSopd ? (
                  <div className="flex flex-1 items-center gap-2 min-w-0 mr-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                      <ClipboardList size={12} />
                    </div>
                    <div className="flex flex-col items-start flex-1 min-w-0 overflow-hidden">
                      <span className="text-[10px] font-semibold text-emerald-700 leading-none">{selectedSopd.no_sopd}</span>
                      <span className="text-[12px] font-semibold text-gray-800 truncate tracking-tight w-full text-left" title={`${selectedSopd.pelanggan} — ${selectedSopd.nama_order}`}>
                        {selectedSopd.pelanggan} — {selectedSopd.nama_order}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Search size={15} className="group-hover:text-emerald-500 transition-colors" />
                    <span className="text-[12px] font-bold">Cari nomor SOPd atau pelanggan...</span>
                  </div>
                )}
                <ChevronDown size={18} className={`text-gray-300 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white border border-gray-100 rounded-2xl shadow-xl z-[90] animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[450px]">
                  <div className="p-4 border-b border-gray-50 bg-gray-50/30">
                    <div className="relative">
                      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Ketik nomor SOPd, pelanggan, atau nama order..."
                        className="w-full h-11 pl-12 pr-4 bg-white border border-gray-100 rounded-xl text-[13px] font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-gray-300"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setFocusedSopdIndex(prev => (prev < filteredSopd.length - 1 ? prev + 1 : prev));
                          } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setFocusedSopdIndex(prev => (prev > 0 ? prev - 1 : prev));
                          } else if (e.key === 'Enter' && focusedSopdIndex >= 0) {
                            e.preventDefault();
                            const opt = filteredSopd[focusedSopdIndex];
                            setSelectedSopd(opt);
                            setIsDropdownOpen(false);
                            setSearchQuery('');
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 custom-scrollbar min-h-[100px]">
                    {loadingSopd ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-3 opacity-40">
                        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-[10px] font-semibold tracking-wide">Mencari data...</span>
                      </div>
                    ) : (
                      <>
                        {filteredSopd.length > 0 ? filteredSopd.map((opt, idx) => (
                      <button
                        key={opt.no_sopd}
                        ref={focusedSopdIndex === idx ? (el) => { if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } : null}
                        onClick={() => {
                          setSelectedSopd(opt);
                          setIsDropdownOpen(false);
                          setSearchQuery('');
                        }}
                        className={`w-full flex items-center justify-between p-4 rounded-xl transition-all mb-1 group ${
                          selectedSopd?.no_sopd === opt.no_sopd 
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100' 
                          : focusedSopdIndex === idx ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-200' : 'hover:bg-emerald-50'
                        }`}
                      >
                        <div className="flex flex-col items-start min-w-0 flex-1 mr-3 text-left">
                          <span className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${selectedSopd?.no_sopd === opt.no_sopd ? 'text-emerald-100' : 'text-emerald-600'}`}>
                            {opt.no_sopd}
                          </span>
                          <span className={`text-[13px] font-semibold truncate w-full ${selectedSopd?.no_sopd === opt.no_sopd ? 'text-white' : 'text-gray-800'}`} title={`${opt.pelanggan} — ${opt.nama_order}`}>
                            {opt.pelanggan} — {opt.nama_order}
                          </span>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-tighter shrink-0 whitespace-nowrap ${selectedSopd?.no_sopd === opt.no_sopd ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {opt.qty?.toLocaleString('id-ID')} {opt.unit}
                        </div>
                      </button>
                        )) : (
                          <div className="flex flex-col items-center justify-center py-10 gap-2 opacity-30 text-center px-6">
                            <AlertCircle size={24} />
                            <span className="text-[11px] font-semibold tracking-wide leading-relaxed">Data tidak ditemukan untuk kata kunci ini</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Combined Row for Date, Bagian, Pekerjaan & Refresh on LG */}
          <div className="flex flex-col lg:flex-row lg:items-end gap-2 lg:gap-3">
            {/* Rentang Tanggal */}
            <div className="flex flex-col lg:w-[290px] shrink-0">
              <label className="block text-[11px] font-semibold text-gray-500 mb-1 ml-1 tracking-tight select-none">Rentang Tanggal</label>
              <div className="flex items-center gap-1">
                <div className="flex-1"><DatePicker name="startDate" value={startDate} onChange={(d) => setStartDate(d)} /></div>
                <div className="w-2 h-px bg-gray-200 shrink-0"></div>
                <div className="flex-1"><DatePicker name="endDate" value={endDate} onChange={(d) => setEndDate(d)} popupAlign="right" /></div>
              </div>
            </div>

            {/* Bagian, Pekerjaan & Refresh */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2 w-fit">
              {activeTab === 'jurnal' && (
                <div className="flex items-center gap-2">
                  <div className="flex flex-col min-w-0">
                    <SearchableDropdown
                      id="hasil-bagian"
                      label="Bagian"
                      value={selectedBagian}
                      items={availableBagian}
                      allLabel="Semua Bagian"
                      searchPlaceholder="Cari bagian..."
                      panelWidth="w-[250px]"
                      icon={<Filter size={14} className={selectedBagian ? 'text-emerald-600' : 'text-gray-400'} />}
                      onChange={(val) => setSelectedBagian(val)}
                      compact
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <SearchableDropdown
                      id="hasil-pekerjaan"
                      label="Pekerjaan"
                      value={selectedPekerjaan}
                      items={availablePekerjaan}
                      allLabel="Semua Pekerjaan"
                      searchPlaceholder="Cari pekerjaan..."
                      panelWidth="w-[280px]"
                      icon={<Filter size={14} className={selectedPekerjaan ? 'text-emerald-600' : 'text-gray-400'} />}
                      onChange={(val) => setSelectedPekerjaan(val)}
                      compact
                    />
                  </div>
                </div>
              )}

              {/* Level */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <span className="block font-semibold text-gray-500 ml-1 tracking-tight select-none text-[11px] mb-1">Level</span>
                <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-0.5 shadow-sm">
                  <button onClick={() => setDetailLevel(1)} className={`px-3 h-7 text-[11px] font-bold rounded-lg transition-all ${detailLevel === 1 ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>1</button>
                  <button onClick={() => setDetailLevel(2)} className={`px-3 h-7 text-[11px] font-bold rounded-lg transition-all ${detailLevel === 2 ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>2</button>
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={resetFilters}
                className="h-9 px-4 sm:w-auto flex items-center justify-center gap-2 shrink-0 bg-rose-50 text-rose-600 font-bold text-[12px] border border-rose-200 rounded-xl hover:bg-rose-100 transition-all group shadow-sm"
                title="Reset semua filter"
              >
                <X size={14} />
                <span className="sm:hidden md:inline">Reset</span>
              </button>

              {/* Refresh Button */}
              <button
                onClick={() => fetchDetails()}
                className="h-9 px-4 sm:w-auto flex items-center justify-center gap-2 shrink-0 bg-emerald-50 text-emerald-600 font-bold text-[12px] border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-all group shadow-sm"
                title="Refresh Data"
              >
                <RotateCcw size={14} className={`group-hover:rotate-[-180deg] transition-transform duration-500 ${loadingDetails ? 'animate-spin' : ''}`} />
                <span className="sm:hidden md:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
        </div>


        {/* Unified Dashboard Control Bar */}
        {selectedSopd && (
          <div id="desktop-sticky-control-bar" className="shrink-0 z-[70] bg-[var(--bg-deep)] pb-1.5 -mx-4 px-4 xl:-mx-8 xl:px-8">

            {selectedPekerjaan ? (
              /* === MODE PEKERJAAN DIPILIH: 1 baris, Card Tren menempel di ujung === */
              <div className="flex flex-col lg:flex-row items-stretch gap-3 sm:gap-4">
                {/* Card 1: Order Produksi | WIP | Hasil Produksi */}
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm px-3 sm:px-5 py-2.5 sm:py-3.5 flex items-center shrink-0 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className="text-[11px] sm:text-[12px] font-bold text-gray-400 capitalize tracking-tight shrink-0">Jumlah Order</span>
                    <div className="flex items-baseline gap-1 min-w-0">
                      <span className="text-lg sm:text-xl font-semibold text-gray-800 tabular-nums truncate" title={selectedSopd.qty.toLocaleString('id-ID')}>{selectedSopd.qty.toLocaleString('id-ID')}</span>
                      <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-tighter shrink-0">{selectedSopd.unit}</span>
                    </div>
                  </div>
                  <div className="w-px h-6 bg-gray-100 shrink-0 mx-2 sm:mx-3"></div>
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className="text-[11px] sm:text-[12px] font-bold text-gray-400 capitalize tracking-tight shrink-0">WIP</span>
                    <div className="flex items-baseline gap-1 min-w-0">
                      <span className="text-lg sm:text-xl font-semibold text-rose-600 tabular-nums truncate" title={(selectedSopd.qty - grandTotal).toLocaleString('id-ID')}>{(selectedSopd.qty - grandTotal).toLocaleString('id-ID')}</span>
                      <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-tighter shrink-0">{selectedSopd.unit}</span>
                    </div>
                  </div>
                  <div className="w-px h-6 bg-gray-100 shrink-0 mx-2 sm:mx-3"></div>
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className="text-[11px] sm:text-[12px] font-bold text-gray-400 capitalize tracking-tight shrink-0">Hasil Produksi</span>
                    <div className="flex items-baseline gap-1 min-w-0">
                      <span className="text-lg sm:text-xl font-semibold text-emerald-600 tabular-nums truncate" title={grandTotal.toLocaleString('id-ID')}>{grandTotal.toLocaleString('id-ID')}</span>
                      <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-tighter shrink-0">{selectedSopd.unit}</span>
                    </div>
                  </div>
                </div>

                {/* Card 2: Pekerjaan | Realisasi | WIP */}
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm px-3 sm:px-5 py-2.5 sm:py-3.5 flex items-center shrink-0 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className="text-[11px] sm:text-[12px] font-bold text-gray-400 capitalize tracking-tight shrink-0">Pekerjaan</span>
                    <span className="text-[13px] sm:text-[14px] font-semibold text-gray-800 capitalize truncate max-w-[180px]" title={selectedPekerjaan}>{selectedPekerjaan}</span>
                  </div>
                  <div className="w-px h-6 bg-gray-100 shrink-0 mx-2 sm:mx-3"></div>
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className="text-[11px] sm:text-[12px] font-bold text-gray-400 capitalize tracking-tight shrink-0">Realisasi</span>
                    <div className="flex items-baseline gap-1 min-w-0">
                      <span className="text-lg sm:text-xl font-semibold text-emerald-600 tabular-nums truncate" title={grandTotalJurnal.toLocaleString('id-ID')}>{grandTotalJurnal.toLocaleString('id-ID')}</span>
                      <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-tighter shrink-0">{selectedSopd.unit}</span>
                    </div>
                  </div>
                  <div className="w-px h-6 bg-gray-100 shrink-0 mx-2 sm:mx-3"></div>
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className="text-[11px] sm:text-[12px] font-bold text-gray-400 capitalize tracking-tight shrink-0">WIP</span>
                    <div className="flex items-baseline gap-1 min-w-0">
                      <span className="text-lg sm:text-xl font-semibold text-rose-600 tabular-nums truncate" title={(selectedSopd.qty - grandTotalJurnal).toLocaleString('id-ID')}>{(selectedSopd.qty - grandTotalJurnal).toLocaleString('id-ID')}</span>
                      <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-tighter shrink-0">{selectedSopd.unit}</span>
                    </div>
                  </div>
                </div>

                {/* Card Tren — hanya tombol Tren, sebelum Tab */}
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm px-3 sm:px-5 py-2.5 sm:py-3.5 flex items-center shrink-0">
                  <button
                    onClick={() => setShowChart(!showChart)}
                    className={`px-4 py-1.5 rounded-lg border text-[10px] font-semibold uppercase tracking-wide transition-all shadow-sm shrink-0 ${showChart ? 'bg-emerald-600 text-white border-emerald-600' : 'border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}
                  >
                    Tren
                  </button>
                </div>

                {/* Tab — flex-1 agar mengisi sisa ruang */}
                <div className="hidden lg:flex items-stretch flex-1 shrink-0 bg-white border border-gray-100 rounded-xl shadow-sm px-1.5 gap-1">
                  <button
                    onClick={() => setActiveTab('jurnal')}
                    className={`flex-1 my-2 rounded-lg text-[12px] font-bold capitalize tracking-tight whitespace-nowrap transition-all duration-300 ${activeTab === 'jurnal' ? 'bg-gray-100 text-emerald-600 border border-gray-200/50 shadow-inner' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                  >
                    Jurnal Produksi
                  </button>
                  <button
                    onClick={() => setActiveTab('barang_jadi')}
                    className={`flex-1 my-2 rounded-lg text-[12px] font-bold capitalize tracking-tight whitespace-nowrap transition-all duration-300 ${activeTab === 'barang_jadi' ? 'bg-gray-100 text-emerald-600 border border-gray-200/50 shadow-inner' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                  >
                    Barang Jadi
                  </button>
                </div>
              </div>
            ) : (
              /* === MODE TANPA PEKERJAAN: 1 baris, card stats & tren terpisah === */
              <div className="flex flex-col lg:flex-row items-stretch gap-3 sm:gap-4">
                {/* Card 1: Order Produksi | WIP | Hasil Produksi */}
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm px-3 sm:px-5 py-2.5 sm:py-3.5 flex items-center shrink-0 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span className="text-[11px] sm:text-[12px] font-bold text-gray-400 capitalize tracking-tight">Jumlah Order</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg sm:text-xl font-semibold text-gray-800 tabular-nums">{selectedSopd.qty.toLocaleString('id-ID')}</span>
                      <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{selectedSopd.unit}</span>
                    </div>
                  </div>

                  <div className="w-px h-6 bg-gray-100 shrink-0 mx-2 sm:mx-3"></div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span className="text-[11px] sm:text-[12px] font-bold text-gray-400 capitalize tracking-tight">WIP</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg sm:text-xl font-semibold text-rose-600 tabular-nums">{(selectedSopd.qty - grandTotal).toLocaleString('id-ID')}</span>
                      <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{selectedSopd.unit}</span>
                    </div>
                  </div>

                  <div className="w-px h-6 bg-gray-100 shrink-0 mx-2 sm:mx-3"></div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span className="text-[11px] sm:text-[12px] font-bold text-gray-400 capitalize tracking-tight">Hasil Produksi</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg sm:text-xl font-semibold text-emerald-600 tabular-nums">{grandTotal.toLocaleString('id-ID')}</span>
                      <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{selectedSopd.unit}</span>
                    </div>
                  </div>
                </div>

                {/* Card Tren — flex-1 agar mengisi sisa ruang, sebelum Tab */}
                <div className="flex-1 bg-white border border-gray-100 rounded-xl shadow-sm px-3 sm:px-5 py-2.5 sm:py-3.5 flex items-center gap-2 sm:gap-6 min-w-0">
                  <button
                    onClick={() => setShowChart(!showChart)}
                    className={`px-4 py-1.5 rounded-lg border text-[10px] font-semibold uppercase tracking-wide transition-all shadow-sm shrink-0 ${showChart ? 'bg-emerald-600 text-white border-emerald-600' : 'border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}
                  >
                    Tren
                  </button>
                  <div className="flex-1 flex items-center gap-3 min-w-0">
                    <div className="flex-1 h-2.5 bg-gray-200/50 rounded-full relative overflow-hidden">
                      <div className={`h-full transition-all duration-1000 ease-out rounded-full ${grandTotal >= selectedSopd.qty ? 'bg-emerald-500 shadow-sm' : 'bg-emerald-400'}`} style={{ width: `${Math.min(100, (grandTotal / selectedSopd.qty) * 100)}%` }} />
                    </div>
                    <span className="text-[14px] font-semibold tabular-nums text-gray-800 w-14 text-right shrink-0">
                      {((grandTotal / selectedSopd.qty) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Tab */}
                <div className="hidden lg:flex items-stretch shrink-0 bg-white border border-gray-100 rounded-xl shadow-sm px-1.5 gap-1">
                  <button
                    onClick={() => setActiveTab('jurnal')}
                    className={`lg:px-10 my-2 rounded-lg text-[12px] font-bold capitalize tracking-tight whitespace-nowrap transition-all duration-300 ${activeTab === 'jurnal' ? 'bg-gray-100 text-emerald-600 border border-gray-200/50 shadow-inner' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                  >
                    Jurnal Produksi
                  </button>
                  <button
                    onClick={() => setActiveTab('barang_jadi')}
                    className={`lg:px-10 my-2 rounded-lg text-[12px] font-bold capitalize tracking-tight whitespace-nowrap transition-all duration-300 ${activeTab === 'barang_jadi' ? 'bg-gray-100 text-emerald-600 border border-gray-200/50 shadow-inner' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                  >
                    Barang Jadi
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Navigation — Mobile/MD (shown below cards, separate layer) */}
        {selectedSopd && (
          <div id="sticky-tabs-container" className="shrink-0 z-[70] bg-[var(--bg-deep)] pb-1.5 -mx-4 px-4 lg:hidden">
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-1.5 flex items-center gap-1 w-full">
              <button 
                onClick={() => setActiveTab('jurnal')}
                className={`flex-1 py-2.5 rounded-lg text-[12px] font-bold capitalize tracking-tight whitespace-nowrap transition-all duration-300 ${
                  activeTab === 'jurnal' 
                  ? 'bg-gray-100 text-emerald-600 border border-gray-200/50 shadow-inner' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                Jurnal Produksi
              </button>
              <button 
                onClick={() => setActiveTab('barang_jadi')}
                className={`flex-1 py-2.5 rounded-lg text-[12px] font-bold capitalize tracking-tight whitespace-nowrap transition-all duration-300 ${
                  activeTab === 'barang_jadi' 
                  ? 'bg-gray-100 text-emerald-600 border border-gray-200/50 shadow-inner' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                Barang Jadi
              </button>
            </div>
          </div>
        )}

            {/* Daily Trend Chart - MODAL VERSION */}
            {showChart && chartData.length > 0 && (
              <div 
                className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-10 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300 cursor-pointer"
                onClick={() => setShowChart(false)}
              >
                <div 
                  className="w-full max-w-5xl bg-white border border-gray-100 rounded-xl shadow-md flex flex-col animate-in zoom-in-95 duration-300 cursor-default overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-50 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                        <TrendingUp size={16} />
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-gray-800 leading-tight">Tren Produksi Harian</h3>
                        <span className="text-[10px] sm:text-[12px] font-medium text-gray-500 mt-1">
                          Grafik perbandingan Barang Jadi dan Realisasi Pekerjaan
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowChart(false)}
                      className="p-2.5 rounded-lg bg-white border border-gray-100 shadow-sm hover:bg-red-50 hover:text-red-600 transition-all text-gray-400"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Modal Content */}
                  <div className="p-4 sm:p-10 min-h-[300px] sm:min-h-[450px] flex flex-col">
                    <div className="mb-6 sm:mb-10 flex flex-wrap gap-4 sm:gap-8 text-[11px] font-bold uppercase tracking-wide">
                      <button 
                        onClick={() => setHideGudang(!hideGudang)}
                        className={`flex items-center gap-3 cursor-pointer transition-all hover:opacity-80 ${hideGudang ? 'opacity-40' : 'opacity-100'}`}
                      >
                        <div className="w-5 h-5 rounded-lg border border-blue-100 shadow-sm" style={{ backgroundColor: '#2563eb' }}></div>
                        <span className={hideGudang ? 'line-through text-gray-300' : 'text-gray-800'}>Barang Jadi</span>
                      </button>
                      {selectedPekerjaan && (
                        <button 
                          onClick={() => setHideJurnal(!hideJurnal)}
                          className={`flex items-center gap-3 cursor-pointer transition-all hover:opacity-80 ${hideJurnal ? 'opacity-40' : 'opacity-100'}`}
                        >
                          <div className="w-5 h-5 rounded-lg border border-orange-100 shadow-sm" style={{ backgroundColor: '#f97316' }}></div>
                          <span className={hideJurnal ? 'line-through text-gray-300' : 'text-gray-800'}>{selectedPekerjaan}</span>
                        </button>
                      )}
                    </div>
                    
                    <div className="flex-1 w-full">
                      <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                          <defs>
                            <linearGradient id="colorGudang" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorJurnal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                          <XAxis 
                            dataKey="displayDate" 
                            fontSize={10} 
                            fontWeight={700} 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af', textAnchor: 'end' }}
                            angle={-30}
                            height={80}
                            dy={4}
                            label={{ value: 'Tanggal', position: 'insideBottom', offset: -10, fill: '#9ca3af', fontSize: 10, fontWeight: 700 }}
                          />
                          <YAxis 
                            width={80}
                            fontSize={10} 
                            fontWeight={700}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(val) => val.toLocaleString('id-ID')}
                            tick={{ fill: '#9ca3af' }}
                            dx={-10}
                            label={{ value: 'Qty / Realisasi', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 10, fontWeight: 700, offset: 0 }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#fff', 
                              border: '1px solid #f3f4f6', 
                              borderRadius: '16px',
                              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                              fontSize: '12px',
                              fontWeight: '700',
                              padding: '12px'
                            }}
                          />
                          {!hideGudang && (
                            <Area 
                              type="monotone" 
                              dataKey="gudang" 
                              name="Barang Jadi" 
                              stroke="#2563eb" 
                              strokeWidth={3}
                              fillOpacity={1} 
                              fill="url(#colorGudang)" 
                              animationDuration={1000}
                            />
                          )}
                          {!hideJurnal && selectedPekerjaan && (
                            <Area 
                              type="monotone" 
                              dataKey="jurnal" 
                              name={selectedPekerjaan} 
                              stroke="#f97316" 
                              strokeWidth={3}
                              fillOpacity={1} 
                              fill="url(#colorJurnal)" 
                              animationDuration={1000}
                            />
                          )}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}
        
        {selectedSopd ? (
          <>
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm shadow-green-900/5 flex flex-col flex-1 min-h-0 -mt-2">
            {activeTab === 'barang_jadi' ? (
            <div className="flex flex-col flex-1 min-h-0">
              {/* Scrollable container - header + body in same scroll area */}
              <div
                ref={barangJadiBodyRef}
                className="flex-1 min-h-0 overflow-auto custom-scrollbar bg-gray-50/20"
              >
                <table className="w-full text-left border-separate border-spacing-0" style={{ tableLayout: 'fixed', minWidth: '700px' }}>
                  <colgroup>
                    <col style={{ width: '130px' }} />
                    <col />
                    <col style={{ width: '150px' }} />
                    <col style={{ width: '120px' }} />
                  </colgroup>
                  <thead className="sticky top-0 z-20">
                    <tr className="bg-white">
                      <th className="sticky left-0 z-30 px-4 py-3 xl:py-5 text-[10px] xl:text-xs font-bold text-gray-400 tracking-tight border-b border-r border-gray-100 bg-white whitespace-nowrap shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">Tanggal</th>
                      <th className="px-4 py-3 xl:py-5 text-[10px] xl:text-xs font-bold text-gray-400 tracking-tight border-b border-gray-100 bg-white whitespace-nowrap">Nama Produksi</th>
                      <th className="px-4 py-3 xl:py-5 text-[10px] xl:text-xs font-bold text-gray-400 tracking-tight border-b border-gray-100 bg-white whitespace-nowrap">No. Faktur</th>
                      <th className="px-4 py-3 xl:py-5 text-[10px] xl:text-xs font-bold text-gray-400 tracking-tight border-b border-gray-100 bg-emerald-50 text-right whitespace-nowrap">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {memoizedBarangJadiRows}
                  </tbody>
                </table>
              </div>
            </div>
           ) : (
            <div className="flex flex-col flex-1 min-h-0">
              {/* Operator Efficiency Summary - Horizontal scrollable row */}
              {jurnalResults.length > 0 && !loadingDetails && selectedPekerjaan && (
                <div className="bg-white border-b border-gray-100 px-6 py-2.5 flex items-center gap-4 shrink-0 overflow-hidden">
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-emerald-600 tracking-wide shrink-0">
                    <TrendingUp size={14} />
                    <span>Realisasi:</span>
                  </div>
                  <div className="flex-1 flex flex-nowrap gap-6 overflow-x-auto custom-scrollbar scrollbar-hide py-1">
                    {operatorStats.map(([name, total], idx) => (
                      <div key={name} className="flex items-center gap-3 shrink-0 group">
                        {idx > 0 && <div className="w-px h-3 bg-gray-200"></div>}
                        <div className="flex flex-col">
                          <span className="text-[11px] font-semibold text-gray-500 capitalize tracking-tight leading-none mb-1 group-hover:text-gray-700 transition-colors">
                            {(name || '').toLowerCase()}
                          </span>
                          <span className="text-[13px] font-semibold text-gray-800 tabular-nums leading-none">
                            {total.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Scrollable container - header + body in same scroll area */}
              <div
                ref={jurnalBodyRef}
                className="flex-1 min-h-0 overflow-auto custom-scrollbar"
              >
                <table className="text-left border-separate border-spacing-0" style={{ tableLayout: 'fixed', width: `${colWidths.reduce((a, b) => a + b, 0)}px` }}>
                  <colgroup>
                    {colWidths.map((w, i) => <col key={i} style={{ width: `${w}px` }} />)}
                  </colgroup>
                  <thead className="sticky top-0 z-20">
                    <tr className="bg-white">
                      {colWidths.map((w, i) => (
                        <th key={i} onClick={() => toggleSort(i)} onContextMenu={(e) => colCtx(i, e)}
                          className={`px-2 py-3 xl:py-4 text-[10px] xl:text-xs font-bold tracking-tight border-b border-r border-gray-100 bg-white whitespace-nowrap ${i === 0 ? 'sticky left-0 z-30 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]' : ''} ${i === 1 ? 'md:sticky md:z-30 md:shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]' : ''} ${i === 2 || i === 3 || i === 4 ? 'lg:sticky lg:z-30 lg:shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]' : ''} ${sorting.some(x => x.i === i) ? 'text-emerald-600' : 'text-gray-400'} ${i >= 6 && i <= 9 ? 'text-right' : ''} ${i === 14 ? 'bg-emerald-50' : ''} cursor-pointer hover:bg-gray-50 select-none`}
                          style={{ width: `${w}px`, minWidth: `${w}px`, ...(i > 4 ? { position: 'relative' } : {}), ...(i > 0 && i <= 4 ? { left: `${colWidths.slice(0, i).reduce((a, b) => a + b, 0)}px` } : {}) }}>
                          <div className="flex items-center gap-1">
                            <SortIcon i={i} />
                            <span className="truncate">{['Tanggal','Bagian / Karyawan','No. & Nama Order','Jenis Pekerjaan','Kode','Bahan Kertas','Jml. Plate','Warna','Inscheet','Rijek','Jam','Kendala','Keterangan','Target','Realisasi'][i]}</span>
                          </div>
                          <div onMouseDown={(e) => colResizeStart(i, e)} onDoubleClick={(e) => colAutoFit(i, e)} className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-300/50 z-10" />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody style={{ display: 'block', height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
                    {jurnalRowsContent}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          </div>

          {/* Fixed Footer for Totals & Pagination */}
          {((activeTab === 'barang_jadi' && results.length > 0) || (activeTab === 'jurnal' && jurnalResults.length > 0)) && !loadingDetails && (
            <>
              {/* Totals Row */}
              {(activeTab === 'barang_jadi' || (activeTab === 'jurnal' && selectedPekerjaan)) && (
                <div className="shrink-0 flex flex-wrap items-center justify-end gap-4 px-4 py-2 border-t border-gray-100 bg-gray-50/30">
                  {activeTab === 'jurnal' && grandTotalRijek > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold tracking-wide text-rose-400">Total rijek</span>
                      <div className="text-[14px] font-bold tabular-nums tracking-tight text-rose-600">
                        {grandTotalRijek.toLocaleString('id-ID')}
                      </div>
                    </div>
                  )}
                  {activeTab === 'jurnal' && grandTotalTarget > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold tracking-wide text-gray-500">Total target</span>
                      <div className="text-[14px] font-bold tabular-nums tracking-tight text-gray-700">
                        {grandTotalTarget.toLocaleString('id-ID')}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-bold tracking-wide text-gray-500">
                      {activeTab === 'barang_jadi' ? 'Total Masuk' : 'Realisasi'}
                    </span>
                    <div className="text-[14px] font-bold tabular-nums tracking-tight text-emerald-600">
                      {activeTab === 'barang_jadi' 
                        ? `${grandTotal.toLocaleString('id-ID')} ${results[0]?.items[0]?.satuan || results[0]?.items[0]?.unit || unit}`
                        : `${grandTotalJurnal.toLocaleString('id-ID')}`
                      }
                    </div>
                  </div>
                </div>
              )}
              {activeTab === 'jurnal' ? (
                <div className="flex items-center justify-between shrink-0 px-2 min-h-[30px]">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-gray-400 tracking-wide">Menampilkan {totalJurnalItems} dari {totalJurnalItems} baris data</span>
                    {loadTime !== null && loadTime !== undefined && (
                      <div className={`text-[9px] px-2 py-1 rounded-full font-bold flex items-center gap-1.5 border tracking-wide shadow-sm ${
                        loadTime < 300  ? 'bg-green-50 text-green-600 border-green-100' :
                        loadTime < 1000 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                          'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        <span className="animate-pulse">⚡</span>
                        <span className="leading-none">{(loadTime / 1000).toFixed(2)}s</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
              <TableFooter
                totalCount={totalBarangJadiItems}
                currentCount={Math.min(barangJadiPage * PAGE_SIZE, totalBarangJadiItems)}
                label="baris data"
                loadTime={loadTime}
                page={barangJadiPage}
                totalPages={totalBarangJadiPages}
                onPageChange={setBarangJadiPage}
               />
              )}
            </>
          )}
          {ctxCol && (() => {
            return <div onMouseDown={() => setCtxCol(null)} className="fixed inset-0 z-50">
                <div onMouseDown={e => e.stopPropagation()} className="fixed bg-white border border-gray-200 shadow-2xl rounded-xl p-3 flex items-center gap-2 z-50" style={{ left: ctxCol.x, top: ctxCol.y }}>
                <input autoFocus className="w-20 px-2 py-1.5 text-xs font-bold border border-gray-200 rounded-lg outline-none focus:border-emerald-400" type="number" value={ctxCol.val} onChange={e => setCtxCol({ ...ctxCol, val: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') { setColWidths(p => { const n = [...p]; n[ctxCol.i] = Math.max(COL_MIN[ctxCol.i], parseInt(ctxCol.val) || COL_MIN[ctxCol.i]); return n; }); setCtxCol(null); } }} />
                <button onClick={() => { setColWidths(p => { const n = [...p]; n[ctxCol.i] = Math.max(COL_MIN[ctxCol.i], parseInt(ctxCol.val) || COL_MIN[ctxCol.i]); return n; }); setCtxCol(null); }} className="text-[11px] font-bold text-white bg-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-700">Atur</button>
              </div>
            </div>;
          })()}
          </>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center border-2 border-dashed border-emerald-100 bg-emerald-50/10 rounded-2xl animate-in fade-in duration-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-200/20 blur-[100px] -mr-32 -mt-32 rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-100/20 blur-[100px] -ml-32 -mb-32 rounded-full"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 bg-white border border-emerald-100 shadow-xl shadow-emerald-900/5 rounded-3xl flex items-center justify-center mb-8">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <BarChart3 size={40} strokeWidth={1.5} />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-800 tracking-tight mb-3 text-center">Analisa Hasil Produksi</h2>
            <p className="text-gray-500 font-medium max-w-md text-center text-[13px] leading-relaxed px-6">
              Silakan pilih <span className="text-emerald-600 font-bold">Order Produksi (SOPd)</span> melalui panel di atas untuk mulai membandingkan laporan operasional.
            </p>
            
            <div className="mt-12 flex items-center gap-4 text-[10px] font-semibold text-gray-300 uppercase tracking-[0.4em]">
              <div className="w-12 h-px bg-gray-100"></div>
              SINTAK ERP SYSTEM
              <div className="w-12 h-px bg-gray-100"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

