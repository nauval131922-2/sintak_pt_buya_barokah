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
import SquareDropdown from '@/components/SquareDropdown';
import { SimulatorMasterParams } from '@/lib/pricelist-simulator';
import { ManasikMasterParams } from '@/lib/manasik-calculator';
import { YasinMasterParams } from '@/lib/yasin-calculator';
import { SavedSimulationItem } from './PricelistSimulator';
import { SavedManasikSimulationItem } from './ManasikSimulator';
import { SavedYasinSimulationItem } from './YasinSimulator';
import { SavedNotaSimulationItem } from './NotaSimulator';
import { SavedBrosurSimulationItem } from './BrosurSimulator';
import { SavedLabelKhqSimulationItem } from './LabelKhqSimulator';
import { SavedBukuTulisSimulationItem } from './BukuTulisSimulator';
import { SavedStopmapSimulationItem } from './StopmapSimulator';
import { SavedSyahadahSimulationItem } from './SyahadahSimulator';
import { SavedRaportKalebSimulationItem } from './RaportKalebSimulator';
import { SavedKopSuratSimulationItem } from './KopSuratSimulator';
import { SavedAmplopSimulationItem } from './AmplopSimulator';

export type UnifiedCalculationItem = {
  id: string;
  category: 'Kalender' | 'Buku Manasik' | 'Buku Yasin' | 'Nota 1 Warna' | 'Brosur 2026' | 'Label KHQ' | 'Buku Tulis' | 'Stopmap' | 'Syahadah' | 'Raport Kaleb' | 'Kop Surat' | 'Amplop';
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
  rawData:
    | SavedSimulationItem
    | SavedManasikSimulationItem
    | SavedYasinSimulationItem
    | SavedNotaSimulationItem
    | SavedBrosurSimulationItem
    | SavedLabelKhqSimulationItem
    | SavedBukuTulisSimulationItem
    | SavedStopmapSimulationItem
    | SavedSyahadahSimulationItem
    | SavedRaportKalebSimulationItem
    | SavedKopSuratSimulationItem
    | SavedAmplopSimulationItem;
};

interface SavedCalculationsListProps {
  selectedCategory: 'Kalender' | 'Buku Manasik' | 'Buku Yasin' | 'Nota 1 Warna' | 'Brosur 2026' | 'Label KHQ' | 'Buku Tulis' | 'Stopmap' | 'Syahadah' | 'Raport Kaleb' | 'Kop Surat' | 'Amplop';
  onLoadSimulation: (item: UnifiedCalculationItem) => void;
  activeSimulationId?: string | null;
}

