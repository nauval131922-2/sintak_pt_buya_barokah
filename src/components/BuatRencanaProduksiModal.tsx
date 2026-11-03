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

import type { OrderInfoForGantt } from '@/components/OrderGanttChart';

interface BuatRencanaProduksiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialNoOrder?: string | null;
  initialOrderInfo?: OrderInfoForGantt | null;
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
  spesifikasi?: string;
}

interface TahapTemplateItem {
  bagian: string;
  mesin: string;
  nama_tahap: string;
  target_per_hari: number;
}

// Otomatisasi alur tahapan mesin cerdas berdasarkan kategori produk & spesifikasi dari Digit ERP
function deriveTahapanFromOrder(spekText: string, namaOrderText: string): TahapTemplateItem[] {
  const text = `${spekText} ${namaOrderText}`.toUpperCase();
  const list: TahapTemplateItem[] = [];

  // Deteksi Kategori Produk
  const isLabelOrSticker = text.includes('LABEL') || text.includes('STICKER') || text.includes('STIKER');
  const isNotaOrForm = text.includes('KARCIS') || text.includes('NOTA') || text.includes('KWITANSI') || text.includes('FORMULIR') || text.includes('BUKTI KAS') || text.includes('NCR');
  const isKalenderOrPoster = text.includes('KALENDER') || text.includes('POSTER') || text.includes('ALMANAK') || text.includes('BROSUR') || text.includes('MAP') || text.includes('STOPMAP');
  const isBuku = text.includes('BUKU') || text.includes("QUR'AN") || text.includes('KITAB') || text.includes('MAJALAH') || text.includes('MANASIK') || text.includes('YANBU') || text.includes('YASIN') || text.includes('JILID') || text.includes('HALAMAN') || text.includes('HAL ');

  // KATEGORI 1: LABEL & STIKER (Cetak Print Digital, Tanpa Plat, Tanpa Potong Awal)
  if (isLabelOrSticker) {
    list.push({
      bagian: 'SETTING',
      mesin: 'Setting',
      nama_tahap: 'Setting Mockup & Imposisi Label',
      target_per_hari: 2000,
    });
    list.push({
      bagian: 'CETAK',
      mesin: 'Print Inter',
      nama_tahap: 'Print Inter Label',
      target_per_hari: 10000,
    });
    if (text.includes('LAMINASI') || text.includes('GLOSSY') || text.includes('DOFF')) {
      list.push({
        bagian: 'FINISHING',
        mesin: 'Laminasi',
        nama_tahap: 'Laminasi Glossy / Doff Label',
        target_per_hari: 10000,
      });
    }
    list.push({
      bagian: 'FINISHING',
      mesin: 'Potong QZ 104',
      nama_tahap: 'Rajang Label Satuan',
      target_per_hari: 20000,
    });
    list.push({
      bagian: 'QUALITY CONTROL',
      mesin: 'QC',
      nama_tahap: 'Pemeriksaan QC & Sortir Label',
      target_per_hari: 10000,
    });
    list.push({
      bagian: 'GUDANG',
      mesin: 'Packing',
      nama_tahap: 'Packing & Siap Kirim',
      target_per_hari: 10000,
    });
    return list;
  }

  // KATEGORI 2: NOTA, FORMULIR, KARCIS, KWITANSI
  if (isNotaOrForm) {
    list.push({
      bagian: 'SETTING',
      mesin: 'Setting',
      nama_tahap: 'Setting & Layout Form/Nota',
      target_per_hari: 2000,
    });
    list.push({
      bagian: 'QUALITY CONTROL',
      mesin: 'Plate',
      nama_tahap: 'Pembuatan & Cek Plat Cetak',
      target_per_hari: 5000,
    });
    list.push({
      bagian: 'FINISHING',
      mesin: 'Potong QZ 104',
      nama_tahap: 'Potong Bahan Baku Kertas',
      target_per_hari: 20000,
    });
    list.push({
      bagian: 'CETAK',
      mesin: 'Ryobi 500N',
      nama_tahap: 'Cetak Mesin Ryobi',
      target_per_hari: 15000,
    });
    if (text.includes('PORPORASI') || text.includes('PORFORASI')) {
      list.push({
        bagian: 'FINISHING',
        mesin: 'Porporasi',
        nama_tahap: 'Porporasi Lembaran',
        target_per_hari: 8000,
      });
    }
    if (text.includes('NOMORATOR') || text.includes('NOMOR')) {
      list.push({
        bagian: 'FINISHING',
        mesin: 'Nomorator',
        nama_tahap: 'Nomorator Form',
        target_per_hari: 8000,
      });
    }
    if (text.includes('STAPLES') || text.includes('SUSUN') || text.includes('LEM')) {
      list.push({
        bagian: 'FINISHING',
        mesin: 'Stitching Kawat',
        nama_tahap: 'Susun & Jilid Lem/Staples',
        target_per_hari: 5000,
      });
    }
    list.push({
      bagian: 'FINISHING',
      mesin: 'Potong QZ 104',
      nama_tahap: 'Potong Sisir Bersih',
      target_per_hari: 20000,
    });
    list.push({
      bagian: 'QUALITY CONTROL',
      mesin: 'QC',
      nama_tahap: 'Pemeriksaan QC Akhir',
      target_per_hari: 5000,
    });
    list.push({
      bagian: 'GUDANG',
      mesin: 'Packing',
      nama_tahap: 'Packing Kardus & Gudang',
      target_per_hari: 5000,
    });
    return list;
  }

  // KATEGORI 3: KALENDER, POSTER, BROSUR LEMBARAN
  if (isKalenderOrPoster && !isBuku) {
    list.push({
      bagian: 'SETTING',
      mesin: 'Setting',
      nama_tahap: 'Setting & Imposisi Kalender/Poster',
      target_per_hari: 2000,
    });
    list.push({
      bagian: 'QUALITY CONTROL',
      mesin: 'Plate',
      nama_tahap: 'Pembuatan & Cek Plat Cetak',
      target_per_hari: 5000,
    });
    list.push({
      bagian: 'FINISHING',
      mesin: 'Potong QZ 104',
      nama_tahap: 'Potong Bahan Baku Kertas',
      target_per_hari: 20000,
    });
    let mesinCetak = 'SM 102';
    let namaCetak = 'Cetak Mesin SM 102';
    if (text.includes('2 WARNA') || text.includes('2/0') || text.includes('OLIVER')) {
      mesinCetak = 'Oliver 72E';
      namaCetak = 'Cetak Oliver 72E';
    }
    list.push({
      bagian: 'CETAK',
      mesin: mesinCetak,
      nama_tahap: namaCetak,
      target_per_hari: 15000,
    });
    if (text.includes('LAMINASI') || text.includes('UV') || text.includes('VARNISH')) {
      list.push({
        bagian: 'FINISHING',
        mesin: 'Laminasi',
        nama_tahap: 'Laminasi Doff/Glossy',
        target_per_hari: 10000,
      });
    }
    if (text.includes('KLEM') || text.includes('SPIRAL') || text.includes('SENG')) {
      list.push({
        bagian: 'FINISHING',
        mesin: 'Klem Seng',
        nama_tahap: 'Jilid Klem Seng / Spiral',
        target_per_hari: 5000,
      });
    }
    list.push({
      bagian: 'FINISHING',
      mesin: 'Potong QZ 104',
      nama_tahap: 'Potong Sisir / Rajang Bersih',
      target_per_hari: 20000,
    });
    list.push({
      bagian: 'QUALITY CONTROL',
      mesin: 'QC',
      nama_tahap: 'Pemeriksaan QC & Sortir',
      target_per_hari: 5000,
    });
    list.push({
      bagian: 'GUDANG',
      mesin: 'Packing',
      nama_tahap: 'Packing & Ikat Kardus',
      target_per_hari: 5000,
    });
    return list;
  }

  // KATEGORI 4: BUKU, AL-QUR'AN, KITAB, MAJALAH (Alur Jilid Lengkap)
  list.push({
    bagian: 'SETTING',
    mesin: 'Setting',
    nama_tahap: 'Setting & Imposisi Isi / Cover',
    target_per_hari: 2000,
  });
  list.push({
    bagian: 'QUALITY CONTROL',
    mesin: 'Plate',
    nama_tahap: 'Pembuatan & Cek Plat Cetak',
    target_per_hari: 5000,
  });
  list.push({
    bagian: 'FINISHING',
    mesin: 'Potong QZ 104',
    nama_tahap: 'Potong Bahan Baku Isi & Cover',
    target_per_hari: 20000,
  });
  list.push({
    bagian: 'CETAK',
    mesin: 'SM 102',
    nama_tahap: 'Cetak Mesin SM 102',
    target_per_hari: 15000,
  });
  if (text.includes('LAMINASI') || text.includes('DOFF') || text.includes('GLOSSY')) {
    list.push({
      bagian: 'FINISHING',
      mesin: 'Laminasi',
      nama_tahap: 'Laminasi Doff/Glossy Cover',
      target_per_hari: 10000,
    });
  }
  list.push({
    bagian: 'FINISHING',
    mesin: 'Mesin Lipat',
    nama_tahap: 'Lipat Lembaran Isi',
    target_per_hari: 15000,
  });
  const isHardCover = text.includes('HARDCOVER') || text.includes('HARD COVER') || text.includes('CASING IN') || text.includes('SKIBLAT');
  const isStitching = text.includes('STAPLES') || text.includes('STICHING') || text.includes('STITCHING') || text.includes('JAHIT KAWAT');

  if (isHardCover) {
    list.push({
      bagian: 'FINISHING',
      mesin: 'Jahit Benang',
      nama_tahap: 'Jahit Blok Buku',
      target_per_hari: 3000,
    });
    list.push({
      bagian: 'FINISHING',
      mesin: 'Mesin Hard Cover',
      nama_tahap: 'Pembuatan & Casing In Hardcover',
      target_per_hari: 2000,
    });
    list.push({
      bagian: 'FINISHING',
      mesin: 'Potong 3 Sisi',
      nama_tahap: 'Potong 3 Sisi Buku Jadi',
      target_per_hari: 4000,
    });
  } else if (isStitching) {
    list.push({
      bagian: 'FINISHING',
      mesin: 'Stitching Kawat',
      nama_tahap: 'Jilid Jahit Kawat (Stitching)',
      target_per_hari: 8000,
    });
    list.push({
      bagian: 'FINISHING',
      mesin: 'Potong 3 Sisi',
      nama_tahap: 'Potong 3 Sisi Buku Jadi',
      target_per_hari: 5000,
    });
  } else {
    list.push({
      bagian: 'FINISHING',
      mesin: 'Binding Lem Panas',
      nama_tahap: 'Jilid Soft Cover Binding',
      target_per_hari: 5000,
    });
    list.push({
      bagian: 'FINISHING',
      mesin: 'Potong 3 Sisi',
      nama_tahap: 'Potong 3 Sisi Buku Jadi',
      target_per_hari: 5000,
    });
  }
  list.push({
    bagian: 'QUALITY CONTROL',
    mesin: 'QC',
    nama_tahap: 'Pemeriksaan QC Akhir & Sortir',
    target_per_hari: 5000,
  });
  list.push({
    bagian: 'GUDANG',
    mesin: 'Packing',
    nama_tahap: 'Packing Kardus & Distribusi',
    target_per_hari: 5000,
  });
  return list;
}

