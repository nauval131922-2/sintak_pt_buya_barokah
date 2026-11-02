'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  CalendarRange, Plus, Trash2, CheckCircle2, AlertTriangle, 
  Calculator, Sparkles, Loader2, RefreshCw, X, Search, Flag, Clock, Layers
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
  qty_sopd?: number;
  unit?: string;
}

// Preset template alur tahapan mesin percetakan PT Buya Barokah
const PRESET_TEMPLATES: Record<string, { label: string; tahapan: Array<{ bagian: string; mesin: string; nama_tahap: string; target_per_hari: number }> }> = {
  hardcover: {
    label: 'Buku Hard Cover',
    tahapan: [
      { bagian: 'Setting', mesin: 'Prepress', nama_tahap: 'Setting & Desain Mockup', target_per_hari: 2000 },
      { bagian: 'Quality Control', mesin: 'Plate CTP', nama_tahap: 'Pemeriksaan & CTP Plat', target_per_hari: 2000 },
      { bagian: 'Finishing', mesin: 'Potong QZ 104', nama_tahap: 'Potong Bahan Isi & Cover', target_per_hari: 20000 },
      { bagian: 'Cetak', mesin: 'SM 102', nama_tahap: 'Cetak Isi & Cover', target_per_hari: 15000 },
      { bagian: 'Finishing', mesin: 'Laminasi', nama_tahap: 'Laminasi Doff/Glossy Cover', target_per_hari: 10000 },
      { bagian: 'Finishing', mesin: 'Lipat Stall K66', nama_tahap: 'Lipat Lembaran Isi', target_per_hari: 15000 },
      { bagian: 'Finishing', mesin: 'Jahit Benang', nama_tahap: 'Jahit Blok Buku', target_per_hari: 5000 },
      { bagian: 'Finishing', mesin: 'Mesin Hard Cover', nama_tahap: 'Pembuatan & Pasang Hard Cover', target_per_hari: 3000 },
      { bagian: 'Finishing', mesin: 'Potong 3 Sisi', nama_tahap: 'Potong 3 Sisi Buku Jadi', target_per_hari: 5000 },
      { bagian: 'Gudang', mesin: 'Packing', nama_tahap: 'QC Akhir & Packing Gudang', target_per_hari: 5000 },
    ],
  },
  softcover: {
    label: 'Buku Soft Cover',
    tahapan: [
      { bagian: 'Setting', mesin: 'Prepress', nama_tahap: 'Setting & Layout Isi', target_per_hari: 2000 },
      { bagian: 'Quality Control', mesin: 'Plate CTP', nama_tahap: 'Pemeriksaan & CTP Plat', target_per_hari: 2000 },
      { bagian: 'Finishing', mesin: 'Potong QZ 104', nama_tahap: 'Potong Bahan', target_per_hari: 20000 },
      { bagian: 'Cetak', mesin: 'SM 102', nama_tahap: 'Cetak Isi & Cover', target_per_hari: 15000 },
      { bagian: 'Finishing', mesin: 'Lipat Stall K66', nama_tahap: 'Lipat Lembaran Isi', target_per_hari: 15000 },
      { bagian: 'Finishing', mesin: 'Binding Lem Panas', nama_tahap: 'Jilid Soft Cover Binding', target_per_hari: 5000 },
      { bagian: 'Finishing', mesin: 'Potong 3 Sisi', nama_tahap: 'Potong 3 Sisi Buku Jadi', target_per_hari: 5000 },
      { bagian: 'Gudang', mesin: 'Packing', nama_tahap: 'Pengepakan & Siap Kirim', target_per_hari: 5000 },
    ],
  },
  majalah: {
    label: 'Majalah / Buletin',
    tahapan: [
      { bagian: 'Setting', mesin: 'Prepress', nama_tahap: 'Setting & Layout', target_per_hari: 2000 },
      { bagian: 'Quality Control', mesin: 'Plate CTP', nama_tahap: 'Output Plat', target_per_hari: 2000 },
      { bagian: 'Finishing', mesin: 'Potong QZ 104', nama_tahap: 'Potong Bahan', target_per_hari: 20000 },
      { bagian: 'Cetak', mesin: 'Oliver 72E', nama_tahap: 'Cetak Majalah', target_per_hari: 15000 },
      { bagian: 'Finishing', mesin: 'Lipat Stall', nama_tahap: 'Lipat Lembaran', target_per_hari: 15000 },
      { bagian: 'Finishing', mesin: 'Stitching Kawat', nama_tahap: 'Jilid Jahit Kawat (Stitching)', target_per_hari: 8000 },
      { bagian: 'Gudang', mesin: 'Packing', nama_tahap: 'Packing & Distribusi', target_per_hari: 5000 },
    ],
  },
};

