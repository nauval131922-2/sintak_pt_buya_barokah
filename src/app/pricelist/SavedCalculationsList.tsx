'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Bookmark,
  Calendar,
  BookOpen,
  Search,
  Trash2,
  Edit2,
  Play,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Filter,
  X,
  ExternalLink,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { SimulatorMasterParams } from '@/lib/pricelist-simulator';
import { ManasikMasterParams } from '@/lib/manasik-calculator';
import { YasinMasterParams } from '@/lib/yasin-calculator';
import { SavedSimulationItem } from './PricelistSimulator';
import { SavedManasikSimulationItem } from './ManasikSimulator';
import { SavedYasinSimulationItem } from './YasinSimulator';

export type UnifiedCalculationItem = {
  id: string;
  category: 'Kalender' | 'Buku Manasik' | 'Buku Yasin';
  savedAt: string;
  title: string;
  oplah: number;
  specSummary: string;
  detailSpecs: string[];
  hppUnit: number;
  hargaJualUnit: number;
  totalOmset: number;
  marginPct: number;
  negoDiskonPct: number;
  // Raw item reference for restoring
  rawData: SavedSimulationItem | SavedManasikSimulationItem | SavedYasinSimulationItem;
};

interface SavedCalculationsListProps {
  selectedCategory: 'Kalender' | 'Buku Manasik' | 'Buku Yasin';
  onLoadSimulation: (item: UnifiedCalculationItem) => void;
  activeSimulationId?: string | null;
}

