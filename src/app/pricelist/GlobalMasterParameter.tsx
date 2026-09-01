// ponytail: komponen master parameter tarif global (berlaku lintas seluruh produk)

'use client';

import React, { useState } from 'react';
import {
  Database,
  Printer,
  FileText,
  RotateCcw,
  Sparkles,
  Layers,
  Box,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import {
  GlobalMasterParams,
  DEFAULT_GLOBAL_PARAMS,
} from '@/lib/global-master-params';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

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
  ) => (
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
        {isFieldModified(key) && (
          <button
            type="button"
            onClick={() => handleResetField(key)}
            className="text-[9.5px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
            title="Reset ke default"
          >
            <RotateCcw className="w-2.5 h-2.5" /> Def
          </button>
        )}
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
            <h3 className="text-xs font-bold text-slate-800">1. Mesin Offset (Oliver 58/52)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('oliverPlatUnit', 'Tarif Plat CTP / Unit', 'Kalender, Manasik, Brosur')}
            {fieldRow('oliverMinOngkos', 'Min. Cetak (≤1000 Drek)', 'Kalender, Manasik, Brosur')}
            {fieldRow('oliverDrekOver', 'Tarif Drek Over / Drek', 'Kalender, Manasik, Brosur')}
            {fieldRow('oliverTransport', 'Ongkos Transport Cetak', 'Kalender')}
          </div>
        </div>

        {/* 2. Bahan Kertas Dasar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800">2. Bahan Kertas Dasar (/Kg)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifHvs70', 'HVS 70 gsm / Kg', 'Kalender, Nota')}
            {fieldRow('tarifAp120', 'Art Paper 120 / Kg', 'Kalender, Brosur')}
            {fieldRow('tarifAp150', 'Art Paper 150 / Kg', 'Kalender')}
            {fieldRow('tarifAc230Kg', 'Art Carton 230 / Kg', 'Buku Manasik')}
            {fieldRow('tarifAc260Kg', 'Art Carton 260 / Kg', 'Buku Manasik')}
            {fieldRow('upKertasPct', 'Up / PPN Kertas Dasar (%)', 'Kalender, Nota, Brosur', false)}
          </div>
        </div>

        {/* 3. Print Digital POD A3+ */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Printer className="w-4 h-4 text-purple-600" />
            <h3 className="text-xs font-bold text-slate-800">3. Print Digital POD A3+</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifPrintA3', 'Print Cover POD A3+', 'Manasik, Yasin')}
            {fieldRow('tarifPrintInter1Muka', 'Print Inter 1 Muka', 'Brosur 2026')}
            {fieldRow('tarifPrintInter2Muka', 'Print Inter 2 Muka', 'Brosur 2026')}
          </div>
        </div>

        {/* 4. Tarif Laminasi Standar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-800">4. Jasa Laminasi (/cm²)</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifLaminasiGlossyCm2', 'Laminasi Glossy / cm²', 'Manasik, Yasin, Brosur', true, true)}
            {fieldRow('tarifLaminasiDoffCm2', 'Laminasi Doff / cm²', 'Manasik, Yasin, Brosur', true, true)}
            {fieldRow('tarifUvVarnishCm2', 'UV Varnish / cm²', 'Manasik, Brosur', true, true)}
            {fieldRow('minLaminasi', 'Min. Order Laminasi', 'Manasik, Yasin')}
          </div>
        </div>

        {/* 5. Finishing & Kemasan Standar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Box className="w-4 h-4 text-rose-600" />
            <h3 className="text-xs font-bold text-slate-800">5. Packing & Finishing Umum</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {fieldRow('tarifKardusBox', 'Kardus Box / Pcs', 'Manasik, Brosur')}
            {fieldRow('tarifLakbanRoll', 'Lakban Roll / Pcs', 'Kalender, Brosur')}
            {fieldRow('tarifPlastikOppPcs', 'Plastik OPP / Pcs', 'Manasik, Yasin')}
            {fieldRow('tarifSisirPcs', 'Ongkos Potong Sisir', 'Manasik, Yasin')}
            {fieldRow('tarifStaplesPcs', 'Ongkos Staples', 'Manasik, Yasin')}
          </div>
        </div>

        {/* Info Box Cara Kerja */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <HelpCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-800 block">Cara Kerja Parameter Global:</span>
              <p>
                1. Ubah tarif standar di atas (misal kenaikan harga kertas atau tarif plat Oliver).
              </p>
              <p>
                2. Klik tombol <strong>&ldquo;Terapkan ke Semua Produk&rdquo;</strong> di atas untuk menyinkronkan seluruh parameter di modul Kalender, Manasik, Yasin, Nota, dan Brosur sekaligus.
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
            className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-800/80 rounded-xl border border-emerald-700">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Manual Pengguna & Pemetaan 30 Sumber Excel Pricelist</h3>
                  <p className="text-xs text-emerald-200">Referensi: Folder SPH Pricelist Juli–Agustus 2026 PT Buya Barokah</p>
                </div>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-emerald-300 hover:text-white p-1.5 rounded-lg hover:bg-emerald-800/60 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto text-xs text-slate-700 space-y-5 leading-relaxed">
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950 font-medium space-y-1">
                <p className="font-bold text-emerald-900 text-sm">Prinsip Kerja Sinkronisasi Parameter Global:</p>
                <p>
                  Parameter Global adalah pusat kendali tarif bersama (shared rates). Setiap kali ada kenaikan harga bahan baku (HVS, Art Paper, Art Carton, NCR, Stiker) atau penyesuaian ongkos cetak mesin Oliver/SM, Anda cukup mengubahnya di halaman ini lalu menekan tombol <strong>&ldquo;Terapkan ke Semua Produk&rdquo;</strong>.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                  <Database size={15} className="text-emerald-700" />
                  Daftar 30 Modul Produk & Pemetaan File Excel Sumber
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                        <th className="py-2.5 px-3 w-10 text-center">No</th>
                        <th className="py-2.5 px-3 min-w-[160px]">Jenis Produk SINTAK</th>
                        <th className="py-2.5 px-3 min-w-[220px]">Folder Referensi Excel</th>
                        <th className="py-2.5 px-3 min-w-[180px]">File Sumber Acuan</th>
                        <th className="py-2.5 px-3 text-center">Alur Mesin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {[
                        { no: 1, nama: 'Buku Manasik Haji', folder: '01. Pricelist Buku Manasik', file: 'Source/*.xlsm', mesin: 'Oliver' },
                        { no: 2, nama: 'Buku Surat Yasin', folder: '02. Pricelist Yasin', file: 'Pricelist Yasin 96 dan 128.xlsx', mesin: 'Oliver' },
                        { no: 3, nama: 'Nota 1 Warna', folder: '03. Pricelist Nota 1 Warna', file: 'Pricelist Nota 1 warna.xlsx', mesin: 'Tokoe / Ryobi' },
                        { no: 4, nama: 'Brosur 2026', folder: '04. Pricelist Brosur 2026', file: 'Pricelist BROSUR 2026.xlsm', mesin: 'Oliver' },
                        { no: 5, nama: 'Label KHQ (Air Minum)', folder: '05. Pricelist Label KHQ', file: 'Pricelist Label KHQ JUNI 2026.xlsm', mesin: 'Oliver' },
                        { no: 6, nama: 'Buku Tulis', folder: '06. Pricelist Buku Tulis', file: 'Pricelist Buku Tulis.xlsx', mesin: 'Oliver' },
                        { no: 7, nama: 'Stopmap / Map Dokumen', folder: '07. Pricelist Stopmap', file: 'Pricelist Stopmap.xlsx', mesin: 'Oliver' },
                        { no: 8, nama: 'Syahadah Kelulusan', folder: '08. Pricelist Syahadah', file: 'Pricelist Syahadah Juli 2026.xlsx', mesin: 'Oliver' },
                        { no: 9, nama: 'Raport Kaleb / Map Raport', folder: '09. Pricelist Raport Kaleb', file: 'Pricelist Raport Kaleb.xlsx', mesin: 'Emboss / Foil Hotprint' },
                        { no: 10, nama: 'Kop Surat Resmi', folder: '10. Pricelist Kop Surat', file: 'Pricelist Kop Surat.xlsx', mesin: 'Oliver' },
                        { no: 11, nama: 'Amplop Custom', folder: '11. Pricelist Amplop', file: 'Pricelist Amplop.xlsx', mesin: 'Oliver / Toko' },
                        { no: 12, nama: 'Sertifikat Piagam', folder: '12. Pricelist Sertifikat', file: 'Pricelist Sertifikat.xlsx', mesin: 'Oliver' },
                        { no: 13, nama: 'Undangan Pernikahan', folder: '13. Pricelist Undangan', file: 'Pricelist Undangan.xlsx', mesin: 'Oliver' },
                        { no: 14, nama: 'Buku Tabungan Non-Sec', folder: '14. Pricelist Buku Tabungan Non Security', file: 'Pricelist Buku Tabungan Non Security.xlsx', mesin: 'Oliver' },
                        { no: 15, nama: 'Buku Tabungan Security', folder: '15. Pricelist Buku Tabungan Security', file: 'Pricelist Buku Tabungan Security.xlsx', mesin: 'Oliver (Invisible/Guilloche)' },
                        { no: 16, nama: 'Kartu Koperasi Promise', folder: '15. Pricelist kartu Koperasi Promise', file: 'Pricelist kartu Koperasi Promise.xlsx', mesin: 'Oliver' },
                        { no: 17, nama: 'Lebel Kartu Obat', folder: '16. Pricelist Lebel Kartu Obat', file: 'Pricelist Lebel Kartu Obat.xlsx', mesin: 'Oliver' },
                        { no: 18, nama: 'Buku Soft Cover (A4)', folder: '17. Pricelist Buku Soft Cover', file: 'Pricelist Buku Soft Cover.xlsx', mesin: 'Print Inter + Oliver' },
                        { no: 19, nama: 'Buku Soft Cover (A5)', folder: '18. Pricelist Buku Soft Cover - 14,5 x 20,25 cm', file: 'Pricelist Buku Soft Cover - 14,5 x 20,25 cm.xlsx', mesin: 'Oliver' },
                        { no: 20, nama: 'Buku Hard Cover (A6)', folder: '18. Pricelist Hard Cover - 10,5 x 14,8 cm', file: 'Pricelist Buku Hard Cover 10,5 x 14,8 cm.xlsx', mesin: 'Oliver / Inter' },
                        { no: 21, nama: 'Poster Custom', folder: '19. Pricelist Poster', file: 'Pricelist Poster.xlsx', mesin: 'Oliver / SM' },
                        { no: 22, nama: 'Majalah 14,5×20,25', folder: '20. Pricelist Majalah - 14,5 x 20,25 cm', file: '20. Pricelist Majalah - 14,5 x 20,25 cm.xlsx', mesin: 'Oliver' },
                        { no: 23, nama: 'Kalender 2027 (Spiral & Klem)', folder: '22. Kalender 2027 Spiral / 30. Klem', file: 'Pricelist Kalender 2027 Spiral.xlsx', mesin: 'Oliver / SM' },
                        { no: 24, nama: 'Stiker Cromo & Vynil', folder: '23. Pricelist Stiker', file: 'Pricelist Stiker.xlsx', mesin: 'Oliver / SM' },
                        { no: 25, nama: 'Buku Soft Cover (A6)', folder: '24. Pricelist Buku Soft Cover - 10,5 x 14,8 cm', file: 'Pricelist Buku Soft Cover - 10,5 x 14,8 cm.xlsx', mesin: 'Oliver' },
                        { no: 26, nama: 'Buku Hard Cover (A5)', folder: '25. Pricelist Hard Cover - 14,5 x 20,25 cm', file: 'Pricelist Buku Hard Cover 14,5 x 20,25 cm.xlsx', mesin: 'Oliver / SM' },
                        { no: 27, nama: 'Buku Hard Cover (A4)', folder: '26. Pricelist Hard Cover - 21 x 29,7 cm', file: 'Pricelist Buku Hard Cover 21 x 29,7 cm.xlsx', mesin: 'Oliver / SM' },
                        { no: 28, nama: 'Kalender Kop (Blanko)', folder: '27. Pricelist Kalender Kop', file: 'Pricelist Kalender Kop.xlsx', mesin: 'Sablon / Offset' },
                        { no: 29, nama: 'Packaging Box Dus', folder: '28. Pricelist Packaging', file: 'Pricelist Packaging.xlsx', mesin: 'Oliver / SM + Pond' },
                        { no: 30, nama: 'Paperbag Tas Kertas', folder: '29. Pricelist Paperbag', file: 'Pricelist Paperbag.xlsx', mesin: 'Oliver / SM + Tali' },
                      ].map((row) => (
                        <tr key={row.no} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-center font-mono text-slate-500">{row.no}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{row.nama}</td>
                          <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">{row.folder}</td>
                          <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">{row.file}</td>
                          <td className="py-2 px-3 text-center">
                            <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {row.mesin}
                            </span>
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
                className="px-4 py-1.5 bg-emerald-800 text-white font-bold rounded-lg hover:bg-emerald-900 transition-all cursor-pointer text-xs"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