const BAGIAN_OPTIONS = ['Setting', 'Quality Control', 'Cetak', 'Finishing', 'Gudang'];

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

  // Search Autocomplete SPK
  const [searchSpk, setSearchSpk] = useState('');
  const [spkResults, setSpkResults] = useState<OrderOption[]>([]);
  const [searchingSpk, setSearchingSpk] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Format Helper
  const formatISO = (d: Date | null): string => {
    if (!d) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Muat preset awal saat pertama kali buka
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

  // Reset saat modal dibuka
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
      setSearchSpk('');
      setSpkResults([]);
      applyTemplate('hardcover', 1000, formatISO(now));
    }
  }, [isOpen, applyTemplate]);

  // Autocomplete search SPK / SOPD
  const handleSearchSpk = (q: string) => {
    setSearchSpk(q);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!q || q.length < 2) {
      setSpkResults([]);
      setIsDropdownOpen(false);
      return;
    }

    searchTimerRef.current = setTimeout(async () => {
      setSearchingSpk(true);
      try {
        const res = await fetch(`/api/sopd/options?search=${encodeURIComponent(q)}&limit=15`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setSpkResults(json.data);
          setIsDropdownOpen(true);
        }
      } catch (e) {
        console.error('Failed to search SPK:', e);
      } finally {
        setSearchingSpk(false);
      }
    }, 250);
  };

  const handleSelectSpk = (item: OrderOption) => {
    setNoOrder(item.no_sopd);
    setNamaOrder(item.nama_order || '');
    if (item.qty_sopd) setQtyOplah(item.qty_sopd);
    if (item.unit) setSatuan(item.unit);
    if (item.tgl) setTglOrder(item.tgl);
    setSearchSpk(item.no_sopd);
    setIsDropdownOpen(false);

    // Otomatis hitung ulang volume tahapan sesuai oplah baru
    if (item.qty_sopd && item.qty_sopd > 0) {
      const startDateStr = formatISO(tglMulaiRencana || new Date());
      applyTemplate(selectedTemplate, item.qty_sopd, startDateStr);
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
        bagian: 'Finishing',
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
      toast.error('Nomor SPK / Order wajib diisi.');
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
      maxWidth="max-w-5xl"
    >
      <div className="space-y-5 text-xs text-gray-700">
        
        {/* SECTION 1: Identitas Pesanan & Template */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <Sparkles size={14} className="text-emerald-600" />
              1. Identitas Pesanan (SPK / Order)
            </h4>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-medium">Template Alur:</span>
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                {Object.entries(PRESET_TEMPLATES).map(([key, item]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyTemplate(key, qtyOplah, formatISO(tglMulaiRencana || new Date()))}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Input No SPK with Autocomplete */}
            <div className="relative">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                No SPK / SOPD <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ketik cari no SPK..."
                  value={searchSpk}
                  onChange={(e) => handleSearchSpk(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                {searchingSpk && (
                  <Loader2 size={13} className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-emerald-600" />
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {isDropdownOpen && spkResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {spkResults.map((item) => (
                    <button
                      key={item.no_sopd}
                      type="button"
                      onClick={() => handleSelectSpk(item)}
                      className="w-full text-left px-3 py-2 hover:bg-emerald-50 transition-colors flex flex-col"
                    >
                      <span className="font-bold text-slate-800 text-[11px]">{item.no_sopd}</span>
                      <span className="text-[10px] text-slate-500 truncate">{item.nama_order}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Nama Order */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Nama Order / Judul Buku <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: Al-Quddus A1 Kecil HVS..."
                value={namaOrder}
                onChange={(e) => setNamaOrder(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Oplah & Satuan */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Oplah (Jumlah Cetak)
              </label>
              <div className="flex gap-1">
                <input
                  type="number"
                  min="1"
                  value={qtyOplah}
                  onChange={(e) => {
                    const v = Number(e.target.value) || 0;
                    setQtyOplah(v);
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  value={satuan}
                  onChange={(e) => setSatuan(e.target.value)}
                  className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Pemesan</label>
              <input
                type="text"
                placeholder="Nama pemesan/klien..."
                value={namaPelanggan}
                onChange={(e) => setNamaPelanggan(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Tanggal Mulai Rencana</label>
              <DatePicker
                name="tglMulaiRencana"
                value={tglMulaiRencana}
                onChange={(d) => setTglMulaiRencana(d)}
                popupAlign="left"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center justify-between">
                <span>Batas Deadline SPK</span>
                {isOverdueDeadline && (
                  <span className="text-[10px] text-rose-600 font-bold flex items-center gap-0.5">
                    <AlertTriangle size={11} /> Overdue!
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

        {/* SECTION 2: Rincian Alur Tahapan Mesin (Tabel Interaktif) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Clock size={14} className="text-emerald-600" />
                2. Rincian Alur Tahapan Mesin ({tahapan.length} tahapan)
              </h4>
              <p className="text-[11px] text-slate-400">
                Jadwal otomatis melompati hari <b>Jumat</b> sebagai hari libur operasional PT Buya Barokah.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRecalculateDates}
                className="h-7 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer border border-slate-200 shadow-2xs"
                title="Hitung ulang tanggal selesai dan sambungan antar mesin"
              >
                <Calculator size={12} className="text-emerald-600" />
                <span>Hitung Ulang Jadwal</span>
              </button>
              <button
                type="button"
                onClick={handleAddTahapRow}
                className="h-7 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus size={12} />
                <span>Tambah Tahap</span>
              </button>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-xs text-[11px] font-bold text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-2.5 w-10 text-center">#</th>
                    <th className="py-2 px-2.5 w-32">Bagian</th>
                    <th className="py-2 px-2.5 w-36">Mesin</th>
                    <th className="py-2 px-2.5">Nama Tahap</th>
                    <th className="py-2 px-2.5 w-24 text-right">Volume</th>
                    <th className="py-2 px-2.5 w-28 text-right">Target/Hari</th>
                    <th className="py-2 px-2.5 w-20 text-center">Durasi</th>
                    <th className="py-2 px-2.5 w-48 text-center">Rentang Tanggal</th>
                    <th className="py-2 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {tahapan.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-1.5 px-2.5 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-1.5 px-2">
                        <select
                          value={item.bagian}
                          onChange={(e) => handleUpdateTahapRow(idx, 'bagian', e.target.value)}
                          className="w-full py-1 px-1.5 bg-white border border-slate-200 rounded text-[11px] font-medium"
                        >
                          {BAGIAN_OPTIONS.map(b => (
                            <option key={b} value={b}>{b}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={item.mesin || ''}
                          onChange={(e) => handleUpdateTahapRow(idx, 'mesin', e.target.value)}
                          placeholder="Nama mesin..."
                          className="w-full py-1 px-2 bg-white border border-slate-200 rounded text-[11px]"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={item.nama_tahap}
                          onChange={(e) => handleUpdateTahapRow(idx, 'nama_tahap', e.target.value)}
                          className="w-full py-1 px-2 bg-white border border-slate-200 rounded text-[11px] font-semibold text-slate-800"
                        />
                      </td>
                      <td className="py-1.5 px-2 text-right">
                        <input
                          type="number"
                          value={item.volume}
                          onChange={(e) => {
                            const v = Number(e.target.value) || 0;
                            handleUpdateTahapRow(idx, 'volume', v);
                          }}
                          className="w-full py-1 px-1.5 bg-white border border-slate-200 rounded text-[11px] text-right font-medium"
                        />
                      </td>
                      <td className="py-1.5 px-2 text-right">
                        <input
                          type="number"
                          value={item.target_per_hari}
                          onChange={(e) => {
                            const v = Number(e.target.value) || 0;
                            handleUpdateTahapRow(idx, 'target_per_hari', v);
                          }}
                          className="w-full py-1 px-1.5 bg-white border border-slate-200 rounded text-[11px] text-right"
                        />
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-700 text-[11px]">
                          {item.durasi_hari} hr
                        </span>
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <span className="font-mono text-[10px] text-slate-600 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                          {item.tgl_mulai_plan} <span className="text-slate-400">&rarr;</span> {item.tgl_selesai_plan}
                        </span>
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteTahapRow(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Hapus baris tahapan"
                        >
                          <Trash2 size={13} />
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Catatan Tambahan PPIC</label>
            <input
              type="text"
              placeholder="Catatan prioritas, instruksi khusus, atau kendala bahan..."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Status Rencana</label>
            <select
              value={statusPlan}
              onChange={(e) => setStatusPlan(e.target.value as any)}
              className="w-full py-1.5 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="DRAFT">DRAFT (Penyusunan)</option>
              <option value="DISETUJUI">DISETUJUI (Siap Jalan)</option>
              <option value="BERJALAN">BERJALAN (Di Produksi)</option>
            </select>
          </div>
        </div>

      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex items-center justify-between border-t border-slate-200 pt-3 mt-4">
        <div className="text-[11px] text-slate-500">
          Target Selesai: <b>{formatISO(tglSelesaiRencana) || '-'}</b>
        </div>
        <div className="flex items-center gap-2">
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
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
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
