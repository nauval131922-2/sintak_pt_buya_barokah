'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Loader2, X, AlertCircle, Sparkles,
  Save, Info, Plus, SkipForward, CheckCircle2, RefreshCw
} from 'lucide-react';
import Portal from './Portal';
import { toast } from '@/lib/toast';
import DraftRowItem from './DraftRowItem';

interface DraftRow {
  _draftId: string;
  _alasan?: string;
  _feedbackReason?: string;
  _sourceType?: 'pola_historis' | 'order_aktif' | 'fallback';
  posisi: number;
  absensi: number;
  shift: string;
  nama_karyawan: string;
  no_order: string;
  nama_order: string;
  jenis_pekerjaan: string;
  keterangan: string;
  target: number | null;
  bagian: string;
  is_manual_input: number;
  nama_order_manual: string;
  nama_order_manual_2: string;
}

interface AutoGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetDate: string;
  employees: { name: string }[];
  onSaved: () => void;
}

function formatIndoDate(dateStr: string) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const HARI = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
  const dt = new Date(Number(y), Number(m) - 1, Number(d));
  return `${HARI[dt.getDay()]}, ${d} ${BULAN[Number(m) - 1]} ${y}`;
}

function isFriday(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  return new Date(Number(y), Number(m) - 1, Number(d)).getDay() === 5;
}

