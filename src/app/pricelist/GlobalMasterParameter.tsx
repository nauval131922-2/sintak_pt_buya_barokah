// ponytail: komponen master parameter tarif global (berlaku lintas seluruh produk)

'use client';

import {
  Database,
  Printer,
  FileText,
  RotateCcw,
  Sparkles,
  Layers,
  Box,
  Palette,
  Percent,
  TrendingUp,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  X,
  FileSpreadsheet,
  Search,
  FolderOpen,
  ShoppingCart,
} from 'lucide-react';
import {
  GlobalMasterParams,
  DEFAULT_GLOBAL_PARAMS,
} from '@/lib/global-master-params';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';
import RekapLookupModal from './RekapLookupModal';

interface GlobalMasterParameterProps {
  globalParams: GlobalMasterParams;
  setGlobalParams: React.Dispatch<React.SetStateAction<GlobalMasterParams>>;
  onApplyToAllProducts: (paramsToApply?: GlobalMasterParams) => void;
}

export default function GlobalMasterParameter({
  globalParams,
  setGlobalParams,
  onApplyToAllProducts,
}: GlobalMasterParameterProps) {
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  
  // State untuk Lookup Modal Rekap Pembelian Barang
  const [lookupTarget, setLookupTarget] = useState<{
    key: keyof GlobalMasterParams;
    label: string;
    isRupiah: boolean;
    isDecimal: boolean;
  } | null>(null);
   const handleChange = (key: keyof GlobalMasterParams, val: number) => {
    const updated = { ...globalParams, [key]: Math.max(0, val) };
    setGlobalParams(updated);
    onApplyToAllProducts(updated);
   };
  const isFieldModified = (key: keyof GlobalMasterParams) =>
    globalParams[key] !== DEFAULT_GLOBAL_PARAMS[key];

  const handleResetField = (key: keyof GlobalMasterParams) => {
    const updated = { ...globalParams, [key]: DEFAULT_GLOBAL_PARAMS[key] };
    setGlobalParams(updated);
    onApplyToAllProducts(updated);
    toast.info(`Field dikembalikan ke standar global (${DEFAULT_GLOBAL_PARAMS[key]}).`);
  };
   const isModified = React.useMemo(
     () => JSON.stringify(globalParams) !== JSON.stringify(DEFAULT_GLOBAL_PARAMS),
     [globalParams]
   );

   const handleResetAll = () => {
     setGlobalParams(DEFAULT_GLOBAL_PARAMS);
    onApplyToAllProducts(DEFAULT_GLOBAL_PARAMS);
    toast.success('Semua Master Parameter Global dikembalikan ke standar & disinkronkan.');
   };
  const fieldRow = (
    key: keyof GlobalMasterParams,
    label: string,
    affectedProducts: string,
    isRupiah = true,
    isDecimal = false
  ) => {
    // Field yang relevan untuk ditarik dari Rekap Pembelian Barang
    const isLookupEligible =
      key.startsWith('tarif') ||
      key === 'oliverPlatUnit' ||
      key === 'oliverMinOngkos' ||
      key === 'oliverDrekOver' ||
      key === 'ryobiPlatUnit' ||
      key === 'ryobiMinOngkos' ||
      key === 'ryobiDrekOver';

    return (
      <div
        className={`p-2.5 rounded-lg border transition-all ${
          isFieldModified(key)
            ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
            : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center justify-between gap-1 mb-1.5">
          <label className="text-xs font-semibold text-slate-700 truncate" title={label}>
            {label}
          </label>
          <div className="flex items-center gap-1 shrink-0">
            {isLookupEligible && (
              <button
                type="button"
                onClick={() => setLookupTarget({ key, label, isRupiah, isDecimal })}
                className="text-[9.5px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5 bg-emerald-100/90 hover:bg-emerald-200/80 px-1.5 py-0.5 rounded cursor-pointer transition-colors shadow-2xs"
                title="Ambil nilai tarif dari Riwayat Rekap Pembelian Barang"
              >
                <ShoppingCart className="w-2.5 h-2.5" /> Rekap
              </button>
            )}
            {isFieldModified(key) && (
              <button
                type="button"
                onClick={() => handleResetField(key)}
                className="text-[9.5px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1.5 py-0.5 rounded cursor-pointer shrink-0 transition-colors"
                title="Reset ke default"
              >
                <RotateCcw className="w-2.5 h-2.5" /> Def
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <ThousandInput
            value={globalParams[key]}
            onValueChange={(val) => handleChange(key, val)}
            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
            prefix={isRupiah ? 'Rp' : undefined}
            suffix={isRupiah ? undefined : '%'}
            allowDecimals={isDecimal}
          />
        </div>
        <p className="text-[10px] text-slate-500 font-medium mt-1.5 truncate" title={affectedProducts}>
          Terkait: <span className="text-slate-600 font-semibold">{affectedProducts}</span>
        </p>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5 pb-8 overflow-y-auto">
      {/* Header Info Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-xl border border-white/20 text-white">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Master Parameter Global (Shared Rates)</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full border border-white/30">
                Multi-Produk
              </span>
            </div>
            <p className="text-xs text-emerald-100 mt-0.5">
              Kelola tarif bahan baku, mesin offset, digital print, dan finishing yang dipakai bersama oleh seluruh produk.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/30 transition-all cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Panduan & Pemetaan Excel
          </button>
          {isModified && (
            <button
              type="button"
              onClick={handleResetAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/30 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Default
            </button>
          )}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/20 text-white border border-white/30 backdrop-blur-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
            <span>Otomatis Sinkron Real-time</span>
          </span>
        </div>
      </div>

      {/* Grid Kategori Parameter (2 Kolom) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Mesin Cetak Offset Oliver */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Printer className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold text-slate-800">1. Mesin Offset Besar (Oliver 58/52)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('oliverPlatUnit', 'Tarif Plat CTP / Unit', 'Kalender, Manasik, Brosur, Stopmap')}
            {fieldRow('oliverMinOngkos', 'Min. Cetak (≤1000 Drek)', 'Kalender, Manasik, Brosur, Stopmap')}
            {fieldRow('oliverDrekOver', 'Tarif Drek Over / Drek', 'Kalender, Manasik, Brosur, Stopmap')}
            {fieldRow('oliverTransport', 'Ongkos Transport Cetak', 'Kalender, Packaging')}
          </div>
        </div>

        {/* 2. Mesin Cetak Offset Toko / Ryobi */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Printer className="w-4 h-4 text-cyan-700" />
            <h3 className="text-xs font-bold text-slate-800">2. Mesin Offset Kecil (Ryobi / Toko 1 Warna)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('ryobiPlatUnit', 'Tarif Plat Ryobi / Toko', 'Nota, Buku Tabungan, Buku Mini')}
            {fieldRow('ryobiMinOngkos', 'Min. Cetak (≤1000 Drek)', 'Nota, Buku Tabungan, Buku Mini')}
            {fieldRow('ryobiDrekOver', 'Tarif Drek Over / Drek', 'Nota, Buku Tabungan, Buku Mini')}
          </div>
        </div>

        {/* 3. Bahan Kertas Dasar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800">3. Bahan Kertas Dasar (/Kg)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifHvs70', 'HVS 70 gsm / Kg', 'Kalender, Nota, Buku')}
            {fieldRow('tarifAp120', 'Art Paper 120 / Kg', 'Kalender, Brosur, Majalah')}
            {fieldRow('tarifAp150', 'Art Paper 150 / Kg', 'Kalender, Buku Hardcover')}
            {fieldRow('tarifAc230Kg', 'Art Carton 230 / Kg', 'Buku Manasik, Cover Buku')}
            {fieldRow('tarifAc260Kg', 'Art Carton 260 / Kg', 'Manasik, Syahadah, Sertifikat')}
            {fieldRow('upKertasPct', 'Up / PPN Kertas Dasar (%)', 'Seluruh Produk', false)}
          </div>
        </div>

        {/* 4. Print Digital POD A3+ */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Printer className="w-4 h-4 text-purple-600" />
            <h3 className="text-xs font-bold text-slate-800">4. Print Digital POD A3+</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifPrintA3', 'Print Cover POD A3+', 'Manasik, Yasin, Buku, Sertifikat')}
            {fieldRow('tarifPrintInter1Muka', 'Print Inter 1 Muka', 'Brosur, Buku Tabungan isi')}
            {fieldRow('tarifPrintInter2Muka', 'Print Inter 2 Muka', 'Brosur 2 Muka, Majalah isi')}
          </div>
        </div>

        {/* 5. Tarif Laminasi Standar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-800">5. Jasa Laminasi (/cm²)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifLaminasiGlossyCm2', 'Laminasi Glossy / cm²', 'Manasik, Yasin, Brosur, Buku', true, true)}
            {fieldRow('tarifLaminasiDoffCm2', 'Laminasi Doff / cm²', 'Manasik, Yasin, Brosur, Buku', true, true)}
            {fieldRow('tarifUvVarnishCm2', 'UV Varnish / cm²', 'Manasik, Brosur, Buku', true, true)}
            {fieldRow('minLaminasi', 'Min. Order Laminasi', 'Manasik, Yasin, Buku')}
          </div>
        </div>

        {/* 6. Finishing & Kemasan Standar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Box className="w-4 h-4 text-rose-600" />
            <h3 className="text-xs font-bold text-slate-800">6. Packing & Finishing Umum</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifKardusBox', 'Kardus Box / Pcs', 'Semua Produk')}
            {fieldRow('tarifLakbanRoll', 'Lakban Roll / Pcs', 'Semua Produk')}
            {fieldRow('tarifPlastikOppPcs', 'Plastik OPP / Pcs', 'Manasik, Yasin, Undangan')}
            {fieldRow('tarifSisirPcs', 'Ongkos Potong Sisir', 'Manasik, Yasin, Buku, Brosur')}
            {fieldRow('tarifStaplesPcs', 'Ongkos Staples', 'Manasik, Yasin, Buku Tulis')}
          </div>
        </div>

        {/* 7. Jasa Desain & Margin Standar Perusahaan */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Palette className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-slate-800">7. Jasa Desain & Margin Standar</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifDesainStandar', 'Tarif Desain Standar', 'Amplop, Kop Surat, Buku, Sertifikat')}
            {fieldRow('defaultMarginPct', 'Target Margin Standar (%)', 'Seluruh 30 Produk', false)}
            {fieldRow('defaultNegoPct', 'Batas Diskon Nego (%)', 'Seluruh 30 Produk', false)}
          </div>
        </div>

        {/* Info Box Cara Kerja */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <HelpCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-800 block">Cara Kerja Parameter Global:</span>
              <p>
                1. Ubah tarif standar di atas (misal kenaikan harga kertas, tarif plat offset, tarif desain, atau target margin perusahaan).
              </p>
              <p>
                2. Klik tombol <strong>&ldquo;Terapkan ke Semua Produk&rdquo;</strong> di atas untuk menyinkronkan seluruh parameter di 30 jenis produk sekaligus.
              </p>
              <p>
                3. Jika ingin tarif khusus untuk produk tertentu saja, Anda tetap bisa mengubahnya di tab Parameter produk terkait.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Panduan & Pemetaan 30 Sumber Excel */}
      {showManualModal && (
        <div className="fixed inset-0 z-300 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer">
          <div
            className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-emerald-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-800/80 rounded-xl border border-emerald-700">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Manual Pengguna & Pemetaan 30 Sumber Excel Pricelist SPH 2026</h3>
                  <p className="text-xs text-emerald-200">
                    Lokasi: <span className="font-mono bg-emerald-900/80 px-1.5 py-0.5 rounded border border-emerald-700/60">H:\percetakan buya barokah\backup\a1\02__PEMASARAN\0203_SURAT PENAWARAN HARGA (SPH) out\020326 2026 SURAT PENAWARAN HARGA (SPH) out\Pricelist Juli 2026</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-emerald-300 hover:text-white p-1.5 rounded-lg hover:bg-emerald-800/60 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto text-xs text-slate-700 space-y-5 leading-relaxed">
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 font-medium space-y-1">
                <p className="font-bold text-emerald-900 text-sm">Prinsip Kerja Sinkronisasi Master Parameter Global:</p>
                <p>
                  Parameter Global adalah pusat kendali tarif bersama (shared rates). Setiap kali ada kenaikan harga bahan baku (HVS, Art Paper, Art Carton, NCR, Stiker) atau penyesuaian ongkos cetak mesin Oliver/SM, Anda cukup mengubahnya di halaman ini lalu menekan tombol <strong>&ldquo;Terapkan ke Semua Produk&rdquo;</strong>. Seluruh 30 kalkulator produk di SINTAK akan langsung terbarui secara konsisten.
                </p>
              </div>

              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Database size={15} className="text-emerald-700" />
                    Daftar 30 Modul Produk & Pemetaan File Excel Sumber
                  </h4>
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari produk, folder, mesin..."
                      value={manualSearchQuery}
                      onChange={(e) => setManualSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white shadow-2xs"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[420px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 text-slate-700 font-bold shadow-2xs">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">No</th>
                        <th className="py-2.5 px-3 min-w-[170px]">Kategori & Produk SINTAK</th>
                        <th className="py-2.5 px-3 min-w-[220px]">Folder Referensi Excel</th>
                        <th className="py-2.5 px-3 min-w-[200px]">File Sumber Acuan</th>
                        <th className="py-2.5 px-3 text-center">Alur Mesin</th>
                        <th className="py-2.5 px-3 min-w-[180px]">Finishing & Packing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {[
                        { no: 1, kategori: 'Buku Manasik', nama: 'Buku Manasik Haji / Umroh', folder: '01. Pricelist Buku Manasik', file: 'Buku Manasik Cetakan Baru Juni 2026 - Custom Cover 2026.xlsm', mesin: 'Oliver 58', finishing: 'Laminasi Glossy/Doff, Sisir, Staples, Box' },
                        { no: 2, kategori: 'Buku Yasin', nama: 'Buku Surat Yasin', folder: '02. Pricelist Yasin', file: 'Pricelist Yasin 96 dan 128.xlsx', mesin: 'Oliver 58', finishing: 'Laminasi Glossy/Doff, Sisir, Staples, Plastik OPP' },
                        { no: 3, kategori: 'Nota 1 Warna', nama: 'Nota / Surat Jalan 1 Warna', folder: '03. Pricelist Nota 1 Warna', file: 'Pricelist Nota 1 warna.xlsx', mesin: 'Toko 810 / Ryobi 48', finishing: 'Nomorator, Porporasi, Lem/Jilid Buku' },
                        { no: 4, kategori: 'Brosur 2026', nama: 'Brosur Custom (AP 120 / AP 150)', folder: '04. Pricelist Brosur 2026', file: 'Pricelist BROSUR 2026.xlsm', mesin: 'Oliver 58 / POD Inter', finishing: 'Laminasi Glossy/Doff/UV, Lipat, Sisir, Box' },
                        { no: 5, kategori: 'Label KHQ', nama: 'Label KHQ Air Minum', folder: '05. Pricelist Label KHQ', file: 'Pricelist Label KHQ  JUNI 2026.xlsm', mesin: 'Oliver 58', finishing: 'Laminasi Glossy, Potong Sisir' },
                        { no: 6, kategori: 'Buku Tulis', nama: 'Buku Tulis Sekolah / Yayasan', folder: '06. Pricelist Buku Tulis', file: 'Pricelist Buku Tulis.xlsx', mesin: 'Oliver 58', finishing: 'Laminasi Glossy, Staples Palu, Sisir, Box' },
                        { no: 7, kategori: 'Stopmap', nama: 'Stopmap / Map Dokumen Folio', folder: '07. Pricelist Stopmap', file: 'Pricelist Stopmap.xlsx', mesin: 'Oliver 58', finishing: 'Laminasi Glossy/Doff, Pond Kantong, Lem, Box' },
                        { no: 8, kategori: 'Syahadah', nama: 'Syahadah / Piagam Kelulusan', folder: '08. Pricelist Syahadah', file: 'Pricelist Syahadah.xlsx', mesin: 'Oliver 58 / Ryobi / POD', finishing: 'Potong Sisir, Packing Dus' },
                        { no: 9, kategori: 'Raport Kaleb', nama: 'Raport Kaleb / Map Ijazah Hotprint', folder: '09. Pricelist Raport Kaleb', file: 'Pricelist Raport Kaleb.xlsx', mesin: 'Emboss Foil Hotprint', finishing: 'Karton Hardboard, Mika Baut/Mata Itik' },
                        { no: 10, kategori: 'Kop Surat', nama: 'Kop Surat Resmi Instansi', folder: '10. Pricelist Kop Surat', file: 'Pricelist Kop Surat.xlsx', mesin: 'Oliver 58 / Ryobi / POD', finishing: 'Potong Sisir, Packing Box' },
                        { no: 11, kategori: 'Amplop', nama: 'Amplop Custom Kop Perusahaan', folder: '11. Pricelist Amplop', file: 'Pricelist Amplop.xlsm', mesin: 'Oliver 58 / Ryobi', finishing: 'Pond Pola, Lipat Lem Seal, Box' },
                        { no: 12, kategori: 'Sertifikat', nama: 'Sertifikat / Piagam Penghargaan', folder: '12. Pricelist Sertifikat', file: 'Pricelist SERTIFIKAT.xlsm', mesin: 'Oliver 58 / POD A3+', finishing: 'Laminasi Glossy/Doff, Sisir, Box' },
                        { no: 13, kategori: 'Undangan', nama: 'Undangan Pernikahan / Acara', folder: '13. Pricelist Undangan', file: 'Pricelist Undangan.xlsm', mesin: 'Oliver 58 / POD A3+', finishing: 'Laminasi Doff/Glossy, Pond Rel, OPP' },
                        { no: 14, kategori: 'Buku Tabungan NS', nama: 'Buku Tabungan Non-Security', folder: '14. Pricelist Buku Tabungan Non Security', file: 'Pricelist Buku Tabungan Non Security.xlsm', mesin: 'Oliver 58 + Toko/Ryobi', finishing: 'Laminasi, Jahit Kawat/Benang, Sisir, Pond' },
                        { no: 15, kategori: 'Buku Tabungan Security', nama: 'Buku Tabungan Security Pattern', folder: '15. Pricelist Buku Tabungan Security', file: 'Pricelist Buku Tabungan Security.xlsm', mesin: 'Oliver (Invisible/Guilloche)', finishing: 'Laminasi, Jahit Benang, Sisir, Nomorator' },
                        { no: 16, kategori: 'Kartu Koperasi Promise', nama: 'Kartu Koperasi / Janji Anggota', folder: '15. Pricelist kartu Koperasi Promise', file: 'Pricelist kartu Koperasi Promise.xlsm', mesin: 'Oliver 58', finishing: 'Pond Garis Lipat, Potong Sisir, Dus' },
                        { no: 17, kategori: 'Lebel Kartu Obat', nama: 'Label / Kartu Berobat RS & Klinik', folder: '16. Pricelist Lebel Kartu Obat', file: 'Pricelist Lebel Kartu Obat.xlsx', mesin: 'Oliver 58 / Toko', finishing: 'Potong Sisir Presisi, Packing Dus' },
                        { no: 18, kategori: 'Buku Soft Cover', nama: 'Buku Soft Cover Standar (A4 / B5)', folder: '17. Pricelist Buku Soft Cover', file: 'Pricelist Buku Soft Cover.xlsx', mesin: 'POD A3+ + Oliver', finishing: 'Laminasi Doff/Glossy/UV, Staples, Sisir, Box' },
                        { no: 19, kategori: 'Buku Soft Cover 14,5×20,25', nama: 'Buku Soft Cover Sedang (14,5×20,25 cm)', folder: '18. Pricelist Buku Soft Cover - 14,5 x 20,25 cm', file: 'Pricelist Buku Soft Cover - 14,5 x 20,25 cm.xlsx', mesin: 'POD A3+ + Oliver/Ryobi', finishing: 'Laminasi Doff/Glossy, Lem Panas / Staples, Sisir' },
                        { no: 20, kategori: 'Buku Hard Cover 10,5×14,8', nama: 'Buku Hard Cover Saku (10,5×14,8 cm)', folder: '18. Pricelist Hard Cover - 10,5 x 14,8 cm', file: 'Pricelist Buku Hard Cover 10,5 x 14,8 cm.xlsx', mesin: 'POD A3+ + Oliver/Ryobi', finishing: 'Laminasi Doff/Glossy, Board No. 30/40, Casing-In' },
                        { no: 21, kategori: 'Poster', nama: 'Poster Dinding (A3+ / A2 / Plano)', folder: '19. Pricelist Poster', file: 'Pricelist Poster.xlsx', mesin: 'Oliver 58 / SM 72 / SM 102', finishing: 'Laminasi Glossy/Doff/UV, Potong Sisir, Box' },
                        { no: 22, kategori: 'Majalah', nama: 'Majalah / Buletin Berkala (14,5×20,25)', folder: '20. Pricelist Majalah - 14,5 x 20,25 cm', file: '20. Pricelist Majalah - 14,5 x 20,25 cm.xlsx', mesin: 'Oliver 58 (Cover & Isi)', finishing: 'Laminasi Doff/Glossy/UV, Staples Tengah, Sisir, Box' },
                        { no: 23, kategori: 'Kalender', nama: 'Kalender Dinding 2027 (Spiral & Klem)', folder: '22. Pricelist Kalender 2027 Spiral / 30. Klem', file: 'Pricelist Kalender 2027 Spiral.xlsx', mesin: 'Oliver 58 / SM 72', finishing: 'Jilid Spiral Gantung / Klem Seng Plat, Box' },
                        { no: 24, kategori: 'Stiker', nama: 'Stiker Cromo & Vinyl Die Cut', folder: '23. Pricelist Stiker', file: 'Pricelist Stiker.xlsx', mesin: 'Oliver 58 / POD A3+', finishing: 'Rajang / Half Cut, Laminasi Glossy, Box' },
                        { no: 25, kategori: 'Buku Soft Cover 10,5×14,8', nama: 'Buku Soft Cover Saku (10,5×14,8 cm)', folder: '24. Pricelist Buku Soft Cover - 10,5 x 14,8 cm', file: 'Pricelist Buku Soft Cover - 10,5 x 14,8 cm.xlsx', mesin: 'POD A3+ + Oliver/Ryobi', finishing: 'Laminasi Doff/Glossy/UV, Staples, Sisir, Box' },
                        { no: 26, kategori: 'Buku Hard Cover 14,5×20,25', nama: 'Buku Hard Cover Sedang (14,5×20,25 cm)', folder: '25. Pricelist Hard Cover - 14,5 x 20,25 cm', file: 'Pricelist Buku Hard Cover 14,5 x 20,25 cm.xlsx', mesin: 'POD A3+ + Oliver', finishing: 'Laminasi Doff/Glossy, Board No. 30, Casing-In' },
                        { no: 27, kategori: 'Buku Hard Cover 21×29,7', nama: 'Buku Hard Cover Besar / Skripsi (A4)', folder: '26. Pricelist Hard Cover - 21 x 29,7 cm', file: 'Pricelist Buku Hard Cover 21 x 29,7 cm.xlsx', mesin: 'POD A3+ + Oliver/SM', finishing: 'Laminasi Doff/Glossy, Board No. 30, Casing-In' },
                        { no: 28, kategori: 'Kalender Kop', nama: 'Kalender Kop Blanko / Sablon', folder: '27. Pricelist Kalender Kop', file: 'Pricelist Kalender Kop.xlsx', mesin: 'Sablon Manual / Offset', finishing: 'Klem Seng Standar, Packing Dus' },
                        { no: 29, kategori: 'Packaging', nama: 'Packaging Dus / Box Kemasan Custom', folder: '28. Pricelist Packaging', file: 'Pricelist Packaging.xlsx', mesin: 'Oliver 58 / SM 72 + Pond', finishing: 'Laminasi Doff/Glossy/Window, Pond Garis, Lem' },
                        { no: 30, kategori: 'Paperbag', nama: 'Paperbag / Tas Kertas Custom Cetak', folder: '29. Pricelist Paperbag', file: 'Pricelist Paperbag.xlsx', mesin: 'Oliver 58 / SM 72 + Pond', finishing: 'Laminasi Doff/Glossy, Pond Pola, Pasang Tali' },
                      ]
                        .filter((row) => {
                          if (!manualSearchQuery.trim()) return true;
                          const q = manualSearchQuery.toLowerCase();
                          return (
                            row.nama.toLowerCase().includes(q) ||
                            row.kategori.toLowerCase().includes(q) ||
                            row.folder.toLowerCase().includes(q) ||
                            row.file.toLowerCase().includes(q) ||
                            row.mesin.toLowerCase().includes(q) ||
                            row.finishing.toLowerCase().includes(q)
                          );
                        })
                        .map((row) => (
                          <tr key={row.no} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 text-center font-mono text-slate-500 font-bold">{row.no}</td>
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-slate-900 block">{row.nama}</span>
                              <span className="text-[10px] text-emerald-700 font-semibold">{row.kategori}</span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">{row.folder}</td>
                            <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px] truncate max-w-[200px]" title={row.file}>
                              {row.file}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                {row.mesin}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-[10.5px] text-slate-600">
                              {row.finishing}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Rumus Standar Markup Harga & Nego</h4>
                <p>
                  Seluruh modul di SINTAK menggunakan formula pembulatan ke atas ratusan (ROUNDUP ke ratusan):<br />
                  <code>Harga Jual = CEIL(HPP × (1 + Margin_Profit_Pct) / 100) × 100</code><br />
                  <code>Harga Nego = CEIL(Harga_Jual × (1 - Batas_Nego_Pct) / 100) × 100</code>
                </p>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowManualModal(false)}
                className="px-4 py-1.5 bg-emerald-800 text-white font-bold rounded-lg hover:bg-emerald-900 transition-all cursor-pointer text-xs shadow-xs"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Lookup Rekap Pembelian Barang */}
      {lookupTarget && (
        <RekapLookupModal
          isOpen={Boolean(lookupTarget)}
          onClose={() => setLookupTarget(null)}
          targetKey={lookupTarget.key}
          targetLabel={lookupTarget.label}
          currentValue={globalParams[lookupTarget.key]}
          isRupiah={lookupTarget.isRupiah}
          isDecimal={lookupTarget.isDecimal}
          onSelectValue={(newVal) => {
            handleChange(lookupTarget.key, newVal);
          }}
        />
      )}
    </div>
  );
}
