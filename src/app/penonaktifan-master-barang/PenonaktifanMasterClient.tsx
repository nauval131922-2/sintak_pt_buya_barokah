'use client';

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download, Loader2, Play, AlertCircle, Settings2, X, Plus, Trash2, Save, RefreshCw, Share2, Check, ThumbsUp, ThumbsDown, Search } from 'lucide-react';
import Portal from '@/components/Portal';
import TableFooter from '@/components/TableFooter';
import ConfirmDialog from '@/components/ConfirmDialog';
import { DataTable } from '@/components/ui/DataTable';
import DatePicker from '@/components/DatePicker';
import { useTableSelection } from '@/lib/hooks/useTableSelection';
import { highlightText } from '@/lib/highlight';
import { formatLastUpdate } from '@/lib/date-utils';

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
  B_BATAL: 'B — Penawaran Batal',
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
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [dialog, setDialog] = useState({ isOpen: false, type: 'success' as 'success' | 'error', title: '', message: '' });
  const urlSearchRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const [showSettings, setShowSettings] = useState(false);
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
   const [sharing, setSharing] = useState(false);
   const [shareToken, setShareToken] = useState<string | null>(() => (typeof window !== 'undefined' ? localStorage.getItem('penonaktifan_shareToken') : null));
   const [rekap, setRekap] = useState<Array<{ id: number; kode: string; nama: string; aksi: string; alasan: string; reviewer: string; keputusan: string }>>([]);
   const [rekapOpen, setRekapOpen] = useState(false);
   const [rekapAt, setRekapAt] = useState<string | null>(null);
  const [manualKode, setManualKode] = useState('');
  const [manualNama, setManualNama] = useState('');
  const [manualAlasan, setManualAlasan] = useState('');
  const [manualError, setManualError] = useState('');
  const [manualHits, setManualHits] = useState<Array<{ kode: string; nama: string }>>([]);
  const [manualSearching, setManualSearching] = useState(false);
  const [manualDropdownOpen, setManualDropdownOpen] = useState(false);
  const [manualSearchActiveField, setManualSearchActiveField] = useState<'kode' | 'nama' | null>(null);
   const manualSearchContainerRef = useRef<HTMLDivElement>(null);
   const [manualDropPos, setManualDropPos] = useState<{ left: number; top: number; width: number } | null>(null);

   // Posisikan dropdown manual via Portal — lolos dari parent overflow-hidden + thead sticky z-[40].
   useEffect(() => {
     if (!manualDropdownOpen) { setManualDropPos(null); return; }
     const place = () => {
       const el = manualSearchContainerRef.current;
       if (!el) return;
       const r = el.getBoundingClientRect();
       setManualDropPos({ left: r.left, top: r.bottom + 6, width: Math.min(r.width, 480) });
     };
     place();
     window.addEventListener('resize', place);
     window.addEventListener('scroll', place, true);
     return () => {
       window.removeEventListener('resize', place);
       window.removeEventListener('scroll', place, true);
     };
   }, [manualDropdownOpen]);

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

   useEffect(() => {
     setIsMounted(true);
     mountedRef.current = true;
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
 
   // Polling rekap tiap 30 detik saat panel terbuka — putaran bolak-balik tanpa aksi user.
   useEffect(() => {
     if (!rekapOpen || !shareToken) return;
     loadRekap(shareToken);
     const t = setInterval(() => loadRekap(shareToken), 30000);
     return () => clearInterval(t);
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [rekapOpen, shareToken]);

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
       const res = await fetch(`/api/penonaktifan-master-barang?cutoff=${cutoff}&limit=5000&includeDitolak=1`);
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
 
  const handleSyncAll = useCallback(async () => {
    const yearStart = `${cutoff.slice(0, 4)}-01-01`;
    const endPlus7 = addDaysIso(cutoff, 7);
    const steps = [
      { label: 'Saldo barang', url: `/api/scrape-saldo-barang?tgl=${cutoff}` },
      { label: 'Master barang', url: `/api/scrape-master-barang` },
      { label: 'Order Produksi', url: `/api/scrape-orders?start=${yearStart}&end=${endPlus7}&silent=true` },
      { label: 'Hasil produksi', url: `/api/scrape-barang-jadi?start=${yearStart}&end=${endPlus7}&silent=true` },
      { label: 'SPH Keluar', url: `/api/scrape-sph-out?start=${yearStart}&end=${endPlus7}&silent=true` },
      { label: 'BOM', url: `/api/scrape-bom?start=${yearStart}&end=${endPlus7}&silent=true` },
      { label: 'Sales Order', url: `/api/scrape-sales-orders?start=${yearStart}&end=${endPlus7}&silent=true` },
      { label: 'Log aktivitas', url: `/api/scrape-usr-log?stgl_awal=${isoToDdMmYyyy(yearStart)}&stgl_akhir=${isoToDdMmYyyy(endPlus7)}` },
    ];
    const total = steps.length + 1;
    setSyncing(true);
    setLoading(true);
    setError('');
    const history: { label: string; secs: number }[] = [];
    const syncStart = performance.now();
    try {
      for (let i = 0; i < steps.length; i++) {
        if (!mountedRef.current) return;
        setSyncProgress({ done: i, total, label: steps[i].label, elapsed: (performance.now() - syncStart) / 1000, history: [...history] });
        const stepStart = performance.now();
        const res = await fetch(steps[i].url);
        const json = await res.json().catch(() => ({})) as { success?: boolean; error?: string; details?: string };
        if (!res.ok || json.success === false || json.error) {
          throw new Error(`Tahap ${i + 1}/${total} (${steps[i].label}) gagal: ${json.error || json.details || `HTTP ${res.status}`}`);
        }
        history.push({ label: steps[i].label, secs: Math.round(((performance.now() - stepStart) / 1000) * 10) / 10 });
      }
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
      const totalSecs = Math.round((performance.now() - syncStart) / 1000);
      const rincian = history.map((h) => `${h.label}: ${h.secs}s`).join(' • ');
      setDialog({ isOpen: true, type: 'success', title: 'Berhasil', message: `Semua data Digit ditarik (${steps.length} tahap, total ${totalSecs}s) dan usulan cutoff ${cutoff} digenerate ulang. Rincian: ${rincian}.` });
    } catch (e) {
      if (mountedRef.current) setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (mountedRef.current) { setSyncing(false); setLoading(false); setSyncProgress(null); }
    }
  }, [cutoff, handleGenerate]);

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

   const decide = async (id: number, keputusan: 'setuju' | 'tolak', item: { kode: string; aksi: string }) => {
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
         }
       }
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
       setDialog({ isOpen: true, type: 'success', title: 'Tersimpan', message: 'Pengaturan penonaktifan berhasil disimpan. Menghitung ulang usulan…' });
       await handleGenerate();
     } catch (e) {
       setError(e instanceof Error ? e.message : String(e));
     } finally {
       setSettingsSaving(false);
     }
   };

  const filtered = useMemo(() => {
    const s = debouncedQuery.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => r.kode.toLowerCase().includes(s) || r.nama.toLowerCase().includes(s));
  }, [rows, debouncedQuery]);

  const columns = useMemo(() => [
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
      size: 400,
      cell: ({ getValue, row }: any) => <span className={`text-[12px] block truncate ${row.getIsSelected() ? 'text-emerald-700' : 'text-gray-600'}`} title={String(getValue())}>{highlightText(String(getValue()), highlightQuery)}</span>
    },
  ], [highlightQuery]);

  if (!isMounted) return null;

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
                {(lastGenerate || lastSyncAll) && <span className="text-[10px] font-semibold text-gray-300 leading-none">{lastGenerate ? `Generate: ${formatLastUpdate(lastGenerate.split('|')[0])}` : ''}{lastGenerate && lastSyncAll ? ' • ' : ''}{lastSyncAll ? `Sync: ${formatLastUpdate(lastSyncAll.split('|')[0])}` : ''}</span>}
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
                   onClick={handleSyncAll}
                   disabled={syncing || loading}
                   title="Tarik semua data Digit (saldo, master, transaksi, log) lalu generate ulang"
                   className="shrink-0 px-5 py-2.5 bg-white border border-gray-100 rounded-xl text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 text-[12px] font-bold shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
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
                    title="Lihat daftar kode yang ditolak pilar 2 + alasannya"
                    className="shrink-0 px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-[12px] font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <span>Ditolak Pilar 2</span>
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
                    const next = !rekapOpen;
                    setRekapOpen(next);
                    if (next && shareToken) loadRekap(shareToken);
                  }}
                  title={rekapOpen ? 'Tutup panel rekap koreksi' : 'Buka panel rekap koreksi review'}
                  className={`shrink-0 px-4 py-2.5 bg-white border rounded-xl text-[12px] font-bold shadow-sm flex items-center justify-center gap-2 transition-all ${
                    rekapOpen
                      ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50'
                      : 'border-gray-100 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50'
                  }`}
                >
                  Rekap koreksi {rekap.length > 0 ? `(${rekap.length})` : ''}
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
             {data && (
               <div className="w-full sm:w-auto sm:min-w-[280px] flex items-center gap-2 bg-white border border-slate-300 rounded-xl px-2 py-1.5 shadow-sm ring-1 ring-slate-200/60 focus-within:ring-2 focus-within:ring-emerald-500/25 focus-within:border-emerald-500 transition-all">
                   <button
                     type="button"
                     onClick={handleGenerate}
                     disabled={loading}
                     className="h-8 w-8 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all flex items-center justify-center shrink-0 disabled:opacity-50 cursor-pointer shadow-sm"
                     title="Reload data usulan"
                   >
                     <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                   </button>
                 <div className="relative flex-1 min-w-0">
                   <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                   <input
                     type="text"
                     placeholder="Cari kode / nama…"
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full pl-8 pr-3 h-8 text-xs font-semibold bg-transparent border-0 text-slate-800 placeholder-slate-500 focus:outline-none"
                   />
                 </div>
               </div>
             )}
          </div>
        </div>

        {data && (
          <>

            {rekapOpen && (
              <div className="shrink-0 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                   <div className="flex items-center gap-2">
                     <span className="text-xs font-bold text-slate-800">Rekap Koreksi Review</span>
                     <span className="text-[11px] text-slate-400">({rekap.length} usulan masuk{rekapAt ? ` • ${formatLastUpdate(rekapAt)}` : ''} • auto 30 dtk)</span>
                   </div>
                  <div className="flex items-center gap-2">
                    {shareToken && (
                      <button
                        type="button"
                        onClick={() => loadRekap(shareToken)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                        title={`Muat ulang rekap dari token: ${shareToken}`}
                      >
                        <RefreshCw size={13} />
                        Muat rekap
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setRekapOpen(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>

                {!shareToken && rekap.length === 0 && (
                  <p className="text-xs text-slate-400">
                    Belum ada sesi share. Klik tombol <b>Bagikan</b> terlebih dahulu untuk membuat link review.
                  </p>
                )}

                {shareToken && rekap.length === 0 && (
                  <div className="flex items-center justify-between text-xs text-slate-500 py-1">
                    <span>Belum ada usulan dari reviewer atau belum dimuat.</span>
                    <button
                      type="button"
                      onClick={() => loadRekap(shareToken)}
                      className="text-emerald-600 font-bold hover:underline"
                    >
                      Muat sekarang
                    </button>
                  </div>
                )}

                {rekap.length > 0 && (
                  <div className="max-h-56 overflow-y-auto custom-scrollbar divide-y divide-slate-100 border border-slate-100 rounded-xl">
                    {rekap.map((item) => (
                      <div key={item.id} className="p-2.5 flex items-center justify-between gap-3 text-xs hover:bg-slate-50/60">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              item.aksi === 'usul_hapus'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {item.aksi === 'usul_hapus' ? 'Usul Hapus' : 'Usul Tambah'}
                          </span>
                          <span className="font-mono font-bold text-slate-700 shrink-0">{item.kode}</span>
                          <span className="text-slate-600 truncate max-w-[200px]" title={item.nama || item.kode}>
                            {item.nama || '—'}
                          </span>
                          <span className="text-slate-400 truncate flex-1" title={item.alasan}>
                            “{item.alasan}”
                          </span>
                          <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                            oleh {item.reviewer || 'reviewer'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.keputusan === 'pending' || !item.keputusan ? (
                            <>
                              <button
                                type="button"
                                onClick={() => decide(item.id, 'setuju', item)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                                title="Setujui usulan"
                              >
                                <ThumbsUp size={12} />
                                Setuju
                              </button>
                              <button
                                type="button"
                                onClick={() => decide(item.id, 'tolak', item)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                                title="Tolak usulan"
                              >
                                <ThumbsDown size={12} />
                                Tolak
                              </button>
                            </>
                          ) : (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                                item.keputusan === 'setuju'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-100 text-slate-500 line-through'
                              }`}
                            >
                              {item.keputusan === 'setuju' && <Check size={11} />}
                              {item.keputusan}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

             <div className="shrink-0 bg-white border border-slate-200 rounded-2xl p-3 shadow-sm flex flex-col gap-2 relative z-50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Tambah Usulan Manual</span>
                {manualError && <span className="text-[11px] font-bold text-rose-600">{manualError}</span>}
              </div>
              <div ref={manualSearchContainerRef} className="relative">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-32 shrink-0">
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
                      className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex-1 min-w-[180px]">
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
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex-[2] min-w-[200px]">
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
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddManual}
                    className="shrink-0 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Plus size={14} />
                    Tambah manual
                  </button>
                </div>

                 {manualDropdownOpen && manualDropPos && (manualSearchActiveField === 'kode' ? manualKode.trim().length >= 2 : manualNama.trim().length >= 2) && (
                   <Portal>
                     <div
                       className="fixed bg-white border border-slate-200 rounded-xl shadow-xl z-[9999] max-h-52 overflow-y-auto divide-y divide-slate-100"
                       style={{ left: manualDropPos.left, top: manualDropPos.top, width: manualDropPos.width }}
                     >
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
                   </Portal>
                 )}
               </div>
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
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowSettings(false)}>
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
                     <div className="text-xs font-bold text-slate-700 mb-1.5">Batas idle penawaran batal (hari)</div>
                     <input value={idleInput} onChange={(e) => setIdleInput(e.target.value.replace(/\D/g, ''))} inputMode="numeric" className="px-3 py-2 w-28 text-xs tabular-nums bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all" />
                     <p className="text-[11px] text-slate-400 mt-1">Penawaran yang umurnya di bawah ini tidak diusulkan.</p>
                   </div>
                   <button onClick={handleSaveSettings} disabled={settingsSaving} className="w-full flex items-center justify-center gap-2 px-5 h-10 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold rounded-xl transition-colors shadow-sm disabled:opacity-60">
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
                    Ditolak Pilar 2 {data ? `(${data.ditolak?.length ?? data.ditolakCount})` : ''}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Daftar barang yang ditolak oleh Pilar 2 (penawaran/transaksi aktif) beserta alasannya
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
                        Tidak ada data ditolak pilar 2. Generate ulang untuk memuat daftar.
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