function getNextDay(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  const dt = new Date(Number(y), Number(m) - 1, Number(d));
  dt.setDate(dt.getDate() + 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

const SHIFT_OPTIONS = [
  { label: '1', value: '1', key: '1' },
  { label: '2', value: '2', key: '2' },
  { label: '3', value: '3', key: '3' },
];

function ScrapeProgressRow({
  label, status, total, totalLabel,
}: {
  label: string;
  status: 'idle' | 'loading' | 'done' | 'error';
  total: number | null;
  totalLabel: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-bold text-gray-600">{label}</span>
        <span className="text-[11px] font-bold">
          {status === 'loading' && <span className="text-emerald-600 flex items-center gap-1"><Loader2 size={11} className="animate-spin" /> Mengambil...</span>}
          {status === 'done' && <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={11} /> {total !== null ? `${total.toLocaleString('id-ID')} ${totalLabel}` : 'Selesai'}</span>}
          {status === 'error' && <span className="text-rose-500 flex items-center gap-1"><AlertCircle size={11} /> Gagal (data lama dipakai)</span>}
          {status === 'idle' && <span className="text-gray-400">Menunggu...</span>}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            status === 'loading' ? 'w-1/2 bg-emerald-400 animate-pulse' :
            status === 'done' ? 'w-full bg-emerald-500' :
            status === 'error' ? 'w-full bg-rose-400' : 'w-0'
          }`}
        />
      </div>
    </div>
  );
}


export default function AutoGenerateModal({
  isOpen, onClose, targetDate, employees, onSaved,
}: AutoGenerateModalProps) {
  // Phase: 'scrape' = progress bar scraping, 'draft' = tabel draft
  const [phase, setPhase] = useState<'scrape' | 'draft'>('scrape');

  // State scraping
  const [scrapeOrders, setScrapeOrders] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [scrapeBarangJadi, setScrapeBarangJadi] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [scrapeAnalysis, setScrapeAnalysis] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [scrapeOrdersTotal, setScrapeOrdersTotal] = useState<number | null>(null);
  const [scrapeBarangJadiTotal, setScrapeBarangJadiTotal] = useState<number | null>(null);
  const [scrapeError, setScrapeError] = useState('');

  // State draft
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<DraftRow[]>([]);
  const [sourceDate, setSourceDate] = useState<string | null>(null);
  const [resolvedDate, setResolvedDate] = useState<string | null>(null);
  const [generateMode, setGenerateMode] = useState<'historis' | 'fallback' | null>(null);
  const [generateMeta, setGenerateMeta] = useState<{ karyawanAktif: number; orderAktif: number; windowHari: number } | null>(null);
  const [error, setError] = useState('');
  const [fridayChoice, setFridayChoice] = useState<'friday' | 'saturday'>('friday');
  const [append, setAppend] = useState(false);
  const [appendConfirm, setAppendConfirm] = useState(false);
  const [pekerjaanOptions, setPekerjaanOptions] = useState<{ label: string; value: string; key: string }[]>([]);
  const [orderOptions, setOrderOptions] = useState<{ label: string; value: string; key: string; meta: { nama_order: string } }[]>([]);

  const isTargetFriday = useMemo(() => isFriday(targetDate), [targetDate]);

  const effectiveDate = useMemo(() => {
    if (isTargetFriday && fridayChoice === 'saturday') {
      return getNextDay(targetDate);
    }
    return targetDate;
  }, [targetDate, isTargetFriday, fridayChoice]);

  // Opsi-opsi dropdown — stabil, tidak berubah kecuali data berubah
  const karyawanOptions = useMemo(() =>
    [...new Set(employees.map(e => e.name).filter(Boolean).map(String))].map(name => ({ label: name, value: name, key: name })),
    [employees]
  );


  const [bagianOptions, setBagianOptions] = useState<{ label: string; value: string; key: string }[]>([]);

  // Bangun snapshot bagianOptions dari array rows
  const buildBagianOptions = useCallback((sourceRows: typeof rows) => {
    const ORDER = ['SETTING', 'QC', 'CETAK', 'FINISHING', 'GUDANG', 'TEKNISI'];
    const seen = new Set<string>();
    return sourceRows
      .filter(r => r.bagian)
      .filter(r => {
        if (seen.has(r.bagian)) return false;
        seen.add(r.bagian);
        return true;
      })
      .sort((a, b) => {
        const ia = ORDER.indexOf(a.bagian);
        const ib = ORDER.indexOf(b.bagian);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      })
      .map(r => ({ label: r.bagian, value: r.bagian, key: r.bagian }));
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/master-pekerjaan-jurnal-produksi?limit=9999')
      .then(r => r.json())
      .then(res => {
        if (res.success && Array.isArray(res.data)) {
          setPekerjaanOptions(res.data.map((p: any) => ({ label: p.name, value: p.name, key: String(p.id) })));
        }
      })
      .catch(() => {});
  }, [isOpen]);

  // Bangun snapshot orderOptions dari array rows — urutan stabil, tidak berubah saat user mengedit field lain
  const buildOrderOptions = useCallback((sourceRows: typeof rows) => {
    const seen = new Set<string>();
    return sourceRows
      .filter(r => r.no_order)
      .filter(r => {
        if (seen.has(r.no_order)) return false;
        seen.add(r.no_order);
        return true;
      })
      .map(r => ({ label: r.nama_order ? `${r.no_order} — ${r.nama_order}` : r.no_order, value: r.no_order, key: r.no_order, meta: { nama_order: r.nama_order ?? '' } }));
  }, []);

  const fetchDraft = useCallback(async (
    onDone?: () => void,
    onError?: () => void,
  ) => {
    setLoading(true);
    setError('');
    setRows([]);
    setOrderOptions([]);
    setBagianOptions([]);
    setSourceDate(null);
    setResolvedDate(null);
    setGenerateMode(null);
    setGenerateMeta(null);
    setAppend(false);
    setAppendConfirm(false);
    try {
      const res = await fetch(
        `/api/jurnal-harian-produksi/auto-generate/draft?date=${effectiveDate}`
      );
      const result = await res.json();
      if (result.success) {
        if (result.data.length === 0) {
          setError('Tidak ada data jadwal dari 7 hari terakhir untuk dijadikan referensi.');
          onError?.();
        } else {
          setRows(result.data);
          setOrderOptions(buildOrderOptions(result.data));
          setBagianOptions(buildBagianOptions(result.data));
          setSourceDate(result.sourceDate ?? null);
          setResolvedDate(result.resolvedDate ?? null);
          setGenerateMode(result.mode ?? null);
          setGenerateMeta(result.meta ?? null);
          onDone?.();
        }
      } else {
        setError(result.error || 'Gagal mengambil draft.');
        onError?.();
      }
    } catch (err: any) {
      setError(err.message);
      onError?.();
    } finally {
      setLoading(false);
    }
  }, [effectiveDate, buildOrderOptions, buildBagianOptions]);

  // Reset semua state saat modal dibuka, mulai dari fase scraping
  useEffect(() => {
    if (isOpen) {
      setPhase('scrape');
      setScrapeOrders('idle');
      setScrapeBarangJadi('idle');
      setScrapeAnalysis('idle');
      setScrapeOrdersTotal(null);
      setScrapeBarangJadiTotal(null);
      setScrapeError('');
      runScraping();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const getFirstDayOfMonth = useCallback(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  }, []);

  const getTodayStr = useCallback(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  const runScraping = useCallback(async () => {
    const start = getFirstDayOfMonth();
    const end = getTodayStr();

    setScrapeOrders('loading');
    setScrapeBarangJadi('loading');
    setScrapeAnalysis('idle');
    setScrapeError('');

    const scrapeOne = async (
      url: string,
      setStatus: (s: 'idle' | 'loading' | 'done' | 'error') => void,
      setTotal: (n: number) => void,
    ) => {
      try {
        const res = await fetch(url);
        const json = await res.json();
        if (res.ok && json.success !== false) {
          setTotal(json.total ?? 0);
          setStatus('done');
        } else {
          setStatus('error');
        }
      } catch {
        setStatus('error');
      }
    };

    await Promise.all([
      scrapeOne(
        `/api/scrape-orders?start=${start}&end=${end}&metaStart=${start}&metaEnd=${end}`,
        setScrapeOrders,
        setScrapeOrdersTotal,
      ),
      scrapeOne(
        `/api/scrape-barang-jadi?start=${start}&end=${end}&metaStart=${start}&metaEnd=${end}`,
        setScrapeBarangJadi,
        setScrapeBarangJadiTotal,
      ),
    ]);

    // Fase analisis
    setScrapeAnalysis('loading');
    await fetchDraft(
      () => setScrapeAnalysis('done'),
      () => setScrapeAnalysis('error'),
    );

    setPhase('draft');
  }, [getFirstDayOfMonth, getTodayStr, fetchDraft]);  

  const handleSkipScrape = useCallback(async () => {
    setScrapeOrders('done');
    setScrapeBarangJadi('done');
    setScrapeAnalysis('loading');
    await fetchDraft(
      () => setScrapeAnalysis('done'),
      () => setScrapeAnalysis('error'),
    );
    setPhase('draft');
  }, [fetchDraft]);

  const updateRow = useCallback((draftId: string, field: string, value: any) => {
    setRows(prev => prev.map(r =>
      r._draftId === draftId ? { ...r, [field]: value } : r
    ));
  }, []);

  const addRow = useCallback(() => {
    setRows(prev => [...prev, {
      _draftId: crypto.randomUUID(),
      _sourceType: 'pola_historis' as const,
      _alasan: 'Ditambahkan manual',
      posisi: 0,
      absensi: 0,
      shift: '1',
      nama_karyawan: '',
      no_order: '',
      nama_order: '',
      jenis_pekerjaan: '',
      keterangan: '',
      target: null,
      bagian: '',
      is_manual_input: 1,
      nama_order_manual: '',
      nama_order_manual_2: '',
    }]);
  }, []);

  const removeRow = useCallback((draftId: string) => {
    setRows(prev => prev.filter(r => r._draftId !== draftId));
  }, []);

  const insertRow = useCallback((index: number) => {
    setRows(prev => {
      const next = [...prev];
      next.splice(index + 1, 0, {
        _draftId: crypto.randomUUID(),
        _sourceType: 'pola_historis' as const,
        _alasan: 'Disisipkan manual',
        posisi: 0,
        absensi: 0,
        shift: '1',
        nama_karyawan: '',
        no_order: '',
        nama_order: '',
        jenis_pekerjaan: '',
        keterangan: '',
        target: null,
        bagian: '',
        is_manual_input: 1,
        nama_order_manual: '',
        nama_order_manual_2: '',
      });
      return next;
    });
  }, []);

  // ── Rekap order & pekerjaan — update otomatis saat rows berubah
  const rekapOrder = useMemo(() => {
    const map = new Map<string, { nama_order: string; karyawan: Set<string>; bagian: Set<string> }>();
    for (const r of rows) {
      if (!r.no_order) continue;
      if (!map.has(r.no_order)) {
        map.set(r.no_order, { nama_order: r.nama_order ?? '', karyawan: new Set(), bagian: new Set() });
      }
      const entry = map.get(r.no_order)!;
      if (r.nama_karyawan) entry.karyawan.add(r.nama_karyawan);
      if (r.bagian) entry.bagian.add(r.bagian);
    }
    return [...map.entries()].map(([no_order, v]) => ({ no_order, ...v }));
  }, [rows]);

  const rekapPekerjaan = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) {
      if (!r.jenis_pekerjaan) continue;
      map.set(r.jenis_pekerjaan, (map.get(r.jenis_pekerjaan) ?? 0) + 1);
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([pekerjaan, jumlah]) => ({ pekerjaan, jumlah }));
  }, [rows]);

  const handleSave = async () => {
    if (rows.length === 0) return;
    setSaving(true);
    setError('');
    // Gunakan resolvedDate (tanggal kosong yang dideteksi server), fallback ke effectiveDate
    const saveDate = resolvedDate ?? effectiveDate;
    try {
      const res = await fetch('/api/jurnal-harian-produksi/auto-generate/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: saveDate,
          sourceDate,
          rows: rows.map(r => ({
            ...r,
            alasan_koreksi: r._feedbackReason || null,
          })),
          append: append,
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success(`Berhasil menyimpan ${result.count} baris jadwal.`);
        onSaved();
        onClose();
      } else if (result.code === 'EXISTS') {
        setAppendConfirm(true);
        setError(result.error);
      } else {
        setError(result.error || 'Gagal menyimpan.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[1400px] max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Sparkles size={20} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-800 tracking-tight">Generate Jadwal Produksi</h2>
                <p className="text-[13px] font-bold text-gray-400">
                  {loading
                    ? 'Mendeteksi hari pertama yang belum ada jadwal...'
                    : resolvedDate
                    ? formatIndoDate(resolvedDate)
                    : formatIndoDate(effectiveDate)
                  }
                  {!loading && resolvedDate && resolvedDate !== effectiveDate && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-50 text-blue-600 text-[11px] rounded-lg">
                      {effectiveDate} sudah ada data, digeser ke sini
                    </span>
                  )}
                  {isTargetFriday && fridayChoice === 'saturday' && (
                    <span className="ml-2 text-amber-500">(Jumat dilewati)</span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={saving}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all disabled:opacity-50"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-auto px-6 py-4 min-h-[300px]">
            {/* ── FASE SCRAPING ── */}
            {phase === 'scrape' && (
              <div className="flex flex-col items-center justify-center min-h-[300px] gap-6">
                <div className="w-full max-w-sm flex flex-col gap-4">
                  <p className="text-[13px] font-black text-gray-600 text-center">
                    Memperbarui data order &amp; penerimaan barang...
                  </p>

                  {/* Progress bar Orders */}
                  <ScrapeProgressRow
                    label="Order Produksi"
                    status={scrapeOrders}
                    total={scrapeOrdersTotal}
                    totalLabel="order"
                  />

                  {/* Progress bar Barang Jadi */}
                  <ScrapeProgressRow
                    label="Penerimaan Barang Hasil Produksi"
                    status={scrapeBarangJadi}
                    total={scrapeBarangJadiTotal}
                    totalLabel="baris"
                  />

                  {/* Progress bar Analisis */}
                  <ScrapeProgressRow
                    label="Analisis pola historis"
                    status={scrapeAnalysis}
                    total={null}
                    totalLabel=""
                  />
                  {scrapeError && (
                    <p className="text-[11px] font-bold text-rose-500 text-center">{scrapeError}</p>
                  )}

                  <button
                    type="button"
                    onClick={handleSkipScrape}
                    disabled={scrapeAnalysis !== 'idle'}
                    className="flex items-center justify-center gap-2 mt-2 mx-auto px-5 h-9 text-[12px] font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <SkipForward size={14} />
                    Lewati, gunakan data yang ada
                  </button>
                </div>
              </div>
            )}

            {/* ── FASE DRAFT ── */}
            {phase === 'draft' && (
              <>
            {isTargetFriday && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-amber-700 mb-2">
                    {formatIndoDate(targetDate)} adalah hari Jumat (libur).
                  </p>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="fridayChoice"
                        value="friday"
                        checked={fridayChoice === 'friday'}
                        onChange={() => setFridayChoice('friday')}
                        className="accent-amber-600"
                      />
                      <span className="text-[12px] font-bold text-amber-700">Generate untuk Jumat (lembur)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="fridayChoice"
                        value="saturday"
                        checked={fridayChoice === 'saturday'}
                        onChange={() => setFridayChoice('saturday')}
                        className="accent-emerald-600"
                      />
                      <span className="text-[12px] font-bold text-emerald-700">Generate untuk Sabtu (lewati Jumat)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Append Warning */}
            {appendConfirm && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-bold text-blue-700">
                    Tanggal {effectiveDate} sudah memiliki data. Apakah Anda ingin menambahkan data baru?
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => { setAppend(true); setAppendConfirm(false); setError(''); }}
                      className="px-4 h-9 text-[12px] font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                    >
                      Ya, Tambahkan
                    </button>
                    <button
                      onClick={() => { setAppendConfirm(false); setError(''); }}
                      className="px-4 h-9 text-[12px] font-bold bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              </div>
            )}

            {error && !appendConfirm && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-[13px] font-bold text-rose-600">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
                <div className="w-12 h-12 border-4 border-gray-100 rounded-full border-t-emerald-600 animate-spin" />
                <p className="text-[13px] font-bold text-gray-400">Menganalisis pola historis produksi...</p>
              </div>
            ) : rows.length > 0 ? (
              <div className="flex flex-col gap-3">
                {/* ── Panel Rekap ── */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Rekap Order */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <p className="text-[11px] font-black text-gray-400 mb-2">
                      Rekap Order ({rekapOrder.length})
                    </p>
                    <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto">
                      {rekapOrder.length === 0 && (
                        <p className="text-[11px] text-gray-300 italic">Tidak ada order</p>
                      )}
                      {rekapOrder.map(o => (
                        <div key={o.no_order} className="flex items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <span className="text-[11px] font-black text-gray-700">{o.no_order}</span>
                            {o.nama_order && (
                              <span className="text-[11px] font-medium text-gray-400 ml-1 truncate">— {o.nama_order}</span>
                            )}
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {[...o.bagian].map(b => (
                                <span key={b} className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-black rounded">{b}</span>
                              ))}
                            </div>
                          </div>
                          <span className="shrink-0 text-[11px] font-black text-gray-400 mt-0.5">{o.karyawan.size} org</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rekap Pekerjaan */}
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <p className="text-[11px] font-black text-gray-400 mb-2">
                      Rekap Jenis Pekerjaan ({rekapPekerjaan.length})
                    </p>
                    <div className="flex flex-col gap-1 max-h-[140px] overflow-y-auto">
                      {rekapPekerjaan.length === 0 && (
                        <p className="text-[11px] text-gray-300 italic">Tidak ada pekerjaan</p>
                      )}
                      {rekapPekerjaan.map(p => (
                        <div key={p.pekerjaan} className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-gray-700 truncate">{p.pekerjaan}</span>
                          <span className="shrink-0 px-1.5 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-black rounded">{p.jumlah}x</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tabel Draft */}
                <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[12px]">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="border border-gray-200 py-2 px-2 font-black text-[11px] text-gray-500 text-center w-8">#</th>
                      <th className="border border-gray-200 py-2 px-2 font-black text-[11px] text-gray-500 text-left">Bagian</th>
                      <th className="border border-gray-200 py-2 px-2 font-black text-[11px] text-gray-500 text-center w-16">Shift</th>
                      <th className="border border-gray-200 py-2 px-2 font-black text-[11px] text-gray-500 text-left">Nama Karyawan</th>
                      <th className="border border-gray-200 py-2 px-2 font-black text-[11px] text-gray-500 text-left">No Order</th>
                      <th className="border border-gray-200 py-2 px-2 font-black text-[11px] text-gray-500 text-left">Nama Order</th>
                      <th className="border border-gray-200 py-2 px-2 font-black text-[11px] text-gray-500 text-left">Jenis Pekerjaan</th>
                      <th className="border border-gray-200 py-2 px-2 font-black text-[11px] text-gray-500 text-left">Keterangan</th>
                      <th className="border border-gray-200 py-2 px-2 font-black text-[11px] text-gray-500 text-right w-20">Target</th>
                      <th className="border border-gray-200 py-2 px-2 font-black text-[11px] text-gray-500 text-left max-w-[180px]">Alasan</th>
                      <th className="border border-gray-200 py-2 px-2 font-black text-[11px] text-gray-500 text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <DraftRowItem
                        key={row._draftId}
                        row={row}
                        index={i}
                        shiftOptions={SHIFT_OPTIONS}
                        karyawanOptions={karyawanOptions}
                        bagianOptions={bagianOptions}
                        orderOptions={orderOptions}
                        pekerjaanOptions={pekerjaanOptions}
                        onUpdate={updateRow}
                        onRemove={() => removeRow(row._draftId)}
                        onInsert={() => insertRow(i)}
                      />
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            ) : null}
            </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 shrink-0 bg-gray-50/50">
            <p className="text-[11px] font-bold text-gray-400">
              {generateMode === 'historis' && generateMeta ? (
                <span className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-lg">Pola {generateMeta.windowHari} hari</span>
                  <span>{generateMeta.karyawanAktif} karyawan aktif</span>
                  <span>·</span>
                  <span>{generateMeta.orderAktif} order berjalan</span>
                  {resolvedDate && <span>· Jadwal untuk: <strong>{formatIndoDate(resolvedDate)}</strong></span>}
                </span>
              ) : generateMode === 'fallback' && sourceDate ? (
                <span className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-lg">Fallback</span>
                  <span>Referensi: {formatIndoDate(sourceDate)}</span>
                  {resolvedDate && <span>· Jadwal untuk: <strong>{formatIndoDate(resolvedDate)}</strong></span>}
                </span>
              ) : sourceDate ? (
                <span>Referensi: {formatIndoDate(sourceDate)}</span>
              ) : null}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                disabled={saving}
                className="px-5 h-10 text-[13px] font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={loading || rows.length === 0 || saving}
                className="flex items-center gap-2 px-5 h-10 text-[13px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-100 transition-all disabled:opacity-50 active:scale-95"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {saving ? 'Menyimpan...' : `Simpan Jadwal (${rows.length})`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
