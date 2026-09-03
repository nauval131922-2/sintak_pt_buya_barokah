'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { BarChart3, Search, ChevronDown, ChevronUp, Filter, RotateCcw, ClipboardList, TrendingUp, X, Target, AlertCircle, Package, ArrowUpDown, ArrowUp, ArrowDown, List, Table2, ChevronRight } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell 
} from 'recharts';
import PageHeader from "@/components/PageHeader";
import DatePicker from '@/components/DatePicker';
import SearchableDropdown from '@/components/SearchableDropdown';
import SearchAndReload from '@/components/SearchAndReload';
import TableFooter from '@/components/TableFooter';
import Portal from '@/components/Portal';
import { persistDateStore, hydrateDateStore } from '@/lib/scraper-period';
import { useVirtualizer } from '@tanstack/react-virtual';
import { formatToDayMonthYear, formatCellVal } from './hasil-produksi-utils';
import type { SopdOption } from './hasil-produksi-types';

const isValidVal = (v: any) => v !== null && v !== undefined && v !== '' && v !== '-' && v !== 0 && v !== '0';
const TAB_OPTIONS = [
  { value: 'jurnal', label: 'Jurnal Produksi' },
  { value: 'barang_jadi', label: 'Barang Jadi' },
];

function JurnalSubtotalCard({ row }: { row: any }) {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <div 
      onClick={() => setExpanded(v => !v)}
      className="relative z-10 w-full px-4 py-2.5 bg-emerald-50 border border-emerald-100/50 rounded-xl flex flex-col gap-1.5 shadow-sm cursor-pointer select-none"
    >
      {/* Row 1: Nama Pekerjaan & Kode */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span className={`text-[12px] font-bold text-emerald-800 ${expanded ? 'whitespace-normal break-words' : 'truncate'}`}>
          {row.jobDisplayName}
        </span>
        {row.code && <span className="text-[10px] font-bold text-gray-400 font-mono shrink-0">{row.code}</span>}
      </div>

      {/* Row 2: Target, Total Realisasi, & Rijek */}
      <div className="flex items-center gap-3 pt-1 border-t border-emerald-100/60 flex-wrap">
        {row.totalTarget > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-gray-400 tracking-wide">Target</span>
            <span className="text-[12px] font-bold text-gray-600 tabular-nums">{row.totalTarget.toLocaleString('id-ID')}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-emerald-800/60 tracking-wide">Total</span>
          <span className="text-[14px] font-extrabold text-emerald-950 tabular-nums">{row.totalR.toLocaleString('id-ID')}</span>
        </div>
        {row.totalRijek > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-rose-400 tracking-wide">Rijek</span>
            <span className="text-[12px] font-semibold text-rose-600 tabular-nums">{row.totalRijek.toLocaleString('id-ID')}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function JurnalCard({ item, hasExtra }: { item: any; hasExtra: boolean }) {
  const [expanded, setExpanded] = React.useState(false);
  const [cardExpanded, setCardExpanded] = React.useState(false);
  if (!item) return null;
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-emerald-500 overflow-hidden my-0.5">
      <div 
        onClick={() => setCardExpanded(v => !v)}
        className="px-4 pt-3 pb-2.5 cursor-pointer select-none"
      >
        {/* Header Baris 1: Tanggal (Highlight), Jam, & Kode Pekerjaan */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11.5px] font-extrabold text-emerald-700 tracking-wide bg-emerald-50 border border-emerald-100/80 px-2 py-0.5 rounded-md shrink-0">
              {formatToDayMonthYear(item.tgl)}
            </span>
            {item.jam && item.jam !== '-' && item.jam !== '' && (
              <span className="text-[10.5px] font-semibold text-gray-500 bg-gray-100/80 border border-gray-200/60 px-1.5 py-0.2 rounded shrink-0">
                {item.jam}
              </span>
            )}
          </div>
          {item.kode && (
            <span className="text-[10px] font-bold text-emerald-800 font-mono bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md shrink-0">
              {item.kode}
            </span>
          )}
        </div>

        {/* Header Baris 2: Nama Karyawan (Kalem / Normal) */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[11.5px] font-medium text-gray-500 capitalize leading-tight">
            {(item.nama_karyawan || item.bagian || '—').toLowerCase()}
          </span>
          {item.bagian && item.nama_karyawan && (
            <span className="text-[10px] font-normal text-gray-400 capitalize">
              • {item.bagian.toLowerCase()}
            </span>
          )}
        </div>

        {/* No. & Nama Order (Biasa tanpa badge) */}
        {(item.no_order_2 || item.nama_order_2) && (
          <div className="text-[11.5px] font-semibold text-gray-500 mb-1.5 flex items-start gap-1.5 flex-wrap">
            {item.no_order_2 && item.no_order_2 !== '-' && (
              <span className="font-mono text-gray-400 font-medium text-[11px] shrink-0">
                {item.no_order_2}
              </span>
            )}
            {item.nama_order_2 && item.nama_order_2 !== '-' && (
              <span 
                className={`text-gray-600 ${cardExpanded ? 'whitespace-normal break-words' : 'truncate max-w-full'}`} 
                title={item.nama_order_2}
              >
                {item.nama_order_2}
              </span>
            )}
          </div>
        )}

        {/* Jenis Pekerjaan (Badge Style Highlight) */}
        {item.jenis_pekerjaan_2 && (
          <div className="mb-2.5">
            <span 
              className={`text-[12.5px] font-bold text-emerald-800 bg-emerald-50/80 border border-emerald-100/90 px-2.5 py-1 rounded-lg inline-block shadow-sm leading-snug ${cardExpanded ? 'whitespace-normal break-words' : 'truncate max-w-full'}`} 
              title={item.jenis_pekerjaan_2}
            >
              {item.jenis_pekerjaan_2}
            </span>
          </div>
        )}

        {/* Metrik Realisasi / Target / Rijek */}
        <div className="flex items-center gap-3 flex-wrap pt-1 border-t border-gray-100/60">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-gray-400 tracking-wide">Realisasi</span>
            <span className="text-[16px] font-extrabold text-emerald-600 tabular-nums">{Number(item.realisasi || 0).toLocaleString('id-ID')}</span>
          </div>
          {Number(item.target) > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-gray-400 tracking-wide">Target</span>
              <span className="text-[13px] font-bold text-gray-600 tabular-nums">{Number(item.target).toLocaleString('id-ID')}</span>
            </div>
          )}
          {Number(item.rijek) > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-rose-400 tracking-wide">Rijek</span>
              <span className="text-[13px] font-bold text-rose-600 tabular-nums">{Number(item.rijek).toLocaleString('id-ID')}</span>
            </div>
          )}
        </div>
      </div>
      {hasExtra && (
        <>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(v => !v);
            }} 
            className="w-full flex items-center gap-1.5 px-4 py-2 border-t border-gray-50 text-[11px] font-bold text-gray-400 hover:text-emerald-600 hover:bg-gray-50 transition-all text-left"
          >
            <ChevronRight size={12} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
            {expanded ? 'Sembunyikan detail' : 'Lihat detail'}
          </button>
          {expanded && (
            <div className="px-4 pb-3 pt-1 border-t border-gray-50 grid grid-cols-2 gap-x-4 gap-y-1.5">
              {isValidVal(item.bahan_kertas) && <div><span className="text-[10px] font-bold text-gray-400 block">Bahan Kertas</span><span className="text-[12px] font-semibold text-gray-700">{item.bahan_kertas}</span></div>}
              {isValidVal(item.jml_plate) && <div><span className="text-[10px] font-bold text-gray-400 block">Jml. Plate</span><span className="text-[12px] font-semibold text-gray-700">{item.jml_plate}</span></div>}
              {isValidVal(item.warna) && <div><span className="text-[10px] font-bold text-gray-400 block">Warna</span><span className="text-[12px] font-semibold text-gray-700">{item.warna}</span></div>}
              {isValidVal(item.inscheet) && <div><span className="text-[10px] font-bold text-gray-400 block">Inscheet</span><span className="text-[12px] font-semibold text-gray-700 tabular-nums">{isNaN(Number(item.inscheet)) ? item.inscheet : Number(item.inscheet).toLocaleString('id-ID')}</span></div>}
              {isValidVal(item.kendala) && <div className="col-span-2"><span className="text-[10px] font-bold text-gray-400 block">Kendala</span><span className="text-[12px] font-semibold text-gray-700">{item.kendala}</span></div>}
              {isValidVal(item.keterangan) && <div className="col-span-2"><span className="text-[10px] font-bold text-gray-400 block">Keterangan</span><span className="text-[12px] font-semibold text-gray-700">{item.keterangan}</span></div>}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BarangJadiCard({ item, group, unit: u }: { item: any; group: any; unit: string }) {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <div 
      onClick={() => setExpanded(v => !v)}
      className="bg-white rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-emerald-500 overflow-hidden my-0.5 px-4 py-3 flex items-center justify-between gap-3 cursor-pointer select-none"
    >
      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-[10px] font-bold text-emerald-800 tracking-wide mb-0.5">{formatToDayMonthYear(group.date)}</span>
        <span className={`text-[12.5px] font-bold text-gray-700 leading-tight ${expanded ? 'whitespace-normal break-words' : 'truncate'}`} title={item.nama_prd}>{item.nama_prd}</span>
        {item.faktur && <span className="text-[10px] font-semibold text-gray-400 mt-0.5">{item.faktur}</span>}
      </div>
      <div className="shrink-0 text-right">
        <span className="text-[18px] font-extrabold text-emerald-600 tabular-nums">{Number(item.qty).toLocaleString('id-ID')}</span>
        <span className="text-[10px] font-bold text-gray-400 ml-1 uppercase">{item.satuan || u}</span>
      </div>
    </div>
  );
}

export default function HasilProduksiClient() {
  const [sopdOptions, setSopdOptions] = useState<SopdOption[]>([]);
  const [selectedSopd, setSelectedSopd] = useState<SopdOption | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dataSearchQuery, setDataSearchQuery] = useState('');
  const [debouncedDataQuery, setDebouncedDataQuery] = useState('');
  const [loadingSopd, setLoadingSopd] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isFilterOpenMobile, setIsFilterOpenMobile] = useState<boolean>(true);
  const [isControlOpenMobile, setIsControlOpenMobile] = useState<boolean>(true);
  useEffect(() => {
    setIsMounted(true);

    const hydrated = hydrateDateStore('hasil_dates');
    setStartDate(hydrated.startDate);
    setEndDate(hydrated.endDate);

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

    // Load persisted Bagian & Pekerjaan
    const savedBagian = localStorage.getItem('hasil_selectedBagian');
    if (savedBagian) setSelectedBagian(savedBagian);

    const savedPekerjaan = localStorage.getItem('hasil_selectedPekerjaan');
    if (savedPekerjaan) setSelectedPekerjaan(savedPekerjaan);

    const savedLevel = localStorage.getItem('hasil_detailLevel');
    if (savedLevel) setDetailLevel(Number(savedLevel));
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
  const [activeTab, setActiveTab] = useState<'barang_jadi' | 'jurnal'>(() => {
    try {
      const s = localStorage.getItem('hp-active-tab');
      if (s === 'barang_jadi' || s === 'jurnal') return s;
    } catch {}
    return 'jurnal';
  });
  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem('hp-active-tab', activeTab);
    } catch {}
  }, [activeTab, isMounted]);
  const [selectedBagian, setSelectedBagian] = useState('');
  useEffect(() => {
    if (!isMounted) return;
    if (selectedBagian) localStorage.setItem('hasil_selectedBagian', selectedBagian);
    else localStorage.removeItem('hasil_selectedBagian');
  }, [selectedBagian, isMounted]);

  const [selectedPekerjaan, setSelectedPekerjaan] = useState('');
  useEffect(() => {
    if (!isMounted) return;
    if (selectedPekerjaan) localStorage.setItem('hasil_selectedPekerjaan', selectedPekerjaan);
    else localStorage.removeItem('hasil_selectedPekerjaan');
  }, [selectedPekerjaan, isMounted]);
  const [availableBagian, setAvailableBagian] = useState<string[]>([]);
  const [availablePekerjaan, setAvailablePekerjaan] = useState<string[]>([]);
  const [showChart, setShowChart] = useState(false);
  const [expandedCard1, setExpandedCard1] = useState(false);
  const [expandedCard2, setExpandedCard2] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const [expandedGrandTotal, setExpandedGrandTotal] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [showBottomBtn, setShowBottomBtn] = useState(false);
  const [isNavActive, setIsNavActive] = useState(false);
  const [isNavHovered, setIsNavHovered] = useState(false);
  const navIdleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);
  const [hideGudang, setHideGudang] = useState(false);
  const [hideJurnal, setHideJurnal] = useState(false);
  const [detailLevel, setDetailLevel] = useState(2);
  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem('hasil_detailLevel', String(detailLevel));
  }, [detailLevel, isMounted]);
  useEffect(() => {
    if (!expandedCard2) return;
    const handleDocClick = () => setExpandedCard2(false);
    const timer = setTimeout(() => {
      window.addEventListener('click', handleDocClick);
    }, 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleDocClick);
    };
  }, [expandedCard2]);

  // ponytail: default card di mobile, table di desktop — persist per session
  const [viewMode, setViewMode] = useState<'card' | 'table'>(() => {
    try { const s = localStorage.getItem('hp-view-mode'); if (s === 'card' || s === 'table') return s; } catch {}
    return typeof window !== 'undefined' && window.innerWidth < 1024 ? 'card' : 'table';
  });

  useEffect(() => {
    const mainWrapper = document.getElementById('main-content-scroll');

    const checkScrollPosition = () => {
      const el = mainWrapper || document.documentElement;
      const scrollPos = el.scrollTop || window.scrollY || 0;
      const scrollHeight = el.scrollHeight || document.body.scrollHeight;
      const clientHeight = el.clientHeight || window.innerHeight;

      setShowTopBtn(scrollPos > 150);
      const distanceToBottom = scrollHeight - (scrollPos + clientHeight);
      setShowBottomBtn(distanceToBottom > 150);
    };

    const handleUserScroll = () => {
      checkScrollPosition();
      setIsNavActive(true);
      if (navIdleTimerRef.current) clearTimeout(navIdleTimerRef.current);
      navIdleTimerRef.current = setTimeout(() => {
        setIsNavActive(false);
      }, 1500);
    };

    if (mainWrapper) {
      mainWrapper.addEventListener('scroll', handleUserScroll, { passive: true });
    }
    window.addEventListener('scroll', handleUserScroll, { passive: true });
    window.addEventListener('resize', checkScrollPosition, { passive: true });
    checkScrollPosition();

    return () => {
      if (mainWrapper) {
        mainWrapper.removeEventListener('scroll', handleUserScroll);
      }
      window.removeEventListener('scroll', handleUserScroll);
      window.removeEventListener('resize', checkScrollPosition);
      if (navIdleTimerRef.current) clearTimeout(navIdleTimerRef.current);
    };
  }, [viewMode, activeTab]);
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
  
  // Table scroll sync refs
  const barangJadiBodyRef = useRef<HTMLDivElement>(null);
  const jurnalBodyRef = useRef<HTMLDivElement>(null);

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dataDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchQueryChange = (q: string) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchQuery(q);
    }, 300);
  };

  const handleDataSearchChange = (q: string) => {
    setDataSearchQuery(q);
    if (dataDebounceTimerRef.current) clearTimeout(dataDebounceTimerRef.current);
    dataDebounceTimerRef.current = setTimeout(() => {
      setDebouncedDataQuery(q);
    }, 300);
  };

  useEffect(() => {
    const controller = new AbortController();
    async function fetchSopd() {
      setLoadingSopd(true);
      try {
        const url = new URL('/api/sopd/options', window.location.origin);
        if (debouncedSearchQuery) url.searchParams.set('search', debouncedSearchQuery);
        url.searchParams.set('limit', '50');
        
        const res = await fetch(url.toString(), { signal: controller.signal });
        if (res.ok) {
          const json = await res.json();
          setSopdOptions(json.data || []);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Failed to fetch SOPd options", err);
        }
      } finally {
        setLoadingSopd(false);
      }
    }
    fetchSopd();
    return () => { controller.abort(); };
  }, [debouncedSearchQuery]);

  const sopdLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    const fmt = (x: SopdOption) => {
      const parts = [x.no_sopd];
      if (x.pelanggan) parts.push(x.pelanggan);
      if (x.nama_order) parts.push(x.nama_order);
      let str = parts.join(' — ');
      if (x.qty !== undefined && x.qty !== null) {
        str += ` (${x.qty.toLocaleString('id-ID')}${x.unit ? ' ' + x.unit : ''})`;
      }
      return str;
    };
    sopdOptions.forEach(x => {
      if (x?.no_sopd) labels[x.no_sopd] = fmt(x);
    });
    if (selectedSopd && selectedSopd.no_sopd && !labels[selectedSopd.no_sopd]) {
      labels[selectedSopd.no_sopd] = fmt(selectedSopd);
    }
    return labels;
  }, [sopdOptions, selectedSopd]);

  const sopdItems = useMemo(() => {
    const items = sopdOptions.map(x => x.no_sopd);
    if (selectedSopd && !items.includes(selectedSopd.no_sopd)) {
      items.unshift(selectedSopd.no_sopd);
    }
    return items;
  }, [sopdOptions, selectedSopd]);

  const fetchDetails = useCallback(async (signal?: AbortSignal) => {
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
      const searchParam = debouncedDataQuery ? `&search=${encodeURIComponent(debouncedDataQuery)}` : '';
      const url = `/api/hasil-produksi/details?no_sopd=${encodeURIComponent(selectedSopd.no_sopd)}&startDate=${fmtDate(startDate)}&endDate=${fmtDate(endDate)}&bagian=${encodeURIComponent(selectedBagian)}&pekerjaan=${encodeURIComponent(selectedPekerjaan)}${searchParam}&sort=default`;
      const res = await fetch(url, { signal });
      if (res.ok) {
        const json = await res.json();
        setResults(json.barang_jadi || []);
        setJurnalResults(json.jurnal || []);
        setGrandTotal(json.grandTotal || 0);
        setGrandTotalJurnal(json.grandTotalRealisasi || 0);
        setGrandTotalRijek(json.grandTotalRijek || 0);
        setGrandTotalTarget(json.grandTotalTarget || 0);
        setUnit(json.unit || selectedSopd.unit || '');
        setAvailableBagian(json.availableBagian || []);
        setAvailablePekerjaan(json.availablePekerjaan || []);
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching details:', error);
      }
    } finally {
      setLoadingDetails(false);
      setLoadTime(performance.now() - startTime);
    }
  }, [selectedSopd, startDate, endDate, selectedBagian, selectedPekerjaan, debouncedDataQuery]);

  useEffect(() => {
    const controller = new AbortController();
    fetchDetails(controller.signal);
    return () => { controller.abort(); };
  }, [fetchDetails]);
  const resetFilters = () => {
    setSelectedSopd(null);
    setStartDate(null);
    setEndDate(null);
    setSelectedBagian('');
    setSelectedPekerjaan('');
    setDataSearchQuery('');
    setDebouncedDataQuery('');
    setSorting([]);
    setDetailLevel(2);
    persistDateStore('hasil_dates', null, null);
    localStorage.removeItem('hasil_selectedSopd');
    localStorage.removeItem('hasil_selectedBagian');
    localStorage.removeItem('hasil_selectedPekerjaan');
    localStorage.removeItem('hasil_detailLevel');
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
        if (streak.length > 0 && jobKey !== lastJobKey) {
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

  // Card view renderer — Jurnal Produksi (Standard Flex Layout)
  const jurnalCardContent = React.useMemo(() => {
    if (loadingDetails) {
      return [...Array(4)].map((_, i) => (
        <div key={i} className="animate-pulse bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-2">
          <div className="h-3 w-24 bg-gray-100 rounded-full" />
          <div className="h-4 w-40 bg-gray-50 rounded-full" />
          <div className="flex gap-4 mt-1">
            <div className="h-3 w-16 bg-emerald-50 rounded-full" />
            <div className="h-3 w-16 bg-gray-50 rounded-full" />
          </div>
        </div>
      ));
    }
    if (!displayRows || displayRows.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
          <BarChart3 size={32} className="text-gray-400 mb-2" />
          <span className="text-[11px] font-bold text-gray-400">Belum ada data jurnal produksi</span>
        </div>
      );
    }

    return displayRows.map((row, idx) => {
      if (row.type === 'subtotal') {
        return <JurnalSubtotalCard key={`sc-${idx}`} row={row} />;
      }
      if (!row.item) return null;

      const { item } = row;
      const hasExtra = !!(
        isValidVal(item.bahan_kertas) ||
        isValidVal(item.jml_plate) ||
        isValidVal(item.warna) ||
        isValidVal(item.inscheet) ||
        isValidVal(item.kendala) ||
        isValidVal(item.keterangan)
      );
      return <JurnalCard key={`jc-${idx}`} item={item} hasExtra={hasExtra} />;
    });
  }, [displayRows, loadingDetails]);

  const rowVirtualizer = useVirtualizer({
    count: viewMode === 'table' ? displayRows.length : 0,
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
      const rKey = `j-${gIdx}-${iIdx}-${item.tgl || ''}-${item.kode || ''}`;
      const isSelected = selectedRowKey === rKey;
      const rowBg = isSelected ? 'bg-emerald-100/90 shadow-sm' : (isEven ? 'bg-white hover:bg-[#f0fdf4]' : 'bg-[#f9fafb] hover:bg-[#f0fdf4]');
      const cellBg = isSelected ? '#d1fae5' : (isEven ? '#fff' : '#f9fafb');
      const cw = (i: number) => `${colWidths[i]}px`;
      const sl = (i: number) => ({ left: `${colWidths.slice(0, i).reduce((a, b) => a + b, 0)}px` });
      return (
        <tr key={`${gIdx}-${iIdx}`}
          data-index={virtualRow.index}
          ref={rowVirtualizer.measureElement}
          onClick={() => setSelectedRowKey(prev => prev === rKey ? null : rKey)}
          className={`${rowBg} transition-colors cursor-pointer select-none`}
          style={{ display: 'table', width: '100%', tableLayout: 'fixed', borderSpacing: 0, position: 'absolute', top: 0, left: 0, transform: `translateY(${virtualRow.start}px)` }}>
          <td className="sticky left-0 z-10 px-4 py-3.5 text-[11px] xl:text-[12px] font-bold border-r border-gray-100 tabular-nums text-gray-800" style={{ width: cw(0), minWidth: cw(0), backgroundColor: cellBg }}>
            {formatToDayMonthYear(item.tgl)}
          </td>
          <td className="md:sticky md:z-10 px-4 py-3.5 border-r border-gray-100" style={{ width: cw(1), minWidth: cw(1), backgroundColor: cellBg, ...sl(1) }}>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-gray-400 uppercase leading-none mb-1 truncate" title={item.bagian}>{item.bagian}</span>
              <span className="text-[11px] xl:text-[12px] font-bold text-gray-800 leading-tight whitespace-nowrap truncate" title={item.nama_karyawan}>{item.nama_karyawan}</span>
            </div>
          </td>
          <td className="lg:sticky lg:z-10 px-4 py-3.5 border-r border-gray-100" style={{ width: cw(2), minWidth: cw(2), backgroundColor: cellBg, ...sl(2) }}>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-gray-400 leading-none mb-1 truncate" title={item.no_order_2 || ''}>{item.no_order_2 || '-'}</span>
              <span className="text-[11px] xl:text-[12px] font-bold text-gray-700 leading-tight truncate" title={item.nama_order_2 || ''}>{item.nama_order_2 || '-'}</span>
            </div>
          </td>
          <td className="lg:sticky lg:z-10 px-4 py-3.5 text-[11px] xl:text-[12px] border-r border-gray-100" style={{ width: cw(3), minWidth: cw(3), backgroundColor: cellBg, ...sl(3) }}>
            <div className="font-bold bg-white px-2 py-1 rounded-lg border border-gray-100 shadow-sm text-gray-700 capitalize inline-block whitespace-nowrap align-middle" title={item.jenis_pekerjaan_2 || ''}>
              {(item.jenis_pekerjaan_2 || '-').toLowerCase()}
            </div>
          </td>
          <td className="lg:sticky lg:z-10 px-4 py-3.5 text-[11px] font-mono font-bold border-r border-gray-100 text-emerald-700 truncate" style={{ width: cw(4), minWidth: cw(4), maxWidth: cw(4), backgroundColor: cellBg, ...sl(4) }} title={group.code || ''}>
              {group.code || '-'}
            </td>
          <td className="px-4 py-3.5 text-[11px] font-bold border-r border-gray-100 truncate text-gray-600" style={{ width: cw(5), minWidth: cw(5), maxWidth: cw(5) }} title={item.bahan_kertas || ''}>{item.bahan_kertas || '-'}</td>
          <td className="px-4 py-3.5 text-[11px] xl:text-[12px] font-bold border-r border-gray-100 text-gray-700" style={{ width: cw(6), minWidth: cw(6) }}>{formatCellVal(item.jml_plate)}</td>
          <td className="px-4 py-3.5 text-[11px] font-bold border-r border-gray-100 truncate text-gray-600" style={{ width: cw(7), minWidth: cw(7), maxWidth: cw(7) }} title={item.warna || ''}>{item.warna || '-'}</td>
          <td className="px-4 py-3.5 text-[11px] xl:text-[12px] font-bold border-r border-gray-100 text-gray-700" style={{ width: cw(8), minWidth: cw(8) }}>{formatCellVal(item.inscheet)}</td>
          <td className="px-4 py-3.5 text-[11px] xl:text-[12px] font-bold border-r border-gray-100 text-rose-600" style={{ width: cw(9), minWidth: cw(9) }}>{formatCellVal(item.rijek)}</td>
          <td className="px-4 py-3.5 text-[11px] xl:text-[12px] font-bold border-r border-gray-100 text-gray-700 truncate" style={{ width: cw(10), minWidth: cw(10) }} title={item.jam || ''}>{item.jam || '-'}</td>
          <td className="px-4 py-3.5 text-[11px] font-bold border-r border-gray-100 truncate text-rose-600" style={{ width: cw(11), minWidth: cw(11) }} title={item.kendala || ''}>{item.kendala || '-'}</td>
          <td className="px-4 py-3.5 text-[11px] font-bold border-r border-gray-100 text-gray-500 truncate" style={{ width: cw(12), minWidth: cw(12) }} title={item.keterangan || ''}>{item.keterangan || '-'}</td>
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

    const pageItems = allItems;

    const renderedGroups: React.ReactNode[] = [];
    pageItems.forEach(({ item, group, iIdx, gIdx, isLastInGroup }) => {
      const rKey = `bj-${gIdx}-${iIdx}-${item.nama_prd || ''}`;
      const isSelected = selectedRowKey === rKey;
      renderedGroups.push(
        <tr 
          key={`${gIdx}-${iIdx}`} 
          onClick={() => setSelectedRowKey(prev => prev === rKey ? null : rKey)}
          className={`transition-colors cursor-pointer select-none ${isSelected ? 'bg-emerald-100/90 shadow-sm' : 'bg-white hover:bg-emerald-50/30 even:bg-gray-50/50'}`}
        >
          <td className={`sticky left-0 z-10 px-4 py-3 xl:py-4 text-[11px] xl:text-[12px] font-bold text-gray-800 border-r border-gray-50 tabular-nums shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] ${isSelected ? 'bg-[#d1fae5]' : 'bg-white group-even:bg-[#f9fafb]'}`}>
            {formatToDayMonthYear(group.date)}
          </td>
          <td className="px-4 py-3 xl:py-4 text-[11px] xl:text-[12px] font-bold text-gray-600 border-r border-gray-50 tracking-tight">
            <div className="truncate max-w-[400px]" title={item.nama_prd}>{item.nama_prd}</div>
          </td>
          <td className="px-4 py-3 xl:py-4 text-[11px] font-bold text-gray-400 border-r border-gray-50 tabular-nums">
            {item.faktur}
          </td>
          <td className="px-4 py-3 xl:py-4 text-[13px] xl:text-[15px] font-bold text-emerald-900 bg-emerald-50 text-right tabular-nums">
            {Number(item.qty).toLocaleString('id-ID')} <span className="text-[11px] font-bold text-emerald-600/50 ml-1 uppercase">{item.satuan || unit}</span>
          </td>
        </tr>
      );

      if (isLastInGroup && group.items.length > 1) {
        renderedGroups.push(
          <tr key={`${gIdx}-subtotal`} className="bg-emerald-100 border-t-2 border-emerald-200">
            <td colSpan={3} className="px-5 py-3.5 text-right text-[15px] font-extrabold tracking-tight text-emerald-900 border-r border-emerald-200">Total Harian {formatToDayMonthYear(group.date)}</td>
            <td className="px-5 py-3.5 text-right text-[17px] font-extrabold tabular-nums text-emerald-900 bg-emerald-200/60">
               {group.total.toLocaleString('id-ID')} <span className="text-[11px] opacity-40 ml-1 uppercase">{group.items[0].satuan || unit}</span>
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
  }, [results, loadingDetails, unit]);

  // Cleaned up unused scroll reflow listener
  if (!isMounted) return null;

  const totalJurnalItems = jurnalResults.reduce((acc, group) => acc + (group.items?.length || 0), 0);
  const totalBarangJadiItems = results.reduce((acc, group) => acc + group.items.length, 0);

  return (
    <div className={`flex flex-col gap-3 ${viewMode === 'table' ? 'lg:flex-1 lg:min-h-0 lg:overflow-hidden' : ''}`}>
      {/* 1. Header Section - Fixed */}
      <div id="filter-control-container" className="flex flex-col gap-3 shrink-0 relative z-[80]">
        {/* 1. Filter Control Center — 2 Baris di MD, 1 Baris di LG (1024px+) */}
        <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-xl shadow-sm transition-all overflow-hidden">
          {/* Toggle Header Khusus Mobile (< sm) */}
          <div className="sm:hidden flex items-center justify-between px-3 py-2 bg-slate-50/70 hover:bg-slate-100/80 transition-colors border-b border-slate-100">
            <button
              type="button"
              onClick={() => setIsFilterOpenMobile(!isFilterOpenMobile)}
              className="flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-emerald-700 transition-colors focus:outline-none flex-1 text-left min-w-0"
            >
              <Filter className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-[11px] font-bold text-slate-800 truncate">Filter & Parameter SOPd</span>
              {(selectedSopd !== null || selectedBagian !== '' || selectedPekerjaan !== '' || startDate !== null) && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Filter aktif" />
              )}
              <div className="flex items-center space-x-1 text-slate-500 text-[10.5px] font-medium ml-auto pr-1 shrink-0">
                <span>{isFilterOpenMobile ? "Sembunyikan" : "Tampilkan"}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isFilterOpenMobile ? "rotate-180" : ""
                  }`}
                />
              </div>
            </button>
          </div>

          {/* Konten Filter — Bisa Diciutkan di Mobile */}
          <div className={`${isFilterOpenMobile ? "flex flex-col" : "hidden sm:flex sm:flex-col"} lg:flex-row items-stretch lg:items-end gap-2 p-2.5 sm:p-3 relative animate-in fade-in slide-in-from-top-1 duration-200`}>
            {/* Baris 1: SOPd Selection Group (Dinamis mengisi sisa ruang) */}
            <div className="w-full lg:flex-1 lg:min-w-[140px]">
            <SearchableDropdown
              id="hasil-sopd"
              label="Pilih Order Produksi (SOPd)"
              value={selectedSopd?.no_sopd || ''}
              items={sopdItems}
              allLabel="Pilih SOPd..."
              placeholder="Cari nomor SOPd atau pelanggan..."
              searchPlaceholder="Ketik nomor SOPd, pelanggan, atau nama order..."
              triggerWidth="w-full"
              panelWidth="w-full md:w-[600px]"
              icon={<ClipboardList size={14} className={selectedSopd ? 'text-emerald-600' : 'text-gray-400'} />}
              itemLabels={sopdLabels}
              onSearchQueryChange={handleSearchQueryChange}
              onChange={(val) => {
                const opt = sopdOptions.find(x => x.no_sopd === val);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                setSelectedSopd(opt || null);
                setSelectedBagian('');
                setSelectedPekerjaan('');
                setStartDate(null);
                setEndDate(today);
                localStorage.removeItem('hasil_selectedPekerjaan');
              }}
            />
          </div>

          {/* Baris 2: Date, Bagian, Pekerjaan, Reset */}
          <div className={`flex flex-wrap lg:flex-nowrap items-end gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0 ${activeTab === 'barang_jadi' ? 'lg:gap-4' : ''}`}>
            {/* Rentang Tanggal */}
            <div className="flex flex-col w-full sm:w-[250px] md:w-[250px] lg:w-[245px] xl:w-[260px] shrink-0">
              <label className="block text-[11px] font-semibold text-gray-500 mb-1 ml-1 tracking-tight select-none">Rentang Tanggal</label>
              <div className="flex items-center gap-1">
                <div className="flex-1"><DatePicker name="startDate" value={startDate} onChange={(d) => setStartDate(d)} /></div>
                <div className="w-2 h-px bg-gray-200 shrink-0"></div>
                <div className="flex-1"><DatePicker name="endDate" value={endDate} onChange={(d) => setEndDate(d)} /></div>
              </div>
            </div>

            {/* Bagian & Pekerjaan Dropdowns */}
            {activeTab === 'jurnal' && (
              <div className="flex items-center gap-2 w-full sm:w-auto flex-1 min-w-0">
                <div className="flex-1 min-w-0">
                  <SearchableDropdown
                    id="hasil-bagian"
                    label="Bagian"
                    value={selectedBagian}
                    items={availableBagian}
                    allLabel="Semua Bagian"
                    searchPlaceholder="Cari bagian..."
                    triggerWidth="w-full"
                    panelWidth="w-[230px]"
                    icon={<Filter size={14} className={selectedBagian ? 'text-emerald-600' : 'text-gray-400'} />}
                    onChange={(val) => setSelectedBagian(val)}
                    compact
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <SearchableDropdown
                    id="hasil-pekerjaan"
                    label="Pekerjaan"
                    value={selectedPekerjaan}
                    items={availablePekerjaan}
                    allLabel="Semua Pekerjaan"
                    searchPlaceholder="Cari pekerjaan..."
                    triggerWidth="w-full"
                    panelWidth="w-[260px]"
                    icon={<Filter size={14} className={selectedPekerjaan ? 'text-emerald-600' : 'text-gray-400'} />}
                    onChange={(val) => {
                      setSelectedPekerjaan(val);
                    }}
                    compact
                  />
                </div>
              </div>
            )}

            {/* Reset Button */}
            <div className={`flex items-center gap-2 sm:gap-2.5 shrink-0 ${activeTab === 'barang_jadi' ? 'w-full sm:w-auto mt-1.5 sm:mt-0' : 'w-full md:w-auto mt-1.5 md:mt-0'}`}>
              <button
                onClick={resetFilters}
                className="h-10 px-3.5 flex-1 sm:flex-none shrink-0 flex items-center justify-center gap-1.5 bg-rose-50 text-rose-600 font-bold text-[11px] xl:text-[12px] border border-rose-200 rounded-xl hover:bg-rose-100 transition-all group shadow-sm active:scale-95 min-w-0"
                title="Reset semua filter"
              >
                <X size={14} className="shrink-0" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>

        {/* Baris 2 Terpadu (2-Row Redesign): KPI & Tren di Kiri, Tab & Search & Mode di Kanan */}
        {selectedSopd && (
          <div id="desktop-sticky-control-bar" className="shrink-0 z-[10] bg-white/80 backdrop-blur-md border border-white/20 rounded-xl shadow-sm transition-all overflow-hidden">
            {/* Toggle Header Khusus Mobile (< sm) */}
            <div className="sm:hidden flex items-center justify-between px-3 py-2 bg-slate-50/70 hover:bg-slate-100/80 transition-colors border-b border-slate-100">
              <button
                type="button"
                onClick={() => setIsControlOpenMobile(!isControlOpenMobile)}
                className="flex items-center gap-2 text-xs font-bold text-slate-800 hover:text-emerald-700 transition-colors focus:outline-none flex-1 text-left min-w-0"
              >
                <Search className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-[11px] font-bold text-slate-800 truncate">Pencarian & Kontrol Data</span>
                {dataSearchQuery !== '' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Pencarian aktif" />
                )}
                <div className="flex items-center space-x-1 text-slate-500 text-[10.5px] font-medium ml-auto pr-1 shrink-0">
                  <span>{isControlOpenMobile ? "Sembunyikan" : "Tampilkan"}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isControlOpenMobile ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>
            </div>

            {/* Konten Kontrol & Pencarian — Bisa Diciutkan di Mobile */}
            <div className={`${isControlOpenMobile ? "flex flex-col" : "hidden sm:flex sm:flex-col"} md:flex-row items-stretch md:items-center gap-2 p-1.5 sm:p-2 animate-in fade-in slide-in-from-top-1 duration-200`}>
              {/* Bagian Kiri: KPI Metrik & Tren Ringkas */}
              <div className="flex items-center gap-1.5 sm:gap-2 w-full md:w-auto shrink-0 min-w-0">
              {/* Card 1: Order | WIP | Hasil */}
              <div className="bg-gray-50/80 border border-gray-200/60 rounded-lg px-2 sm:px-3 h-8 flex items-center justify-around md:justify-start flex-1 md:flex-none shrink min-w-0 select-none gap-1 sm:gap-2">
                <div className="flex items-baseline gap-0.5 min-w-0 shrink">
                  <span className="text-[9.5px] sm:text-[10px] font-bold text-gray-400 capitalize tracking-tight shrink-0 mr-0.5">Order</span>
                  <span className="text-[11px] sm:text-[12px] font-semibold text-gray-800 tabular-nums whitespace-nowrap">{selectedSopd.qty.toLocaleString('id-ID')}</span>
                  <span className="hidden sm:inline text-[8.5px] sm:text-[9px] font-bold text-gray-400 shrink-0">{selectedSopd.unit}</span>
                </div>
                <div className="w-px h-3.5 bg-gray-200 shrink-0"></div>
                <div className="flex items-baseline gap-0.5 min-w-0 shrink">
                  <span className="text-[9.5px] sm:text-[10px] font-bold text-gray-400 capitalize tracking-tight shrink-0 mr-0.5">WIP</span>
                  <span className="text-[11px] sm:text-[12px] font-semibold text-rose-600 tabular-nums whitespace-nowrap">{(selectedSopd.qty - grandTotal).toLocaleString('id-ID')}</span>
                  <span className="hidden sm:inline text-[8.5px] sm:text-[9px] font-bold text-gray-400 shrink-0">{selectedSopd.unit}</span>
                </div>
                <div className="w-px h-3.5 bg-gray-200 shrink-0"></div>
                <div className="flex items-baseline gap-0.5 min-w-0 shrink">
                  <span className="text-[9.5px] sm:text-[10px] font-bold text-gray-400 capitalize tracking-tight shrink-0 mr-0.5">Hasil</span>
                  <span className="text-[11px] sm:text-[12px] font-semibold text-emerald-600 tabular-nums whitespace-nowrap">{grandTotal.toLocaleString('id-ID')}</span>
                  <span className="hidden sm:inline text-[8.5px] sm:text-[9px] font-bold text-gray-400 shrink-0">{selectedSopd.unit}</span>
                </div>
              </div>

              {/* Pekerjaan Spesifik (Jika terpilih) */}
              {selectedPekerjaan && (
                <div 
                  onClick={(e) => {
                    const textEl = e.currentTarget.querySelector('.job-name-text') as HTMLElement | null;
                    const isTruncated = textEl ? textEl.scrollWidth > textEl.clientWidth : false;
                    if (isTruncated) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltipPos({ top: rect.bottom + 4, left: Math.max(12, rect.left) });
                      setExpandedCard2(prev => !prev);
                    } else if (expandedCard2) {
                      setExpandedCard2(false);
                    }
                  }}
                  className="bg-gray-50/80 border border-gray-200/60 rounded-lg px-2 sm:px-2.5 h-8 flex items-center gap-1.5 sm:gap-2 shrink-0 max-w-[160px] sm:max-w-[220px] select-none cursor-pointer"
                >
                  <span className="text-[10px] font-bold text-gray-400 capitalize shrink-0">Job:</span>
                  <span className="job-name-text text-[11px] sm:text-[11.5px] font-semibold text-gray-800 capitalize truncate" title={selectedPekerjaan}>{selectedPekerjaan}</span>
                  <span className="text-[11px] sm:text-[11.5px] font-semibold text-emerald-600 tabular-nums shrink-0">{grandTotalJurnal.toLocaleString('id-ID')}</span>
                </div>
              )}

              {/* Tren Button & Mini Progress */}
              <div className="bg-gray-50/80 border border-gray-200/60 rounded-lg px-1.5 sm:px-2 h-8 flex items-center gap-1 sm:gap-1.5 shrink-0">
                <button
                  onClick={() => setShowChart(!showChart)}
                  className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[10.5px] font-semibold transition-all shadow-none shrink-0 ${
                    showChart ? 'bg-emerald-600 text-white' : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white'
                  }`}
                >
                  Tren
                </button>
                <div className="flex items-center gap-1 sm:gap-1.5 w-[55px] sm:w-[75px] ml-0.5">
                  <div className="flex-1 h-1.5 bg-gray-200/60 rounded-full relative overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ease-out rounded-full ${grandTotal >= selectedSopd.qty ? 'bg-emerald-500' : 'bg-emerald-400'}`} 
                      style={{ width: `${Math.min(100, (grandTotal / selectedSopd.qty) * 100)}%` }} 
                    />
                  </div>
                  <span className="text-[10px] sm:text-[10.5px] font-bold tabular-nums text-gray-700 shrink-0">
                    {((grandTotal / selectedSopd.qty) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Bagian Tengah: Search Bar */}
            <div className="flex-1 min-w-0 w-full md:w-auto">
              <div className="relative w-full group">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-emerald-500 transition-colors z-10 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari kata kunci (pekerjaan, karyawan, kendala)..."
                  className="w-full pl-7 pr-6 h-8 text-[11px] bg-gray-50/70 border border-gray-200/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all font-medium placeholder:text-gray-400 shadow-none"
                  value={dataSearchQuery}
                  onChange={(e) => handleDataSearchChange(e.target.value)}
                />
                {dataSearchQuery && (
                  <button 
                    onClick={() => handleDataSearchChange('')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 p-0.5"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            </div>

            {/* Bagian Kanan: Tab, Level, View Mode, Refresh */}
            <div className="flex items-center gap-1.5 sm:gap-2 w-full md:w-auto shrink-0 justify-between md:justify-end">
              {/* Sisi Kiri Mobile: Tab & Level */}
              <div className="flex items-center gap-1.5 flex-1 md:flex-initial min-w-0">
                {/* Tab Selector */}
                <div className="flex items-center gap-0.5 bg-gray-100/70 p-0.5 rounded-lg border border-gray-200/60 flex-1 md:flex-none">
                  <button 
                    onClick={() => setActiveTab('jurnal')} 
                    className={`flex-1 md:flex-none px-2.5 sm:px-3 py-1 rounded-md text-[10.5px] sm:text-[11px] font-bold whitespace-nowrap flex items-center justify-center transition-all ${activeTab === 'jurnal' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                  >
                    Jurnal
                  </button>
                  <button 
                    onClick={() => setActiveTab('barang_jadi')} 
                    className={`flex-1 md:flex-none px-2.5 sm:px-3 py-1 rounded-md text-[10.5px] sm:text-[11px] font-bold whitespace-nowrap flex items-center justify-center transition-all ${activeTab === 'barang_jadi' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                  >
                    Barang Jadi
                  </button>
                </div>

                {/* Level Selector (Hanya di Tab Jurnal) */}
                {activeTab === 'jurnal' && (
                  <div className="flex items-center gap-0.5 bg-gray-100/70 p-0.5 rounded-lg border border-gray-200/60 shrink-0">
                    <span className="text-[10px] font-semibold text-gray-400 pl-1 pr-0.5 select-none">Lvl:</span>
                    <button 
                      type="button" 
                      onClick={() => setDetailLevel(1)} 
                      className={`px-1.5 py-0.5 text-[10.5px] font-bold rounded transition-all ${detailLevel === 1 ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      title="Level 1: Hanya Subtotal Pekerjaan"
                    >
                      1
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setDetailLevel(2)} 
                      className={`px-1.5 py-0.5 text-[10.5px] font-bold rounded transition-all ${detailLevel === 2 ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      title="Level 2: Detail Lengkap per Baris"
                    >
                      2
                    </button>
                  </div>
                )}
              </div>

              {/* Sisi Kanan Mobile: Mode & Reload */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* View Mode Switcher */}
                <div className="flex items-center gap-0.5 bg-gray-100/70 p-0.5 rounded-lg border border-gray-200/60 shrink-0">
                  <button 
                    onClick={() => { setViewMode('table'); localStorage.setItem('hp-view-mode', 'table'); }} 
                    className={`px-2 py-1 rounded-md text-[10.5px] font-bold flex items-center gap-1 transition-all ${viewMode === 'table' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`} 
                    title="Tampilan tabel"
                  >
                    <Table2 size={13} />
                    <span className="hidden md:inline">Tabel</span>
                  </button>
                  <button 
                    onClick={() => { setViewMode('card'); localStorage.setItem('hp-view-mode', 'card'); }} 
                    className={`px-2 py-1 rounded-md text-[10.5px] font-bold flex items-center gap-1 transition-all ${viewMode === 'card' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`} 
                    title="Tampilan kartu"
                  >
                    <List size={13} />
                    <span className="hidden md:inline">Kartu</span>
                  </button>
                </div>

                {/* Refresh Button */}
                <button
                  onClick={() => fetchDetails()}
                  disabled={loadingDetails}
                  className="h-8 w-8 bg-white border border-gray-200/80 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 flex items-center justify-center transition-all disabled:opacity-50 shrink-0 shadow-sm"
                  title="Refresh Data"
                >
                  <RotateCcw size={13} className={`shrink-0 ${loadingDetails ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
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
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <TrendingUp size={16} />
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-lg sm:text-xl font-bold tracking-tight text-gray-800 leading-tight">Tren Produksi Harian</h3>
                        <span className="text-[11px] sm:text-[12px] font-medium text-gray-500 mt-1">
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
                    <div className="mb-6 sm:mb-10 flex flex-wrap gap-4 sm:gap-8 text-[11px] font-bold">
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
          <div className={`bg-white/80 backdrop-blur-md border border-white/20 rounded-xl shadow-sm flex flex-col ${viewMode === 'table' ? 'lg:flex-1 lg:min-h-0 lg:overflow-hidden' : ''}`}>
            {activeTab === 'barang_jadi' ? (
            <div className={`flex flex-col ${viewMode === 'table' ? 'lg:flex-1 lg:min-h-0 lg:overflow-hidden' : ''}`}>
              {viewMode === 'card' ? (
                <div className="flex flex-col gap-2 p-3 isolate">
                  {loadingDetails
                    ? [...Array(4)].map((_, i) => (
                        <div key={i} className="animate-pulse bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between gap-3">
                          <div className="flex flex-col gap-1.5"><div className="h-3 w-20 bg-gray-100 rounded-full" /><div className="h-4 w-40 bg-gray-50 rounded-full" /></div>
                          <div className="h-6 w-14 bg-emerald-50 rounded-full" />
                        </div>
                      ))
                    : results.flatMap((group: any, gIdx: number) => [
                        ...group.items.map((item: any, iIdx: number) => (
                          <BarangJadiCard key={`bjc-${gIdx}-${iIdx}`} item={item} group={group} unit={unit} />
                        )),
                        group.items.length > 1 && (
                          <div key={`bjc-sub-${gIdx}`} className="relative z-10 flex items-center gap-2 px-1 py-1">
                            <div className="flex-1 h-px bg-emerald-100" />
                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full shrink-0">
                              <span className="text-[11px] font-bold text-emerald-700">Total {formatToDayMonthYear(group.date)}</span>
                              <span className="text-[13px] font-extrabold text-emerald-800 tabular-nums">{group.total.toLocaleString('id-ID')}</span>
                              <span className="text-[10px] font-bold text-gray-400 uppercase">{group.items[0]?.satuan || unit}</span>
                            </div>
                            <div className="flex-1 h-px bg-emerald-100" />
                          </div>
                        ),
                      ]).filter(Boolean)
                  }
                </div>
              ) : (
              <div
                ref={barangJadiBodyRef}
                className={`overflow-auto custom-scrollbar bg-gray-50/20 max-h-[60vh] ${viewMode === 'table' ? 'lg:max-h-none lg:flex-1 lg:min-h-0' : ''}`}
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
                      <th className="sticky left-0 z-30 px-4 py-3 xl:py-5 text-[11px] xl:text-xs font-bold text-gray-400 tracking-tight border-b border-r border-gray-100 bg-white whitespace-nowrap shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">Tanggal</th>
                      <th className="px-4 py-3 xl:py-5 text-[11px] xl:text-xs font-bold text-gray-400 tracking-tight border-b border-gray-100 bg-white whitespace-nowrap">Nama Produksi</th>
                      <th className="px-4 py-3 xl:py-5 text-[11px] xl:text-xs font-bold text-gray-400 tracking-tight border-b border-gray-100 bg-white whitespace-nowrap">No. Faktur</th>
                      <th className="px-4 py-3 xl:py-5 text-[11px] xl:text-xs font-bold text-gray-400 tracking-tight border-b border-gray-100 bg-emerald-50 text-right whitespace-nowrap">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {memoizedBarangJadiRows}
                  </tbody>
                </table>
              </div>
              )}
            </div>
            ) : (
             <div className={`flex flex-col ${viewMode === 'table' ? 'lg:flex-1 lg:min-h-0 lg:overflow-hidden' : ''}`}>
               {/* Operator Efficiency Summary - Horizontal scrollable row */}
               {jurnalResults.length > 0 && !loadingDetails && selectedPekerjaan && (
                 <div className="bg-white border-b border-gray-100 px-6 py-2.5 flex items-center gap-4 shrink-0 overflow-hidden">
                   <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-600 tracking-wide shrink-0">
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

              {viewMode === 'card' ? (
                <>
                  {/* Card Quick Sort Bar */}
                  {activeTab === 'jurnal' && jurnalResults.length > 0 && !loadingDetails && (
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-white border-b border-gray-100 overflow-x-auto custom-scrollbar shrink-0 select-none">
                      <span className="text-[11px] font-bold text-gray-400 shrink-0 flex items-center gap-1">
                        <ArrowUpDown size={12} />
                        <span>Urutkan:</span>
                      </span>
                      {[
                        { i: 0, label: 'Tanggal' },
                        { i: 14, label: 'Realisasi' },
                        { i: 13, label: 'Target' },
                        { i: 3, label: 'Pekerjaan' },
                        { i: 4, label: 'Kode' },
                      ].map(item => {
                        const currentSort = sorting.find(s => s.i === item.i);
                        return (
                          <button
                            key={item.i}
                            onClick={() => toggleSort(item.i)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all shrink-0 border ${
                              currentSort
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                                : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'
                            }`}
                          >
                            <span>{item.label}</span>
                            {currentSort ? (
                              currentSort.desc ? <ArrowDown size={11} className="text-emerald-700" /> : <ArrowUp size={11} className="text-emerald-700" />
                            ) : null}
                          </button>
                        );
                      })}
                      {sorting.length > 0 && (
                        <button
                          onClick={() => setSorting([])}
                          className="text-[10.5px] font-semibold text-rose-500 hover:text-rose-700 hover:underline px-1.5 shrink-0"
                        >
                          Reset Urutan
                        </button>
                      )}
                    </div>
                  )}
                  <div className="flex flex-col gap-2 p-3 isolate">
                    {jurnalCardContent}
                  </div>
                </>
              ) : (
              <div
                ref={jurnalBodyRef}
                className={`overflow-auto custom-scrollbar bg-gray-50/20 max-h-[60vh] ${viewMode === 'table' ? 'lg:max-h-none lg:flex-1 lg:min-h-0' : ''}`}
              >
                <table className="text-left border-separate border-spacing-0" style={{ tableLayout: 'fixed', width: `${colWidths.reduce((a, b) => a + b, 0)}px` }}>
                  <colgroup>
                    {colWidths.map((w, i) => <col key={i} style={{ width: `${w}px` }} />)}
                  </colgroup>
                  <thead className="sticky top-0 z-20">
                    <tr className={sorting.length > 0 ? 'bg-amber-50/90' : 'bg-white'}>
                      {colWidths.map((w, i) => {
                        const isSorted = sorting.some(x => x.i === i);
                        return (
                          <th key={i} onClick={() => toggleSort(i)} onContextMenu={(e) => colCtx(i, e)}
                            className={`px-2 py-3 xl:py-4 text-[11px] xl:text-xs font-bold tracking-tight border-b border-r ${
                              sorting.length > 0 
                                ? 'border-amber-200/80 bg-amber-50/90' 
                                : 'border-gray-100 bg-white'
                            } whitespace-nowrap ${i === 0 ? 'sticky left-0 z-30 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]' : ''} ${i === 1 ? 'md:sticky md:z-30 md:shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]' : ''} ${i === 2 || i === 3 || i === 4 ? 'lg:sticky lg:z-30 lg:shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]' : ''} ${
                              isSorted 
                                ? 'text-amber-900 bg-amber-100/90' 
                                : sorting.length > 0 
                                ? 'text-amber-800/70 hover:bg-amber-100/50' 
                                : 'text-gray-400 hover:bg-gray-50'
                            } ${i >= 6 && i <= 9 ? 'text-right' : ''} ${i === 14 && sorting.length === 0 ? 'bg-emerald-50' : ''} cursor-pointer select-none`}
                            style={{ width: `${w}px`, minWidth: `${w}px`, ...(i > 4 ? { position: 'relative' } : {}), ...(i > 0 && i <= 4 ? { left: `${colWidths.slice(0, i).reduce((a, b) => a + b, 0)}px` } : {}) }}>
                            <div className="flex items-center gap-1">
                              <SortIcon i={i} />
                              <span className="truncate">{['Tanggal','Bagian / Karyawan','No. & Nama Order','Jenis Pekerjaan','Kode','Bahan Kertas','Jml. Plate','Warna','Inscheet','Rijek','Jam','Kendala','Keterangan','Target','Realisasi'][i]}</span>
                            </div>
                            <div onMouseDown={(e) => colResizeStart(i, e)} onDoubleClick={(e) => colAutoFit(i, e)} className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-300/50 z-10" />
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody style={{ display: 'block', height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
                    {jurnalRowsContent}
                  </tbody>
                </table>
              </div>
              )}
            </div>
          )}
          </div>

          {/* Fixed Footer for Totals & Pagination */}
          {((activeTab === 'barang_jadi' && results.length > 0) || (activeTab === 'jurnal' && jurnalResults.length > 0)) && !loadingDetails && (
            <>
              {/* Totals Row */}
              {(activeTab === 'barang_jadi' || (activeTab === 'jurnal' && selectedPekerjaan)) && (
                <div 
                  className="shrink-0 w-full bg-white/80 backdrop-blur-md border border-white/20 rounded-xl shadow-sm px-2.5 sm:px-4 py-1.5 md:py-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between sm:justify-end shrink-0 min-w-0 mt-1 mb-1.5 select-none gap-1.5 sm:gap-0"
                >
                  {activeTab === 'jurnal' && grandTotalTarget > 0 && (
                    <>
                      <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-1.5 min-w-0 flex-1 sm:flex-initial">
                        <span className="text-[10.5px] sm:text-[11px] font-bold text-gray-400 capitalize tracking-tight shrink-0" title="Total Target">Total Target</span>
                        <div className="flex items-baseline gap-0.5 shrink-0">
                          <span className="text-[13px] sm:text-[14px] lg:text-base font-semibold text-gray-800 tabular-nums whitespace-nowrap" title={grandTotalTarget.toLocaleString('id-ID')}>{grandTotalTarget.toLocaleString('id-ID')}</span>
                          <span className="text-[9.5px] sm:text-[10px] font-bold text-gray-400 shrink-0 sm:mr-1.5">{selectedSopd?.unit}</span>
                        </div>
                      </div>
                      <div className="hidden sm:block w-px h-4 sm:h-5 bg-gray-200 shrink-0 mx-1.5 sm:mx-2.5"></div>
                    </>
                  )}
                  {activeTab === 'jurnal' && grandTotalRijek > 0 && (
                    <>
                      <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-1.5 min-w-0 flex-1 sm:flex-initial">
                        <span className="text-[10.5px] sm:text-[11px] font-bold text-rose-400 capitalize tracking-tight shrink-0" title="Total Rijek">Total Rijek</span>
                        <div className="flex items-baseline gap-0.5 shrink-0">
                          <span className="text-[13px] sm:text-[14px] lg:text-base font-semibold text-rose-600 tabular-nums whitespace-nowrap" title={grandTotalRijek.toLocaleString('id-ID')}>{grandTotalRijek.toLocaleString('id-ID')}</span>
                          <span className="text-[9.5px] sm:text-[10px] font-bold text-gray-400 shrink-0 sm:mr-1.5">{selectedSopd?.unit}</span>
                        </div>
                      </div>
                      <div className="hidden sm:block w-px h-4 sm:h-5 bg-gray-200 shrink-0 mx-1.5 sm:mx-2.5"></div>
                    </>
                  )}
                  <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-1.5 min-w-0 flex-1 sm:flex-initial">
                    <span className="text-[10.5px] sm:text-[11px] font-bold text-emerald-600 capitalize tracking-tight shrink-0" title={activeTab === 'barang_jadi' ? 'Total Masuk' : 'Realisasi'}>
                      {activeTab === 'barang_jadi' ? 'Total Masuk' : 'Realisasi'}
                    </span>
                    <div className="flex items-baseline gap-0.5 shrink-0">
                      <span className="text-[13px] sm:text-[14px] lg:text-base font-semibold text-emerald-600 tabular-nums whitespace-nowrap" title={activeTab === 'barang_jadi' ? grandTotal.toLocaleString('id-ID') : grandTotalJurnal.toLocaleString('id-ID')}>
                        {activeTab === 'barang_jadi' 
                          ? grandTotal.toLocaleString('id-ID')
                          : grandTotalJurnal.toLocaleString('id-ID')
                        }
                      </span>
                      <span className="text-[9.5px] sm:text-[10px] font-bold text-gray-400 shrink-0">
                        {activeTab === 'barang_jadi' 
                          ? (results[0]?.items[0]?.satuan || results[0]?.items[0]?.unit || unit)
                          : selectedSopd?.unit
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div className={`pt-1 shrink-0 ${viewMode === 'card' ? 'pb-20 lg:pb-16' : 'pb-14 lg:pb-0'}`}>
                {activeTab === 'jurnal' ? (
                  <TableFooter
                    totalCount={totalJurnalItems}
                    currentCount={totalJurnalItems}
                    label="baris data"
                    loadTime={loadTime}
                  />
                ) : (
                  <TableFooter
                    totalCount={totalBarangJadiItems}
                    currentCount={totalBarangJadiItems}
                    label="baris data"
                    loadTime={loadTime}
                  />
                )}
              </div>
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
            
            <div className="mt-12 flex items-center gap-4 text-[11px] font-semibold text-gray-300">
              <div className="w-12 h-px bg-gray-100"></div>
              SINTAK-PT. Buya Barokah
              <div className="w-12 h-px bg-gray-100"></div>
            </div>
          </div>
        </div>
      )}
      {/* Floating Navigation Controls - Smooth Fade & Scale Transitions (Fade total saat idle) */}
      {isMounted && (showTopBtn || showBottomBtn) && (
        <Portal>
          <div 
            onMouseEnter={() => setIsNavHovered(true)}
            onMouseLeave={() => setIsNavHovered(false)}
            onTouchEnd={() => {
              if (navIdleTimerRef.current) clearTimeout(navIdleTimerRef.current);
              navIdleTimerRef.current = setTimeout(() => {
                setIsNavHovered(false);
                setIsNavActive(false);
              }, 1200);
            }}
            className={`fixed bottom-6 right-6 z-[80] transition-all duration-300 ease-out ${
              isNavActive || isNavHovered
                ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' 
                : 'opacity-0 translate-y-4 scale-90 pointer-events-none'
            }`}
          >
            <div className={`bg-white/80 backdrop-blur-xl border border-white/60 shadow-2xl shadow-emerald-950/20 rounded-full p-1.5 flex flex-col transition-all duration-300 ring-1 ring-black/5 ${showTopBtn && showBottomBtn ? 'gap-1.5' : 'gap-0'}`}>
              {/* Tombol Ke Atas */}
              {showTopBtn && (
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('main-content-scroll');
                    if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
                    setTimeout(() => setIsNavHovered(false), 300);
                  }}
                  className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 hover:shadow-emerald-600/50 hover:scale-110 active:scale-95 transition-all duration-300 ease-out cursor-pointer"
                  title="Ke Paling Atas"
                  aria-label="Ke Paling Atas"
                >
                  <ChevronUp size={20} strokeWidth={2.5} />
                </button>
              )}

              {/* Tombol Ke Grand Total */}
              {showBottomBtn && (
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('main-content-scroll');
                    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
                    setTimeout(() => setIsNavHovered(false), 300);
                  }}
                  className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/30 hover:bg-emerald-600 hover:shadow-emerald-600/40 hover:scale-110 active:scale-95 transition-all duration-300 ease-out cursor-pointer"
                  title="Ke Grand Total (Paling Bawah)"
                  aria-label="Ke Grand Total"
                >
                  <ChevronDown size={20} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>
        </Portal>
      )}

      {/* Simple Floating Tooltip Bubble tepat di bawah Card Pekerjaan yang diklik */}
      {expandedCard2 && isMounted && typeof document !== 'undefined' && createPortal(
        <div 
          style={{ top: `${tooltipPos.top}px`, left: `${tooltipPos.left}px` }}
          className="fixed z-[999999] bg-gray-900 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg shadow-xl max-w-xs sm:max-w-md break-words pointer-events-none animate-in fade-in duration-100"
        >
          {selectedPekerjaan}
        </div>,
        document.body
      )}
    </div>
  );
}