export default function SavedCalculationsList({
  selectedCategory,
  onLoadSimulation,
  activeSimulationId,
}: SavedCalculationsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'Kalender' | 'Buku Manasik' | 'Buku Yasin'>(selectedCategory || 'ALL');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Raw state lists
  const [kalenderList, setKalenderList] = useState<SavedSimulationItem[]>([]);
  const [manasikList, setManasikList] = useState<SavedManasikSimulationItem[]>([]);
  const [yasinList, setYasinList] = useState<SavedYasinSimulationItem[]>([]);

  // Load from localStorage
  const refreshData = () => {
    try {
      const rawK = localStorage.getItem('sintak_saved_simulations');
      if (rawK) setKalenderList(JSON.parse(rawK));
      else setKalenderList([]);

      const rawM = localStorage.getItem('sintak_saved_manasik_simulations');
      if (rawM) setManasikList(JSON.parse(rawM));
      else setManasikList([]);

      const rawY = localStorage.getItem('sintak_saved_yasin_simulations');
      if (rawY) setYasinList(JSON.parse(rawY));
      else setYasinList([]);
    } catch (e) {
      console.error('Failed to load saved calculations:', e);
    }
  };

  useEffect(() => {
    refreshData();
    // Sinkronisasi jika kategori yang dipilih di header berubah
    if (selectedCategory) {
      setFilterCategory(selectedCategory);
    }
  }, [selectedCategory]);

  // Map into unified list
  const unifiedList = useMemo<UnifiedCalculationItem[]>(() => {
    const items: UnifiedCalculationItem[] = [];

    // 1. Kalender
    kalenderList.forEach((k) => {
      items.push({
        id: k.id,
        category: 'Kalender',
        savedAt: k.savedAt,
        title: k.title,
        oplah: k.oplah,
        specSummary: `${k.modelKalender} • ${k.ukuran} cm • Jilid ${k.finishingJilid}`,
        detailSpecs: [
          `Bahan: ${k.bahan}`,
          `Mesin: ${k.mesinDigunakan || k.pilihanMesin}`,
          `Target Margin: ${k.marginPct}%`,
        ],
        hppUnit: k.summary.hppPerPcs,
        hargaJualUnit: k.summary.hargaJualPerPcs,
        totalOmset: k.summary.totalOmset,
        marginPct: k.marginPct,
        negoDiskonPct: k.negoDiskonPct,
        rawData: k,
      });
    });

    // 2. Manasik
    manasikList.forEach((m) => {
      items.push({
        id: m.id,
        category: 'Buku Manasik',
        savedAt: m.savedAt,
        title: m.title,
        oplah: m.oplah,
        specSummary: `Manasik ${m.jumlahHalaman} Hal • ${m.tipeJilid}`,
        detailSpecs: [
          `Cover: ${m.laminasiCover}`,
          `Produksi: ${m.metodeCetakCover}`,
          `Kemasan: ${m.opsiPlastikOpp ? 'Plastik OPP' : 'Standar'}`,
        ],
        hppUnit: m.summary.hppPerPcs,
        hargaJualUnit: m.summary.hargaJualPerPcs,
        totalOmset: m.summary.totalHargaJual,
        marginPct: m.marginPct,
        negoDiskonPct: m.negoDiskonPct,
        rawData: m,
      });
    });

    // 3. Yasin
    yasinList.forEach((y) => {
      items.push({
        id: y.id,
        category: 'Buku Yasin',
        savedAt: y.savedAt,
        title: y.title,
        oplah: y.oplah,
        specSummary: `Yasin ${y.tipeCover} ${y.jumlahHalamanIsi} Hal • ${y.ukuran} cm`,
        detailSpecs: [
          `Foto: ${y.lembarSisipanFoto} lbr / Doa: ${y.lembarSisipanKeluarga} lbr`,
          `Cover: ${y.laminasiCover}`,
          `Aksesoris: ${y.opsiSikuEmas ? 'Siku Emas, ' : ''}${y.opsiPitaRumbai ? 'Pita Rumbai' : '-'}`,
        ],
        hppUnit: y.summary.hppPerPcs,
        hargaJualUnit: y.summary.hargaJualPerPcs,
        totalOmset: y.summary.totalHargaJual,
        marginPct: y.marginPct,
        negoDiskonPct: y.negoDiskonPct,
        rawData: y,
      });
    });

    // Urutkan dari yang terbaru disimpan
    return items.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  }, [kalenderList, manasikList, yasinList]);

  // Filtered List
  const filteredList = useMemo(() => {
    return unifiedList.filter((item) => {
      // Filter kategori
      if (filterCategory !== 'ALL' && item.category !== filterCategory) {
        return false;
      }
      // Filter search term
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.specSummary.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        String(item.oplah).includes(q)
      );
    });
  }, [unifiedList, filterCategory, searchTerm]);

  // Hapus item
  const handleDeleteItem = (item: UnifiedCalculationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Hapus kalkulasi "${item.title}"?`)) return;

    try {
      if (item.category === 'Kalender') {
        const updated = kalenderList.filter((k) => k.id !== item.id);
        setKalenderList(updated);
        localStorage.setItem('sintak_saved_simulations', JSON.stringify(updated));
      } else if (item.category === 'Buku Manasik') {
        const updated = manasikList.filter((m) => m.id !== item.id);
        setManasikList(updated);
        localStorage.setItem('sintak_saved_manasik_simulations', JSON.stringify(updated));
      } else if (item.category === 'Buku Yasin') {
        const updated = yasinList.filter((y) => y.id !== item.id);
        setYasinList(updated);
        localStorage.setItem('sintak_saved_yasin_simulations', JSON.stringify(updated));
      }
      toast.success('Kalkulasi berhasil dihapus.');
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghapus kalkulasi.');
    }
  };

  // Simpan edit judul
  const handleSaveEditTitle = (item: UnifiedCalculationItem) => {
    const newTitle = editTitleInput.trim();
    if (!newTitle) return;

    try {
      if (item.category === 'Kalender') {
        const updated = kalenderList.map((k) => (k.id === item.id ? { ...k, title: newTitle } : k));
        setKalenderList(updated);
        localStorage.setItem('sintak_saved_simulations', JSON.stringify(updated));
      } else if (item.category === 'Buku Manasik') {
        const updated = manasikList.map((m) => (m.id === item.id ? { ...m, title: newTitle } : m));
        setManasikList(updated);
        localStorage.setItem('sintak_saved_manasik_simulations', JSON.stringify(updated));
      } else if (item.category === 'Buku Yasin') {
        const updated = yasinList.map((y) => (y.id === item.id ? { ...y, title: newTitle } : y));
        setYasinList(updated);
        localStorage.setItem('sintak_saved_yasin_simulations', JSON.stringify(updated));
      }
      setEditingId(null);
      toast.success('Nama kalkulasi berhasil diperbarui.');
    } catch (err) {
      console.error(err);
      toast.error('Gagal memperbarui nama kalkulasi.');
    }
  };

  // Salin teks penawaran
  const handleCopyQuote = (item: UnifiedCalculationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    let text = '';
    if (item.category === 'Kalender') {
      const k = item.rawData as SavedSimulationItem;
      text = `*PENAWARAN HARGA KALENDER DINDING 2027*\n*PT Buya Barokah*\n━━━━━━━━━━━━━━━━━━━━\n• *Model*: ${k.modelKalender}\n• *Bahan*: ${k.bahan}\n• *Ukuran*: ${k.ukuran} cm\n• *Finishing*: Jilid ${k.finishingJilid}\n• *Oplah*: ${k.oplah.toLocaleString('id-ID')} pcs\n━━━━━━━━━━━━━━━━━━━━\n• *Harga / Pcs*: *Rp ${k.summary.hargaJualPerPcs.toLocaleString('id-ID')}*\n• *Total Penawaran*: *Rp ${k.summary.totalOmset.toLocaleString('id-ID')}*\n━━━━━━━━━━━━━━━━━━━━\n_Harga belum termasuk PPN. Waktu pengerjaan & jadwal kirim dapat disesuaikan._`;
    } else if (item.category === 'Buku Manasik') {
      const m = item.rawData as SavedManasikSimulationItem;
      text = `*PENAWARAN BUKU PANDUAN MANASIK HAJI / UMROH*\n*PT Buya Barokah*\n━━━━━━━━━━━━━━━━━━━━\n• *Produk*: Buku Manasik ${m.jumlahHalaman} Halaman\n• *Kuantitas*: ${m.oplah.toLocaleString('id-ID')} eks\n• *Cover*: AC 230 gsm + Laminasi ${m.laminasiCover}\n• *Jilid*: ${m.tipeJilid}\n━━━━━━━━━━━━━━━━━━━━\n• *Harga / Eks*: *Rp ${m.summary.hargaJualPerPcs.toLocaleString('id-ID')}*\n• *Total Penawaran*: *Rp ${m.summary.totalHargaJual.toLocaleString('id-ID')}*\n━━━━━━━━━━━━━━━━━━━━\n_Harga belum termasuk PPN._`;
    } else if (item.category === 'Buku Yasin') {
      const y = item.rawData as SavedYasinSimulationItem;
      text = `*PENAWARAN BUKU SURAT YASIN & TAHLIL*\n*PT Buya Barokah*\n━━━━━━━━━━━━━━━━━━━━\n• *Produk*: Buku Yasin ${y.tipeCover} (${y.jumlahHalamanIsi} Halaman)\n• *Ukuran*: ${y.ukuran} cm\n• *Kuantitas*: ${y.oplah.toLocaleString('id-ID')} buku\n• *Sisipan*: ${y.lembarSisipanFoto} Lembar Foto / ${y.lembarSisipanKeluarga} Lembar Doa\n━━━━━━━━━━━━━━━━━━━━\n• *Harga / Buku*: *Rp ${y.summary.hargaJualPerPcs.toLocaleString('id-ID')}*\n• *Total Penawaran*: *Rp ${y.summary.totalHargaJual.toLocaleString('id-ID')}*\n━━━━━━━━━━━━━━━━━━━━\n_Desain foto almarhum & silsilah keluarga dibantu layouting sampai approved._`;
    }

    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    toast.success('Format penawaran WhatsApp berhasil disalin!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="flex flex-col gap-4 pb-8 overflow-y-auto">
      {/* Header Info Banner */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200">
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-emerald-950 tracking-tight">
                Daftar Kalkulasi & Riwayat Simulasi
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                {unifiedList.length} Tersimpan
              </span>
            </div>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Kelola, edit judul, salin format penawaran WhatsApp, atau muat kembali hasil kalkulasi ke simulator.
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3 text-xs">
        {/* Search Bar */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama kalkulasi, spesifikasi, atau oplah..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Kategori Produk Pill Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0 w-full sm:w-auto overflow-x-auto">
          <button
            type="button"
            onClick={() => setFilterCategory('ALL')}
            className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer text-xs ${
              filterCategory === 'ALL'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Semua ({unifiedList.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('Kalender')}
            className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer text-xs ${
              filterCategory === 'Kalender'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🗓️ Kalender ({kalenderList.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('Buku Manasik')}
            className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer text-xs ${
              filterCategory === 'Buku Manasik'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📖 Manasik ({manasikList.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('Buku Yasin')}
            className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer text-xs ${
              filterCategory === 'Buku Yasin'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📗 Yasin ({yasinList.length})
          </button>
        </div>
      </div>

      {/* List Container */}
      {filteredList.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
          <Bookmark className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
          <h4 className="text-sm font-bold text-slate-700">Belum Ada Kalkulasi Tersimpan</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchTerm
              ? 'Tidak ada riwayat kalkulasi yang sesuai dengan kata kunci pencarian.'
              : 'Gunakan tombol "Simpan Hasil Simulasi" di bagian bawah simulator untuk menyimpan skenario harga.'}
          </p>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setFilterCategory('ALL');
              }}
              className="text-xs text-emerald-700 font-bold underline cursor-pointer mt-2"
            >
              Reset Filter Pencarian
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((item) => {
            const isEditing = editingId === item.id;
            const isActive = activeSimulationId === item.id;
            const dateFormatted = new Date(item.savedAt).toLocaleString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={item.id}
                className={`bg-white rounded-xl border transition-all flex flex-col justify-between shadow-xs hover:shadow-sm ${
                  isActive
                    ? 'border-amber-400 bg-amber-50/20 ring-1 ring-amber-400'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Card Header */}
                <div className="p-4 border-b border-slate-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.category === 'Kalender'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : item.category === 'Buku Manasik'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          : 'bg-blue-100 text-blue-900 border border-blue-200'
                      }`}
                    >
                      {item.category}
                    </span>

                    <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                      <Clock size={11} /> {dateFormatted}
                    </span>
                  </div>

                  {/* Title / Edit Title */}
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        type="text"
                        value={editTitleInput}
                        onChange={(e) => setEditTitleInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEditTitle(item);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        className="w-full px-2 py-1 text-xs font-bold border border-emerald-500 rounded bg-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEditTitle(item)}
                        className="px-2 py-1 text-[11px] font-bold bg-emerald-700 text-white rounded cursor-pointer"
                      >
                        Simpan
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1 text-[11px] font-bold bg-slate-200 text-slate-700 rounded cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2 group">
                      <h3 className="text-xs font-bold text-slate-800 group-hover:text-emerald-900 line-clamp-2">
                        {item.title}
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(item.id);
                          setEditTitleInput(item.title);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 transition cursor-pointer shrink-0"
                        title="Edit Nama Kalkulasi"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  )}

                  <p className="text-[11px] font-medium text-slate-600 line-clamp-1">{item.specSummary}</p>
                </div>

                {/* Card Body: Specs Pill & Financial Summary */}
                <div className="p-4 flex flex-col gap-3 flex-1 justify-between bg-slate-50/40">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Kuantitas / Oplah:</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {item.oplah.toLocaleString('id-ID')} unit
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">HPP Unit (Modal):</span>
                      <span className="font-mono text-slate-600">
                        Rp {item.hppUnit.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-emerald-800 font-bold">Harga Jual / Unit:</span>
                      <span className="font-bold font-mono text-emerald-800 text-sm">
                        Rp {item.hargaJualUnit.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Total Omset:</span>
                    <span className="font-bold font-mono text-slate-900">
                      Rp {item.totalOmset.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-2.5 bg-white border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={(e) => handleCopyQuote(item, e)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                    title="Salin Format WhatsApp"
                  >
                    {copiedId === item.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    <span>{copiedId === item.id ? 'Tersalin' : 'WA'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => handleDeleteItem(item, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Hapus Kalkulasi"
                    >
                      <Trash2 size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => onLoadSimulation(item)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                    >
                      <Edit2 size={12} />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