export default function SavedCalculationsList({
  selectedCategory,
  onLoadSimulation,
  activeSimulationId,
}: SavedCalculationsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'Kalender' | 'Buku Manasik' | 'Buku Yasin' | 'Nota 1 Warna' | 'Brosur 2026' | 'Label KHQ' | 'Buku Tulis' | 'Stopmap' | 'Syahadah' | 'Raport Kaleb' | 'Kop Surat' | 'Amplop'>('ALL');
  
  const handleFilterChange = (val: 'ALL' | 'Kalender' | 'Buku Manasik' | 'Buku Yasin' | 'Nota 1 Warna' | 'Brosur 2026' | 'Label KHQ' | 'Buku Tulis' | 'Stopmap' | 'Syahadah' | 'Raport Kaleb' | 'Kop Surat' | 'Amplop') => {
    setFilterCategory(val);
    try {
      localStorage.setItem('sintak_pricelist_saved_list_filter', val);
    } catch (e) {
      console.error('Failed to save list filter to localStorage:', e);
    }
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Raw state lists
  const [kalenderList, setKalenderList] = useState<SavedSimulationItem[]>([]);
  const [manasikList, setManasikList] = useState<SavedManasikSimulationItem[]>([]);
  const [yasinList, setYasinList] = useState<SavedYasinSimulationItem[]>([]);
  const [notaList, setNotaList] = useState<SavedNotaSimulationItem[]>([]);
  const [brosurList, setBrosurList] = useState<SavedBrosurSimulationItem[]>([]);
  const [labelKhqList, setLabelKhqList] = useState<SavedLabelKhqSimulationItem[]>([]);
  const [bukuTulisList, setBukuTulisList] = useState<SavedBukuTulisSimulationItem[]>([]);
  const [stopmapList, setStopmapList] = useState<SavedStopmapSimulationItem[]>([]);
  const [syahadahList, setSyahadahList] = useState<SavedSyahadahSimulationItem[]>([]);
  const [raportKalebList, setRaportKalebList] = useState<SavedRaportKalebSimulationItem[]>([]);
  const [kopSuratList, setKopSuratList] = useState<SavedKopSuratSimulationItem[]>([]);
  const [amplopList, setAmplopList] = useState<SavedAmplopSimulationItem[]>([]);

  // Load from localStorage
  const refreshData = () => {
    try {
      const savedFilter = localStorage.getItem('sintak_pricelist_saved_list_filter');
      if (
        savedFilter === 'ALL' ||
        savedFilter === 'Kalender' ||
        savedFilter === 'Buku Manasik' ||
        savedFilter === 'Buku Yasin' ||
        savedFilter === 'Nota 1 Warna' ||
        savedFilter === 'Brosur 2026' ||
        savedFilter === 'Label KHQ' ||
        savedFilter === 'Buku Tulis' ||
        savedFilter === 'Stopmap' ||
        savedFilter === 'Syahadah' ||
        savedFilter === 'Raport Kaleb' ||
        savedFilter === 'Kop Surat' ||
        savedFilter === 'Amplop'
      ) {
        setFilterCategory(savedFilter as any);
      }

      const rawK = localStorage.getItem('sintak_saved_simulations');
      if (rawK) setKalenderList(JSON.parse(rawK));
      else setKalenderList([]);

      const rawM = localStorage.getItem('sintak_saved_manasik_simulations');
      if (rawM) setManasikList(JSON.parse(rawM));
      else setManasikList([]);

      const rawY = localStorage.getItem('sintak_saved_yasin_simulations');
      if (rawY) setYasinList(JSON.parse(rawY));
      else setYasinList([]);

      const rawN = localStorage.getItem('sintak_saved_nota_simulations');
      if (rawN) setNotaList(JSON.parse(rawN));
      else setNotaList([]);

      const rawB = localStorage.getItem('sintak_saved_brosur_simulations');
      if (rawB) setBrosurList(JSON.parse(rawB));
      else setBrosurList([]);

      const rawL = localStorage.getItem('sintak_saved_label_khq_simulations');
      if (rawL) setLabelKhqList(JSON.parse(rawL));
      else setLabelKhqList([]);

      const rawBT = localStorage.getItem('sintak_saved_buku_tulis_simulations');
      if (rawBT) setBukuTulisList(JSON.parse(rawBT));
      else setBukuTulisList([]);

      const rawSM = localStorage.getItem('sintak_saved_stopmap_simulations');
      if (rawSM) setStopmapList(JSON.parse(rawSM));
      else setStopmapList([]);

      const rawSy = localStorage.getItem('sintak_saved_syahadah_simulations');
      if (rawSy) setSyahadahList(JSON.parse(rawSy));
      else setSyahadahList([]);

      const rawRK = localStorage.getItem('sintak_saved_raport_kaleb_simulations');
      if (rawRK) setRaportKalebList(JSON.parse(rawRK));
      else setRaportKalebList([]);

      const rawKS = localStorage.getItem('sintak_saved_kop_surat_simulations');
      if (rawKS) setKopSuratList(JSON.parse(rawKS));
      else setKopSuratList([]);

      const rawA = localStorage.getItem('sintak_saved_amplop_simulations');
      if (rawA) setAmplopList(JSON.parse(rawA));
      else setAmplopList([]);
    } catch (e) {
      console.error('Failed to load saved calculations:', e);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

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

    // 4. Nota 1 Warna
    notaList.forEach((n) => {
      items.push({
        id: n.id,
        category: 'Nota 1 Warna',
        savedAt: n.savedAt,
        title: n.title,
        oplah: n.oplahRim,
        specSummary: `Nota ${n.rangkap} Rangkap • ${n.ukuran.split(' ')[0]} • ${n.oplahRim} Rim`,
        detailSpecs: [
          `Kertas: ${n.rangkap === 1 ? 'HVS 70 gr' : `NCR 55 gr (${n.rangkap} Ply)`}`,
          `Warna: ${n.jumlahWarna} Warna (Ryobi)`,
          `Finishing: ${n.opsiPorporasi ? 'Porporasi' : ''}${n.opsiNomorator ? ', Nomorator' : ''}`,
        ],
        hppUnit: n.summary.hppPerRim,
        hargaJualUnit: n.summary.hargaJualPerRim,
        totalOmset: n.summary.totalHargaJual,
        marginPct: n.marginPct,
        negoDiskonPct: n.negoDiskonPct,
        rawData: n,
      });
    });

    // 5. Brosur 2026
    brosurList.forEach((b) => {
      const inp = b.data.input;
      items.push({
        id: b.id,
        category: 'Brosur 2026',
        savedAt: b.savedAt,
        title: b.title,
        oplah: inp.oplah,
        specSummary: `Brosur ${inp.muka} • ${inp.ukuran} cm • ${inp.mesin}`,
        detailSpecs: [
          `Bahan: ${inp.gramatur || 'Art Paper 120 gsm'}`,
          `Laminasi: ${inp.laminasi}`,
          `Finishing: ${inp.opsiSisir ? 'Sisir' : '-'}${inp.opsiPacking ? ', Packing' : ''}`,
          `Margin: ${inp.marginPct}%`,
        ],
        hppUnit: b.data.hppPerPcs,
        hargaJualUnit: b.data.hargaJualPerPcs,
        totalOmset: b.data.totalHargaJual,
        marginPct: inp.marginPct,
        negoDiskonPct: inp.negoDiskonPct,
        rawData: b,
      });
    });

    // 6. Label KHQ
    labelKhqList.forEach((l) => {
      const inp = l.data.input;
      items.push({
        id: l.id,
        category: 'Label KHQ',
        savedAt: l.savedAt,
        title: l.title,
        oplah: l.data.jumlahLbr,
        specSummary: `Label ${inp.varian} • ${l.data.jumlahKardus} Dus (${l.data.jumlahLbr.toLocaleString('id-ID')} Lbr)`,
        detailSpecs: [
          `Print: ${l.data.kebutuhanLbrA3} Lbr A3+`,
          `Finishing: ${inp.opsiLaminasi !== false ? 'Laminasi Glossy' : 'Tanpa Laminasi'}, ${inp.opsiRajang !== false ? 'Rajang Potong' : 'Tanpa Potong'}`,
          `Margin: ${inp.marginPct}%`,
        ],
        hppUnit: l.data.hppPerLbr,
        hargaJualUnit: l.data.hargaJualPerLbr,
        totalOmset: l.data.totalHargaJual,
        marginPct: inp.marginPct,
        negoDiskonPct: inp.negoDiskonPct,
        rawData: l,
      });
    });

    // 7. Buku Tulis
    bukuTulisList.forEach((bt) => {
      const inp = bt.data.input;
      items.push({
        id: bt.id,
        category: 'Buku Tulis',
        savedAt: bt.savedAt,
        title: bt.title,
        oplah: inp.oplah,
        specSummary: `Buku Tulis ${inp.ukuran} 72 Hal • ${inp.oplah.toLocaleString('id-ID')} pcs`,
        detailSpecs: [
          `Cover: ${inp.opsiLaminasi ? 'Laminasi Glossy' : 'Tanpa Laminasi'}`,
          `Finishing: ${inp.opsiSisir ? 'Sisir + Packing' : 'Standar'}`,
          `Margin: ${inp.marginPct}%`,
        ],
        hppUnit: bt.data.hppPerPcs,
        hargaJualUnit: bt.data.hargaJualPerPcs,
        totalOmset: bt.data.totalHargaJual,
        marginPct: inp.marginPct,
        negoDiskonPct: inp.negoDiskonPct,
        rawData: bt,
      });
    });

    // 8. Stopmap
    stopmapList.forEach((sm) => {
      const inp = sm.data.input;
      items.push({
        id: sm.id,
        category: 'Stopmap',
        savedAt: sm.savedAt,
        title: sm.title,
        oplah: inp.oplah,
        specSummary: `Stopmap ${inp.ukuran} • ${inp.laminasi} • ${inp.oplah.toLocaleString('id-ID')} pcs`,
        detailSpecs: [
          `Laminasi: ${inp.laminasi}${inp.laminasi === 'Doff' ? ' (+Rp 200/pcs)' : ''}`,
          `Finishing: Sisir + Lipat + Kupingan Smile + Packing`,
          `Margin: ${inp.marginPct}%`,
        ],
        hppUnit: sm.data.hppPerPcs,
        hargaJualUnit: sm.data.hargaJualPerPcs,
        totalOmset: sm.data.totalHargaJual,
        marginPct: inp.marginPct,
        negoDiskonPct: inp.negoDiskonPct,
        rawData: sm,
      });
    });

    // 9. Syahadah
    syahadahList.forEach((sy) => {
      const inp = sy.data.input;
      items.push({
        id: sy.id,
        category: 'Syahadah',
        savedAt: sy.savedAt,
        title: sy.title,
        oplah: inp.oplah,
        specSummary: `Syahadah ${inp.varian}${inp.opsiFoil ? ' +Foil' : ''} • ${inp.oplah.toLocaleString('id-ID')} pcs`,
        detailSpecs: [
          `Foil: ${inp.opsiFoil ? 'Ya (+Rp 450/pcs, min 100k)' : 'Tanpa Foil'}`,
          `Finishing: Sisir + Packing Kardus`,
          `Margin: ${inp.marginPct}%`,
        ],
        hppUnit: sy.data.hppPerPcs,
        hargaJualUnit: sy.data.hargaJualPerPcs,
        totalOmset: sy.data.totalHargaJual,
        marginPct: inp.marginPct,
        negoDiskonPct: inp.negoDiskonPct,
        rawData: sy,
      });
    });

    // 10. Raport Kaleb
    raportKalebList.forEach((rk) => {
      const inp = rk.data.input;
      const extra = inp.tambahanIsiLbr ? ` +${inp.tambahanIsiLbr} lbr` : '';
      items.push({
        id: rk.id,
        category: 'Raport Kaleb',
        savedAt: rk.savedAt,
        title: rk.title,
        oplah: inp.oplah,
        specSummary: `Raport Kaleb ${inp.varian}${extra} • ${inp.oplah.toLocaleString('id-ID')} pcs`,
        detailSpecs: [
          `Isi: ${inp.varian}${extra ? ` +${inp.tambahanIsiLbr} lbr custom` : ''} · Foil Emas`,
          `Finishing: Sisir + Packing Kardus`,
          `Margin: ${inp.marginPct}%`,
        ],
        hppUnit: rk.data.hppPerPcs,
        hargaJualUnit: rk.data.hargaJualPerPcs,
        totalOmset: rk.data.totalHargaJual,
        marginPct: inp.marginPct,
        negoDiskonPct: inp.negoDiskonPct,
        rawData: rk,
      });
    });

    // 11. Kop Surat
    kopSuratList.forEach((ks) => {
      const inp = ks.data.input;
      items.push({
        id: ks.id,
        category: 'Kop Surat',
        savedAt: ks.savedAt,
        title: ks.title,
        oplah: inp.oplah,
        specSummary: `Kop Surat ${inp.varian} • ${inp.oplah.toLocaleString('id-ID')} pcs`,
        detailSpecs: [
          `Bahan: ${inp.varian} · A4 21×29,7 cm · 2 pcs/A3+`,
          `Finishing: Potong + Packing Kardus`,
          `Margin: ${inp.marginPct}%`,
        ],
        hppUnit: ks.data.hppPerPcs,
        hargaJualUnit: ks.data.hargaJualPerPcs,
        totalOmset: ks.data.totalHargaJual,
        marginPct: inp.marginPct,
        negoDiskonPct: inp.negoDiskonPct,
        rawData: ks,
      });
    });

    // 12. Amplop
    amplopList.forEach((a) => {
      const inp = a.data.input;
      items.push({
        id: a.id,
        category: 'Amplop',
        savedAt: a.savedAt,
        title: a.title,
        oplah: inp.oplah,
        specSummary: `Amplop ${inp.varian} • ${inp.oplah.toLocaleString('id-ID')} pcs`,
        detailSpecs: [
          `Bahan: HVS 80 gsm · ${inp.varian} · ${a.data.kebutuhanA3} lbr A3+`,
          `Finishing: Lipat & Lem + Packing Kardus`,
          `Margin: ${inp.marginPct}%`,
        ],
        hppUnit: a.data.hppPerPcs,
        hargaJualUnit: a.data.hargaJualPerPcs,
        totalOmset: a.data.totalHargaJual,
        marginPct: inp.marginPct,
        negoDiskonPct: inp.negoDiskonPct,
        rawData: a,
      });
    });

    // Urutkan dari yang terbaru disimpan
    return items.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  }, [kalenderList, manasikList, yasinList, notaList, brosurList, labelKhqList, bukuTulisList, stopmapList, syahadahList, raportKalebList, kopSuratList, amplopList]);

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
      } else if (item.category === 'Nota 1 Warna') {
        const updated = notaList.filter((n) => n.id !== item.id);
        setNotaList(updated);
        localStorage.setItem('sintak_saved_nota_simulations', JSON.stringify(updated));
      } else if (item.category === 'Brosur 2026') {
        const updated = brosurList.filter((b) => b.id !== item.id);
        setBrosurList(updated);
        localStorage.setItem('sintak_saved_brosur_simulations', JSON.stringify(updated));
      } else if (item.category === 'Label KHQ') {
        const updated = labelKhqList.filter((l) => l.id !== item.id);
        setLabelKhqList(updated);
        localStorage.setItem('sintak_saved_label_khq_simulations', JSON.stringify(updated));
      } else if (item.category === 'Buku Tulis') {
        const updated = bukuTulisList.filter((bt) => bt.id !== item.id);
        setBukuTulisList(updated);
        localStorage.setItem('sintak_saved_buku_tulis_simulations', JSON.stringify(updated));
      } else if (item.category === 'Stopmap') {
        const updated = stopmapList.filter((sm) => sm.id !== item.id);
        setStopmapList(updated);
        localStorage.setItem('sintak_saved_stopmap_simulations', JSON.stringify(updated));
      } else if (item.category === 'Syahadah') {
        const updated = syahadahList.filter((sy) => sy.id !== item.id);
        setSyahadahList(updated);
        localStorage.setItem('sintak_saved_syahadah_simulations', JSON.stringify(updated));
      } else if (item.category === 'Raport Kaleb') {
        const updated = raportKalebList.filter((rk) => rk.id !== item.id);
        setRaportKalebList(updated);
        localStorage.setItem('sintak_saved_raport_kaleb_simulations', JSON.stringify(updated));
      } else if (item.category === 'Kop Surat') {
        const updated = kopSuratList.filter((ks) => ks.id !== item.id);
        setKopSuratList(updated);
        localStorage.setItem('sintak_saved_kop_surat_simulations', JSON.stringify(updated));
      } else if (item.category === 'Amplop') {
        const updated = amplopList.filter((a) => a.id !== item.id);
        setAmplopList(updated);
        localStorage.setItem('sintak_saved_amplop_simulations', JSON.stringify(updated));
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
      } else if (item.category === 'Nota 1 Warna') {
        const updated = notaList.map((n) => (n.id === item.id ? { ...n, title: newTitle } : n));
        setNotaList(updated);
        localStorage.setItem('sintak_saved_nota_simulations', JSON.stringify(updated));
      } else if (item.category === 'Brosur 2026') {
        const updated = brosurList.map((b) => (b.id === item.id ? { ...b, title: newTitle } : b));
        setBrosurList(updated);
        localStorage.setItem('sintak_saved_brosur_simulations', JSON.stringify(updated));
      } else if (item.category === 'Label KHQ') {
        const updated = labelKhqList.map((l) => (l.id === item.id ? { ...l, title: newTitle } : l));
        setLabelKhqList(updated);
        localStorage.setItem('sintak_saved_label_khq_simulations', JSON.stringify(updated));
      } else if (item.category === 'Buku Tulis') {
        const updated = bukuTulisList.map((bt) => (bt.id === item.id ? { ...bt, title: newTitle } : bt));
        setBukuTulisList(updated);
        localStorage.setItem('sintak_saved_buku_tulis_simulations', JSON.stringify(updated));
      } else if (item.category === 'Stopmap') {
        const updated = stopmapList.map((sm) => (sm.id === item.id ? { ...sm, title: newTitle } : sm));
        setStopmapList(updated);
        localStorage.setItem('sintak_saved_stopmap_simulations', JSON.stringify(updated));
      } else if (item.category === 'Syahadah') {
        const updated = syahadahList.map((sy) => (sy.id === item.id ? { ...sy, title: newTitle } : sy));
        setSyahadahList(updated);
        localStorage.setItem('sintak_saved_syahadah_simulations', JSON.stringify(updated));
      } else if (item.category === 'Raport Kaleb') {
        const updated = raportKalebList.map((rk) => (rk.id === item.id ? { ...rk, title: newTitle } : rk));
        setRaportKalebList(updated);
        localStorage.setItem('sintak_saved_raport_kaleb_simulations', JSON.stringify(updated));
      } else if (item.category === 'Kop Surat') {
        const updated = kopSuratList.map((ks) => (ks.id === item.id ? { ...ks, title: newTitle } : ks));
        setKopSuratList(updated);
        localStorage.setItem('sintak_saved_kop_surat_simulations', JSON.stringify(updated));
      } else if (item.category === 'Amplop') {
        const updated = amplopList.map((a) => (a.id === item.id ? { ...a, title: newTitle } : a));
        setAmplopList(updated);
        localStorage.setItem('sintak_saved_amplop_simulations', JSON.stringify(updated));
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
    } else if (item.category === 'Nota 1 Warna') {
      const n = item.rawData as SavedNotaSimulationItem;
      text = `*PENAWARAN CETAK NOTA / KWITANSI / SURAT JALAN*\n*PT Buya Barokah*\n━━━━━━━━━━━━━━━━━━━━\n• *Spesifikasi*: Nota ${n.rangkap} Rangkap (${n.rangkap === 1 ? 'HVS 70 gr' : `Kertas NCR 55 gr ${n.rangkap} Ply`})\n• *Ukuran*: ${n.ukuran}\n• *Warna Cetak*: ${n.jumlahWarna} Warna (Mesin Ryobi)\n• *Kuantitas*: *${n.oplahRim} Rim Folio*\n• *Finishing*: Cover Samson, Alas Board, Susun, Staples & Lem Ngetruk${n.opsiPorporasi ? ', Porporasi' : ''}${n.opsiNomorator ? ', Nomorator Seri' : ''}\n━━━━━━━━━━━━━━━━━━━━\n• *Harga / Rim*: *Rp ${n.summary.hargaJualPerRim.toLocaleString('id-ID')}*\n• *Total Penawaran*: *Rp ${n.summary.totalHargaJual.toLocaleString('id-ID')}*\n━━━━━━━━━━━━━━━━━━━━\n_Kualitas cetak tajam & tembusan NCR pekat._`;
    } else if (item.category === 'Brosur 2026') {
      const b = item.rawData as SavedBrosurSimulationItem;
      const inp = b.data.input;
      text = `*PENAWARAN BROSUR 2026*\n*PT Buya Barokah*\n━━━━━━━━━━━━━━━━━━━━\n• *Produk*: Brosur ${inp.muka}\n• *Ukuran*: ${inp.ukuran} cm\n• *Bahan*: ${inp.gramatur || 'Art Paper 120 gsm'}\n• *Laminasi*: ${inp.laminasi}\n• *Kuantitas*: ${inp.oplah.toLocaleString('id-ID')} pcs\n• *Mesin Cetak*: ${inp.mesin}\n━━━━━━━━━━━━━━━━━━━━\n• *Harga / Pcs*: *Rp ${b.data.hargaJualPerPcs.toLocaleString('id-ID')}*\n• *Total Penawaran*: *Rp ${b.data.totalHargaJual.toLocaleString('id-ID')}*\n━━━━━━━━━━━━━━━━━━━━\n_Harga belum termasuk PPN._`;
    } else if (item.category === 'Label KHQ') {
      const l = item.rawData as SavedLabelKhqSimulationItem;
      const inp = l.data.input;
      text = `*PENAWARAN LABEL BOTOL KHQ*\n*PT Buya Barokah*\n━━━━━━━━━━━━━━━━━━━━\n• *Produk*: ${inp.varian}\n• *Jumlah*: ${l.data.jumlahKardus} Dus (${l.data.jumlahLbr.toLocaleString('id-ID')} Lembar Label)\n• *Finishing*: ${inp.opsiLaminasi !== false ? 'Laminasi Glossy' : 'Tanpa Laminasi'}, ${inp.opsiRajang !== false ? 'Rajang Potong' : 'Tanpa Potong'}\n━━━━━━━━━━━━━━━━━━━━\n• *Harga / Lembar*: *Rp ${l.data.hargaJualPerLbr.toLocaleString('id-ID')}*\n• *Total Penawaran*: *Rp ${l.data.totalHargaJual.toLocaleString('id-ID')}*\n━━━━━━━━━━━━━━━━━━━━\n_Harga dapat disesuaikan dengan fluktuasi bahan baku._`;
    } else if (item.category === 'Buku Tulis') {
      const bt = item.rawData as SavedBukuTulisSimulationItem;
      const inp = bt.data.input;
      text = `*PENAWARAN BUKU TULIS 72 HAL*\n*PT Buya Barokah*\n━━━━━━━━━━━━━━━━━━━━\n• *Produk*: Buku Tulis ${inp.ukuran} 72 Hal Soft Cover (15,5×21 & 16×21 cm)\n• *Ukuran*: ${inp.ukuran} cm (tertutup)\n• *Kuantitas*: ${inp.oplah.toLocaleString('id-ID')} pcs\n• *Finishing*: ${inp.opsiLaminasi ? 'Laminasi Glossy' : 'Tanpa Laminasi'}, ${inp.opsiSisir ? 'Sisir + Packing' : 'Standar'}\n━━━━━━━━━━━━━━━━━━━━\n• *Harga / Pcs*: *Rp ${bt.data.hargaJualPerPcs.toLocaleString('id-ID')}*\n• *Total Penawaran*: *Rp ${bt.data.totalHargaJual.toLocaleString('id-ID')}*\n━━━━━━━━━━━━━━━━━━━━\n_Harga belum termasuk PPN. Cover AC 230 gsm 4W, isi HVS 70 gsm 1W bolak-balik._`;
    } else if (item.category === 'Stopmap') {
      const sm = item.rawData as SavedStopmapSimulationItem;
      const inp = sm.data.input;
      text = `*PENAWARAN STOPMAP*\n*PT Buya Barokah*\n━━━━━━━━━━━━━━━━━━━━\n• *Produk*: Stopmap ${inp.ukuran}\n• *Laminasi*: ${inp.laminasi}${inp.laminasi === 'Doff' ? ' (+Rp 200/pcs)' : ''}\n• *Kuantitas*: ${inp.oplah.toLocaleString('id-ID')} pcs\n• *Bahan*: Art Carton 230 gsm 1 Muka Full Colour\n• *Finishing*: Sisir + Lipat + Kupingan Smile + Packing Kardus\n━━━━━━━━━━━━━━━━━━━━\n• *Harga / Pcs*: *Rp ${sm.data.hargaJualPerPcs.toLocaleString('id-ID')}*\n• *Total Penawaran*: *Rp ${sm.data.totalHargaJual.toLocaleString('id-ID')}*\n━━━━━━━━━━━━━━━━━━━━\n_Harga belum termasuk PPN._`;
    } else if (item.category === 'Syahadah') {
      const sy = item.rawData as SavedSyahadahSimulationItem;
      const inp = sy.data.input;
      text = `*PENAWARAN SYAHADAH*\n*PT Buya Barokah*\n━━━━━━━━━━━━━━━━━━━━\n• *Produk*: Syahadah ${inp.varian} 21,5×33 cm\n• *Bahan*: Linen/Hammer Crem Tebal 260 gsm\n• *Kuantitas*: ${inp.oplah.toLocaleString('id-ID')} pcs\n• *Foil*: ${inp.opsiFoil ? 'Ya (+Rp 450/pcs, min 100k + master foil)' : 'Tanpa Foil'}\n• *Finishing*: Sisir + Packing Kardus\n━━━━━━━━━━━━━━━━━━━━\n• *Harga / Pcs*: *Rp ${sy.data.hargaJualPerPcs.toLocaleString('id-ID')}*\n• *Total Penawaran*: *Rp ${sy.data.totalHargaJual.toLocaleString('id-ID')}*\n━━━━━━━━━━━━━━━━━━━━\n_Harga belum termasuk PPN._`;
    } else if (item.category === 'Raport Kaleb') {
      const rk = item.rawData as SavedRaportKalebSimulationItem;
      const inp = rk.data.input;
      const extra = inp.tambahanIsiLbr ? ` +${inp.tambahanIsiLbr} lbr` : '';
      text = `*PENAWARAN RAPORT KALEB*\n*PT Buya Barokah*\n━━━━━━━━━━━━━━━━━━━━\n• *Produk*: Raport Kaleb ${inp.varian}${extra} 24×34 cm\n• *Bahan*: Kaleb Foil Emas\n• *Kuantitas*: ${inp.oplah.toLocaleString('id-ID')} pcs\n• *Isi*: ${inp.varian}${extra ? ` +${inp.tambahanIsiLbr} lbr custom` : ''} (+Rp ${((rk.paramsSnapshot?.tarifIsiPerLbr) || 1200).toLocaleString('id-ID')}/lbr)\n• *Finishing*: Sisir + Packing Kardus + Foil Emas\n━━━━━━━━━━━━━━━━━━━━\n• *Harga / Pcs*: *Rp ${rk.data.hargaJualPerPcs.toLocaleString('id-ID')}*\n• *Total Penawaran*: *Rp ${rk.data.totalHargaJual.toLocaleString('id-ID')}*\n━━━━━━━━━━━━━━━━━━━━\n_Harga belum termasuk PPN._`;
    } else if (item.category === 'Kop Surat') {
      const ks = item.rawData as SavedKopSuratSimulationItem;
      const inp = ks.data.input;
      text = `*PENAWARAN KOP SURAT*\n*PT Buya Barokah*\n━━━━━━━━━━━━━━━━━━━━\n• *Produk*: Kop Surat ${inp.varian} A4 21×29,7 cm\n• *Bahan*: HVS ${(inp.varian.includes('100') ? '100' : '80')} gsm\n• *Kuantitas*: ${inp.oplah.toLocaleString('id-ID')} pcs (2 pcs/A3+)\n• *Cetak*: ${inp.varian.includes('Full Colour') ? 'Full Colour 1 Muka' : '1 Warna Hitam 1 Muka'}${inp.oplah > 500 ? ' (Oliver)' : ' (Print Inter/Ryobi)'}\n• *Finishing*: Potong + Packing Kardus\n━━━━━━━━━━━━━━━━━━━━\n• *Harga / Pcs*: *Rp ${ks.data.hargaJualPerPcs.toLocaleString('id-ID')}*\n• *Total Penawaran*: *Rp ${ks.data.totalHargaJual.toLocaleString('id-ID')}*\n━━━━━━━━━━━━━━━━━━━━\n_Harga belum termasuk PPN._`;
    } else if (item.category === 'Amplop') {
      const a = item.rawData as SavedAmplopSimulationItem;
      const inp = a.data.input;
      text = `*PENAWARAN AMPLOP*\n*PT Buya Barokah*\n━━━━━━━━━━━━━━━━━━━━\n• *Produk*: Amplop ${inp.varian}\n• *Bahan*: HVS 80 gsm\n• *Kuantitas*: ${inp.oplah.toLocaleString('id-ID')} pcs\n• *Cetak*: 1 Warna Hitam 1 Muka${inp.oplah > 500 ? ' (Oliver)' : ' (Ryobi)'}\n• *Finishing*: Lipat & Lem + Packing Kardus\n━━━━━━━━━━━━━━━━━━━━\n• *Harga / Pcs*: *Rp ${a.data.hargaJualPerPcs.toLocaleString('id-ID')}*\n• *Total Penawaran*: *Rp ${a.data.totalHargaJual.toLocaleString('id-ID')}*\n━━━━━━━━━━━━━━━━━━━━\n_Harga belum termasuk PPN._`;
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

        {/* Filter Kategori Produk - SquareDropdown Searchable */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <span className="text-slate-500 font-semibold text-xs hidden md:inline">Kategori:</span>
          <div className="w-full sm:w-56 text-xs">
            <SquareDropdown
              options={[
                { value: 'ALL', label: 'Semua Kategori', count: unifiedList.length },
                { value: 'Kalender', label: '🗓️ Kalender', count: kalenderList.length },
                { value: 'Buku Manasik', label: '📖 Buku Manasik', count: manasikList.length },
                { value: 'Buku Yasin', label: '📗 Buku Yasin', count: yasinList.length },
                { value: 'Nota 1 Warna', label: '📋 Nota 1 Warna', count: notaList.length },
                { value: 'Brosur 2026', label: '🗞️ Brosur 2026', count: brosurList.length },
                { value: 'Label KHQ', label: '🏷️ Label KHQ', count: labelKhqList.length },
                { value: 'Buku Tulis', label: '📓 Buku Tulis', count: bukuTulisList.length },
                { value: 'Stopmap', label: '📁 Stopmap', count: stopmapList.length },
                { value: 'Syahadah', label: '🕌 Syahadah', count: syahadahList.length },
                { value: 'Raport Kaleb', label: '📒 Raport Kaleb', count: raportKalebList.length },
                { value: 'Kop Surat', label: '📄 Kop Surat', count: kopSuratList.length },
                { value: 'Amplop', label: '✉️ Amplop', count: amplopList.length },
              ]}
              value={filterCategory}
              onChange={(val) => handleFilterChange(val as any)}
              searchPlaceholder="Cari kategori produk..."
              widthClass="w-full sm:w-56"
            />
          </div>
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
                          : item.category === 'Buku Yasin'
                          ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                          : item.category === 'Nota 1 Warna'
                          ? 'bg-purple-100 text-purple-900 border border-purple-200'
                          : item.category === 'Brosur 2026'
                          ? 'bg-rose-100 text-rose-900 border border-rose-200'
                          : item.category === 'Label KHQ'
                          ? 'bg-teal-100 text-teal-900 border border-teal-200'
                          : item.category === 'Buku Tulis'
                          ? 'bg-cyan-100 text-cyan-900 border border-cyan-200'
                          : item.category === 'Stopmap'
                          ? 'bg-orange-100 text-orange-900 border border-orange-200'
                          : item.category === 'Syahadah'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : item.category === 'Raport Kaleb'
                          ? 'bg-yellow-100 text-yellow-900 border border-yellow-300'
                          : item.category === 'Kop Surat'
                          ? 'bg-sky-100 text-sky-900 border border-sky-300'
                          : item.category === 'Amplop'
                          ? 'bg-pink-100 text-pink-900 border border-pink-300'
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
