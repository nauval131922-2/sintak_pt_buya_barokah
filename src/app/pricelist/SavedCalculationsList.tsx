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
  FileText,
  Eye,
  Info,
  Calculator,
  Sparkles,
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
import { SavedSertifikatSimulationItem } from './SertifikatSimulator';
import { SavedUndanganSimulationItem } from './UndanganSimulator';
import { SavedBukuTabunganNsSimulationItem } from './BukuTabunganNsSimulator';
import { SavedBukuTabunganSecuritySimulationItem } from './BukuTabunganSecuritySimulator';
import { SavedKartuKoperasiPromiseSimulationItem } from './KartuKoperasiPromiseSimulator';
import { SavedLebelKartuObatSimulationItem } from './LebelKartuObatSimulator';
import { SavedBukuSoftCoverSimulationItem } from './BukuSoftCoverSimulator';
import { SavedBukuSoftCover145x2025SimulationItem } from './BukuSoftCover145x2025Simulator';
import { SavedBukuHardCover105x148SimulationItem } from './BukuHardCover105x148Simulator';
import { SavedPosterSimulationItem } from './PosterSimulator';
import { SavedMajalahSimulationItem } from './MajalahSimulator';
import { SavedStikerSimulationItem } from './StikerSimulator';
import { SavedBukuSoftCover105x148SimulationItem } from './BukuSoftCover105x148Simulator';
import { SavedBukuHardCover145x2025SimulationItem } from './BukuHardCover145x2025Simulator';
import { SavedBukuHardCover21x297SimulationItem } from './BukuHardCover21x297Simulator';
import { SavedKalenderKopSimulationItem } from './KalenderKopSimulator';
import { SavedPackagingSimulationItem } from './PackagingSimulator';
import { SavedPaperbagSimulationItem } from './PaperbagSimulator';

export type UnifiedCalculationItem = {
  id: string;
  category: 'Kalender' | 'Buku Manasik' | 'Buku Yasin' | 'Nota 1 Warna' | 'Brosur 2026' | 'Label KHQ' | 'Buku Tulis' | 'Stopmap' | 'Syahadah' | 'Raport Kaleb' | 'Kop Surat' | 'Amplop' | 'Sertifikat' | 'Undangan' | 'Buku Tabungan NS' | 'Buku Tabungan Security' | 'Kartu Koperasi Promise' | 'Lebel Kartu Obat' | 'Buku Soft Cover' | 'Buku Soft Cover 14,5×20,25' | 'Buku Hard Cover 10,5×14,8' | 'Poster' | 'Majalah 14,5×20,25' | 'Stiker' | 'Buku Soft Cover 10,5×14,8' | 'Buku Hard Cover 14,5×20,25' | 'Buku Hard Cover 21×29,7' | 'Kalender Kop' | 'Packaging' | 'Paperbag';
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
    | SavedAmplopSimulationItem
    | SavedSertifikatSimulationItem
    | SavedUndanganSimulationItem
    | SavedBukuTabunganNsSimulationItem
    | SavedBukuTabunganSecuritySimulationItem
    | SavedKartuKoperasiPromiseSimulationItem
    | SavedLebelKartuObatSimulationItem
    | SavedBukuSoftCoverSimulationItem
    | SavedBukuSoftCover145x2025SimulationItem
    | SavedBukuHardCover105x148SimulationItem
    | SavedPosterSimulationItem
    | SavedMajalahSimulationItem
    | SavedStikerSimulationItem
    | SavedBukuSoftCover105x148SimulationItem
    | SavedBukuHardCover145x2025SimulationItem
    | SavedBukuHardCover21x297SimulationItem
    | SavedKalenderKopSimulationItem
    | SavedPackagingSimulationItem
    | SavedPaperbagSimulationItem
};

interface SavedCalculationsListProps {
  selectedCategory: 'Kalender' | 'Buku Manasik' | 'Buku Yasin' | 'Nota 1 Warna' | 'Brosur 2026' | 'Label KHQ' | 'Buku Tulis' | 'Stopmap' | 'Syahadah' | 'Raport Kaleb' | 'Kop Surat' | 'Amplop' | 'Sertifikat' | 'Undangan' | 'Buku Tabungan NS' | 'Buku Tabungan Security' | 'Kartu Koperasi Promise' | 'Lebel Kartu Obat' | 'Buku Soft Cover' | 'Buku Soft Cover 14,5×20,25' | 'Buku Hard Cover 10,5×14,8' | 'Poster' | 'Majalah 14,5×20,25' | 'Stiker' | 'Buku Soft Cover 10,5×14,8' | 'Buku Hard Cover 14,5×20,25' | 'Buku Hard Cover 21×29,7' | 'Kalender Kop' | 'Packaging' | 'Paperbag';
  onLoadSimulation: (item: UnifiedCalculationItem) => void;
  activeSimulationId?: string | null;
}

