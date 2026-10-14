 'use client';
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
 import { Download, Loader2, Play, AlertCircle, Settings2, X, Plus, Trash2, Save, RefreshCw, Share2, Check, ThumbsUp, ThumbsDown, Search, ShieldCheck, CheckSquare, Square, ClipboardList } from 'lucide-react';
import Portal from '@/components/Portal';
import TableFooter from '@/components/TableFooter';
import ConfirmDialog from '@/components/ConfirmDialog';
import { DataTable } from '@/components/ui/DataTable';
import DatePicker from '@/components/DatePicker';
import { useTableSelection } from '@/lib/hooks/useTableSelection';
import { highlightText } from '@/lib/highlight';
 import { formatLastUpdate } from '@/lib/date-utils';
 import { formatScrapedPeriodDate } from '@/lib/scraper-period';

 interface PreviewRow {
   id: string;
   kode: string;
   nama: string;
   satuan: string;
   golongan: string;
   kelompok: string;
   saldo: string;
   kategori: 'A_LUDES' | 'B_BATAL' | 'MANUAL';
   alasan: string;
 }

 interface PreviewResult {
   success: boolean;
   cutoff: string;
   kandidat: number;
   bolehCount: number;
   ditolakCount: number;
   rows: PreviewRow[];
   ditolak?: Array<{ kode: string; nama: string; alasan: string }>;
   idleDays?: number;
   error?: string;
 }

interface Settings {
  routine_codes: string[];
  routine_keywords: string[];
  routine_exclude_keywords: string[];
  idle_days: number;
}

function todayIso(): string {
  const now = new Date();
  const wib = new Date(now.getTime() + (7 * 60 + now.getTimezoneOffset()) * 60000);
  return wib.toISOString().slice(0, 10);
}

function isoToDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
  return isNaN(d.getTime()) ? null : d;
}

function dateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDaysIso(iso: string, n: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + n, 12, 0, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isoToDdMmYyyy(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : iso;
 }

 const BULAN_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

 function formatCutoff(iso: string): string {
   const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
   if (!m) return iso;
   return `${m[3]} ${BULAN_SHORT[Number(m[2]) - 1] ?? m[2]} ${m[1]}`;
 }

const KAT_LABEL: Record<string, string> = {
  A_LUDES: 'A — Ludes Pesanan',
   B_BATAL: 'B — Hanya Penawaran',
  MANUAL: 'Manual',
};

export default function PenonaktifanMasterClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  const [cutoff, setCutoff] = useState(() => searchParams.get('cutoff') || todayIso());
   const [data, setData] = useState<PreviewResult | null>(null);
  const [showDitolak, setShowDitolak] = useState(false);
  const [ditolakSearch, setDitolakSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('search') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(() => searchParams.get('search') || '');
  const [highlightQuery, setHighlightQuery] = useState(() => searchParams.get('search') || '');
   const [syncing, setSyncing] = useState(false);
   const [syncProgress, setSyncProgress] = useState<{ done: number; total: number; label: string; elapsed: number; history: { label: string; secs: number }[] } | null>(null);
   const [protecting, setProtecting] = useState(false);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [dialog, setDialog] = useState({ isOpen: false, type: 'success' as 'success' | 'error', title: '', message: '' });
  const urlSearchRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const [showSettings, setShowSettings] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [codeSearch, setCodeSearch] = useState('');
  const [codeHits, setCodeHits] = useState<Array<{ kode: string; nama: string }>>([]);
  const [codeSearching, setCodeSearching] = useState(false);
   const [idleInput, setIdleInput] = useState('7');
   const [keywordInput, setKeywordInput] = useState('');
  const [excludeInput, setExcludeInput] = useState('');
  const [routineItems, setRoutineItems] = useState<Array<{ kode: string; nama: string }>>([]);
   const [lastGenerate, setLastGenerate] = useState<string | null>(() => (typeof window !== 'undefined' ? localStorage.getItem('penonaktifan_lastGenerate') : null));
   const [lastSyncAll, setLastSyncAll] = useState<string | null>(() => (typeof window !== 'undefined' ? localStorage.getItem('penonaktifan_lastSyncAll') : null));
   const [serverSync, setServerSync] = useState<{
     at: string | null;
     period: { start: string; end: string } | null;
     saldoTgl?: string | null;
   } | null>(null);
   const [sharing, setSharing] = useState(false);
   const [shareToken, setShareToken] = useState<string | null>(() => (typeof window !== 'undefined' ? localStorage.getItem('penonaktifan_shareToken') : null));
   const [rekap, setRekap] = useState<Array<{ id: number; kode: string; nama: string; aksi: string; alasan: string; reviewer: string; keputusan: string }>>([]);
  const [rekapOpen, setRekapOpen] = useState(false);
  const [rekapAt, setRekapAt] = useState<string | null>(null);
  const [searchRekap, setSearchRekap] = useState('');
  const [selectedRekapIds, setSelectedRekapIds] = useState<Set<number>>(new Set());
  const lastSelectedRekapIdRef = useRef<number | null>(null);

  const toggleSelectRekap = useCallback((id: number, e?: React.MouseEvent, isCheckbox?: boolean) => {
    setSelectedRekapIds((prev) => {
      const next = new Set(prev);
      if (e?.shiftKey && lastSelectedRekapIdRef.current !== null) {
        const last = lastSelectedRekapIdRef.current;
        const cIdx = rekap.findIndex((x) => x.id === id);
        const lIdx = rekap.findIndex((x) => x.id === last);
        if (cIdx !== -1 && lIdx !== -1) {
          const start = Math.min(cIdx, lIdx);
          const end = Math.max(cIdx, lIdx);
          for (let i = start; i <= end; i++) {
            next.add(rekap[i].id);
          }
          return next;
        }
      }
      if (isCheckbox || e?.ctrlKey || e?.metaKey) {
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        lastSelectedRekapIdRef.current = id;
        return next;
      }
      const isCurrentlySelected = next.has(id);
      const wasOnlyOneSelected = next.size === 1;
      if (isCurrentlySelected && wasOnlyOneSelected) {
        next.clear();
        lastSelectedRekapIdRef.current = null;
      } else {
        next.clear();
        next.add(id);
        lastSelectedRekapIdRef.current = id;
      }
      return next;
    });
  }, [rekap]);
  const filteredRekap = useMemo(() => {
    const q = searchRekap.trim().toLowerCase();
    if (!q) return rekap;
    return rekap.filter((item) => {
      const nama = (item.nama || '').toLowerCase();
      const alasan = (item.alasan || '').toLowerCase();
      const reviewer = (item.reviewer || '').toLowerCase();
      return item.kode.toLowerCase().includes(q) || nama.includes(q) || alasan.includes(q) || reviewer.includes(q);
    });
  }, [rekap, searchRekap]);

  const [manualKode, setManualKode] = useState('');
  const [manualNama, setManualNama] = useState('');
  const [manualAlasan, setManualAlasan] = useState('');
  const [manualError, setManualError] = useState('');
  const [manualHits, setManualHits] = useState<Array<{ kode: string; nama: string }>>([]);
  const [manualSearching, setManualSearching] = useState(false);
  const [manualDropdownOpen, setManualDropdownOpen] = useState(false);
  const [manualSearchActiveField, setManualSearchActiveField] = useState<'kode' | 'nama' | null>(null);
   const manualSearchContainerRef = useRef<HTMLDivElement>(null);
   const manualShowDropdown = manualDropdownOpen
     && (manualSearchActiveField === 'kode' ? manualKode.trim().length >= 2 : manualNama.trim().length >= 2);

  const rows = useMemo(() => data?.rows ?? [], [data]);
  const { selectedIds, handleRowClick, clearSelection } = useTableSelection(rows);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('penonaktifan_columnWidths');
      if (saved) return JSON.parse(saved);
    }
    return { kode: 130, nama: 350, kategori: 180, alasan: 400 };
  });

  useEffect(() => {
    localStorage.setItem('penonaktifan_columnWidths', JSON.stringify(columnWidths));
  }, [columnWidths]);

   const loadSyncStatus = useCallback(async (targetCutoff?: string) => {
     try {
       const res = await fetch(`/api/penonaktifan-master-barang/sync-range?cutoff=${targetCutoff || cutoff}`);
       const json = await res.json();
       if (json.success && json.lastSync) {
         setServerSync(json.lastSync);
       }
     } catch {
       // abaikan kegagalan jaringan
     }
   }, [cutoff]);
 
   useEffect(() => {
     setIsMounted(true);
     mountedRef.current = true;
     void loadSyncStatus();
     try {
       const saved = localStorage.getItem('penonaktifan_lastData');
       if (saved) {
         const parsed = JSON.parse(saved);
         if (parsed && Array.isArray(parsed.rows) && (!parsed.cutoff || parsed.cutoff === cutoff)) setData(parsed);
       }
     } catch { /* abaikan cache rusak */ }
     return () => { mountedRef.current = false; };
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);
 
  // Polling rekap tiap 20 detik jika ada shareToken (agar tombol berkedip jika ada update)
  useEffect(() => {
    if (!shareToken) return;
    loadRekap(shareToken);
    const t = setInterval(() => loadRekap(shareToken), 20000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareToken]);

  useEffect(() => {
    const urlSearch = searchParams.get('search');
    const urlCutoff = searchParams.get('cutoff');
    if (urlSearch !== null) {
      urlSearchRef.current = urlSearch;
      setSearchQuery(urlSearch);
      setDebouncedQuery(urlSearch);
      setHighlightQuery(urlSearch);
    }
    if (urlCutoff && /^\d{4}-\d{2}-\d{2}$/.test(urlCutoff)) setCutoff(urlCutoff);
  }, [searchParams]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      if (searchQuery !== urlSearchRef.current) setHighlightQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (!isMounted) return;
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('search', debouncedQuery);
    if (cutoff) params.set('cutoff', cutoff);
    const qs = params.toString();
    router.replace(qs ? `/penonaktifan-master-barang?${qs}` : '/penonaktifan-master-barang', { scroll: false });
  }, [debouncedQuery, cutoff, isMounted, router]);

  const loadSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch('/api/penonaktifan-master-barang/settings');
      const json = await res.json();
      if (json.success) {
         setSettings(json.settings);
         setIdleInput(String(json.settings.idle_days));
         const items = (json as unknown as { routine_items?: Array<{ kode: string; nama: string }> }).routine_items;
         if (Array.isArray(items)) setRoutineItems(items);
       }
    } catch {
      // abaikan, panel tampilkan pesan
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    if (showSettings && !settings) loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSettings]);

  useEffect(() => {
    const q = codeSearch.trim();
    if (q.length < 2) { setCodeHits([]); setCodeSearching(false); return; }
    setCodeSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/penonaktifan-master-barang/search?q=${encodeURIComponent(q)}&limit=10`);
        const json = await res.json();
        if (mountedRef.current && json.success) setCodeHits(json.rows ?? []);
      } catch { /* abaikan, dropdown kosong */ }
      finally { if (mountedRef.current) setCodeSearching(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [codeSearch]);
  useEffect(() => {
    const q = (manualSearchActiveField === 'kode' ? manualKode : manualNama).trim();
    if (q.length < 2) {
      setManualHits([]);
      setManualSearching(false);
      return;
    }
    setManualSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/penonaktifan-master-barang/search?q=${encodeURIComponent(q)}&limit=10`);
        const json = await res.json();
        if (mountedRef.current && json.success) {
          setManualHits(json.rows ?? []);
        }
      } catch {
        /* abaikan, dropdown kosong */
      } finally {
        if (mountedRef.current) setManualSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [manualKode, manualNama, manualSearchActiveField]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (manualSearchContainerRef.current && !manualSearchContainerRef.current.contains(e.target as Node)) {
        setManualDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError('');
    const startTimer = performance.now();
    try {
       const res = await fetch(`/api/penonaktifan-master-barang?cutoff=${cutoff}&limit=20000&includeDitolak=1`);
      const json = (await res.json()) as PreviewResult;
      if (!json.success) throw new Error(json.error || 'Gagal generate');
      if (!mountedRef.current) return;
      setData({ ...json, rows: (json.rows || []).map((r) => ({ ...r, id: r.kode })) });
      setLoadTime(Math.round(performance.now() - startTimer));
      const stamp = `${new Date().toISOString()}|${cutoff}`;
      setLastGenerate(stamp);
      try {
        localStorage.setItem('penonaktifan_lastGenerate', stamp);
        localStorage.setItem('penonaktifan_lastData', JSON.stringify({ ...json, rows: (json.rows || []).map((r) => ({ ...r, id: r.kode })) }));
      } catch { /* abaikan kuota */ }
    } catch (e) {
      if (mountedRef.current) setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [cutoff]);
 
   const handleSyncAll = useCallback(async (options?: { forceFull?: boolean }) => {
     const defaultStart = `${cutoff.slice(0, 4)}-01-01`;
    const defaultEnd = cutoff;
     let startDate = defaultStart;
     let endDate = defaultEnd;
     let syncMode: 'incremental' | 'full' = options?.forceFull ? 'full' : 'incremental';
 
     setSyncing(true);
     setLoading(true);
     setError('');
     const history: { label: string; secs: number }[] = [];
     const syncStart = performance.now();
     let doneCount = 0;
 
     try {
       if (!options?.forceFull) {
         try {
           const rangeRes = await fetch(`/api/penonaktifan-master-barang/sync-range?cutoff=${cutoff}`);
           const rangeJson = (await rangeRes.json()) as { success?: boolean; startDate?: string; endDate?: string; mode?: 'incremental' | 'full' };
           if (rangeJson.success && rangeJson.startDate) {
             startDate = rangeJson.startDate;
             endDate = rangeJson.endDate || defaultEnd;
             if (rangeJson.mode) syncMode = rangeJson.mode;
           }
         } catch {
           // Fallback ke awal tahun jika pengecekan range gagal
         }
       }
 
       const steps = [
         { label: 'Saldo barang', url: `/api/scrape-saldo-barang?tgl=${cutoff}` },
         { label: 'Master barang', url: `/api/scrape-master-barang` },
         { label: 'Order Produksi', url: `/api/scrape-orders?start=${startDate}&end=${endDate}&silent=true` },
         { label: 'Hasil produksi', url: `/api/scrape-barang-jadi?start=${startDate}&end=${endDate}&silent=true` },
         { label: 'SPH Keluar', url: `/api/scrape-sph-out?start=${startDate}&end=${endDate}&silent=true` },
         { label: 'BOM', url: `/api/scrape-bom?start=${startDate}&end=${endDate}&silent=true` },
         { label: 'Sales Order', url: `/api/scrape-sales-orders?start=${startDate}&end=${endDate}&silent=true` },
         { label: 'Log aktivitas', url: `/api/scrape-usr-log?stgl_awal=${isoToDdMmYyyy(startDate)}&stgl_akhir=${isoToDdMmYyyy(endDate)}` },
       ];
       const total = steps.length + 1;
 
       const waitRetry = () => {
         const { promise, resolve } = Promise.withResolvers<void>();
         setTimeout(resolve, 3000);
         return promise;
       };
       // Saldo paling berat + butuh sesi Digit segar: jalan duluan sendirian sebagai pemanasan login.
       // Retry 1x khusus 401/login agar gagal sesaat tidak langsung merah.
       const runStep = async (i: number, attempt = 1): Promise<void> => {
         const stepStart = performance.now();
         const res = await fetch(steps[i].url);
         const json = await res.json().catch(() => ({})) as { success?: boolean; error?: string; details?: string };
         const msg = json.error || json.details || '';
         const retryable = res.status === 401 || /failed to login|no cookies|unauthorized/i.test(msg);
         if ((!res.ok || json.success === false || json.error) && retryable && attempt < 2) {
           await waitRetry();
           return runStep(i, attempt + 1);
         }
         if (!res.ok || json.success === false || json.error) {
           throw new Error(`Tahap ${i + 1}/${total} (${steps[i].label}) gagal: ${json.error || json.details || `HTTP ${res.status}`}`);
         }
         const secs = Math.round(((performance.now() - stepStart) / 1000) * 10) / 10;
         history[i] = { label: steps[i].label, secs };
         doneCount += 1;
         if (mountedRef.current) setSyncProgress({ done: doneCount, total, label: steps[i].label, elapsed: (performance.now() - syncStart) / 1000, history: history.filter(Boolean) });
       };
 
       const saldoLabel = syncMode === 'incremental' ? 'Menarik saldo (tahap 1, inkremental 30h)…' : 'Menarik saldo (tahap 1, penuh awal tahun)…';
       setSyncProgress({ done: 0, total, label: saldoLabel, elapsed: 0, history: [] });
       await runStep(0);
       const restLabel = syncMode === 'incremental' ? 'Menarik 7 data paralel (inkremental 30h)…' : 'Menarik 7 data paralel (penuh awal tahun)…';
       setSyncProgress({ done: doneCount, total, label: restLabel, elapsed: (performance.now() - syncStart) / 1000, history: history.filter(Boolean) });
       const rest = steps.map((_, i) => i).filter((i) => i > 0);
       const settled = await Promise.allSettled(rest.map((i) => runStep(i)));
       const failed = settled.find((s) => s.status === 'rejected');
       if (failed) throw (failed as PromiseRejectedResult).reason;
       if (!mountedRef.current) return;
       setSyncProgress({ done: steps.length, total, label: 'Generate usulan', elapsed: (performance.now() - syncStart) / 1000, history: [...history] });
       setData(null);
       const genStart = performance.now();
       await handleGenerate();
       history.push({ label: 'Generate usulan', secs: Math.round(((performance.now() - genStart) / 1000) * 10) / 10 });
       if (!mountedRef.current) return;
       const syncStamp = `${new Date().toISOString()}|${cutoff}`;
       setLastSyncAll(syncStamp);
       try { localStorage.setItem('penonaktifan_lastSyncAll', syncStamp); } catch { /* abaikan */ }
       void loadSyncStatus(cutoff);
       const totalSecs = Math.round((performance.now() - syncStart) / 1000);
       const rincian = history.map((h) => `${h.label}: ${h.secs}s`).join(' • ');
       const modeText = syncMode === 'incremental' ? 'inkremental 30 hari' : 'penuh';
       setDialog({ isOpen: true, type: 'success', title: 'Berhasil', message: `Semua data Digit ditarik (${modeText}, ${steps.length} tahap, total ${totalSecs}s) dan usulan cutoff ${cutoff} digenerate ulang. Rincian: ${rincian}.` });
     } catch (e) {
       if (mountedRef.current) setError(e instanceof Error ? e.message : String(e));
     } finally {
       if (mountedRef.current) { setSyncing(false); setLoading(false); setSyncProgress(null); }
     }
   }, [cutoff, handleGenerate, loadSyncStatus]);

   const handleExport = async () => {
     if (!data) return;
     setExporting(true);
     try {
       const res = await fetch('/api/export-penonaktifan-master-barang', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           cutoff,
           rows: rows.map((r) => ({ kode: r.kode, nama: r.nama, satuan: r.satuan, golongan: r.golongan, kelompok: r.kelompok, saldo: r.saldo, alasan: r.alasan })),
         }),
       });
       if (!res.ok) throw new Error('Gagal export Excel');
       const blob = await res.blob();
       const url = URL.createObjectURL(blob);
       const a = document.createElement('a');
       a.href = url;
       a.download = `USULAN NONAKTIF ${cutoff}.xlsx`;
       a.click();
       URL.revokeObjectURL(url);
     } catch (e) {
       setError(e instanceof Error ? e.message : String(e));
     } finally {
       setExporting(false);
     }
   };

  const handleShare = async () => {
    if (!data) return;
    setSharing(true);
    try {
      const res = await fetch('/api/penonaktifan-master-barang/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cutoff,
          snapshot: rows.map((r) => ({ kode: r.kode, nama: r.nama, kategori: r.kategori, alasan: r.alasan })),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Gagal buat link');
      setShareToken(json.token);
      try { localStorage.setItem('penonaktifan_shareToken', json.token); } catch { /* abaikan */ }
      try { await navigator.clipboard.writeText(`${window.location.origin}/penonaktifan-review/${json.token}`); } catch { /* clipboard diblokir */ }
      setDialog({ isOpen: true, type: 'success', title: 'Link review dibuat', message: `Link disalin: ${window.location.origin}/penonaktifan-review/${json.token}` });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSharing(false);
    }
  };

   const loadRekap = async (token: string) => {
     try {
       const res = await fetch(`/api/penonaktifan-master-barang/review?token=${encodeURIComponent(token)}`);
       const json = await res.json();
       if (!mountedRef.current) return;
       if (json.success) {
         setRekap(json.review.items ?? []);
         setRekapAt(new Date().toISOString());
       }
     } catch { /* abaikan */ }
   };

   const pendingRekapCount = useMemo(() => rekap.filter((x) => !x.keputusan || x.keputusan === 'pending').length, [rekap]);

   const decide = async (id: number, keputusan: 'setuju' | 'tolak', item: { kode: string; nama?: string; aksi: string; alasan?: string }) => {
     try {
       const res = await fetch('/api/penonaktifan-master-barang/review', {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ id, keputusan }),
       });
       const json = await res.json();
       if (!json.success) throw new Error(json.error || 'Gagal');
       if (!mountedRef.current) return;
       setRekap((prev) => prev.map((x) => (x.id === id ? { ...x, keputusan } : x)));
       if (keputusan === 'setuju' && data) {
         if (item.aksi === 'usul_hapus') {
           setData({ ...data, rows: data.rows.filter((r) => r.kode !== item.kode), bolehCount: data.bolehCount - 1 });
         } else if (item.aksi === 'usul_tambah' && !data.rows.some((r) => r.kode === item.kode)) {
           const newRow: PreviewRow = {
             id: item.kode,
             kode: item.kode,
             nama: item.nama || item.kode,
             satuan: '',
             golongan: 'Barang Jadi Pesanan',
             kelompok: 'MANUAL REVIEW',
             saldo: '0.00',
             kategori: 'MANUAL',
             alasan: `Usulan reviewer: ${item.alasan || 'Ditambah via review'}`,
           };
           setData({ ...data, rows: [newRow, ...data.rows], bolehCount: data.bolehCount + 1 });
         }
       }
     } catch (e) {
       if (!mountedRef.current) return;
       setError(e instanceof Error ? e.message : String(e));
     }
   };

   const decideBatch = async (ids: number[], keputusan: 'setuju' | 'tolak') => {
     if (ids.length === 0) return;
     try {
       const res = await fetch('/api/penonaktifan-master-barang/review', {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ ids, keputusan }),
       });
       const json = await res.json();
       if (!json.success) throw new Error(json.error || 'Gagal');
       if (!mountedRef.current) return;

       const idSet = new Set(ids);
       setRekap((prev) => prev.map((x) => (idSet.has(x.id) ? { ...x, keputusan } : x)));

       if (keputusan === 'setuju' && data) {
         const itemsToApply = rekap.filter((x) => idSet.has(x.id));
         let currentRows = [...data.rows];
         let deltaCount = 0;

         for (const item of itemsToApply) {
           if (item.aksi === 'usul_hapus') {
             currentRows = currentRows.filter((r) => r.kode !== item.kode);
             deltaCount--;
           } else if (item.aksi === 'usul_tambah' && !currentRows.some((r) => r.kode === item.kode)) {
             currentRows.unshift({
               id: item.kode,
               kode: item.kode,
               nama: item.nama || item.kode,
               satuan: '',
               golongan: 'Barang Jadi Pesanan',
               kelompok: 'MANUAL REVIEW',
               saldo: '0.00',
               kategori: 'MANUAL',
               alasan: `Usulan reviewer: ${item.alasan || 'Ditambah via review'}`,
             });
             deltaCount++;
           }
         }
         setData({ ...data, rows: currentRows, bolehCount: data.bolehCount + deltaCount });
       }
       setSelectedRekapIds(new Set());
     } catch (e) {
       if (!mountedRef.current) return;
       setError(e instanceof Error ? e.message : String(e));
     }
   };

  const handleAddManual = () => {
    const k = manualKode.trim();
    const nm = manualNama.trim();
    const reason = manualAlasan.trim();
    if (!k) {
      setManualError('Kode barang wajib diisi.');
      return;
    }
    if (!/^\d+$/.test(k)) {
      setManualError('Kode barang harus numerik (angka saja).');
      return;
    }
    if (!reason) {
      setManualError('Alasan penambahan manual wajib diisi.');
      return;
    }
    if (data && data.rows.some((r) => r.kode === k)) {
      setManualError('Kode sudah ada dalam daftar usulan.');
      return;
    }
     const newRow: PreviewRow = {
       id: `manual-${k}`,
       kode: k,
       nama: nm || k,
       satuan: 'PCS',
       golongan: 'Barang Jadi Pesanan',
       kelompok: 'MANUAL',
       saldo: '0.00',
       kategori: 'MANUAL',
       alasan: reason,
     };
    if (data) {
      setData({
        ...data,
        rows: [newRow, ...data.rows],
        bolehCount: data.bolehCount + 1,
      });
    }
    setManualKode('');
    setManualNama('');
    setManualAlasan('');
    setManualError('');
    setManualHits([]);
    setManualDropdownOpen(false);
    setManualSearchActiveField(null);
    setShowManual(false);
  };
   const handleSaveSettings = async () => {
     if (!settings) return;
     setSettingsSaving(true);
     try {
       const res = await fetch('/api/penonaktifan-master-barang/settings', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ ...settings, routine_exclude_keywords: settings.routine_exclude_keywords ?? [], idle_days: Number(idleInput) }),
       });
       const json = await res.json();
       if (!json.success) throw new Error(json.error || 'Gagal simpan');
       setSettings(json.settings);
       setIdleInput(String(json.settings.idle_days));
      setShowSettings(false);
      setDialog({ isOpen: true, type: 'success', title: 'Tersimpan', message: 'Pengaturan penonaktifan berhasil disimpan. Klik Generate usulan untuk menerapkan.' });
     } catch (e) {
       setError(e instanceof Error ? e.message : String(e));
     } finally {
       setSettingsSaving(false);
     }
   };
   const protectCodes = useCallback(async (kodes: string[]) => {
     const fresh = [...new Set(kodes.map((k) => String(k).trim()).filter((k) => /^\d+$/.test(k)))];
     if (fresh.length === 0) return;
     setProtecting(true);
     try {
       let base: Settings;
       let idle = Number(idleInput);
       if (settings) {
         base = settings;
       } else {
         const r = await fetch('/api/penonaktifan-master-barang/settings');
         const j = await r.json();
         if (!j.success) throw new Error(j.error || 'Gagal muat pengaturan');
         base = j.settings as Settings;
         setSettings(base);
         setIdleInput(String(base.idle_days));
         idle = base.idle_days;
       }
       const merged = [...new Set([...base.routine_codes, ...fresh])];
       const nameMap = new Map(routineItems.map((x) => [x.kode, x.nama]));
       for (const r of rows) if (fresh.includes(r.kode) && r.nama) nameMap.set(r.kode, r.nama);
       const res = await fetch('/api/penonaktifan-master-barang/settings', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ ...base, routine_codes: merged, idle_days: Number.isFinite(idle) ? idle : base.idle_days }),
       });
       const json = await res.json();
       if (!json.success) throw new Error(json.error || 'Gagal simpan');
       setSettings(json.settings as Settings);
       setRoutineItems(merged.map((kode) => ({ kode, nama: nameMap.get(kode) ?? '' })));
       if (!mountedRef.current) return;
       setData((prev) => prev ? { ...prev, rows: prev.rows.filter((r) => !merged.includes(r.kode)), bolehCount: prev.bolehCount - prev.rows.filter((r) => merged.includes(r.kode)).length } : prev);
       clearSelection();
       setDialog({ isOpen: true, type: 'success', title: 'Dilindungi', message: `${fresh.length} kode masuk Kode rutin dan hilang dari usulan.` });
     } catch (e) {
       if (mountedRef.current) setError(e instanceof Error ? e.message : String(e));
     } finally {
       if (mountedRef.current) setProtecting(false);
     }
   }, [settings, idleInput, routineItems, rows, clearSelection]);

  const filtered = useMemo(() => {
    const s = debouncedQuery.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => r.kode.toLowerCase().includes(s) || r.nama.toLowerCase().includes(s));
  }, [rows, debouncedQuery]);

   const columns = useMemo(() => [
     {
       id: 'lindungi',
       header: '',
       size: 50,
       cell: ({ row }: { row: { original?: PreviewRow; getIsSelected: () => boolean } }) => {
         const kode = String(row.original?.kode ?? '');
         const inList = (settings?.routine_codes ?? []).includes(kode);
         return (
           <button
             type="button"
             onClick={(e) => { e.stopPropagation(); void protectCodes([kode]); }}
             disabled={inList || protecting}
             title={inList ? 'Sudah dilindungi' : 'Lindungi kode ini sebagai rutin'}
             className={`p-1.5 rounded-lg border transition-colors ${inList ? 'bg-emerald-100 border-emerald-200 text-emerald-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100 hover:border-emerald-300'}`}
           >
             <ShieldCheck size={14} />
           </button>
         );
       }
     },
     {
       accessorKey: 'kode',
       header: 'Kode',
       size: 130,
       cell: ({ getValue, row }: any) => <span className={`font-semibold tracking-tight font-mono transition-colors ${row.getIsSelected() ? 'text-emerald-600' : 'text-gray-700'}`}>{highlightText(String(getValue()), highlightQuery)}</span>
     },
     {
       accessorKey: 'nama',
       header: 'Nama Barang',
       size: 350,
       cell: ({ getValue, row }: any) => <span className={`font-bold tracking-tight block truncate ${row.getIsSelected() ? 'text-emerald-900' : 'text-gray-800'}`} title={String(getValue())}>{highlightText(String(getValue()), highlightQuery)}</span>
     },
     {
       accessorKey: 'kategori',
       header: 'Kategori',
       size: 180,
       cell: ({ getValue, row }: any) => {
         const val = String(getValue());
         return (
           <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${val === 'A_LUDES' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
             {KAT_LABEL[val] ?? val}
           </span>
         );
       }
     },
     {
       accessorKey: 'alasan',
       header: 'Alasan',
       size: 360,
       cell: ({ getValue, row }: any) => <span className={`text-[12px] block truncate ${row.getIsSelected() ? 'text-emerald-700' : 'text-gray-600'}`} title={String(getValue())}>{highlightText(String(getValue()), highlightQuery)}</span>
     },
   ], [highlightQuery, settings, protecting]);

   if (!isMounted) return null;
 
   const effectiveSyncAt = serverSync?.at || (lastSyncAll ? lastSyncAll.split('|')[0] : null);
   const periodText = serverSync?.period?.start && serverSync?.period?.end
     ? `${formatScrapedPeriodDate(serverSync.period.start)} - ${formatScrapedPeriodDate(serverSync.period.end)}`
     : null;
 
   return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 animate-in fade-in duration-500 overflow-hidden">
      {error && (
        <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl shadow-sm shadow-red-900/5 text-sm font-bold flex items-start gap-3 animate-in fade-in shrink-0">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {syncProgress && (
        <div className="shrink-0 px-4 py-3 bg-white border border-gray-100 rounded-xl shadow-sm">
          <div className="flex items-center justify-between text-[12px] font-bold text-gray-500 mb-2">
            <span className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-emerald-600" />
              Menarik data Digit — {syncProgress.label} ({Math.round(syncProgress.elapsed)}s)
            </span>
            <span className="text-emerald-600">{syncProgress.done + 1}/{syncProgress.total}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.round(((syncProgress.done + 1) / syncProgress.total) * 100)}%` }}
            />
          </div>
          {syncProgress.history.length > 0 && (
            <p className="mt-2 text-[11px] font-semibold text-gray-400 leading-relaxed">
              {syncProgress.history.map((h) => `${h.label} ${h.secs}s`).join(' • ')}
            </p>
          )}
        </div>
      )}

      <div className="flex-1 flex flex-col gap-3 overflow-hidden min-h-0 relative">
        <div className="flex flex-col gap-4 shrink-0 px-1">
          <div className="flex items-center justify-between gap-4 min-h-[32px] flex-wrap">
            <div className="flex flex-col gap-1 shrink-0">
              <div className="flex items-baseline gap-2 whitespace-nowrap">
                <label className="block text-[11px] font-bold text-gray-400 shrink-0">Tanggal cutoff</label>
                 {(lastGenerate || effectiveSyncAt) && (
                   <span className="text-[10px] font-semibold text-gray-400 leading-none">
                     {lastGenerate ? `Generate: ${formatLastUpdate(lastGenerate.split('|')[0])}` : ''}
                     {lastGenerate && effectiveSyncAt ? ' • ' : ''}
                     {effectiveSyncAt ? `Sync: ${formatLastUpdate(effectiveSyncAt)}${periodText ? ` (${periodText})` : ''}` : ''}
                   </span>
                 )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowSettings(true)}
                  className="shrink-0 w-10 h-10 bg-white border border-gray-100 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 flex items-center justify-center transition-all shadow-sm"
                  title="Pengaturan penonaktifan"
                >
                  <Settings2 size={18} />
                </button>
                <div className="w-44 shrink-0">
                  <DatePicker name="cutoff" value={isoToDate(cutoff)} onChange={(d) => setCutoff(dateToIso(d))} />
                </div>
                 <button
                   onClick={(e) => handleSyncAll({ forceFull: e.shiftKey })}
                   disabled={syncing || loading}
                   title="Tarik data Digit & Generate usulan (inkremental 30 hari; tahan Shift untuk sync penuh sejak awal tahun)"
                   className="shrink-0 px-5 py-2.5 bg-white border border-gray-100 rounded-xl text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 text-[12px] font-bold shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                 >
                   {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                   Sync semua & Generate
                 </button>
                 <button
                   onClick={handleGenerate}
                   disabled={loading}
                   className="shrink-0 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl text-[12px] font-bold shadow-sm shadow-emerald-900/20 hover:shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group/btn relative overflow-hidden"
                 >
                   <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" />
                   <span className="relative z-10 flex items-center gap-2">
                     {loading ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                     Generate usulan
                   </span>
                 </button>
                 {data && (
                  <button
                    type="button"
                    onClick={() => setShowDitolak(true)}
                     title="Lihat daftar kode yang ditolak tahap 2 + alasannya"
                     className="shrink-0 px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-[12px] font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                   >
                     <span>Ditolak Tahap 2</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-[10px] font-mono tabular-nums">
                      {data.ditolakCount.toLocaleString('id-ID')}
                    </span>
                    <span>▸</span>
                  </button>
                )}
                <button
                  onClick={handleShare}
                  disabled={!data || sharing}
                  title="Buat link review untuk pengecek"
                  className="shrink-0 px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 text-[12px] font-bold shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {sharing ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
                  Bagikan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRekapOpen(true);
                    if (shareToken) loadRekap(shareToken);
                  }}
                  title="Buka dialog rekap koreksi review"
                  className={`shrink-0 px-4 py-2.5 bg-white border rounded-xl text-[12px] font-bold shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    pendingRekapCount > 0
                      ? 'border-amber-400 text-amber-700 bg-amber-50/70 ring-2 ring-amber-400/30'
                      : 'border-gray-100 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  <ClipboardList size={16} />
                  <span>Rekap koreksi</span>
                  {pendingRekapCount > 0 ? (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                      {pendingRekapCount} baru
                    </span>
                  ) : rekap.length > 0 ? (
                    <span className="text-slate-400 text-[11px] font-medium">({rekap.length})</span>
                  ) : null}
                </button>
                <button
                  onClick={handleExport}
                  disabled={!data || exporting}
                  className="shrink-0 px-5 py-2.5 bg-white border border-gray-100 rounded-xl text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 text-[12px] font-bold shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  Unduh Excel usulan
                </button>
              </div>
            </div>
          </div>
        </div>

        {data && (
          <>


             <div className="shrink-0 flex items-center gap-2 w-full">
               <button
                 type="button"
                 onClick={handleGenerate}
                 disabled={loading}
                 className="h-9 w-9 text-slate-700 hover:text-emerald-800 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-all flex items-center justify-center shrink-0 disabled:opacity-50 cursor-pointer shadow-sm"
                 title="Reload data usulan"
               >
                 <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
               </button>
               <div className="relative flex-1 min-w-0">
                 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input
                   type="text"
                   placeholder="Cari kode / nama…"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full pl-9 pr-4 h-9 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all shadow-sm"
                 />
               </div>
               {selectedIds.size > 0 && (
                 <button
                   type="button"
                   onClick={() => void protectCodes(filtered.filter((r) => selectedIds.has(r.id)).map((r) => r.kode))}
                   disabled={protecting}
                   title="Lindungi kode terpilih sebagai rutin"
                   className="h-9 px-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm disabled:opacity-50"
                 >
                   {protecting ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
                   <span className="hidden sm:inline">Lindungi {selectedIds.size} rutin</span>
                 </button>
               )}
               <button
                 type="button"
                 onClick={() => { setManualError(''); setShowManual(true); }}
                 title="Tambah usulan manual"
                 className="h-9 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
               >
                 <Plus size={15} />
                 <span className="hidden sm:inline">Tambah manual</span>
               </button>
             </div>
             <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden relative">
               <DataTable
                columns={columns}
                data={filtered}
                isLoading={loading}
                selectedIds={selectedIds}
                onRowClick={handleRowClick}
                columnWidths={columnWidths}
                onColumnWidthChange={setColumnWidths}
                rowHeight="h-11"
              />
              <TableFooter
                totalCount={rows.length}
                currentCount={filtered.length}
                label="Usulan"
                selectedCount={selectedIds.size}
                onClearSelection={clearSelection}
                loadTime={loadTime}
              />
            </div>
            <p className="text-[11px] text-gray-400 shrink-0">
              File usulan saja — tidak mengubah status master. Eksekusi nonaktif tetap di Digit oleh PPIC.
              Saldo 0 di sintak diasumsikan N PERSD 0; pastikan sync master terbaru sebelum eksekusi.
            </p>
          </>
        )}
      </div>

      {showSettings && (
        <Portal>
           <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                    <Settings2 size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Pengaturan penonaktifan</h3>
                    <p className="text-[11px] text-slate-500">Kode rutin dan batas idle penawaran</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowSettings(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all cursor-pointer">
                  <X size={16} />
                </button>
              </div>
              {settingsLoading || !settings ? (
                <div className="py-8 text-center text-gray-400 text-sm">
                  <Loader2 size={20} className="inline animate-spin mr-1" /> Memuat pengaturan…
                </div>
              ) : (
                <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                  <div>
                     <div className="text-xs font-bold text-slate-700 mb-1.5">Kode rutin — dilindungi dari usulan (pasti per kode)</div>
                     <input value={codeSearch} onChange={(e) => setCodeSearch(e.target.value)} placeholder="Cari kode / nama barang…" className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all mb-2" />
                     {codeSearch.trim().length >= 2 && (
                       <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 mb-2">
                         {codeSearching && <div className="px-3 py-2 text-[11px] text-gray-400">Mencari…</div>}
                         {!codeSearching && codeHits.length === 0 && <div className="px-3 py-2 text-[11px] text-gray-400">Tidak ada kode/nama yang cocok.</div>}
                         {codeHits.map((r) => (
                           <button key={r.kode} onClick={() => { if (!settings.routine_codes.includes(r.kode)) { setSettings({ ...settings, routine_codes: [...settings.routine_codes, r.kode] }); setRoutineItems((prev) => (prev.some((x) => x.kode === r.kode) ? prev : [...prev, { kode: r.kode, nama: r.nama }])); } setCodeSearch(''); setCodeHits([]); }} className="w-full text-left px-3 py-2 hover:bg-emerald-50 transition-colors flex items-center justify-between gap-2" title={r.nama}>
                             <span className="text-xs font-mono font-bold text-slate-700">{r.kode}</span>
                             <span className="text-[11px] text-slate-500 truncate flex-1">{r.nama}</span>
                             {settings.routine_codes.includes(r.kode) ? <span className="text-[10px] font-bold text-emerald-600 shrink-0">Sudah</span> : <Plus size={14} className="text-emerald-600 shrink-0" />}
                           </button>
                         ))}
                       </div>
                     )}
                     <div className="flex flex-wrap gap-1.5 mb-2 max-h-64 overflow-y-auto custom-scrollbar">
                       {settings.routine_codes.map((c) => {
                         const nm = routineItems.find((r) => r.kode === c)?.nama ?? '';
                         return (
                         <span key={c} title={nm || c} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold max-w-full">
                           <span className="font-mono">{c}</span>
                           {nm && <span className="font-normal text-blue-600 truncate max-w-[220px]">— {nm.slice(0, 40)}</span>}
                           <button onClick={() => setSettings({ ...settings, routine_codes: settings.routine_codes.filter((x) => x !== c) })} className="hover:text-blue-900 shrink-0">
                             <Trash2 size={12} />
                           </button>
                         </span>
                         );
                       })}
                       {settings.routine_codes.length === 0 && <span className="text-xs text-gray-400">Belum ada — semua kode bisa diusulkan.</span>}
                     </div>
                   </div>
                   <div>
                     <div className="text-xs font-bold text-slate-700 mb-1.5">Keyword rutin — lindungi semua nama yang mengandung kata ini</div>
                     <div className="flex flex-wrap gap-1.5 mb-2">
                       {(settings.routine_keywords ?? []).map((k) => (
                         <span key={k} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold">
                           “{k}”
                           <button onClick={() => setSettings({ ...settings, routine_keywords: (settings.routine_keywords ?? []).filter((x) => x !== k) })} className="hover:text-violet-900 shrink-0">
                             <Trash2 size={12} />
                           </button>
                         </span>
                       ))}
                       {(settings.routine_keywords ?? []).length === 0 && <span className="text-xs text-gray-400">Belum ada keyword — mis. yanbu, quddus, yasin.</span>}
                     </div>
                     <div className="flex gap-2">
                       <input value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const v = keywordInput.trim().toLowerCase(); if (v.length >= 3 && !(settings.routine_keywords ?? []).includes(v)) setSettings({ ...settings, routine_keywords: [...(settings.routine_keywords ?? []), v] }); setKeywordInput(''); } }} placeholder="Ketik keyword + Enter…" className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 focus:outline-none transition-all" />
                       <button onClick={() => { const v = keywordInput.trim().toLowerCase(); if (v.length >= 3 && !(settings.routine_keywords ?? []).includes(v)) setSettings({ ...settings, routine_keywords: [...(settings.routine_keywords ?? []), v] }); setKeywordInput(''); }} className="px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1">
                         <Plus size={13} /> Tambah
                       </button>
                     </div>
                     <p className="text-[11px] text-slate-400 mt-1">Cocok sebagian nama, tanpa peduli huruf besar/kecil. Hati-hati: keyword pendek melindungi banyak barang.</p>
                   </div>
                  <div>
                    <div className="text-xs font-bold text-slate-700 mb-1.5">Keyword pengecualian — JANGAN lindungi</div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {(settings.routine_exclude_keywords ?? []).map((k) => (
                        <span key={k} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
                          “{k}”
                          <button onClick={() => setSettings({ ...settings, routine_exclude_keywords: (settings.routine_exclude_keywords ?? []).filter((x) => x !== k) })} className="hover:text-amber-950 shrink-0">
                            <Trash2 size={12} />
                          </button>
                        </span>
                      ))}
                      {(settings.routine_exclude_keywords ?? []).length === 0 && <span className="text-xs text-gray-400">Belum ada pengecualian — mis. non-standar, afkir.</span>}
                    </div>
                    <div className="flex gap-2">
                      <input value={excludeInput} onChange={(e) => setExcludeInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); const v = excludeInput.trim().toLowerCase(); if (v.length >= 3 && !(settings.routine_exclude_keywords ?? []).includes(v)) setSettings({ ...settings, routine_exclude_keywords: [...(settings.routine_exclude_keywords ?? []), v] }); setExcludeInput(''); } }} placeholder="Ketik keyword pengecualian + Enter…" className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none transition-all" />
                      <button onClick={() => { const v = excludeInput.trim().toLowerCase(); if (v.length >= 3 && !(settings.routine_exclude_keywords ?? []).includes(v)) setSettings({ ...settings, routine_exclude_keywords: [...(settings.routine_exclude_keywords ?? []), v] }); setExcludeInput(''); }} className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1">
                        <Plus size={13} /> Tambah
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Barang yang cocok dengan keyword ini akan tetap bisa diusulkan untuk dinonaktifkan meski cocok kode/keyword rutin.</p>
                  </div>
                   <div>
                     <div className="text-xs font-bold text-slate-700 mb-1.5">Batas idle hanya penawaran (hari)</div>
                     <input value={idleInput} onChange={(e) => setIdleInput(e.target.value.replace(/\D/g, ''))} inputMode="numeric" className="px-3 py-2 w-28 text-xs tabular-nums bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all" />
                     <p className="text-[11px] text-slate-400 mt-1">Penawaran yang umurnya di bawah ini tidak diusulkan.</p>
                   </div>
                </div>
              )}
              {settings && !settingsLoading && (
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2 shrink-0">
                  <button type="button" onClick={() => setShowSettings(false)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer">
                    Batal
                  </button>
                  <button onClick={handleSaveSettings} disabled={settingsSaving} className="flex items-center gap-2 px-5 h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold rounded-xl transition-colors shadow-sm disabled:opacity-60 cursor-pointer">
                    {settingsSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Simpan pengaturan
                  </button>
                </div>
              )}
            </div>
          </div>
        </Portal>
      )}
      {showDitolak && (
        <Portal>
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => {
              setShowDitolak(false);
              setDitolakSearch('');
            }}
          >
            <div
              className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
                <div>
                   <h3 className="text-sm font-bold text-slate-800">
                     Ditolak Tahap 2 {data ? `(${data.ditolak?.length ?? data.ditolakCount})` : ''}
                   </h3>
                   <p className="text-[11px] text-slate-500">
                     Daftar barang yang ditolak oleh Tahap 2 (penawaran/transaksi aktif) beserta alasannya
                   </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowDitolak(false);
                    setDitolakSearch('');
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-4 border-b border-slate-100 bg-white shrink-0">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={ditolakSearch}
                    onChange={(e) => setDitolakSearch(e.target.value)}
                    placeholder="Cari kode, nama, atau alasan ditolak…"
                    className="w-full pl-9 pr-4 h-9 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                  />
                </div>
              </div>
              <div className="overflow-y-auto custom-scrollbar flex-1 min-h-0 divide-y divide-slate-100">
                {(() => {
                  const list = data?.ditolak ?? [];
                  const q = ditolakSearch.trim().toLowerCase();
                  const filteredList = q
                    ? list.filter(
                        (d) =>
                          d.kode.toLowerCase().includes(q) ||
                          d.nama.toLowerCase().includes(q) ||
                          d.alasan.toLowerCase().includes(q)
                      )
                    : list;

                  if (list.length === 0) {
                    return (
                      <div className="py-12 text-center text-slate-400 text-xs">
                         Tidak ada data ditolak tahap 2. Generate ulang untuk memuat daftar.
                      </div>
                    );
                  }
                  if (filteredList.length === 0) {
                    return (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        Tidak ada hasil yang cocok dengan &ldquo;{ditolakSearch}&rdquo;
                      </div>
                    );
                  }
                  return filteredList.map((d) => (
                    <div key={d.kode} className="px-5 py-3 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 text-xs">
                      <div className="font-mono font-bold text-slate-700 shrink-0 w-28">{d.kode}</div>
                      <div className="text-slate-800 font-medium flex-1 min-w-0">{d.nama}</div>
                      <div className="text-amber-700 sm:flex-1 text-[11px] sm:text-xs bg-amber-50/60 sm:bg-transparent p-1.5 sm:p-0 rounded-lg sm:rounded-none">
                        {d.alasan}
                      </div>
                    </div>
                  ));
                })()}
              </div>
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowDitolak(false);
                    setDitolakSearch('');
                  }}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
         </Portal>
       )}
       {showManual && (
         <Portal>
           <div
             className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
             onClick={() => setShowManual(false)}
           >
             <div
               className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh] overflow-visible"
               onClick={(e) => e.stopPropagation()}
             >
               <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
                 <div>
                   <h3 className="text-sm font-bold text-slate-800">Tambah Usulan Manual</h3>
                   <p className="text-[11px] text-slate-500">Cari kode/nama barang, isi alasan, lalu simpan ke daftar usulan</p>
                 </div>
                 <button type="button" onClick={() => setShowManual(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all cursor-pointer">
                   <X size={16} />
                 </button>
               </div>
               <div ref={manualSearchContainerRef} className="p-5 flex flex-col gap-3 overflow-visible flex-1 min-h-0">
                 {manualError && <span className="text-[11px] font-bold text-rose-600">{manualError}</span>}
                 <div>
                   <div className="text-xs font-bold text-slate-700 mb-1.5">Kode barang</div>
                   <div className="relative">
                     <input
                       type="text"
                       value={manualKode}
                       onChange={(e) => {
                         setManualKode(e.target.value.replace(/\D/g, ''));
                         setManualSearchActiveField('kode');
                         setManualDropdownOpen(true);
                         if (manualError) setManualError('');
                       }}
                       onFocus={() => {
                         setManualSearchActiveField('kode');
                         if (manualKode.trim().length >= 2) setManualDropdownOpen(true);
                       }}
                       placeholder="Kode (angka)…"
                       className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                     />
                     {manualShowDropdown && manualSearchActiveField === 'kode' && (
                       <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-52 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                         {manualSearching && <div className="px-3 py-2 text-[11px] text-gray-400">Mencari barang…</div>}
                         {!manualSearching && manualHits.length === 0 && (
                           <div className="px-3 py-2 text-[11px] text-gray-400">Tidak ada barang yang cocok.</div>
                         )}
                         {!manualSearching && manualHits.map((item) => (
                           <button
                             key={item.kode}
                             type="button"
                             onMouseDown={(e) => {
                               e.preventDefault();
                               setManualKode(item.kode);
                               setManualNama(item.nama);
                               setManualDropdownOpen(false);
                               setManualHits([]);
                               if (manualError) setManualError('');
                             }}
                             className="w-full text-left px-3 py-2 hover:bg-emerald-50 bg-white transition-colors block"
                             title={`${item.kode} — ${item.nama}`}
                           >
                             <span className="block text-xs font-mono font-bold text-slate-700">{item.kode}</span>
                             <span className="block text-xs text-slate-600 whitespace-normal break-words leading-snug">{item.nama}</span>
                           </button>
                         ))}
                       </div>
                     )}
                   </div>
                 </div>
                 <div>
                   <div className="text-xs font-bold text-slate-700 mb-1.5">Nama barang</div>
                   <div className="relative">
                     <input
                       type="text"
                       value={manualNama}
                       onChange={(e) => {
                         setManualNama(e.target.value);
                         setManualSearchActiveField('nama');
                         setManualDropdownOpen(true);
                         if (manualError) setManualError('');
                       }}
                       onFocus={() => {
                         setManualSearchActiveField('nama');
                         if (manualNama.trim().length >= 2) setManualDropdownOpen(true);
                       }}
                       placeholder="Nama barang…"
                       className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                     />
                     {manualShowDropdown && manualSearchActiveField === 'nama' && (
                       <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-52 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                         {manualSearching && <div className="px-3 py-2 text-[11px] text-gray-400">Mencari barang…</div>}
                         {!manualSearching && manualHits.length === 0 && (
                           <div className="px-3 py-2 text-[11px] text-gray-400">Tidak ada barang yang cocok.</div>
                         )}
                         {!manualSearching && manualHits.map((item) => (
                           <button
                             key={item.kode}
                             type="button"
                             onMouseDown={(e) => {
                               e.preventDefault();
                               setManualKode(item.kode);
                               setManualNama(item.nama);
                               setManualDropdownOpen(false);
                               setManualHits([]);
                               if (manualError) setManualError('');
                             }}
                             className="w-full text-left px-3 py-2 hover:bg-emerald-50 bg-white transition-colors block"
                             title={`${item.kode} — ${item.nama}`}
                           >
                             <span className="block text-xs font-mono font-bold text-slate-700">{item.kode}</span>
                             <span className="block text-xs text-slate-600 whitespace-normal break-words leading-snug">{item.nama}</span>
                           </button>
                         ))}
                       </div>
                     )}
                   </div>
                 </div>
                 <div>
                   <div className="text-xs font-bold text-slate-700 mb-1.5">Alasan penonaktifan</div>
                   <input
                     type="text"
                     value={manualAlasan}
                     onChange={(e) => {
                       setManualAlasan(e.target.value);
                       if (manualError) setManualError('');
                     }}
                     onKeyDown={(e) => {
                       if (e.key === 'Enter') {
                         e.preventDefault();
                         handleAddManual();
                       }
                     }}
                     placeholder="Alasan penonaktifan manual…"
                     className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
                   />
                 </div>
               </div>
               <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2 shrink-0">
                 <button type="button" onClick={() => setShowManual(false)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer">
                   Batal
                 </button>
                 <button type="button" onClick={handleAddManual} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer">
                   <Plus size={14} />
                   Tambah ke usulan
                 </button>
               </div>
             </div>
           </div>
         </Portal>
       )}

       {rekapOpen && (
         <Portal>
           <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          >
            <div
              className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh] h-[88vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
               {/* Header Modal */}
               <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
                 <div>
                   <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                     <span>Rekap Koreksi Reviewer</span>
                     {pendingRekapCount > 0 && (
                       <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                         {pendingRekapCount} Belum Diputuskan
                       </span>
                     )}
                   </h3>
                   <p className="text-[11px] text-slate-500 mt-0.5">
                     {rekap.length} total usulan {rekapAt ? `• diperbarui ${formatLastUpdate(rekapAt)}` : ''} • auto-refresh tiap 20 detik
                   </p>
                 </div>
                 <div className="flex items-center gap-2">
                   <button
                     type="button"
                     onClick={() => setRekapOpen(false)}
                     className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all cursor-pointer"
                   >
                     <X size={16} />
                   </button>
                 </div>
               </div>

               {/* Action Bar Modal */}
               <div className="px-5 py-2.5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap shrink-0">
                 <div className="flex items-center gap-3">
                   <button
                     type="button"
                     onClick={() => {
                       if (selectedRekapIds.size === rekap.length && rekap.length > 0) {
                         setSelectedRekapIds(new Set());
                       } else {
                         setSelectedRekapIds(new Set(rekap.map((x) => x.id)));
                       }
                     }}
                     className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-emerald-700 cursor-pointer"
                   >
                     {selectedRekapIds.size === rekap.length && rekap.length > 0 ? (
                       <CheckSquare size={15} className="text-emerald-600" />
                     ) : (
                       <Square size={15} className="text-slate-400" />
                     )}
                     <span>Pilih Semua ({rekap.length})</span>
                   </button>

                   {selectedRekapIds.size > 0 && (
                     <div className="flex items-center gap-2 pl-3 border-l border-slate-200 animate-in fade-in duration-150">
                       <button
                         type="button"
                         onClick={() => decideBatch(Array.from(selectedRekapIds), 'setuju')}
                         className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                       >
                         <Check size={13} />
                         <span>Setujui ({selectedRekapIds.size}) Terpilih</span>
                       </button>
                       <button
                         type="button"
                        onClick={() => decideBatch(Array.from(selectedRekapIds), 'tolak')}
                        className="px-3 py-1 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <X size={13} />
                        <span>Tolak ({selectedRekapIds.size}) Terpilih</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {shareToken && (
                    <button
                      type="button"
                      onClick={() => loadRekap(shareToken)}
                      className="h-8 w-8 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-emerald-700 rounded-xl flex items-center justify-center transition-colors cursor-pointer shadow-sm shrink-0"
                      title="Muat ulang rekap review"
                    >
                      <RefreshCw size={13} />
                    </button>
                  )}
                  <div className="relative w-48 sm:w-72">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchRekap}
                      onChange={(e) => setSearchRekap(e.target.value)}
                      placeholder="Cari kode, nama, alasan…"
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                    />
                  </div>

                   {pendingRekapCount > 0 && (
                     <button
                       type="button"
                       onClick={() => {
                         const pendingIds = rekap.filter((x) => !x.keputusan || x.keputusan === 'pending').map((x) => x.id);
                         decideBatch(pendingIds, 'setuju');
                       }}
                       className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-900/10 cursor-pointer transition-all shrink-0"
                     >
                       <Check size={14} />
                       <span>Setujui Semua ({pendingRekapCount})</span>
                     </button>
                   )}
                 </div>
               </div>

               {/* Daftar Item Rekap */}
               <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar divide-y divide-slate-100 p-2">
                 {filteredRekap.map((item) => {
                   const isSelected = selectedRekapIds.has(item.id);
                   const isPending = !item.keputusan || item.keputusan === 'pending';
                   return (
                    <div
                      key={item.id}
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.closest('input, button')) return;
                        toggleSelectRekap(item.id, e, false);
                      }}
                      className={`p-3 rounded-xl flex items-start gap-3 text-xs transition-colors cursor-pointer select-none ${
                        isSelected
                          ? 'bg-emerald-50/60 ring-1 ring-emerald-300 shadow-xs'
                          : 'hover:bg-slate-50/80'
                      }`}
                    >
                       <input
                         type="checkbox"
                         checked={isSelected}
                         onChange={() => {}}
                         onClick={(e) => {
                           e.stopPropagation();
                           toggleSelectRekap(item.id, e, true);
                         }}
                         className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500/20 border-slate-300 cursor-pointer shrink-0"
                         title="Centang untuk menambah pilihan"
                       />

                       <span
                         className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 mt-0.5 ${
                           item.aksi === 'usul_hapus'
                             ? 'bg-amber-100 text-amber-800 border border-amber-200'
                             : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                         }`}
                       >
                         {item.aksi === 'usul_hapus' ? 'Usul Hapus' : 'Usul Tambah'}
                       </span>

                       <span className="font-mono font-bold text-slate-800 shrink-0 w-24 mt-0.5">{item.kode}</span>

                       {/* Nama Barang Utuh (Tanpa Truncate) */}
                       <div className="flex-1 min-w-0 pr-2">
                         <span className="block text-slate-800 font-semibold text-xs leading-snug whitespace-normal break-words">
                           {item.nama || '—'}
                         </span>
                         {item.alasan && (
                           <span className="block text-[11px] text-slate-500 italic mt-0.5 whitespace-normal break-words">
                             "{item.alasan}"
                           </span>
                         )}
                       </div>

                       <div className="text-[11px] text-slate-400 shrink-0 mt-0.5">
                         oleh <b className="text-slate-600">{item.reviewer || 'reviewer'}</b>
                       </div>

                       {/* Action Buttons or Status Badge */}
                       <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                         {isPending ? (
                           <>
                             <button
                               type="button"
                               onClick={() => decide(item.id, 'setuju', item)}
                               className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                               title="Setujui usulan ini"
                             >
                               <Check size={11} />
                               <span>Setuju</span>
                             </button>
                             <button
                               type="button"
                               onClick={() => decide(item.id, 'tolak', item)}
                               className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-600 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                               title="Tolak usulan ini"
                             >
                               <X size={11} />
                               <span>Tolak</span>
                             </button>
                           </>
                         ) : (
                           <span
                             className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                               item.keputusan === 'setuju'
                                 ? 'bg-emerald-100 text-emerald-700'
                                 : 'bg-slate-100 text-slate-400 line-through'
                             }`}
                           >
                             {item.keputusan === 'setuju' && <Check size={11} />}
                             {item.keputusan}
                           </span>
                         )}
                       </div>
                     </div>
                   );
                 })}
                 {filteredRekap.length === 0 && (
                   <div className="py-12 text-center text-xs text-slate-400">
                     {rekap.length === 0
                       ? 'Belum ada usulan koreksi yang masuk dari reviewer.'
                       : 'Tidak ada usulan koreksi yang cocok dengan pencarian.'}
                   </div>
                 )}
               </div>
             </div>
           </div>
         </Portal>
       )}
      <ConfirmDialog
        isOpen={dialog.isOpen}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        onConfirm={() => setDialog({ ...dialog, isOpen: false })}
      />
    </div>
  );
}
