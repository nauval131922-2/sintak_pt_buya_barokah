'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  CalendarRange, Plus, Trash2, CheckCircle2, AlertTriangle, 
  Calculator, Sparkles, Loader2, RefreshCw, X, Search, Flag, Clock, Layers,
  ChevronDown, User, Hash
} from 'lucide-react';
import BaseModal from '@/components/ui/BaseModal';
import DatePicker from '@/components/DatePicker';
import { toast } from '@/lib/toast';
import { 
  addWorkdays, calculateDurationDays, parseDateToISO,
  type RencanaProduksiTahapanItem, type CreateRencanaProduksiPayload 
} from '@/lib/rencana-produksi-utils';

interface BuatRencanaProduksiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface OrderOption {
  no_sopd: string;
  nama_order: string;
  tgl?: string;
  qty?: number;
  qty_sopd?: number;
  unit?: string;
  nama_pelanggan?: string;
  pelanggan?: string;
  deadline_date?: string;
}

// Preset template alur tahapan mesin percetakan PT Buya Barokah
const PRESET_TEMPLATES: Record<string, { label: string; tahapan: Array<{ bagian: string; mesin: string; nama_tahap: string; target_per_hari: number }> }> = {
  hardcover: {
    label: 'Buku Hard Cover',
    tahapan: [
      { bagian: 'SETTING', mesin: 'Prepress', nama_tahap: 'Setting & Desain Mockup', target_per_hari: 2000 },
      { bagian: 'QUALITY CONTROL', mesin: 'Plate CTP', nama_tahap: 'Pemeriksaan & CTP Plat', target_per_hari: 2000 },
      { bagian: 'FINISHING', mesin: 'Potong QZ 104', nama_tahap: 'Potong Bahan Isi & Cover', target_per_hari: 20000 },
      { bagian: 'CETAK', mesin: 'SM 102', nama_tahap: 'Cetak Isi & Cover', target_per_hari: 15000 },
      { bagian: 'FINISHING', mesin: 'Laminasi', nama_tahap: 'Laminasi Doff/Glossy Cover', target_per_hari: 10000 },
      { bagian: 'FINISHING', mesin: 'Lipat Stall K66', nama_tahap: 'Lipat Lembaran Isi', target_per_hari: 15000 },
      { bagian: 'FINISHING', mesin: 'Jahit Benang', nama_tahap: 'Jahit Blok Buku', target_per_hari: 5000 },
      { bagian: 'FINISHING', mesin: 'Mesin Hard Cover', nama_tahap: 'Pembuatan & Pasang Hard Cover', target_per_hari: 3000 },
      { bagian: 'FINISHING', mesin: 'Potong 3 Sisi', nama_tahap: 'Potong 3 Sisi Buku Jadi', target_per_hari: 5000 },
      { bagian: 'GUDANG', mesin: 'Packing', nama_tahap: 'QC Akhir & Packing Gudang', target_per_hari: 5000 },
    ],
  },
  softcover: {
    label: 'Buku Soft Cover',
    tahapan: [
      { bagian: 'SETTING', mesin: 'Prepress', nama_tahap: 'Setting & Layout Isi', target_per_hari: 2000 },
      { bagian: 'QUALITY CONTROL', mesin: 'Plate CTP', nama_tahap: 'Pemeriksaan & CTP Plat', target_per_hari: 2000 },
      { bagian: 'FINISHING', mesin: 'Potong QZ 104', nama_tahap: 'Potong Bahan', target_per_hari: 20000 },
      { bagian: 'CETAK', mesin: 'SM 102', nama_tahap: 'Cetak Isi & Cover', target_per_hari: 15000 },
      { bagian: 'FINISHING', mesin: 'Lipat Stall K66', nama_tahap: 'Lipat Lembaran Isi', target_per_hari: 15000 },
      { bagian: 'FINISHING', mesin: 'Binding Lem Panas', nama_tahap: 'Jilid Soft Cover Binding', target_per_hari: 5000 },
      { bagian: 'FINISHING', mesin: 'Potong 3 Sisi', nama_tahap: 'Potong 3 Sisi Buku Jadi', target_per_hari: 5000 },
      { bagian: 'GUDANG', mesin: 'Packing', nama_tahap: 'Pengepakan & Siap Kirim', target_per_hari: 5000 },
    ],
  },
  majalah: {
    label: 'Majalah / Buletin',
    tahapan: [
      { bagian: 'SETTING', mesin: 'Prepress', nama_tahap: 'Setting & Layout', target_per_hari: 2000 },
      { bagian: 'QUALITY CONTROL', mesin: 'Plate CTP', nama_tahap: 'Output Plat', target_per_hari: 2000 },
      { bagian: 'FINISHING', mesin: 'Potong QZ 104', nama_tahap: 'Potong Bahan', target_per_hari: 20000 },
      { bagian: 'CETAK', mesin: 'Oliver 72E', nama_tahap: 'Cetak Majalah', target_per_hari: 15000 },
      { bagian: 'FINISHING', mesin: 'Lipat Stall', nama_tahap: 'Lipat Lembaran', target_per_hari: 15000 },
      { bagian: 'FINISHING', mesin: 'Stitching Kawat', nama_tahap: 'Jilid Jahit Kawat (Stitching)', target_per_hari: 8000 },
      { bagian: 'GUDANG', mesin: 'Packing', nama_tahap: 'Packing & Distribusi', target_per_hari: 5000 },
    ],
  },
};