const BAGIAN_OPTIONS = ['SETTING', 'QUALITY CONTROL', 'CETAK', 'FINISHING', 'GUDANG'];

export default function BuatRencanaProduksiModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  initialNoOrder,
  initialOrderInfo,
}: BuatRencanaProduksiModalProps) {
  const [isExistingPlan, setIsExistingPlan] = useState(false);
  const [noOrder, setNoOrder] = useState('');
  const [namaOrder, setNamaOrder] = useState('');
  const [qtyOplah, setQtyOplah] = useState<number>(0);
  const [satuan, setSatuan] = useState('');
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


  // Searchable Dropdown SOPD Options
  const [sopdOptions, setSopdOptions] = useState<OrderOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevOpenRef = useRef(false);

  // Format Helper
  const formatISO = (d: Date | null): string => {
    if (!d) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  // Helper: Parse string tanggal aman (ISO atau format DD-MM-YYYY)
  const safeParseDate = (str?: string | null): Date | null => {
    if (!str) return null;
    const s = str.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      return new Date(s.slice(0, 10) + 'T00:00:00');
    }
    const parts = s.split('-');
    if (parts.length === 3 && parts[2].length === 4) {
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };

  // Helper Format Tanggal Indonesia (dd mmm yyyy: 28 Okt 2026)
  const formatTanggalIndo = (tglStr?: string | null): string => {
    if (!tglStr) return '';
    const clean = tglStr.trim();
    const parts = clean.split('-');
    if (parts.length === 3) {
      let day = '', monthNum = 0, year = '';
      if (parts[0].length === 4) {
        year = parts[0];
        monthNum = parseInt(parts[1], 10);
        day = parts[2];
      } else {
        day = parts[0];
        monthNum = parseInt(parts[1], 10);
        year = parts[2];
      }
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      if (monthNum >= 1 && monthNum <= 12) {
        const paddedDay = day.padStart(2, '0');
        return `${paddedDay} ${months[monthNum - 1]} ${year}`;
      }
    }
    return tglStr;
  };

  // Muat preset awal saat template dipilih
  // Terapkan alur tahapan mesin yang didapat dari spesifikasi Order Produksi
  const applyDerivedTahapan = useCallback((templateItems: TahapTemplateItem[], currentVolume: number, startDateStr: string, currentNoOrder?: string) => {
    const ord = currentNoOrder ?? '-';
    let currentStart = startDateStr || formatISO(new Date());
    const vol = currentVolume > 0 ? currentVolume : 1000;

    const generated = templateItems.map((t, idx) => {
      const dur = calculateDurationDays(vol, t.target_per_hari);
      const end = addWorkdays(currentStart, dur);
      const row = {
        no_order: ord,
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
  }, []);

  // Muat opsi awal SOPD saat modal dibuka atau disinkronkan dengan order yang dipilih
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      const now = new Date();
      setTglMulaiRencana(now);
      setStatusPlan('DRAFT');
      setCatatan('');
      setIsDropdownOpen(false);

      if (initialNoOrder) {
        setNoOrder(initialNoOrder);
        setSearchQuery(initialNoOrder);

        // Pre-fill instan dari data order info jika tersedia
        if (initialOrderInfo) {
          setNamaOrder(initialOrderInfo.nama_prd || '');
          setQtyOplah(Number(initialOrderInfo.qty) || 0);
          setSatuan(initialOrderInfo.satuan || '');
          setNamaPelanggan(initialOrderInfo.nama_pelanggan || '');
          if (initialOrderInfo.tgl_order) setTglOrder(initialOrderInfo.tgl_order);
          if (initialOrderInfo.deadline_date) setTglDeadline(safeParseDate(initialOrderInfo.deadline_date));

          const derived = deriveTahapanFromOrder('', initialOrderInfo.nama_prd || '');
          applyDerivedTahapan(derived, Number(initialOrderInfo.qty) || 1000, formatISO(now), initialNoOrder);
        } else {
          setNamaOrder('');
          setQtyOplah(0);
          setSatuan('');
          setNamaPelanggan('');
          setTglOrder('');
          setTglDeadline(null);
          setTahapan([]);
          setTglSelesaiRencana(null);
        }

        // Muat data spesifik order dari database (periksa rencana_produksi eksisting dulu, lalu data SOPD Digit)
        async function loadOrderSpecificData() {
          setLoadingOptions(true);
          try {
            // 1. Cek apakah order ini sudah memiliki rencana produksi yang pernah disimpan
            const planRes = await fetch(`/api/rencana-produksi?order=${encodeURIComponent(initialNoOrder!)}`);
            const planJson = await planRes.json();
            if (planJson.success && planJson.plan) {
              const p = planJson.plan;
              setNoOrder(p.no_order);
              setNamaOrder(p.nama_order || '');
              setQtyOplah(Number(p.qty_oplah) || 0);
              setSatuan(p.satuan || '');
              setNamaPelanggan(p.nama_pelanggan || '');
              if (p.tgl_order) setTglOrder(p.tgl_order);
              if (p.tgl_deadline) setTglDeadline(safeParseDate(p.tgl_deadline));
              if (p.tgl_mulai_rencana) setTglMulaiRencana(safeParseDate(p.tgl_mulai_rencana) || now);
              if (p.tgl_selesai_rencana) setTglSelesaiRencana(safeParseDate(p.tgl_selesai_rencana));
              setStatusPlan(p.status || 'DRAFT');
              if (p.catatan) setCatatan(p.catatan);
              if (Array.isArray(planJson.tahapan) && planJson.tahapan.length > 0) {
                setTahapan(planJson.tahapan);
              }
              setIsExistingPlan(true);
            } else {
              setIsExistingPlan(false);
              // 2. Jika belum ada rencana tersimpan, cari data SOPD lengkap dari Digit ERP
              const sopdRes = await fetch(`/api/sopd/options?search=${encodeURIComponent(initialNoOrder!)}&limit=10`);
              const sopdJson = await sopdRes.json();
              if (sopdJson.success && Array.isArray(sopdJson.data) && sopdJson.data.length > 0) {
                const matched = sopdJson.data.find((item: OrderOption) => item.no_sopd === initialNoOrder) || sopdJson.data[0];
                if (matched) {
                  handleSelectSpk(matched);
                  setSopdOptions(sopdJson.data);
                }
              }
            }

            // Muat opsi umum SOPD sebagai cadangan dropdown
            const resAll = await fetch('/api/sopd/options?limit=80');
            const jsonAll = await resAll.json();
            if (jsonAll.success && Array.isArray(jsonAll.data)) {
              setSopdOptions(prev => {
                const existingNos = new Set(prev.map(p => p.no_sopd));
                const added = jsonAll.data.filter((d: OrderOption) => !existingNos.has(d.no_sopd));
                return [...prev, ...added];
              });
            }
          } catch (e) {
            console.error('Failed to load order plan / SOPD options:', e);
          } finally {
            setLoadingOptions(false);
          }
        }
        loadOrderSpecificData();
      } else {
        // Alur pembukaan baru tanpa nomor order awal (dari Master Timeline)
        setIsExistingPlan(false);
        setNoOrder('');
        setNamaOrder('');
        setQtyOplah(0);
        setSatuan('');
        setNamaPelanggan('');
        setTglOrder('');
        setTglDeadline(null);
        setSearchQuery('');
        setTahapan([]);
        setTglSelesaiRencana(null);

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
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, initialNoOrder, initialOrderInfo]);

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
    const selectedNoOrder = item.no_sopd;
    setNoOrder(selectedNoOrder);
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

    // Otomatis turunkan alur mesin dari spesifikasi Order Produksi dan hitung tanggal
    const startDateStr = formatISO(tglMulaiRencana || new Date());
    const derived = deriveTahapanFromOrder(item.spesifikasi || '', item.nama_order || '');
    applyDerivedTahapan(derived, qVal > 0 ? qVal : 1000, startDateStr, selectedNoOrder);
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
      toast.error('Silakan pilih No SOPD terlebih dahulu.');
      return;
    }
    if (!namaOrder.trim()) {
      toast.error('Nama Order wajib diisi.');
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

  // Cek apakah tanggal selesai melebihi deadline
  const isOverdueDeadline = useMemo(() => {
    if (!tglDeadline || !tglSelesaiRencana) return false;
    return formatISO(tglSelesaiRencana) > formatISO(tglDeadline);
  }, [tglDeadline, tglSelesaiRencana]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isExistingPlan ? `Atur Rencana Produksi (${noOrder})` : (noOrder ? `Buat Rencana Produksi (${noOrder})` : "Buat Rencana Produksi Baru")}
      subtitle="Rancang jadwal alur tahapan mesin, target waktu kerja, dan kapasitas PPIC per nomor order."
      icon={CalendarRange}
      maxWidth="w-[97vw] max-w-[1550px]"
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
            {noOrder ? (
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-lg text-[11px] font-semibold">
                <Sparkles size={13} className="text-emerald-600" />
                <span>Alur Mesin Otomatis dari Order Produksi</span>
              </div>
            ) : (
              <span className="text-[11px] text-slate-400 font-medium">
                Pilih SOPD untuk memuat alur mesin otomatis
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
            {/* DROPDOWN NO SOPD */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Pilih No SOPD <span className="text-rose-500">*</span>
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
                        setQtyOplah(0);
                        setSatuan('');
                        setNamaPelanggan('');
                        setTglOrder('');
                        setTglDeadline(null);
                        setTahapan([]);
                        setTglSelesaiRencana(null);
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
                <div className="absolute top-full left-0 right-0 sm:w-[520px] mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-80 animate-in fade-in zoom-in-95 duration-150">
                  {/* Search Input inside Dropdown */}
                  <div className="p-2 border-b border-slate-100 bg-slate-50/90 sticky top-0 z-10">
                    <div className="relative">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Ketik cari no SOPD, nama order, atau pemesan..."
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
                                  {formatTanggalIndo(item.tgl)}
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

                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                            {(item.nama_pelanggan || item.pelanggan) ? (
                              <div className="flex items-center gap-1 truncate max-w-[320px]">
                                <span className="text-slate-400">Pemesan:</span>
                                <span className="font-medium text-slate-700 truncate">{item.nama_pelanggan || item.pelanggan}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Tanpa Nama Pemesan</span>
                            )}
                            {item.deadline_date && (
                              <span className="text-rose-600 font-semibold shrink-0">
                                D/L: {formatTanggalIndo(item.deadline_date)}
                              </span>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Nama Order (Disabled / ReadOnly) */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Nama Order
              </label>
              <input
                type="text"
                disabled
                readOnly
                placeholder="Pilih nomor SOPD untuk memuat data..."
                value={namaOrder}
                className="w-full h-9 px-3 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 cursor-not-allowed select-none"
              />
            </div>

            {/* Jumlah Cetak & Satuan (Disabled / ReadOnly) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Jumlah Cetak &amp; Satuan
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  disabled
                  readOnly
                  value={qtyOplah > 0 ? qtyOplah.toLocaleString('id-ID') : ''}
                  className="w-full h-9 px-2.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 cursor-not-allowed select-none text-right"
                  placeholder="Jumlah"
                />
                <input
                  type="text"
                  disabled
                  readOnly
                  value={satuan}
                  className="w-20 h-9 px-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-center font-bold text-slate-700 cursor-not-allowed select-none"
                  placeholder="Satuan"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            {/* Nama Pemesan (Disabled / ReadOnly) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Nama Pemesan
              </label>
              <input
                type="text"
                disabled
                readOnly
                placeholder="Terisi otomatis saat memilih SOPD..."
                value={namaPelanggan}
                className="w-full h-9 px-3 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 cursor-not-allowed select-none"
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

            {/* Batas Deadline */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center justify-between">
                <span>Batas Deadline</span>
                {isOverdueDeadline && (
                  <span className="text-[10px] text-rose-600 font-bold flex items-center gap-0.5">
                    <AlertTriangle size={11} /> Melewati Deadline!
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
            <div className="max-h-[460px] overflow-y-auto custom-scrollbar">
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
                  {tahapan.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-14 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                            <Layers size={20} />
                          </div>
                          <p className="font-bold text-slate-700 text-xs">Belum Ada Nomor SOPD yang Dipilih</p>
                          <p className="text-[11px] text-slate-400 max-w-md leading-relaxed">
                            Silakan pilih nomor SOPD pada formulir Bagian 1 di atas untuk memuat dan merakit rincian alur mesin secara otomatis.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    tahapan.map((item, idx) => (
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
                  ))
                )}
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
                <span>{isExistingPlan ? 'Perbarui Rencana Produksi' : 'Simpan Rencana Produksi'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