export default function SavedCalculationsList({
  selectedCategory,
  onLoadSimulation,
  activeSimulationId,
}: SavedCalculationsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'Kalender' | 'Buku Manasik' | 'Buku Yasin' | 'Nota 1 Warna' | 'Brosur 2026' | 'Label KHQ' | 'Buku Tulis' | 'Stopmap' | 'Syahadah' | 'Raport Kaleb' | 'Kop Surat' | 'Amplop' | 'Sertifikat' | 'Undangan' | 'Buku Tabungan NS' | 'Buku Tabungan Security' | 'Kartu Koperasi Promise' | 'Lebel Kartu Obat' | 'Buku Soft Cover' | 'Buku Soft Cover 14,5×20,25' | 'Buku Hard Cover 10,5×14,8' | 'Poster' | 'Majalah 14,5×20,25' | 'Stiker' | 'Buku Soft Cover 10,5×14,8' | 'Buku Hard Cover 14,5×20,25' | 'Buku Hard Cover 21×29,7' | 'Kalender Kop' | 'Packaging' | 'Paperbag'>('ALL');
  
  const handleFilterChange = (val: 'ALL' | 'Kalender' | 'Buku Manasik' | 'Buku Yasin' | 'Nota 1 Warna' | 'Brosur 2026' | 'Label KHQ' | 'Buku Tulis' | 'Stopmap' | 'Syahadah' | 'Raport Kaleb' | 'Kop Surat' | 'Amplop' | 'Sertifikat' | 'Undangan' | 'Buku Tabungan NS' | 'Buku Tabungan Security' | 'Kartu Koperasi Promise' | 'Lebel Kartu Obat' | 'Buku Soft Cover' | 'Buku Soft Cover 14,5×20,25' | 'Buku Hard Cover 10,5×14,8' | 'Poster' | 'Majalah 14,5×20,25' | 'Stiker' | 'Buku Soft Cover 10,5×14,8' | 'Buku Hard Cover 14,5×20,25' | 'Buku Hard Cover 21×29,7' | 'Kalender Kop' | 'Packaging' | 'Paperbag') => {
    setFilterCategory(val);
    try {
      localStorage.setItem('sintak_pricelist_saved_list_filter', val);
    } catch (e) {
      console.error('Failed to save list filter to localStorage:', e);
    }
  };
  const [viewingDetailItem, setViewingDetailItem] = useState<UnifiedCalculationItem | null>(null);

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
  const [sertifikatList, setSertifikatList] = useState<SavedSertifikatSimulationItem[]>([]);
  const [undanganList, setUndanganList] = useState<SavedUndanganSimulationItem[]>([]);
  const [bukuTabunganNsList, setBukuTabunganNsList] = useState<SavedBukuTabunganNsSimulationItem[]>([]);
  const [bukuTabunganSecurityList, setBukuTabunganSecurityList] = useState<SavedBukuTabunganSecuritySimulationItem[]>([]);
  const [kartuKoperasiPromiseList, setKartuKoperasiPromiseList] = useState<SavedKartuKoperasiPromiseSimulationItem[]>([]);
  const [lebelKartuObatList, setLebelKartuObatList] = useState<SavedLebelKartuObatSimulationItem[]>([]);
  const [bukuSoftCoverList, setBukuSoftCoverList] = useState<SavedBukuSoftCoverSimulationItem[]>([]);
  const [bukuSoftCover145x2025List, setBukuSoftCover145x2025List] = useState<SavedBukuSoftCover145x2025SimulationItem[]>([]);
  const [bukuHardCover105x148List, setBukuHardCover105x148List] = useState<SavedBukuHardCover105x148SimulationItem[]>([]);
  const [posterList, setPosterList] = useState<SavedPosterSimulationItem[]>([]);
  const [majalahList, setMajalahList] = useState<SavedMajalahSimulationItem[]>([]);
  const [stikerList, setStikerList] = useState<SavedStikerSimulationItem[]>([]);
  const [bukuSoftCover105x148List, setBukuSoftCover105x148List] = useState<SavedBukuSoftCover105x148SimulationItem[]>([]);
  const [bukuHardCover145x2025List, setBukuHardCover145x2025List] = useState<SavedBukuHardCover145x2025SimulationItem[]>([]);
  const [bukuHardCover21x297List, setBukuHardCover21x297List] = useState<SavedBukuHardCover21x297SimulationItem[]>([]);
  const [kalenderKopList, setKalenderKopList] = useState<SavedKalenderKopSimulationItem[]>([]);
  const [packagingList, setPackagingList] = useState<SavedPackagingSimulationItem[]>([]);
  const [paperbagList, setPaperbagList] = useState<SavedPaperbagSimulationItem[]>([]);

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
        savedFilter === 'Amplop' ||
        savedFilter === 'Sertifikat' ||
        savedFilter === 'Undangan' ||
        savedFilter === 'Buku Tabungan NS' ||
        savedFilter === 'Buku Tabungan Security' ||
        savedFilter === 'Kartu Koperasi Promise' ||
        savedFilter === 'Lebel Kartu Obat' ||
        savedFilter === 'Buku Soft Cover' ||
        savedFilter === 'Buku Soft Cover 14,5×20,25' ||
        savedFilter === 'Buku Hard Cover 10,5×14,8' ||
        savedFilter === 'Poster' ||
        savedFilter === 'Majalah 14,5×20,25' ||
        savedFilter === 'Stiker' ||
        savedFilter === 'Buku Soft Cover 10,5×14,8' ||
        savedFilter === 'Buku Hard Cover 14,5×20,25' ||
        savedFilter === 'Buku Hard Cover 21×29,7' ||
        savedFilter === 'Kalender Kop' ||
        savedFilter === 'Packaging' ||
        savedFilter === 'Paperbag'
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

      const rawSert = localStorage.getItem('sintak_saved_sertifikat_simulations');
      if (rawSert) setSertifikatList(JSON.parse(rawSert));
      else setSertifikatList([]);

      const rawUnd = localStorage.getItem('sintak_saved_undangan_simulations');
      if (rawUnd) setUndanganList(JSON.parse(rawUnd));
      else setUndanganList([]);

      const rawBtn = localStorage.getItem('sintak_saved_buku_tabungan_ns_simulations');
      if (rawBtn) setBukuTabunganNsList(JSON.parse(rawBtn));
      else setBukuTabunganNsList([]);

      const rawBts = localStorage.getItem('sintak_saved_buku_tabungan_security_simulations');
      if (rawBts) setBukuTabunganSecurityList(JSON.parse(rawBts));
      else setBukuTabunganSecurityList([]);

      const rawKkp = localStorage.getItem('sintak_saved_kartu_koperasi_promise_simulations');
      if (rawKkp) setKartuKoperasiPromiseList(JSON.parse(rawKkp));
      else setKartuKoperasiPromiseList([]);

      const rawLko = localStorage.getItem('sintak_saved_lebel_kartu_obat_simulations');
      if (rawLko) setLebelKartuObatList(JSON.parse(rawLko));
      else setLebelKartuObatList([]);

      const rawBsc = localStorage.getItem('sintak_saved_buku_soft_cover_simulations');
      if (rawBsc) setBukuSoftCoverList(JSON.parse(rawBsc));
      else setBukuSoftCoverList([]);

      const rawBsc145 = localStorage.getItem('sintak_saved_buku_soft_cover_145x2025_simulations');
      if (rawBsc145) setBukuSoftCover145x2025List(JSON.parse(rawBsc145));
      else setBukuSoftCover145x2025List([]);

      const rawBhc105 = localStorage.getItem('sintak_saved_buku_hard_cover_105x148_simulations');
      if (rawBhc105) setBukuHardCover105x148List(JSON.parse(rawBhc105));
      else setBukuHardCover105x148List([]);

      const rawPoster = localStorage.getItem('sintak_saved_poster_simulations');
      if (rawPoster) setPosterList(JSON.parse(rawPoster));
      else setPosterList([]);

      const rawMajalah = localStorage.getItem('sintak_saved_majalah_simulations');
      if (rawMajalah) setMajalahList(JSON.parse(rawMajalah));
      else setMajalahList([]);

      const rawStiker = localStorage.getItem('sintak_saved_stiker_simulations');
      if (rawStiker) setStikerList(JSON.parse(rawStiker));
      else setStikerList([]);

      const rawBsc105 = localStorage.getItem('sintak_saved_buku_soft_cover_105x148_simulations');
      if (rawBsc105) setBukuSoftCover105x148List(JSON.parse(rawBsc105));
      else setBukuSoftCover105x148List([]);

      const rawBhc145 = localStorage.getItem('sintak_saved_buku_hard_cover_145x2025_simulations');
      if (rawBhc145) setBukuHardCover145x2025List(JSON.parse(rawBhc145));
      else setBukuHardCover145x2025List([]);

      const rawBhc21 = localStorage.getItem('sintak_saved_buku_hard_cover_21x297_simulations');
      if (rawBhc21) setBukuHardCover21x297List(JSON.parse(rawBhc21));
      else setBukuHardCover21x297List([]);

      const rawKalenderKop = localStorage.getItem('sintak_saved_kalender_kop_simulations');
      if (rawKalenderKop) setKalenderKopList(JSON.parse(rawKalenderKop));
      else setKalenderKopList([]);
      const rawPkg = localStorage.getItem('sintak_saved_packaging_simulations');
      if (rawPkg) setPackagingList(JSON.parse(rawPkg));
      else setPackagingList([]);
      const rawPb = localStorage.getItem('sintak_saved_paperbag_simulations');
      if (rawPb) setPaperbagList(JSON.parse(rawPb));
      else setPaperbagList([]);
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

    // 13. Sertifikat
    sertifikatList.forEach((s) => {
      const inp = s.data.input;
      const lam = inp.laminasi !== 'Tanpa Laminasi' ? ` · ${inp.laminasi}` : '';
      const foil = inp.opsiFoil ? ' +Foil' : '';
      items.push({
        id: s.id,
        category: 'Sertifikat',
        savedAt: s.savedAt,
        title: s.title,
        oplah: inp.oplah,
        specSummary: `Sertifikat ${inp.varian}${lam}${foil} • ${inp.oplah.toLocaleString('id-ID')} pcs`,
        detailSpecs: [
          `Bahan: ${inp.varian} · A4 21×29,7 cm · ${s.data.kebutuhanA3} lbr A3+`,
          `Finishing: ${inp.laminasi}${foil ? ' +Foil Emas' : ''} + Potong + Packing Kardus`,
          `Margin: ${inp.marginPct}%`,
        ],
        hppUnit: s.data.hppPerPcs,
        hargaJualUnit: s.data.hargaJualPerPcs,
        totalOmset: s.data.totalHargaJual,
        marginPct: inp.marginPct,
        negoDiskonPct: inp.negoDiskonPct,
        rawData: s,
      });
    });

    // 14. Undangan
    undanganList.forEach((u) => {
      const inp = u.data.input;
      const lam = inp.laminasi !== 'Tanpa Laminasi' ? ` · ${inp.laminasi}` : '';
      items.push({
        id: u.id,
        category: 'Undangan',
        savedAt: u.savedAt,
        title: u.title,
        oplah: inp.oplah,
        specSummary: `Undangan ${inp.varian}${lam} • ${inp.oplah.toLocaleString('id-ID')} pcs`,
        detailSpecs: [
          `Bahan: ${inp.varian} · ${u.data.kebutuhanA3} lbr A3+`,
          `Finishing: Sisir + OPP + Label${lam ? ` + ${inp.laminasi}` : ''} + Packing Kardus`,
          `Margin: ${inp.marginPct}%`,
        ],
        hppUnit: u.data.hppPerPcs,
        hargaJualUnit: u.data.hargaJualPerPcs,
        totalOmset: u.data.totalHargaJual,
        marginPct: inp.marginPct,
        negoDiskonPct: inp.negoDiskonPct,
        rawData: u,
      });
    });

    // 15. Buku Tabungan NS
    bukuTabunganNsList.forEach((b) => {
      const inp = b.data.input;
      items.push({
        id: b.id,
        category: 'Buku Tabungan NS',
        savedAt: b.savedAt,
        title: b.title,
        oplah: inp.oplah,
        specSummary: `Buku Tabungan NS ${inp.varian} • ${inp.oplah.toLocaleString('id-ID')} pcs`,
        detailSpecs: [
          `Bahan: Cover AC 260 1 Muka FC + HVS 70 1W BB · ${b.data.kebutuhanCoverA3 + b.data.kebutuhanIsiA3} lbr A3+`,
          `Finishing: Laminasi Glossy + Susun Lipat + Jahit + Pound + Sring + Packing Kardus`,
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

    // 16. Buku Tabungan Security
    bukuTabunganSecurityList.forEach((b) => {
      const inp = b.data.input;
      items.push({
        id: b.id,
        category: 'Buku Tabungan Security',
        savedAt: b.savedAt,
        title: b.title,
        oplah: inp.oplah,
        specSummary: `Buku Tabungan Security ${inp.varian} • ${inp.oplah.toLocaleString('id-ID')} pcs`,
        detailSpecs: [
          `Bahan: Cover Ivory 260 Security 1 Muka FC + HVS 70 1W BB · ${b.data.kebutuhanCoverA3 + b.data.kebutuhanIsiA3} lbr A3+`,
          `Finishing: Laminasi Glossy + Foil Emas + Numbering + Susun Lipat + Jahit + Pound + Sring + Packing Kardus`,
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

    // 17. Kartu Koperasi Promise
    kartuKoperasiPromiseList.forEach((k) => {
      const inp = k.data.input;
      items.push({
        id: k.id,
        category: 'Kartu Koperasi Promise',
        savedAt: k.savedAt,
        title: k.title,
        oplah: inp.oplah,
        specSummary: `Kartu Koperasi Promise ${inp.varian} • ${inp.oplah.toLocaleString('id-ID')} pcs`,
        detailSpecs: [
          `Bahan: BC 160 gsm 2 Muka 1 Warna · ${k.data.kebutuhanPlano} lbr plano`,
          `Finishing: Pound + Sisir + Packing Kardus (Pisau ${k.data.kebutuhanCetak} plat)`,
          `Margin: ${inp.marginPct}%`,
        ],
        hppUnit: k.data.hppPerPcs,
        hargaJualUnit: k.data.hargaJualPerPcs,
        totalOmset: k.data.totalHargaJual,
        marginPct: inp.marginPct,
        negoDiskonPct: inp.negoDiskonPct,
        rawData: k,
      });
    });

    // 18. Lebel Kartu Obat
    lebelKartuObatList.forEach((l) => {
      const inp = l.data.input;
      items.push({
        id: l.id,
        category: 'Lebel Kartu Obat',
        savedAt: l.savedAt,
        title: l.title,
        oplah: inp.oplah,
        specSummary: `Lebel Kartu Obat ${inp.varian} • ${inp.oplah.toLocaleString('id-ID')} rim (${(inp.oplah * 500).toLocaleString('id-ID')} lbr)`,
        detailSpecs: [
          `Bahan: HVS 70 gsm 1 Warna 1 Muka · ${l.data.kebutuhanPlano} lbr plano`,
          `Finishing: Rajang + Packing (Cetak ${l.data.kebutuhanCetak} lbr)`,
          `Margin: ${inp.marginPct}%`,
        ],
        hppUnit: l.data.hppPerRim,
        hargaJualUnit: l.data.hargaJualPerRim,
        totalOmset: l.data.totalHargaJual,
        marginPct: inp.marginPct,
        negoDiskonPct: inp.negoDiskonPct,
        rawData: l,
      });
    });

    // 19. Buku Soft Cover
    bukuSoftCoverList.forEach((b) => {
      const inp = b.data.input;
      items.push({
        id: b.id,
        category: 'Buku Soft Cover',
        savedAt: b.savedAt,
        title: b.title,
        oplah: inp.oplah,
        specSummary: `Buku Soft Cover ${inp.varian} 32 Hal • ${inp.oplah.toLocaleString('id-ID')} pcs`,
        detailSpecs: [
          `Cover: AC 230 (Print Inter) · ${b.data.kebutuhanCoverA3} lbr A3+`,
          `Isi: HVS 70 Oliver · ${b.data.kebutuhanPlanoIsi} plano · Finishing: ${inp.finishing}`,
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

    // 20. Buku Soft Cover 14,5×20,25
    bukuSoftCover145x2025List.forEach((b) => {
      const inp = b.data.input;
      items.push({
        id: b.id,
        category: 'Buku Soft Cover 14,5×20,25',
        savedAt: b.savedAt,
        title: b.title,
        oplah: inp.oplah,
        specSummary: `Buku Soft Cover 14,5×20,25 cm • ${inp.oplah.toLocaleString('id-ID')} pcs (${b.data.prosesCetak})`,
        detailSpecs: [
          `Cover: AC 230 (${inp.finishing}) · Isi: HVS 70 32 Hal`,
          `Proses: ${b.data.prosesCetak} · Jilid: ${inp.jilid}`,
          `Margin: ${inp.marginPct}% · Nego: ${inp.negoDiskonPct}%`,
        ],
        hppUnit: b.data.hppPerPcs,
        hargaJualUnit: b.data.hargaJualPerPcs,
        totalOmset: b.data.totalHargaJual,
        marginPct: inp.marginPct,
        negoDiskonPct: inp.negoDiskonPct,
        rawData: b,
      });
    });

    // 21. Buku Hard Cover 10,5×14,8
    bukuHardCover105x148List.forEach((b) => {
      const inp = b.data.input;
      items.push({
        id: b.id,
        category: 'Buku Hard Cover 10,5×14,8',
        savedAt: b.savedAt,
        title: b.title,
        oplah: inp.oplah,
        specSummary: `Buku Hard Cover 10,5×14,8 cm • ${inp.oplah.toLocaleString('id-ID')} pcs (${b.data.prosesCetak})`,
        detailSpecs: [
          `Cover: AP 150 + Board (${inp.finishing}${inp.opsiFoil ? ' + Foil' : ''})`,
          `Isi: HVS 70 100 Hal · Jilid: Jahit + Casing In`,
          `Margin: ${inp.marginPct}% · Nego: ${inp.negoDiskonPct}%`,
        ],
        hppUnit: b.data.hppPerPcs,
        hargaJualUnit: b.data.hargaJualPerPcs,
        totalOmset: b.data.totalHargaJual,
        marginPct: inp.marginPct,
        negoDiskonPct: inp.negoDiskonPct,
        rawData: b,
      });
    });

    // 22. Poster
    posterList.forEach((p) => {
      const inp = p.data.input;
      items.push({
        id: p.id,
        category: 'Poster',
        savedAt: p.savedAt,
        title: p.title,
        oplah: inp.oplah,
        specSummary: `Poster ${inp.ukuran} • ${inp.oplah.toLocaleString('id-ID')} pcs (${p.data.prosesCetak})`,
        detailSpecs: [
          `Bahan: AC 230 gsm 1 Muka · ${inp.finishing}`,
          `Proses: ${p.data.prosesCetak} · Sisir + Packing`,
          `Margin: ${inp.marginPct}% · Nego: ${inp.negoDiskonPct}%`,
        ],
        hppUnit: p.data.hppPerPcs,
        hargaJualUnit: p.data.hargaJualPerPcs,
        totalOmset: p.data.totalHargaJual,
        marginPct: inp.marginPct,
        negoDiskonPct: inp.negoDiskonPct,
        rawData: p,
      });
    });

    // 23. Majalah 14,5×20,25
    majalahList.forEach((m) => {
      const inp = m.data.input;
      items.push({
        id: m.id,
        category: 'Majalah 14,5×20,25',
        savedAt: m.savedAt,
        title: m.title,
        oplah: inp.oplah,
        specSummary: `Majalah 14,5×20,25 cm • ${inp.oplah.toLocaleString('id-ID')} pcs (${m.data.prosesCetak})`,
        detailSpecs: [
          `Cover: AC 230 (${inp.finishing}) · Isi: AP 120 FC 32 Hal`,
          `Proses: ${m.data.prosesCetak} · Jilid: ${inp.jilid}`,
          `Margin: ${inp.marginPct}% · Nego: ${inp.negoDiskonPct}%`,
        ],
        hppUnit: m.data.hppPerPcs,
        hargaJualUnit: m.data.hargaJualPerPcs,
        totalOmset: m.data.totalHargaJual,
        marginPct: inp.marginPct,
        negoDiskonPct: inp.negoDiskonPct,
        rawData: m,
      });
    });

    // 24. Stiker
    stikerList.forEach((s) => {
      const inp = s.data.input;
      items.push({
        id: s.id,
        category: 'Stiker',
        savedAt: s.savedAt,
        title: s.title,
        oplah: inp.oplah,
        specSummary: `Stiker ${inp.ukuran} • ${inp.oplah.toLocaleString('id-ID')} pcs (${inp.finishing})`,
        detailSpecs: [
          `Bahan: Sticker Vinyl Glossy 200 gsm`,
          `Finishing: ${inp.finishing}`,
          `Margin: ${inp.marginPct}% · Nego: ${inp.negoDiskonPct}%`,
        ],
        hppUnit: s.data.hppPerPcs,
        hargaJualUnit: s.data.hargaJualPerPcs,
        totalOmset: s.data.totalHargaJual,
        marginPct: inp.marginPct,
        negoDiskonPct: inp.negoDiskonPct,
        rawData: s,
      });
    });

    // 25. Buku Soft Cover 10,5×14,8
    bukuSoftCover105x148List.forEach((b) => {
      const inp = b.data.input;
      items.push({
        id: b.id,
        category: 'Buku Soft Cover 10,5×14,8',
        savedAt: b.savedAt,
        title: b.title,
        oplah: inp.oplah,
        specSummary: `Buku Soft Cover 10,5×14,8 cm • ${inp.oplah.toLocaleString('id-ID')} pcs (${b.data.prosesCetak})`,
        detailSpecs: [
          `Cover: AC 230 (${inp.finishing}) · Isi: HVS 70 32 Hal`,
          `Proses: ${b.data.prosesCetak} · Jilid: ${inp.jilid}`,
          `Margin: ${inp.marginPct}% · Nego: ${inp.negoDiskonPct}%`,
        ],
        hppUnit: b.data.hppPerPcs,
        hargaJualUnit: b.data.hargaJualPerPcs,
        totalOmset: b.data.totalHargaJual,
        marginPct: inp.marginPct,
        negoDiskonPct: inp.negoDiskonPct,
        rawData: b,
      });
    });

    // 26. Buku Hard Cover 14,5×20,25
    bukuHardCover145x2025List.forEach((b) => {
      const inp = b.data.input;
      items.push({
        id: b.id,
        category: 'Buku Hard Cover 14,5×20,25',
        savedAt: b.savedAt,
        title: b.title,
        oplah: inp.oplah,
        specSummary: `Buku Hard Cover 14,5×20,25 cm • ${inp.oplah.toLocaleString('id-ID')} pcs (${b.data.prosesCetak})`,
        detailSpecs: [
          `Cover: AP 150 + Board (${inp.finishing}${inp.opsiFoil ? ' + Foil' : ''})`,
          `Isi: HVS 70 100 Hal · Jilid: Jahit + Casing In`,
          `Margin: ${inp.marginPct}% · Nego: ${inp.negoDiskonPct}%`,
        ],
        hppUnit: b.data.hppPerPcs,
        hargaJualUnit: b.data.hargaJualPerPcs,
        totalOmset: b.data.totalHargaJual,
        marginPct: inp.marginPct,
        negoDiskonPct: inp.negoDiskonPct,
        rawData: b,
      });
    });

    // 27. Buku Hard Cover 21×29,7
    bukuHardCover21x297List.forEach((b) => {
      const inp = b.data.input;
      items.push({
        id: b.id,
        category: 'Buku Hard Cover 21×29,7',
        savedAt: b.savedAt,
        title: b.title,
        oplah: inp.oplah,
        specSummary: `Buku Hard Cover 21×29,7 cm • ${inp.oplah.toLocaleString('id-ID')} pcs (${b.data.prosesCetak})`,
        detailSpecs: [
          `Cover: AP 150 + Board (${inp.finishing}${inp.opsiFoil ? ' + Foil' : ''})`,
          `Isi: HVS 70 100 Hal A4 · Jilid: Jahit + Casing In`,
          `Margin: ${inp.marginPct}% · Nego: ${inp.negoDiskonPct}%`,
        ],
        hppUnit: b.data.hppPerPcs,
        hargaJualUnit: b.data.hargaJualPerPcs,
        totalOmset: b.data.totalHargaJual,
        marginPct: inp.marginPct,
        negoDiskonPct: inp.negoDiskonPct,
        rawData: b,
      });
    });

    // 28. Kalender Kop
    kalenderKopList.forEach((k) => {
      const inp = k.data.input;
      items.push({
        id: k.id,
        category: 'Kalender Kop',
        savedAt: k.savedAt,
        title: k.title,
        oplah: inp.oplah,
        specSummary: `Kalender Kop ${inp.varian} • ${inp.oplah.toLocaleString('id-ID')} eks (6 Lembar Dwi Wulan)`,
        detailSpecs: [
          `Blanko: AP 120 gsm 32×48 cm`,
          `Cetak Kop: ${inp.varian} · Jilid Klem Seng`,
          `Margin: ${inp.marginPct ?? 0}% · Nego: ${inp.negoDiskonPct ?? 4}%`,
        ],
        hppUnit: k.data.hppPerPcs,
        hargaJualUnit: k.data.hargaJualPerPcs,
        totalOmset: k.data.totalHargaJual,
        marginPct: inp.marginPct ?? 0,
        negoDiskonPct: inp.negoDiskonPct ?? 4,
        rawData: k,
      });
    });

    // 29. Packaging Box Dus
    packagingList.forEach((p) => {
      const inp = p.data.input;
      items.push({
        id: p.id,
        category: 'Packaging',
        savedAt: p.savedAt,
        title: p.title,
        oplah: inp.oplah,
        specSummary: `Packaging ${inp.ukuran} (${inp.bahan}) • ${inp.oplah.toLocaleString('id-ID')} pcs (${p.data.prosesCetak})`,
        detailSpecs: [
          `Ukuran: ${inp.ukuran} · Terbuka: ${p.data.variantSpec.ukuranTerbuka}`,
          `Bahan: ${inp.bahan} (${p.data.variantSpec.planoYield} box/pln) · Pond Die Cut`,
          `Finishing: ${inp.finishing} · Margin: ${inp.marginPct}%`,
        ],
        hppUnit: p.data.hppPerPcs,
        hargaJualUnit: p.data.hargaJualPerPcs,
        totalOmset: p.data.totalHargaJual,
        marginPct: inp.marginPct,
        negoDiskonPct: inp.negoDiskonPct,
        rawData: p,
      });
    });

    // 30. Paperbag
    paperbagList.forEach((p) => {
      const inp = p.data.input;
      items.push({
        id: p.id,
        category: 'Paperbag',
        savedAt: p.savedAt,
        title: p.title,
        oplah: inp.oplah,
        specSummary: `Paperbag ${inp.ukuran} • ${inp.oplah.toLocaleString('id-ID')} pcs (${p.data.prosesCetak})`,
        detailSpecs: [
          `Ukuran: ${inp.ukuran} · AC 230g (${p.data.spec.planoYieldTas} tas/pln)`,
          `Finishing: Pond + Double Tape + Tali Kur + Lipat`,
          `Tambahan: ${inp.finishing} · Margin: ${inp.marginPct}%`,
        ],
        hppUnit: p.data.hppPerPcs,
        hargaJualUnit: p.data.hargaJualPerPcs,
        totalOmset: p.data.totalHargaJual,
        marginPct: inp.marginPct,
        negoDiskonPct: inp.negoDiskonPct,
        rawData: p,
      });
    });

    // Urutkan dari yang terbaru disimpan
    return items.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
  }, [kalenderList, manasikList, yasinList, notaList, brosurList, labelKhqList, bukuTulisList, stopmapList, syahadahList, raportKalebList, kopSuratList, amplopList, sertifikatList, undanganList, bukuTabunganNsList, bukuTabunganSecurityList, kartuKoperasiPromiseList, lebelKartuObatList, bukuSoftCoverList, bukuSoftCover145x2025List, bukuHardCover105x148List, posterList, majalahList, stikerList, bukuSoftCover105x148List, bukuHardCover145x2025List, bukuHardCover21x297List, kalenderKopList, packagingList, paperbagList]);

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
      } else if (item.category === 'Sertifikat') {
        const updated = sertifikatList.filter((s) => s.id !== item.id);
        setSertifikatList(updated);
        localStorage.setItem('sintak_saved_sertifikat_simulations', JSON.stringify(updated));
      } else if (item.category === 'Undangan') {
        const updated = undanganList.filter((u) => u.id !== item.id);
        setUndanganList(updated);
        localStorage.setItem('sintak_saved_undangan_simulations', JSON.stringify(updated));
      } else if (item.category === 'Buku Tabungan NS') {
        const updated = bukuTabunganNsList.filter((b) => b.id !== item.id);
        setBukuTabunganNsList(updated);
        localStorage.setItem('sintak_saved_buku_tabungan_ns_simulations', JSON.stringify(updated));
      } else if (item.category === 'Buku Tabungan Security') {
        const updated = bukuTabunganSecurityList.filter((b) => b.id !== item.id);
        setBukuTabunganSecurityList(updated);
        localStorage.setItem('sintak_saved_buku_tabungan_security_simulations', JSON.stringify(updated));
      } else if (item.category === 'Kartu Koperasi Promise') {
        const updated = kartuKoperasiPromiseList.filter((k) => k.id !== item.id);
        setKartuKoperasiPromiseList(updated);
        localStorage.setItem('sintak_saved_kartu_koperasi_promise_simulations', JSON.stringify(updated));
      } else if (item.category === 'Lebel Kartu Obat') {
        const updated = lebelKartuObatList.filter((l) => l.id !== item.id);
        setLebelKartuObatList(updated);
        localStorage.setItem('sintak_saved_lebel_kartu_obat_simulations', JSON.stringify(updated));
      } else if (item.category === 'Buku Soft Cover') {
        const updated = bukuSoftCoverList.filter((b) => b.id !== item.id);
        setBukuSoftCoverList(updated);
        localStorage.setItem('sintak_saved_buku_soft_cover_simulations', JSON.stringify(updated));
      } else if (item.category === 'Buku Soft Cover 14,5×20,25') {
        const updated = bukuSoftCover145x2025List.filter((b) => b.id !== item.id);
        setBukuSoftCover145x2025List(updated);
        localStorage.setItem('sintak_saved_buku_soft_cover_145x2025_simulations', JSON.stringify(updated));
      } else if (item.category === 'Buku Hard Cover 10,5×14,8') {
        const updated = bukuHardCover105x148List.filter((b) => b.id !== item.id);
        setBukuHardCover105x148List(updated);
        localStorage.setItem('sintak_saved_buku_hard_cover_105x148_simulations', JSON.stringify(updated));
      } else if (item.category === 'Poster') {
        const updated = posterList.filter((p) => p.id !== item.id);
        setPosterList(updated);
        localStorage.setItem('sintak_saved_poster_simulations', JSON.stringify(updated));
      } else if (item.category === 'Majalah 14,5×20,25') {
        const updated = majalahList.filter((m) => m.id !== item.id);
        setMajalahList(updated);
        localStorage.setItem('sintak_saved_majalah_simulations', JSON.stringify(updated));
      } else if (item.category === 'Stiker') {
        const updated = stikerList.filter((s) => s.id !== item.id);
        setStikerList(updated);
        localStorage.setItem('sintak_saved_stiker_simulations', JSON.stringify(updated));
      } else if (item.category === 'Buku Soft Cover 10,5×14,8') {
        const updated = bukuSoftCover105x148List.filter((b) => b.id !== item.id);
        setBukuSoftCover105x148List(updated);
        localStorage.setItem('sintak_saved_buku_soft_cover_105x148_simulations', JSON.stringify(updated));
      } else if (item.category === 'Buku Hard Cover 14,5×20,25') {
        const updated = bukuHardCover145x2025List.filter((b) => b.id !== item.id);
        setBukuHardCover145x2025List(updated);
        localStorage.setItem('sintak_saved_buku_hard_cover_145x2025_simulations', JSON.stringify(updated));
      } else if (item.category === 'Buku Hard Cover 21×29,7') {
        const updated = bukuHardCover21x297List.filter((b) => b.id !== item.id);
        setBukuHardCover21x297List(updated);
        localStorage.setItem('sintak_saved_buku_hard_cover_21x297_simulations', JSON.stringify(updated));
      } else if (item.category === 'Kalender Kop') {
        const updated = kalenderKopList.filter((k) => k.id !== item.id);
        setKalenderKopList(updated);
        localStorage.setItem('sintak_saved_kalender_kop_simulations', JSON.stringify(updated));
      } else if (item.category === 'Packaging') {
        const updated = packagingList.filter((p) => p.id !== item.id);
        setPackagingList(updated);
        localStorage.setItem('sintak_saved_packaging_simulations', JSON.stringify(updated));
      } else if (item.category === 'Paperbag') {
        const updated = paperbagList.filter((p) => p.id !== item.id);
        setPaperbagList(updated);
        localStorage.setItem('sintak_saved_paperbag_simulations', JSON.stringify(updated));
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
      } else if (item.category === 'Sertifikat') {
        const updated = sertifikatList.map((s) => (s.id === item.id ? { ...s, title: newTitle } : s));
        setSertifikatList(updated);
        localStorage.setItem('sintak_saved_sertifikat_simulations', JSON.stringify(updated));
      } else if (item.category === 'Undangan') {
        const updated = undanganList.map((u) => (u.id === item.id ? { ...u, title: newTitle } : u));
        setUndanganList(updated);
        localStorage.setItem('sintak_saved_undangan_simulations', JSON.stringify(updated));
      } else if (item.category === 'Buku Tabungan NS') {
        const updated = bukuTabunganNsList.map((b) => (b.id === item.id ? { ...b, title: newTitle } : b));
        setBukuTabunganNsList(updated);
        localStorage.setItem('sintak_saved_buku_tabungan_ns_simulations', JSON.stringify(updated));
      } else if (item.category === 'Buku Tabungan Security') {
        const updated = bukuTabunganSecurityList.map((b) => (b.id === item.id ? { ...b, title: newTitle } : b));
        setBukuTabunganSecurityList(updated);
        localStorage.setItem('sintak_saved_buku_tabungan_security_simulations', JSON.stringify(updated));
      } else if (item.category === 'Kartu Koperasi Promise') {
        const updated = kartuKoperasiPromiseList.map((k) => (k.id === item.id ? { ...k, title: newTitle } : k));
        setKartuKoperasiPromiseList(updated);
        localStorage.setItem('sintak_saved_kartu_koperasi_promise_simulations', JSON.stringify(updated));
      } else if (item.category === 'Lebel Kartu Obat') {
        const updated = lebelKartuObatList.map((l) => (l.id === item.id ? { ...l, title: newTitle } : l));
        setLebelKartuObatList(updated);
        localStorage.setItem('sintak_saved_lebel_kartu_obat_simulations', JSON.stringify(updated));
      } else if (item.category === 'Buku Soft Cover') {
        const updated = bukuSoftCoverList.map((b) => (b.id === item.id ? { ...b, title: newTitle } : b));
        setBukuSoftCoverList(updated);
        localStorage.setItem('sintak_saved_buku_soft_cover_simulations', JSON.stringify(updated));
      } else if (item.category === 'Buku Soft Cover 14,5×20,25') {
        const updated = bukuSoftCover145x2025List.map((b) => (b.id === item.id ? { ...b, title: newTitle } : b));
        setBukuSoftCover145x2025List(updated);
        localStorage.setItem('sintak_saved_buku_soft_cover_145x2025_simulations', JSON.stringify(updated));
      } else if (item.category === 'Buku Hard Cover 10,5×14,8') {
        const updated = bukuHardCover105x148List.map((b) => (b.id === item.id ? { ...b, title: newTitle } : b));
        setBukuHardCover105x148List(updated);
        localStorage.setItem('sintak_saved_buku_hard_cover_105x148_simulations', JSON.stringify(updated));
      } else if (item.category === 'Poster') {
        const updated = posterList.map((p) => (p.id === item.id ? { ...p, title: newTitle } : p));
        setPosterList(updated);
        localStorage.setItem('sintak_saved_poster_simulations', JSON.stringify(updated));
      } else if (item.category === 'Majalah 14,5×20,25') {
        const updated = majalahList.map((m) => (m.id === item.id ? { ...m, title: newTitle } : m));
        setMajalahList(updated);
        localStorage.setItem('sintak_saved_majalah_simulations', JSON.stringify(updated));
      } else if (item.category === 'Stiker') {
        const updated = stikerList.map((s) => (s.id === item.id ? { ...s, title: newTitle } : s));
        setStikerList(updated);
        localStorage.setItem('sintak_saved_stiker_simulations', JSON.stringify(updated));
      } else if (item.category === 'Buku Soft Cover 10,5×14,8') {
        const updated = bukuSoftCover105x148List.map((b) => (b.id === item.id ? { ...b, title: newTitle } : b));
        setBukuSoftCover105x148List(updated);
        localStorage.setItem('sintak_saved_buku_soft_cover_105x148_simulations', JSON.stringify(updated));
      } else if (item.category === 'Buku Hard Cover 14,5×20,25') {
        const updated = bukuHardCover145x2025List.map((b) => (b.id === item.id ? { ...b, title: newTitle } : b));
        setBukuHardCover145x2025List(updated);
        localStorage.setItem('sintak_saved_buku_hard_cover_145x2025_simulations', JSON.stringify(updated));
      } else if (item.category === 'Buku Hard Cover 21×29,7') {
        const updated = bukuHardCover21x297List.map((b) => (b.id === item.id ? { ...b, title: newTitle } : b));
        setBukuHardCover21x297List(updated);
        localStorage.setItem('sintak_saved_buku_hard_cover_21x297_simulations', JSON.stringify(updated));
      } else if (item.category === 'Kalender Kop') {
        const updated = kalenderKopList.map((k) => (k.id === item.id ? { ...k, title: newTitle } : k));
        setKalenderKopList(updated);
        localStorage.setItem('sintak_saved_kalender_kop_simulations', JSON.stringify(updated));
      } else if (item.category === 'Packaging') {
        const updated = packagingList.map((p) => (p.id === item.id ? { ...p, title: newTitle } : p));
        setPackagingList(updated);
        localStorage.setItem('sintak_saved_packaging_simulations', JSON.stringify(updated));
      } else if (item.category === 'Paperbag') {
        const updated = paperbagList.map((p) => (p.id === item.id ? { ...p, title: newTitle } : p));
        setPaperbagList(updated);
        localStorage.setItem('sintak_saved_paperbag_simulations', JSON.stringify(updated));
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
    } else if (item.category === 'Sertifikat') {
      const s = item.rawData as SavedSertifikatSimulationItem;
      const inp = s.data.input;
      const foilTxt = inp.opsiFoil ? ' + Foil Emas' : '';
      const lamTxt = inp.laminasi !== 'Tanpa Laminasi' ? ` + Laminasi ${inp.laminasi}` : '';
      text = `*PENAWARAN SERTIFIKAT*\n*PT Buya Barokah*\n━━━━━━━━━━━━━━━━━━━━\n• *Produk*: Sertifikat ${inp.varian}${lamTxt}${foilTxt} A4 21×29,7 cm\n• *Bahan*: ${inp.varian.includes('Ivory') ? 'Ivory 260' : 'Art Carton 260'} gsm\n• *Kuantitas*: ${inp.oplah.toLocaleString('id-ID')} pcs (2 pcs/A3+)\n• *Cetak*: Full Colour ${inp.varian.includes('2 Muka') ? '2 Muka' : '1 Muka'}${inp.oplah > 500 ? ' (Oliver)' : ' (Print Inter)'}\n• *Finishing*: ${inp.laminasi}${foilTxt ? ' + Foil Emas' : ''} + Potong + Packing Kardus\n━━━━━━━━━━━━━━━━━━━━\n• *Harga / Pcs*: *Rp ${s.data.hargaJualPerPcs.toLocaleString('id-ID')}*\n• *Total Penawaran*: *Rp ${s.data.totalHargaJual.toLocaleString('id-ID')}*\n━━━━━━━━━━━━━━━━━━━━\n_Harga belum termasuk PPN._`;
    } else if (item.category === 'Undangan') {
      const u = item.rawData as SavedUndanganSimulationItem;
      const inp = u.data.input;
      const lamTxt = inp.laminasi !== 'Tanpa Laminasi' ? ` + Laminasi ${inp.laminasi}` : '';
      text = `*PENAWARAN UNDANGAN*\n*PT Buya Barokah*\n━━━━━━━━━━━━━━━━━━━━\n• *Produk*: Undangan ${inp.varian}${lamTxt}\n• *Bahan*: Art Carton 230 gsm · ${inp.varian}\n• *Kuantitas*: ${inp.oplah.toLocaleString('id-ID')} pcs (${u.data.kebutuhanA3} lbr A3+)\n• *Cetak*: Full Colour ${inp.varian.includes('2 Muka') ? '2 Muka' : '1 Muka'}${inp.oplah > 500 ? ' (Oliver)' : ' (Print Inter)'}\n• *Finishing*: Sisir + OPP + Label${lamTxt ? ` + ${inp.laminasi}` : ''} + Packing Kardus\n━━━━━━━━━━━━━━━━━━━━\n• *Harga / Pcs*: *Rp ${u.data.hargaJualPerPcs.toLocaleString('id-ID')}*\n• *Total Penawaran*: *Rp ${u.data.totalHargaJual.toLocaleString('id-ID')}*\n━━━━━━━━━━━━━━━━━━━━\n_Harga belum termasuk PPN._`;
    } else if (item.category === 'Buku Tabungan NS') {
      const b = item.rawData as SavedBukuTabunganNsSimulationItem;
      const inp = b.data.input;
      text = `*PENAWARAN BUKU TABUNGAN NON SECURITY*\n*PT Buya Barokah*\n━━━━━━━━━━━━━━━━━━━━\n• *Produk*: Buku Tabungan NS ${inp.varian} 9×14,5 cm\n• *Bahan*: Cover AC 260 gsm 1 Muka FC + Laminasi Glossy, Isi HVS 70 gsm 1W BB\n• *Kuantitas*: ${inp.oplah.toLocaleString('id-ID')} pcs (${b.data.kebutuhanCoverA3 + b.data.kebutuhanIsiA3} lbr A3+)\n• *Finishing*: Susun Lipat + Jahit + Pound + Plastik Sring + Packing Kardus\n━━━━━━━━━━━━━━━━━━━━\n• *Harga / Pcs*: *Rp ${b.data.hargaJualPerPcs.toLocaleString('id-ID')}*\n• *Total Penawaran*: *Rp ${b.data.totalHargaJual.toLocaleString('id-ID')}*\n━━━━━━━━━━━━━━━━━━━━\n_Harga belum termasuk PPN._`;
    } else if (item.category === 'Buku Tabungan Security') {
      const b = item.rawData as SavedBukuTabunganSecuritySimulationItem;
      const inp = b.data.input;
      text = `*PENAWARAN BUKU TABUNGAN SECURITY*\n*PT Buya Barokah*\n━━━━━━━━━━━━━━━━━━━━\n• *Produk*: Buku Tabungan Security ${inp.varian} 9×14,5 cm\n• *Bahan*: Cover Ivory 260 gsm Security 1 Muka FC + Laminasi Glossy + Foil Emas, Isi HVS 70 gsm 1W BB\n• *Kuantitas*: ${inp.oplah.toLocaleString('id-ID')} pcs (${b.data.kebutuhanCoverA3 + b.data.kebutuhanIsiA3} lbr A3+)\n• *Finishing*: Susun Lipat + Jahit + Pound + Foil Emas + Numbering Seri + Plastik Sring + Packing Kardus\n━━━━━━━━━━━━━━━━━━━━\n• *Harga / Pcs*: *Rp ${b.data.hargaJualPerPcs.toLocaleString('id-ID')}*\n• *Total Penawaran*: *Rp ${b.data.totalHargaJual.toLocaleString('id-ID')}*\n━━━━━━━━━━━━━━━━━━━━\n_Harga belum termasuk PPN._`;
    } else if (item.category === 'Kartu Koperasi Promise') {
      const k = item.rawData as SavedKartuKoperasiPromiseSimulationItem;
      const inp = k.data.input;
      text = `*PENAWARAN KARTU KOPERASI PROMISE*\n*PT Buya Barokah*\n━━━━━━━━━━━━━━━━━━━━\n• *Produk*: Kartu Koperasi Promise ${inp.varian} cm\n• *Bahan*: BC 160 gsm 2 Muka 1 Warna\n• *Kuantitas*: ${inp.oplah.toLocaleString('id-ID')} pcs (${k.data.kebutuhanPlano} lbr plano)\n• *Finishing*: Pound + Sisir + Packing Kardus\n━━━━━━━━━━━━━━━━━━━━\n• *Harga / Pcs*: *Rp ${k.data.hargaJualPerPcs.toLocaleString('id-ID')}*\n• *Total Penawaran*: *Rp ${k.data.totalHargaJual.toLocaleString('id-ID')}*\n━━━━━━━━━━━━━━━━━━━━\n_Harga belum termasuk PPN._`;
    } else if (item.category === 'Lebel Kartu Obat') {
      const l = item.rawData as SavedLebelKartuObatSimulationItem;
      const inp = l.data.input;
      text = `*PENAWARAN LEBEL KARTU OBAT*\n*PT Buya Barokah*\n━━━━━━━━━━━━━━━━━━━━\n• *Produk*: Lebel Kartu Obat ${inp.varian} cm\n• *Bahan*: HVS 70 gsm 1 Warna 1 Muka\n• *Kuantitas*: ${inp.oplah.toLocaleString('id-ID')} rim (${(inp.oplah * 500).toLocaleString('id-ID')} lbr, ${l.data.kebutuhanPlano} lbr plano)\n• *Finishing*: Rajang + Packing\n━━━━━━━━━━━━━━━━━━━━\n• *Harga / Rim*: *Rp ${l.data.hargaJualPerRim.toLocaleString('id-ID')}*\n• *Total Penawaran*: *Rp ${l.data.totalHargaJual.toLocaleString('id-ID')}*\n━━━━━━━━━━━━━━━━━━━━\n_Harga belum termasuk PPN._`;
    } else if (item.category === 'Buku Soft Cover') {
      const bsc = item.rawData as SavedBukuSoftCoverSimulationItem;
      const inp = bsc.data.input;
      text = `*PENAWARAN BUKU SOFT COVER*\n*PT Buya Barokah*\n━━━━━━━━━━━━━━━━━━━━\n• *Produk*: Buku Soft Cover ${inp.varian} 32 Hal\n• *Spesifikasi*: Cover AC 230 (Print Inter) + Isi HVS 70 (Oliver) 1 Warna\n• *Kuantitas*: ${inp.oplah.toLocaleString('id-ID')} pcs\n• *Finishing*: ${inp.finishing} + Staples + Sisir\n━━━━━━━━━━━━━━━━━━━━\n• *Harga / pcs*: *Rp ${bsc.data.hargaJualPerPcs.toLocaleString('id-ID')}*\n• *Harga Nego / pcs*: *Rp ${bsc.data.negoPerPcs.toLocaleString('id-ID')}*\n• *Total Penawaran*: *Rp ${bsc.data.totalHargaJual.toLocaleString('id-ID')}*\n━━━━━━━━━━━━━━━━━━━━\n_Harga belum termasuk PPN._`;
    } else if (item.category === 'Buku Soft Cover 14,5×20,25') {
      const bsc = item.rawData as SavedBukuSoftCover145x2025SimulationItem;
      const inp = bsc.data.input;
      text = `*PENAWARAN BUKU SOFT COVER 14,5×20,25 CM*\n*PT Buya Barokah*\n━━━━━━━━━━━━━━━━━━━━\n• *Produk*: Buku Soft Cover 14,5 × 20,25 cm 32 Hal\n• *Spesifikasi*: Cover AC 230 (${inp.finishing}) + Isi HVS 70 1W BB\n• *Kuantitas*: ${inp.oplah.toLocaleString('id-ID')} pcs\n• *Proses Cetak*: ${bsc.data.prosesCetak}\n• *Finishing*: ${inp.jilid} + Sisir + Packing Kardus\n━━━━━━━━━━━━━━━━━━━━\n• *Harga / pcs*: *Rp ${bsc.data.hargaJualPerPcs.toLocaleString('id-ID')}*\n• *Harga Nego / pcs*: *Rp ${bsc.data.negoPerPcs.toLocaleString('id-ID')}*\n• *Total Penawaran*: *Rp ${bsc.data.totalHargaJual.toLocaleString('id-ID')}*\n━━━━━━━━━━━━━━━━━━━━\n_Harga belum termasuk PPN._`;
    } else if (item.category === 'Buku Hard Cover 10,5×14,8') {
      const bhc = item.rawData as SavedBukuHardCover105x148SimulationItem;
      const inp = bhc.data.input;
      const foilTxt = inp.opsiFoil ? ' + Foil Emas' : '';
      const lamTxt = inp.finishing !== 'Tanpa Laminasi' ? ` + ${inp.finishing}` : '';
      text = `*PENAWARAN BUKU HARD COVER 10,5×14,8 CM (A6)*\n*PT Buya Barokah*\n━━━━━━━━━━━━━━━━━━━━\n• *Produk*: Buku Hard Cover 10,5 × 14,8 cm (100 Halaman)\n• *Cover*: Hard Cover Art Paper 150 gsm FC + Board${lamTxt}${foilTxt}\n• *Skiblat*: Art Carton 230 gsm Polos\n• *Isi*: HVS 70 gsm 1 Warna Bolak-Balik (100 Hal)\n• *Kuantitas*: ${inp.oplah.toLocaleString('id-ID')} pcs\n• *Alur Mesin*: ${bhc.data.prosesCetak}\n• *Finishing*: Jahit Benang + Lem Press + Headband + Pita + Casing In\n━━━━━━━━━━━━━━━━━━━━\n• *Harga / pcs*: *Rp ${bhc.data.hargaJualPerPcs.toLocaleString('id-ID')}*\n• *Harga Nego / pcs*: *Rp ${bhc.data.negoPerPcs.toLocaleString('id-ID')}*\n• *Total Penawaran*: *Rp ${bhc.data.totalHargaJual.toLocaleString('id-ID')}*\n━━━━━━━━━━━━━━━━━━━━\n_Harga belum termasuk PPN._`;
    } else if (item.category === 'Poster') {
      const p = item.rawData as SavedPosterSimulationItem;
      const inp = p.data.input;
      const lamTxt = inp.finishing !== 'Tanpa Laminasi' ? ` + ${inp.finishing}` : '';
      text = `*PENAWARAN CETAK POSTER*\n*PT Buya Barokah*\n━━━━━━━━━━━━━━━━━━━━\n• *Produk*: Poster ${inp.ukuran}\n• *Bahan*: Art Carton 230 gsm 1 Muka Full Colour${lamTxt}\n• *Kuantitas*: ${inp.oplah.toLocaleString('id-ID')} pcs\n• *Alur Mesin*: ${p.data.prosesCetak}\n• *Finishing*: Potong / Sisir + Packing Kardus\n━━━━━━━━━━━━━━━━━━━━\n• *Harga / pcs*: *Rp ${p.data.hargaJualPerPcs.toLocaleString('id-ID')}*\n• *Harga Nego / pcs*: *Rp ${p.data.negoPerPcs.toLocaleString('id-ID')}*\n• *Total Penawaran*: *Rp ${p.data.totalHargaJual.toLocaleString('id-ID')}*\n━━━━━━━━━━━━━━━━━━━━\n_Harga belum termasuk PPN._`;
    } else if (item.category === 'Majalah 14,5×20,25') {
      const m = item.rawData as SavedMajalahSimulationItem;
      const inp = m.data.input;
      const lamTxt = inp.finishing !== 'Tanpa Laminasi' ? ` + ${inp.finishing}` : '';
      text = `*PENAWARAN MAJALAH 14,5×20,25 CM*\n*PT Buya Barokah*\n━━━━━━━━━━━━━━━━━━━━\n• *Produk*: Majalah 14,5 × 20,25 cm (32 Halaman)\n• *Cover*: Art Carton 230 gsm 1 Muka Full Colour${lamTxt}\n• *Isi*: Art Paper 120 gsm Full Colour Bolak-Balik (32 Hal)\n• *Kuantitas*: ${inp.oplah.toLocaleString('id-ID')} pcs\n• *Alur Mesin*: ${m.data.prosesCetak}\n• *Finishing*: ${inp.jilid} + Sisir + Packing Kardus\n━━━━━━━━━━━━━━━━━━━━\n• *Harga / pcs*: *Rp ${m.data.hargaJualPerPcs.toLocaleString('id-ID')}*\n• *Harga Nego / pcs*: *Rp ${m.data.negoPerPcs.toLocaleString('id-ID')}*\n• *Total Penawaran*: *Rp ${m.data.totalHargaJual.toLocaleString('id-ID')}*\n━━━━━━━━━━━━━━━━━━━━\n_Harga belum termasuk PPN._`;
    } else if (item.category === 'Stiker') {
      const s = item.rawData as SavedStikerSimulationItem;
      const inp = s.data.input;
      text = `*PENAWARAN CETAK STIKER*\n*PT Buya Barokah*\n━━━━━━━━━━━━━━━━━━━━\n• *Produk*: Stiker ${inp.ukuran}\n• *Bahan*: Sticker Vinyl Glossy 200 gsm Full Colour\n• *Kuantitas*: ${inp.oplah.toLocaleString('id-ID')} pcs\n• *Finishing*: ${inp.finishing} + Packing Rapi\n━━━━━━━━━━━━━━━━━━━━\n• *Harga / pcs*: *Rp ${s.data.hargaJualPerPcs.toLocaleString('id-ID')}*\n• *Harga Nego / pcs*: *Rp ${s.data.negoPerPcs.toLocaleString('id-ID')}*\n• *Total Penawaran*: *Rp ${s.data.totalHargaJual.toLocaleString('id-ID')}*\n━━━━━━━━━━━━━━━━━━━━\n_Harga belum termasuk PPN._`;
    } else if (item.category === 'Buku Soft Cover 10,5×14,8') {
      const bsc = item.rawData as SavedBukuSoftCover105x148SimulationItem;
      const inp = bsc.data.input;
      const lamTxt = inp.finishing !== 'Tanpa Laminasi' ? ` + ${inp.finishing}` : '';
      text = `*PENAWARAN BUKU SOFT COVER 10,5×14,8 CM (A6)*\n*PT Buya Barokah*\n━━━━━━━━━━━━━━━━━━━━\n• *Produk*: Buku Soft Cover 10,5 × 14,8 cm (32 Halaman)\n• *Cover*: Art Carton 230 gsm 1 Muka Full Colour${lamTxt}\n• *Isi*: HVS 70 gsm 1 Warna Bolak-Balik (32 Hal)\n• *Kuantitas*: ${inp.oplah.toLocaleString('id-ID')} pcs\n• *Alur Mesin*: ${bsc.data.prosesCetak}\n• *Finishing*: ${inp.jilid} + Sisir + Packing Kardus\n━━━━━━━━━━━━━━━━━━━━\n• *Harga / pcs*: *Rp ${bsc.data.hargaJualPerPcs.toLocaleString('id-ID')}*\n• *Harga Nego / pcs*: *Rp ${bsc.data.negoPerPcs.toLocaleString('id-ID')}*\n• *Total Penawaran*: *Rp ${bsc.data.totalHargaJual.toLocaleString('id-ID')}*\n━━━━━━━━━━━━━━━━━━━━\n_Harga belum termasuk PPN._`;
    } else if (item.category === 'Buku Hard Cover 14,5×20,25') {
      const bhc = item.rawData as SavedBukuHardCover145x2025SimulationItem;
      const inp = bhc.data.input;
      const foilTxt = inp.opsiFoil ? ' + Foil Emas' : '';
      const lamTxt = inp.finishing !== 'Tanpa Laminasi' ? ` + ${inp.finishing}` : '';
      text = `*PENAWARAN BUKU HARD COVER 14,5×20,25 CM*\n*PT Buya Barokah*\n━━━━━━━━━━━━━━━━━━━━\n• *Produk*: Buku Hard Cover 14,5 × 20,25 cm (100 Halaman)\n• *Cover*: Hard Cover Art Paper 150 gsm FC + Board${lamTxt}${foilTxt}\n• *Skiblat*: Art Carton 230 gsm Polos\n• *Isi*: HVS 70 gsm 1 Warna Bolak-Balik (100 Hal)\n• *Kuantitas*: ${inp.oplah.toLocaleString('id-ID')} pcs\n• *Alur Mesin*: ${bhc.data.prosesCetak}\n• *Finishing*: Jahit Benang + Lem Press + Headband + Pita + Casing In\n━━━━━━━━━━━━━━━━━━━━\n• *Harga / pcs*: *Rp ${bhc.data.hargaJualPerPcs.toLocaleString('id-ID')}*\n• *Harga Nego / pcs*: *Rp ${bhc.data.negoPerPcs.toLocaleString('id-ID')}*\n• *Total Penawaran*: *Rp ${bhc.data.totalHargaJual.toLocaleString('id-ID')}*\n━━━━━━━━━━━━━━━━━━━━\n_Harga belum termasuk PPN._`;
    } else if (item.category === 'Buku Hard Cover 21×29,7') {
      const bhc = item.rawData as SavedBukuHardCover21x297SimulationItem;
      const inp = bhc.data.input;
      const foilTxt = inp.opsiFoil ? ' + Foil Emas' : '';
      const lamTxt = inp.finishing !== 'Tanpa Laminasi' ? ` + ${inp.finishing}` : '';
      text = `*PENAWARAN BUKU HARD COVER 21×29,7 CM (A4)*\n*PT Buya Barokah*\n━━━━━━━━━━━━━━━━━━━━\n• *Produk*: Buku Hard Cover 21 × 29,7 cm (100 Halaman)\n• *Cover*: Hard Cover Art Paper 150 gsm FC + Board${lamTxt}${foilTxt}\n• *Skiblat*: Art Carton 230 gsm Polos\n• *Isi*: HVS 70 gsm 1 Warna Bolak-Balik (100 Hal)\n• *Kuantitas*: ${inp.oplah.toLocaleString('id-ID')} pcs\n• *Alur Mesin*: ${bhc.data.prosesCetak}\n• *Finishing*: Jahit Benang + Lem Press + Headband + Pita + Casing In\n━━━━━━━━━━━━━━━━━━━━\n• *Harga / pcs*: *Rp ${bhc.data.hargaJualPerPcs.toLocaleString('id-ID')}*\n• *Harga Nego / pcs*: *Rp ${bhc.data.negoPerPcs.toLocaleString('id-ID')}*\n• *Total Penawaran*: *Rp ${bhc.data.totalHargaJual.toLocaleString('id-ID')}*\n━━━━━━━━━━━━━━━━━━━━\n_Harga belum termasuk PPN._`;
    } else if (item.category === 'Kalender Kop') {
      const k = item.rawData as SavedKalenderKopSimulationItem;
      const inp = k.data.input;
      text = `*PENAWARAN KALENDER KOP (BLANKO DWI WULAN)*\n*PT Buya Barokah*\n━━━━━━━━━━━━━━━━━━━━\n• *Produk*: Kalender Dinding Kop 32 × 48 cm\n• *Spesifikasi*: Blanko Dwi Wulan 6 Lembar (Art Paper 120 gsm)\n• *Cetak Kop*: Sablon / Offset ${inp.varian}\n• *Kuantitas*: ${inp.oplah.toLocaleString('id-ID')} eks\n• *Finishing*: Jilid Klem Seng Kaleng + Packing Kardus\n━━━━━━━━━━━━━━━━━━━━\n• *Harga / Eks*: *Rp ${k.data.hargaJualPerPcs.toLocaleString('id-ID')}*\n• *Harga Nego / Eks*: *Rp ${k.data.negoPerPcs.toLocaleString('id-ID')}*\n• *Total Penawaran*: *Rp ${k.data.totalHargaJual.toLocaleString('id-ID')}*\n━━━━━━━━━━━━━━━━━━━━\n_Harga belum termasuk PPN._`;
    } else if (item.category === 'Packaging') {
      const pkg = item.rawData as SavedPackagingSimulationItem;
      const inp = pkg.data.input;
      const lamTxt = inp.finishing !== 'Tanpa Laminasi' ? ` + ${inp.finishing}` : '';
      text = `*PENAWARAN PACKAGING BOX DUS / KARDUS*\n*PT Buya Barokah*\n━━━━━━━━━━━━━━━━━━━━\n• *Produk*: Packaging Box Dus Tutup Nyambung\n• *Ukuran Jadi*: ${inp.ukuran} (Terbuka: ${pkg.data.variantSpec.ukuranTerbuka})\n• *Bahan*: ${inp.bahan}\n• *Cetak*: Full Colour 1 Muka (${pkg.data.prosesCetak})\n• *Finishing*: Pond Die Cut + Packing Kardus${lamTxt}\n• *Kuantitas*: ${inp.oplah.toLocaleString('id-ID')} pcs\n━━━━━━━━━━━━━━━━━━━━\n• *Harga / pcs*: *Rp ${pkg.data.hargaJualPerPcs.toLocaleString('id-ID')}*\n• *Harga Nego / pcs*: *Rp ${pkg.data.negoPerPcs.toLocaleString('id-ID')}*\n• *Total Penawaran*: *Rp ${pkg.data.totalHargaJual.toLocaleString('id-ID')}*\n━━━━━━━━━━━━━━━━━━━━\n_Harga belum termasuk PPN._`;
    } else if (item.category === 'Paperbag') {
      const pb = item.rawData as SavedPaperbagSimulationItem;
      const inp = pb.data.input;
      const lamTxt = inp.finishing !== 'Tanpa Laminasi' ? ` + ${inp.finishing}` : '';
      text = `*PENAWARAN PAPERBAG (TAS KERTAS CUSTOM)*\n*PT Buya Barokah*\n━━━━━━━━━━━━━━━━━━━━\n• *Produk*: Paperbag Custom Custom\n• *Ukuran*: ${inp.ukuran} (Terbuka: ${pb.data.spec.ukuranTerbuka})\n• *Bahan*: Art Carton 230 gsm Full Colour 1 Muka\n• *Alur Mesin*: ${pb.data.prosesCetak}\n• *Finishing*: Pond Die Cut + Double Tape + Tali Kur + Lipat Assembly + Packing Kardus${lamTxt}\n• *Kuantitas*: ${inp.oplah.toLocaleString('id-ID')} pcs\n━━━━━━━━━━━━━━━━━━━━\n• *Harga / pcs*: *Rp ${pb.data.hargaJualPerPcs.toLocaleString('id-ID')}*\n• *Harga Nego / pcs*: *Rp ${pb.data.negoPerPcs.toLocaleString('id-ID')}*\n• *Total Penawaran*: *Rp ${pb.data.totalHargaJual.toLocaleString('id-ID')}*\n━━━━━━━━━━━━━━━━━━━━\n_Harga belum termasuk PPN._`;
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
                { value: 'Sertifikat', label: '📜 Sertifikat', count: sertifikatList.length },
                { value: 'Undangan', label: '💌 Undangan', count: undanganList.length },
                { value: 'Buku Tabungan NS', label: '📒 Buku Tabungan NS', count: bukuTabunganNsList.length },
                { value: 'Buku Tabungan Security', label: '🔒 Buku Tabungan Security', count: bukuTabunganSecurityList.length },
                { value: 'Kartu Koperasi Promise', label: '🪪 Kartu Koperasi', count: kartuKoperasiPromiseList.length },
                { value: 'Lebel Kartu Obat', label: '💊 Lebel Kartu Obat', count: lebelKartuObatList.length },
                { value: 'Buku Soft Cover', label: '📗 Buku Soft Cover', count: bukuSoftCoverList.length },
                { value: 'Buku Soft Cover 14,5×20,25', label: '📗 Buku Soft Cover 14,5×20,25', count: bukuSoftCover145x2025List.length },
                { value: 'Buku Hard Cover 10,5×14,8', label: '📕 Buku Hard Cover 10,5×14,8', count: bukuHardCover105x148List.length },
                { value: 'Poster', label: '🖼️ Poster', count: posterList.length },
                { value: 'Majalah 14,5×20,25', label: '📰 Majalah 14,5×20,25', count: majalahList.length },
                { value: 'Kalender', label: '🗓️ Kalender 2027', count: kalenderList.length },
                { value: 'Stiker', label: '🏷️ Stiker', count: stikerList.length },
                { value: 'Buku Soft Cover 10,5×14,8', label: '📗 Buku Soft Cover 10,5×14,8', count: bukuSoftCover105x148List.length },
                { value: 'Buku Hard Cover 14,5×20,25', label: '📕 Buku Hard Cover 14,5×20,25', count: bukuHardCover145x2025List.length },
                { value: 'Buku Hard Cover 21×29,7', label: '📕 Buku Hard Cover 21×29,7', count: bukuHardCover21x297List.length },
                { value: 'Kalender Kop', label: '🗓️ Kalender Kop', count: kalenderKopList.length },
                { value: 'Packaging', label: '📦 Packaging', count: packagingList.length },
                { value: 'Paperbag', label: '🛍️ Paperbag', count: paperbagList.length },
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
                          : item.category === 'Sertifikat'
                          ? 'bg-lime-100 text-lime-900 border border-lime-300'
                          : item.category === 'Undangan'
                          ? 'bg-fuchsia-100 text-fuchsia-900 border border-fuchsia-300'
                          : item.category === 'Buku Tabungan NS'
                          ? 'bg-teal-100 text-teal-900 border border-teal-200'
                          : item.category === 'Buku Tabungan Security'
                          ? 'bg-red-100 text-red-900 border border-red-200'
                          : item.category === 'Kartu Koperasi Promise'
                          ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                          : item.category === 'Lebel Kartu Obat'
                          ? 'bg-cyan-100 text-cyan-900 border border-cyan-200'
                          : item.category === 'Buku Soft Cover'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          : item.category === 'Buku Soft Cover 14,5×20,25'
                          ? 'bg-teal-100 text-teal-900 border border-teal-200'
                          : item.category === 'Buku Hard Cover 10,5×14,8'
                          ? 'bg-rose-100 text-rose-900 border border-rose-200'
                          : item.category === 'Poster'
                          ? 'bg-orange-100 text-orange-900 border border-orange-200'
                          : item.category === 'Majalah 14,5×20,25'
                          ? 'bg-purple-100 text-purple-900 border border-purple-200'
                          : item.category === 'Stiker'
                          ? 'bg-lime-100 text-lime-900 border border-lime-200'
                          : item.category === 'Buku Soft Cover 10,5×14,8'
                          ? 'bg-cyan-100 text-cyan-900 border border-cyan-200'
                          : item.category === 'Buku Hard Cover 14,5×20,25'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : item.category === 'Buku Hard Cover 21×29,7'
                          ? 'bg-red-100 text-red-900 border border-red-200'
                          : item.category === 'Kalender Kop'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          : item.category === 'Packaging'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : item.category === 'Paperbag'
                          ? 'bg-pink-100 text-pink-900 border border-pink-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
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
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setViewingDetailItem(item)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition cursor-pointer"
                      title="Lihat Rincian HPP & Parameter Historis"
                    >
                      <Eye size={13} />
                      <span>Detail</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleCopyQuote(item, e)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                      title="Salin Format WhatsApp"
                    >
                      {copiedId === item.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      <span>{copiedId === item.id ? 'Tersalin' : 'WA'}</span>
                    </button>
                  </div>
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

      {/* Modal Detail Rincian HPP & Parameter Historis */}
      {viewingDetailItem && (
        <div
          className="fixed inset-0 z-300 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
          onClick={() => setViewingDetailItem(null)}
        >
          <div
            className="bg-white w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-emerald-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-800/80 rounded-xl border border-emerald-700">
                  <Calculator className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-white line-clamp-1">{viewingDetailItem.title}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-800 text-emerald-200 border border-emerald-700 shrink-0">
                      {viewingDetailItem.category}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-300 mt-0.5 flex items-center gap-1">
                    <Clock size={12} /> Disimpan: {new Date(viewingDetailItem.savedAt).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingDetailItem(null)}
                className="text-emerald-300 hover:text-white p-1.5 rounded-lg hover:bg-emerald-800/60 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto text-xs text-slate-700 space-y-5 leading-relaxed">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-medium block">Kuantitas / Oplah</span>
                  <span className="text-sm font-bold font-mono text-slate-800">
                    {viewingDetailItem.oplah.toLocaleString('id-ID')} unit
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-medium block">HPP / Unit (Modal)</span>
                  <span className="text-sm font-bold font-mono text-slate-800">
                    Rp {viewingDetailItem.hppUnit.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 font-bold block">Harga Jual / Unit</span>
                  <span className="text-sm font-black font-mono text-emerald-900">
                    Rp {viewingDetailItem.hargaJualUnit.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-medium block">Total Omset Penawaran</span>
                  <span className="text-sm font-bold font-mono text-slate-900">
                    Rp {viewingDetailItem.totalOmset.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Spesifikasi Teknis */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Info size={14} className="text-emerald-700" />
                  Spesifikasi & Konfigurasi Saat Disimpan
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                  {viewingDetailItem.detailSpecs.map((spec, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span>{spec}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>Margin Profit: <strong>{viewingDetailItem.marginPct}%</strong> · Batas Nego: <strong>{viewingDetailItem.negoDiskonPct}%</strong></span>
                  </div>
                </div>
              </div>

              {/* Rincian Komponen Biaya HPP */}
              {(() => {
                const raw: any = viewingDetailItem.rawData;
                const breakdownList: any[] =
                  raw?.breakdown ||
                  raw?.data?.breakdown ||
                  raw?.summary?.breakdown ||
                  [];

                if (!breakdownList || breakdownList.length === 0) {
                  return (
                    <div className="p-4 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
                      Rincian breakdown biaya langsung terlampir pada spesifikasi di atas.
                    </div>
                  );
                }

                return (
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FileText size={14} className="text-emerald-700" />
                      Rincian Biaya HPP Pokok (Cost Breakdown)
                    </h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                            <th className="py-2.5 px-3 w-10 text-center">No</th>
                            <th className="py-2.5 px-3">Komponen Biaya</th>
                            <th className="py-2.5 px-3">Keterangan Spesifikasi</th>
                            <th className="py-2.5 px-3 text-right">Biaya (Rp)</th>
                            <th className="py-2.5 px-3 text-right w-16">Porsi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {breakdownList.map((b: any, idx: number) => {
                            const no = b.no || idx + 1;
                            const komponen = b.komponen || b.name || b.item || 'Komponen';
                            const ket = b.keterangan || b.desc || '-';
                            const biaya = typeof b.biaya === 'number' ? b.biaya : (typeof b.cost === 'number' ? b.cost : 0);
                            const porsi = typeof b.porsiPct === 'number' ? b.porsiPct : null;

                            return (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="py-2 px-3 text-center text-slate-500 font-mono">{no}</td>
                                <td className="py-2 px-3 font-bold text-slate-900">{komponen}</td>
                                <td className="py-2 px-3 text-slate-600 text-[11px]">{ket}</td>
                                <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                                  Rp {Math.round(biaya).toLocaleString('id-ID')}
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-slate-500 text-[11px]">
                                  {porsi !== null ? `${porsi.toFixed(1)}%` : '-'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* Snapshot Master Parameter Saat Disimpan */}
              {(() => {
                const raw: any = viewingDetailItem.rawData;
                const snap = raw?.paramsSnapshot || raw?.customParams;
                if (!snap || typeof snap !== 'object') return null;

                const entries = Object.entries(snap).filter(
                  ([k, v]) => typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean'
                );

                if (entries.length === 0) return null;

                return (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Database size={14} className="text-emerald-700" />
                        Settingan Master Parameter Saat Disimpan ({entries.length} Nilai)
                      </h4>
                      <span className="text-[10px] text-slate-500 font-medium">
                        Snapshot Tarif Acuan Historis
                      </span>
                    </div>
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-3 max-h-60 overflow-y-auto">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {entries.map(([key, val]) => {
                          const formattedKey = key
                            .replace(/([A-Z])/g, ' $1')
                            .replace(/^./, (str) => str.toUpperCase());

                          let displayVal = String(val);
                          if (typeof val === 'number') {
                            if (key.toLowerCase().includes('pct') || key.toLowerCase().includes('margin') || key.toLowerCase().includes('nego') || key.toLowerCase().includes('ppn') || key.toLowerCase().includes('persen')) {
                              displayVal = `${val}%`;
                            } else if (key.toLowerCase().includes('tarif') || key.toLowerCase().includes('harga') || key.toLowerCase().includes('biaya') || key.toLowerCase().includes('ongkos') || key.toLowerCase().includes('min')) {
                              displayVal = `Rp ${Number(val).toLocaleString('id-ID')}`;
                            } else {
                              displayVal = Number(val).toLocaleString('id-ID');
                            }
                          } else if (typeof val === 'boolean') {
                            displayVal = val ? 'Aktif (Ya)' : 'Tidak';
                          }

                          return (
                            <div
                              key={key}
                              className="p-2 bg-white rounded-lg border border-slate-200/80 flex items-center justify-between gap-2"
                            >
                              <span className="text-slate-600 truncate text-[11px]" title={key}>
                                {formattedKey}:
                              </span>
                              <span className="font-bold font-mono text-slate-900 text-[11px] shrink-0">
                                {displayVal}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={(e) => handleCopyQuote(viewingDetailItem, e)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition cursor-pointer shadow-2xs"
              >
                {copiedId === viewingDetailItem.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedId === viewingDetailItem.id ? 'Teks WhatsApp Tersalin!' : 'Salin Format WA'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = viewingDetailItem;
                    setViewingDetailItem(null);
                    onLoadSimulation(target);
                  }}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white transition cursor-pointer shadow-2xs"
                >
                  <Edit2 size={13} />
                  <span>Buka di Simulator</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingDetailItem(null)}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