const BAGIAN_OPTIONS = ['SETTING', 'QUALITY CONTROL', 'CETAK', 'FINISHING', 'GUDANG'];

export default function BuatRencanaProduksiModal({ isOpen, onClose, onSuccess }: BuatRencanaProduksiModalProps) {
  // 1. Data Identitas Pesanan
  const [noOrder, setNoOrder] = useState('');
  const [namaOrder, setNamaOrder] = useState('');
  const [qtyOplah, setQtyOplah] = useState<number>(1000);
  const [satuan, setSatuan] = useState('Eks');
  const [namaPelanggan, setNamaPelanggan] = useState('');
  const [tglOrder, setTglOrder] = useState('');
  const [tglDeadline, setTglDeadline] = useState<Date | null>(null);

  // 2. Waktu Rencana Keseluruhan
  const [tglMulaiRencana, setTglMulaiRencana] = useState<Date | null>(() => new Date());
  const [tglSelesaiRencana, setTglSelesaiRencana] = useState<Date | null>(null);
  const [statusPlan, setStatusPlan] = useState<'DRAFT' | 'DISETUJUI'>('DRAFT');
  const [catatan, setCatatan] = useState('');

  // 3. Tahapan Alur Mesin
  const [tahapan, setTahapan] = useState<Array<Omit<RencanaProduksiTahapanItem, 'id' | 'rencana_id'>>>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('hardcover');

  // Searchable Dropdown SOPD Options
  const [sopdOptions, setSopdOptions] = useState<OrderOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Format Helper
  const formatISO = (d: Date | null): string => {
    if (!d) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Muat preset awal saat template dipilih
  const applyTemplate = useCallback((templateKey: string, currentVolume: number, startDateStr: string) => {
    setSelectedTemplate(templateKey);
    const preset = PRESET_TEMPLATES[templateKey];
    if (!preset) return;

    let currentStart = startDateStr || formatISO(new Date());
    const generated = preset.tahapan.map((t, idx) => {
      const vol = currentVolume > 0 ? currentVolume : 1000;
      const dur = calculateDurationDays(vol, t.target_per_hari);
      const end = addWorkdays(currentStart, dur);
      const row = {
        no_order: noOrder || '-',
        urutan: idx + 1,
        bagian: t.bagian,
        mesin: t.mesin,
        nama_tahap: t.nama_tahap,
        volume: vol,
        target_per_hari: t.target_per_hari,
        durasi_hari: dur,
        tgl_mulai_plan: currentStart,
        tgl_selesai_plan: end,
        catatan: '',
      };
      // Tahap selanjutnya dimulai pada hari kerja berikutnya
      currentStart = addWorkdays(end, 2);
      return row;
    });

    setTahapan(generated);
    if (generated.length > 0) {
      const lastEnd = generated[generated.length - 1].tgl_selesai_plan;
      if (lastEnd) {
        setTglSelesaiRencana(new Date(lastEnd + 'T00:00:00'));
      }
    }
  }, [noOrder]);

  // Muat opsi awal SOPD saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setNoOrder('');
      setNamaOrder('');
      setQtyOplah(1000);
      setSatuan('Eks');
      setNamaPelanggan('');
      setTglOrder('');
      setTglDeadline(null);
      const now = new Date();
      setTglMulaiRencana(now);
      setStatusPlan('DRAFT');
      setCatatan('');
      setSearchQuery('');
      setIsDropdownOpen(false);
      applyTemplate('hardcover', 1000, formatISO(now));

      // Fetch daftar SOPD awal
      async function loadInitialSopd() {
        setLoadingOptions(true);
        try {
          const res = await fetch('/api/sopd/options?limit=80');
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setSopdOptions(json.data);
          }
        } catch (e) {
          console.error('Failed to load SOPD options:', e);
        } finally {
          setLoadingOptions(false);
        }
      }
      loadInitialSopd();
    }
  }, [isOpen, applyTemplate]);

  // Klik di luar dropdown SOPD untuk menutup dropdown (tanpa menutup modal)
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  // Pencarian live di dalam dropdown SOPD
  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(async () => {
      setLoadingOptions(true);
      try {
        const url = q.trim()
          ? `/api/sopd/options?search=${encodeURIComponent(q.trim())}&limit=50`
          : `/api/sopd/options?limit=80`;
        const res = await fetch(url);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setSopdOptions(json.data);
        }
      } catch (e) {
        console.error('Failed to search SOPD options:', e);
      } finally {
        setLoadingOptions(false);
      }
    }, 250);
  };

  // Pilih SOPD dari dropdown
  const handleSelectSpk = (item: OrderOption) => {
    setNoOrder(item.no_sopd);
    setNamaOrder(item.nama_order || '');
    
    // Otomatis isi Oplah & Satuan dari SOPD
    const qVal = Number(item.qty ?? item.qty_sopd) || 0;
    if (qVal > 0) setQtyOplah(qVal);
    if (item.unit) setSatuan(item.unit);

    // Otomatis isi Nama Pemesan dari data Digit
    const cust = item.nama_pelanggan || item.pelanggan || '';
    setNamaPelanggan(cust);

    if (item.tgl) setTglOrder(item.tgl);

    // Otomatis isi Deadline jika format tanggal valid
    if (item.deadline_date) {
      const dl = item.deadline_date.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(dl)) {
        setTglDeadline(new Date(dl + 'T00:00:00'));
      } else {
        const parts = dl.split('-');
        if (parts.length === 3 && parts[2].length === 4) {
          setTglDeadline(new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`));
        }
      }
    }

    setIsDropdownOpen(false);

    // Otomatis hitung ulang volume dan durasi seluruh tahapan mesin
    if (qVal > 0) {
      const startDateStr = formatISO(tglMulaiRencana || new Date());
      applyTemplate(selectedTemplate, qVal, startDateStr);
    }
  };

  // Recalculate secara berantai seluruh tahapan (Skip Jumat)
  const handleRecalculateDates = () => {
    const startDateStr = formatISO(tglMulaiRencana || new Date());
    let currentStart = startDateStr;

    const recalculated = tahapan.map((t, idx) => {
      const dur = calculateDurationDays(t.volume, t.target_per_hari);
      const end = addWorkdays(currentStart, dur);
      const updated = {
        ...t,
        urutan: idx + 1,
        durasi_hari: dur,
        tgl_mulai_plan: currentStart,
        tgl_selesai_plan: end,
      };
      currentStart = addWorkdays(end, 2);
      return updated;
    });

    setTahapan(recalculated);
    if (recalculated.length > 0) {
      const lastEnd = recalculated[recalculated.length - 1].tgl_selesai_plan;
      if (lastEnd) {
        setTglSelesaiRencana(new Date(lastEnd + 'T00:00:00'));
      }
    }
    toast.success('Jadwal tahapan mesin berhasil dihitung ulang (melompati hari libur Jumat).');
  };

  // Update spesifik satu baris tahapan
  const handleUpdateTahapRow = (index: number, field: string, value: any) => {
    setTahapan(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Tambah baris tahapan manual
  const handleAddTahapRow = () => {
    const lastRow = tahapan[tahapan.length - 1];
    const newStart = lastRow ? addWorkdays(lastRow.tgl_selesai_plan, 2) : formatISO(new Date());
    const newEnd = addWorkdays(newStart, 1);

    setTahapan(prev => [
      ...prev,
      {
        no_order: noOrder || '-',
        urutan: prev.length + 1,
        bagian: 'FINISHING',
        mesin: 'Mesin Tambahan',
        nama_tahap: 'Tahap Baru',
        volume: qtyOplah,
        target_per_hari: 5000,
        durasi_hari: 1,
        tgl_mulai_plan: newStart,
        tgl_selesai_plan: newEnd,
        catatan: '',
      }
    ]);
  };

  // Hapus satu baris tahapan
  const handleDeleteTahapRow = (index: number) => {
    setTahapan(prev => prev.filter((_, i) => i !== index));
  };

  // Submit Simpan Rencana ke API
  const handleSubmitPlan = async () => {
    if (!noOrder.trim()) {
      toast.error('Silakan pilih No SOPD / SPK terlebih dahulu.');
      return;
    }
    if (!namaOrder.trim()) {
      toast.error('Nama Order / Judul buku wajib diisi.');
      return;
    }
    if (!tglMulaiRencana) {
      toast.error('Tanggal mulai rencana wajib ditentukan.');
      return;
    }
    if (tahapan.length === 0) {
      toast.error('Minimal harus ada 1 tahapan alur mesin.');
      return;
    }

    const payload: CreateRencanaProduksiPayload = {
      no_order: noOrder.trim(),
      nama_order: namaOrder.trim(),
      qty_oplah: qtyOplah,
      satuan,
      nama_pelanggan: namaPelanggan.trim() || undefined,
      tgl_order: tglOrder || undefined,
      tgl_deadline: formatISO(tglDeadline) || undefined,
      tgl_mulai_rencana: formatISO(tglMulaiRencana),
      tgl_selesai_rencana: formatISO(tglSelesaiRencana) || formatISO(tglMulaiRencana),
      status: statusPlan,
      catatan: catatan.trim() || undefined,
      tahapan: tahapan.map((t, idx) => ({
        ...t,
        no_order: noOrder.trim(),
        urutan: idx + 1,
      })),
    };

    setSubmitting(true);
    try {
      const res = await fetch('/api/rencana-produksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal menyimpan rencana produksi.');
      }

      toast.success(`Rencana produksi untuk ${noOrder} berhasil disimpan!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menyimpan rencana produksi.');
    } finally {
      setSubmitting(false);
    }
  };

  // Cek apakah tanggal selesai melebihi deadline SPK
  const isOverdueDeadline = useMemo(() => {
    if (!tglDeadline || !tglSelesaiRencana) return false;
    return formatISO(tglSelesaiRencana) > formatISO(tglDeadline);
  }, [tglDeadline, tglSelesaiRencana]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Buat Rencana Produksi Baru"
      subtitle="Rancang jadwal alur tahapan mesin, target waktu kerja, dan kapasitas PPIC per nomor SPK."
      icon={CalendarRange}
      maxWidth="max-w-7xl"
      closeOnBackdrop={false}
    >
      <div className="space-y-5 text-xs text-gray-700">
        
        {/* SECTION 1: Identitas Pesanan & Template */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <Sparkles size={14} className="text-emerald-600" />
              1. Identitas Pesanan (Pilih SOPD dari Digit ERP)
            </h4>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-medium">Template Alur:</span>
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                {Object.entries(PRESET_TEMPLATES).map(([key, item]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyTemplate(key, qtyOplah, formatISO(tglMulaiRencana || new Date()))}
                    className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      selectedTemplate === key
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            {/* DROPDOWN NO SOPD */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Pilih No SOPD / SPK <span className="text-rose-500">*</span>
              </label>

              {/* Trigger Button */}
              {noOrder ? (
                <div 
                  onClick={() => setIsDropdownOpen(v => !v)}
                  className="w-full h-9 px-3 bg-white border border-emerald-500 rounded-lg text-xs flex items-center justify-between cursor-pointer shadow-2xs hover:border-emerald-600 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    <span className="font-mono font-bold text-slate-900 truncate">{noOrder}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNoOrder('');
                        setNamaOrder('');
                        setNamaPelanggan('');
                        setIsDropdownOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Ganti SOPD"
                    >
                      <X size={13} />
                    </button>
                    <ChevronDown size={14} className="text-slate-400" />
                  </div>
                </div>
              ) : (
                <div 
                  onClick={() => setIsDropdownOpen(v => !v)}
                  className="w-full h-9 px-3 bg-white border border-slate-300 rounded-lg text-xs flex items-center justify-between cursor-pointer shadow-2xs hover:border-emerald-500 transition-colors text-slate-400"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Search size={14} className="text-slate-400 shrink-0" />
                    <span className="font-medium truncate">Pilih / Cari No SOPD...</span>
                  </div>
                  <ChevronDown size={14} className="text-slate-400 shrink-0" />
                </div>
              )}

              {/* Dropdown Popover */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 sm:w-[480px] mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-80 animate-in fade-in zoom-in-95 duration-150">
                  {/* Search Input inside Dropdown */}
                  <div className="p-2 border-b border-slate-100 bg-slate-50/90 sticky top-0 z-10">
                    <div className="relative">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Ketik cari no SOPD, judul buku, atau pemesan..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      {loadingOptions && (
                        <Loader2 size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-emerald-600" />
                      )}
                    </div>
                  </div>

                  {/* List Items */}
                  <div className="overflow-y-auto divide-y divide-slate-100 p-1">
                    {sopdOptions.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-xs">
                        {loadingOptions ? 'Memuat daftar SOPD...' : 'Tidak ditemukan data SOPD yang cocok.'}
                      </div>
                    ) : (
                      sopdOptions.map((item) => (
                        <button
                          key={item.no_sopd}
                          type="button"
                          onClick={() => handleSelectSpk(item)}
                          className={`w-full text-left px-3 py-2.5 hover:bg-emerald-50/70 rounded-lg transition-colors flex flex-col gap-0.5 group cursor-pointer ${
                            noOrder === item.no_sopd ? 'bg-emerald-50 text-emerald-900' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900 group-hover:text-emerald-700">
                              {item.no_sopd}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {item.tgl && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                                  {item.tgl}
                                </span>
                              )}
                              {(item.qty || item.qty_sopd) ? (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                                  {(item.qty || item.qty_sopd)?.toLocaleString('id-ID')} {item.unit || 'Eks'}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className="text-[11px] font-semibold text-slate-700 truncate group-hover:text-slate-900" title={item.nama_order}>
                            {item.nama_order}
                          </div>

                          {(item.nama_pelanggan || item.pelanggan) && (
                            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                              <span className="text-slate-400">Pemesan:</span>
                              <span className="font-medium text-slate-700">{item.nama_pelanggan || item.pelanggan}</span>
                            </div>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Nama Order / Judul Buku */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Nama Order / Judul Buku <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Pilih SOPD di sebelah kiri untuk mengisi otomatis..."
                value={namaOrder}
                onChange={(e) => setNamaOrder(e.target.value)}
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Oplah & Satuan (Otomatis dari SOPD) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-600">
                  Jumlah Cetak &amp; Satuan
                </label>
                <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  Auto SOPD
                </span>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  min="1"
                  value={qtyOplah}
                  onChange={(e) => {
                    const v = Number(e.target.value) || 0;
                    setQtyOplah(v);
                  }}
                  className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Oplah"
                />
                <input
                  type="text"
                  value={satuan}
                  onChange={(e) => setSatuan(e.target.value)}
                  className="w-20 h-9 px-2 bg-white border border-slate-200 rounded-lg text-xs text-center font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Satuan"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            {/* Nama Pemesan (Otomatis dari Digit) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                  <User size={12} className="text-slate-400" />
                  Nama Pemesan
                </label>
                {namaPelanggan && (
                  <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                    Dari Digit
                  </span>
                )}
              </div>
              <input
                type="text"
                placeholder="Terisi otomatis saat memilih SOPD..."
                value={namaPelanggan}
                onChange={(e) => setNamaPelanggan(e.target.value)}
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Tanggal Mulai Rencana */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Tanggal Mulai Rencana</label>
              <DatePicker
                name="tglMulaiRencana"
                value={tglMulaiRencana}
                onChange={(d) => setTglMulaiRencana(d)}
                popupAlign="left"
              />
            </div>

            {/* Batas Deadline SPK */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center justify-between">
                <span>Batas Deadline SPK</span>
                {isOverdueDeadline && (
                  <span className="text-[10px] text-rose-600 font-bold flex items-center gap-0.5">
                    <AlertTriangle size={11} /> Overdue SPK!
                  </span>
                )}
              </label>
              <DatePicker
                name="tglDeadline"
                value={tglDeadline}
                onChange={(d) => setTglDeadline(d)}
                popupAlign="left"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Rincian Alur Tahapan Mesin (Tabel Interaktif Lebih Luas) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Clock size={14} className="text-emerald-600" />
                2. Rincian Alur Tahapan Mesin ({tahapan.length} tahapan)
              </h4>
              <p className="text-[11px] text-slate-400">
                Jadwal otomatis menyambung antar-mesin dan melompati hari <b>Jumat</b> sebagai libur resmi PT Buya Barokah.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRecalculateDates}
                className="h-8 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 shadow-2xs"
                title="Hitung ulang tanggal selesai dan sambungan antar mesin"
              >
                <Calculator size={13} className="text-emerald-600" />
                <span>Hitung Ulang Jadwal</span>
              </button>
              <button
                type="button"
                onClick={handleAddTahapRow}
                className="h-8 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus size={13} />
                <span>Tambah Tahap</span>
              </button>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-100 text-[11px] font-bold text-slate-700 border-b border-slate-200 z-10 shadow-2xs">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3 w-36">Bagian</th>
                    <th className="py-2.5 px-3 w-40">Mesin</th>
                    <th className="py-2.5 px-3">Nama Tahap</th>
                    <th className="py-2.5 px-3 w-28 text-right">Volume</th>
                    <th className="py-2.5 px-3 w-32 text-right">Target/Hari</th>
                    <th className="py-2.5 px-3 w-24 text-center">Durasi</th>
                    <th className="py-2.5 px-3 w-52 text-center">Rentang Tanggal</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {tahapan.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2.5">
                        <select
                          value={item.bagian}
                          onChange={(e) => handleUpdateTahapRow(idx, 'bagian', e.target.value)}
                          className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          {BAGIAN_OPTIONS.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-2.5">
                        <input
                          type="text"
                          value={item.mesin || ''}
                          onChange={(e) => handleUpdateTahapRow(idx, 'mesin', e.target.value)}
                          placeholder="Nama mesin..."
                          className="w-full py-1.5 px-2.5 bg-white border border-slate-200 rounded text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="py-2 px-2.5">
                        <input
                          type="text"
                          value={item.nama_tahap}
                          onChange={(e) => handleUpdateTahapRow(idx, 'nama_tahap', e.target.value)}
                          className="w-full py-1.5 px-2.5 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="py-2 px-2.5 text-right">
                        <input
                          type="number"
                          value={item.volume}
                          onChange={(e) => {
                            const v = Number(e.target.value) || 0;
                            handleUpdateTahapRow(idx, 'volume', v);
                          }}
                          className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded text-xs text-right font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="py-2 px-2.5 text-right">
                        <input
                          type="number"
                          value={item.target_per_hari}
                          onChange={(e) => {
                            const v = Number(e.target.value) || 0;
                            handleUpdateTahapRow(idx, 'target_per_hari', v);
                          }}
                          className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded text-xs text-right text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="py-2 px-2.5 text-center">
                        <span className="px-2.5 py-1 rounded bg-slate-100 font-bold text-slate-700 text-xs">
                          {item.durasi_hari} hr
                        </span>
                      </td>
                      <td className="py-2 px-2.5 text-center">
                        <span className="font-mono text-[11px] text-slate-700 bg-slate-50 border border-slate-200 rounded px-2 py-1 inline-block">
                          {item.tgl_mulai_plan} <span className="text-slate-400">&rarr;</span> {item.tgl_selesai_plan}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteTahapRow(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Hapus baris tahapan"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SECTION 3: Catatan & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 items-end">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Catatan Tambahan PPIC</label>
            <input
              type="text"
              placeholder="Catatan prioritas, instruksi khusus, atau kendala bahan..."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Status Rencana</label>
            <select
              value={statusPlan}
              onChange={(e) => setStatusPlan(e.target.value as any)}
              className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="DRAFT">DRAFT (Penyusunan)</option>
              <option value="DISETUJUI">DISETUJUI (Siap Jalan)</option>
            </select>
          </div>
        </div>

      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex items-center justify-between border-t border-slate-200 pt-3.5 mt-5">
        <div className="text-xs text-slate-500">
          Target Selesai Produksi: <b className="text-slate-900">{formatISO(tglSelesaiRencana) || '-'}</b>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmitPlan}
            disabled={submitting}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                <span>Simpan Rencana Produksi</span>
              </>
            )}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
