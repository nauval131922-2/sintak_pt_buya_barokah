'use client';

import React, { useState } from 'react';
import {
  Database,
  Sliders,
  RotateCcw,
  Layers,
  HelpCircle,
  Package,
  Scissors,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FolderTree,
  ExternalLink,
  X,
  BookOpen,
} from 'lucide-react';
import {
  DEFAULT_MASTER_PARAMS,
  SimulatorMasterParams,
} from '@/lib/pricelist-simulator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface MasterParameterProps {
  customParams: SimulatorMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<SimulatorMasterParams>>;
}

export default function PricelistMasterParameter({
  customParams,
  setCustomParams,
}: MasterParameterProps) {
  const [showManualModal, setShowManualModal] = useState(false);

  const handleChange = (key: keyof SimulatorMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const handleReset = () => {
    setCustomParams(DEFAULT_MASTER_PARAMS);
    toast.success('Tarif berhasil dikembalikan ke standar master.');
  };

  return (
    <div className="flex flex-col gap-5 pb-8 overflow-y-auto">
      {/* Header Info - Soft Emerald/Slate Style */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-emerald-950 tracking-tight">Master Parameter Tarif Percetakan</h2>
              <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
                Tabel acuan tarif dasar bahan kertas, mesin cetak offset, ongkos finishing, ukuran plano, dan konstanta kalender.
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-emerald-100/50 text-emerald-800 border border-emerald-300 transition-all cursor-pointer shadow-2xs"
          >
            <BookOpen size={13} />
            <span>Manual Pengguna & Pemetaan Excel</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-emerald-100/50 text-emerald-800 border border-emerald-300 transition-all cursor-pointer shadow-2xs"
          >
            <RotateCcw size={13} />
            <span>Reset Standar Master</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Section 1: Harga Bahan Kertas */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                1. Harga Bahan Kertas (Per Kg)
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Satuan: Rp / kg</span>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">HVS 70 gsm</label>
                <ThousandInput
                  prefix="Rp"
                  value={customParams.tarifHvs70}
                  onValueChange={(val) => handleChange('tarifHvs70', val)}
                  className="w-full pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="block text-[10px] text-slate-500 mt-1">Ekonomis</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Art Paper 120</label>
                <ThousandInput
                  prefix="Rp"
                  value={customParams.tarifAp120}
                  onValueChange={(val) => handleChange('tarifAp120', val)}
                  className="w-full pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="block text-[10px] text-slate-500 mt-1">Standar Kilap</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Art Paper 150</label>
                <ThousandInput
                  prefix="Rp"
                  value={customParams.tarifAp150}
                  onValueChange={(val) => handleChange('tarifAp150', val)}
                  className="w-full pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="block text-[10px] text-slate-500 mt-1">Tebal & Premium</span>
              </div>
            </div>

            {/* Setting Faktor PPN / Margin Kertas */}
            <div className="bg-emerald-50/60 p-3 rounded-lg border border-emerald-200/70 flex items-center justify-between gap-3 text-xs text-emerald-950">
              <div>
                <span className="font-bold block text-xs">PPN / Margin Toko Kertas:</span>
                <span className="text-[10.5px] text-emerald-800">
                  Persentase tambahan margin/PPN pada harga distributor kertas
                </span>
              </div>
              <div className="w-24 shrink-0">
                <ThousandInput
                  suffix="%"
                  value={Math.round((customParams.ppnMarginKertas - 1) * 100 * 100) / 100}
                  onValueChange={(val) => handleChange('ppnMarginKertas', 1 + (val || 0) / 100)}
                  className="w-full pr-6 py-1 text-xs font-mono font-bold bg-white border border-emerald-300 rounded-md text-right focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Mesin Cetak & Tarif */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Standar Mesin Cetak & Tarif
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Oliver vs Speedmaster</span>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                  <th className="py-2 px-2.5">Parameter Mesin</th>
                  <th className="py-2 px-2.5 text-center bg-blue-50/40 text-blue-900 w-36">Mesin Oliver</th>
                  <th className="py-2 px-2.5 text-center bg-purple-50/40 text-purple-900 w-36">Mesin SM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11.5px]">
                <tr>
                  <td className="py-2 px-2.5 text-slate-700">Ongkos Min Order (4 plat)</td>
                  <td className="py-1.5 px-2">
                    <ThousandInput
                      prefix="Rp"
                      value={customParams.oliverMinOngkos}
                      onValueChange={(val) => handleChange('oliverMinOngkos', val)}
                      className="w-full pr-1.5 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md text-right"
                    />
                  </td>
                  <td className="py-1.5 px-2">
                    <ThousandInput
                      prefix="Rp"
                      value={customParams.smMinOngkos}
                      onValueChange={(val) => handleChange('smMinOngkos', val)}
                      className="w-full pr-1.5 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md text-right"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-2.5 text-slate-700">Insheet Plat Cetak</td>
                  <td className="py-1.5 px-2">
                    <ThousandInput
                      suffix="lbr"
                      value={customParams.oliverInsheet}
                      onValueChange={(val) => handleChange('oliverInsheet', val)}
                      className="w-full pr-7 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md text-right"
                    />
                  </td>
                  <td className="py-1.5 px-2">
                    <ThousandInput
                      suffix="lbr"
                      value={customParams.smInsheet}
                      onValueChange={(val) => handleChange('smInsheet', val)}
                      className="w-full pr-7 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md text-right"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-2.5 text-slate-700">Biaya Plat CTP / Unit</td>
                  <td className="py-1.5 px-2">
                    <ThousandInput
                      prefix="Rp"
                      value={customParams.oliverPlatUnit}
                      onValueChange={(val) => handleChange('oliverPlatUnit', val)}
                      className="w-full pr-1.5 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md text-right"
                    />
                  </td>
                  <td className="py-1.5 px-2">
                    <ThousandInput
                      prefix="Rp"
                      value={customParams.smPlatUnit}
                      onValueChange={(val) => handleChange('smPlatUnit', val)}
                      className="w-full pr-1.5 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md text-right"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-2.5 text-slate-700">Batas Min Drek (Kapasitas Min)</td>
                  <td className="py-1.5 px-2">
                    <ThousandInput
                      suffix="drek"
                      value={customParams.oliverBatasDrek}
                      onValueChange={(val) => handleChange('oliverBatasDrek', val)}
                      className="w-full pr-8 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md text-right"
                    />
                  </td>
                  <td className="py-1.5 px-2">
                    <ThousandInput
                      suffix="drek"
                      value={customParams.smBatasDrek}
                      onValueChange={(val) => handleChange('smBatasDrek', val)}
                      className="w-full pr-8 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md text-right"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-2.5 text-slate-700">Drek Over / Drek</td>
                  <td className="py-1.5 px-2">
                    <ThousandInput
                      prefix="Rp"
                      value={customParams.oliverDrekOver}
                      onValueChange={(val) => handleChange('oliverDrekOver', val)}
                      className="w-full pr-1.5 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md text-right"
                    />
                  </td>
                  <td className="py-1.5 px-2">
                    <ThousandInput
                      prefix="Rp"
                      value={customParams.smDrekOver}
                      onValueChange={(val) => handleChange('smDrekOver', val)}
                      className="w-full pr-1.5 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md text-right"
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-2.5 text-slate-700">Biaya Transportasi Mesin</td>
                  <td className="py-1.5 px-2">
                    <ThousandInput
                      prefix="Rp"
                      value={customParams.oliverTransport}
                      onValueChange={(val) => handleChange('oliverTransport', val)}
                      className="w-full pr-1.5 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md text-right"
                    />
                  </td>
                  <td className="py-1.5 px-2">
                    <ThousandInput
                      prefix="Rp"
                      value={customParams.smTransport}
                      onValueChange={(val) => handleChange('smTransport', val)}
                      className="w-full pr-1.5 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md text-right"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Ongkos Finishing & Jasa */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                3. Ongkos Finishing & Jasa Cetak
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Baku Grafika</span>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <label className="block text-[10.5px] font-bold text-slate-700 mb-1">Spiral (cm x Rp)</label>
              <ThousandInput
                prefix="Rp"
                value={customParams.tarifSpiralLubang}
                onValueChange={(val) => handleChange('tarifSpiralLubang', val)}
                className="w-full pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="block text-[9.5px] text-slate-500 mt-1">Per lubang spiral</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <label className="block text-[10.5px] font-bold text-slate-700 mb-1">Spiral Min Order</label>
              <ThousandInput
                prefix="Rp"
                value={customParams.tarifSpiralMin}
                onValueChange={(val) => handleChange('tarifSpiralMin', val)}
                className="w-full pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="block text-[9.5px] text-slate-500 mt-1">Batas minimum</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <label className="block text-[10.5px] font-bold text-slate-700 mb-1">Desain Kalender</label>
              <ThousandInput
                prefix="Rp"
                value={customParams.tarifDesain}
                onValueChange={(val) => handleChange('tarifDesain', val)}
                className="w-full pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="block text-[9.5px] text-slate-500 mt-1">Per lembar kalender</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <label className="block text-[10.5px] font-bold text-slate-700 mb-1">Almanak Desain</label>
              <ThousandInput
                prefix="Rp"
                value={customParams.tarifAlmanakDesain}
                onValueChange={(val) => handleChange('tarifAlmanakDesain', val)}
                className="w-full pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="block text-[9.5px] text-slate-500 mt-1">Biaya setting almanak</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <label className="block text-[10.5px] font-bold text-slate-700 mb-1">Royalty Kalender</label>
              <ThousandInput
                prefix="Rp"
                value={customParams.tarifRoyalty}
                onValueChange={(val) => handleChange('tarifRoyalty', val)}
                className="w-full pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="block text-[9.5px] text-slate-500 mt-1">Per pcs kalender</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <label className="block text-[10.5px] font-bold text-slate-700 mb-1">Potong Dasar</label>
              <ThousandInput
                prefix="Rp"
                value={customParams.tarifPotongDasar}
                onValueChange={(val) => handleChange('tarifPotongDasar', val)}
                className="w-full pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="block text-[9.5px] text-slate-500 mt-1">Per lembar potong</span>
            </div>
          </div>
        </div>

        {/* Section 4: Standar Plano & Konstanta */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-600"></span>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                4. Standar Ukuran Plano & Konstanta
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">Baku Hitungan</span>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Ukuran 32 x 48 cm</span>
                  <span className="text-[10px] text-slate-500">Plano 65 x 100</span>
                </div>
                <div className="w-20">
                  <ThousandInput
                    suffix="ptg"
                    value={customParams.potong32x48}
                    onValueChange={(val) => handleChange('potong32x48', val)}
                    className="w-full pr-7 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md text-right"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Ukuran 38 x 54 cm</span>
                  <span className="text-[10px] text-slate-500">Plano 79 x 109</span>
                </div>
                <div className="w-20">
                  <ThousandInput
                    suffix="ptg"
                    value={customParams.potong38x54}
                    onValueChange={(val) => handleChange('potong38x54', val)}
                    className="w-full pr-7 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md text-right"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Ukuran 46 x 64 cm</span>
                  <span className="text-[10px] text-slate-500">Plano 65 x 100</span>
                </div>
                <div className="w-20">
                  <ThousandInput
                    suffix="ptg"
                    value={customParams.potong46x64}
                    onValueChange={(val) => handleChange('potong46x64', val)}
                    className="w-full pr-7 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md text-right"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block text-xs">Ukuran 48 x 64 cm</span>
                  <span className="text-[10px] text-slate-500">Plano 65 x 100</span>
                </div>
                <div className="w-20">
                  <ThousandInput
                    suffix="ptg"
                    value={customParams.potong48x64}
                    onValueChange={(val) => handleChange('potong48x64', val)}
                    className="w-full pr-7 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md text-right"
                  />
                </div>
              </div>
            </div>

            {/* Konstanta Grafika */}
            <div className="p-3 bg-violet-50/60 rounded-lg border border-violet-100 flex flex-col gap-2.5 text-xs text-violet-950">
              <div className="flex items-center justify-between gap-2 border-b border-violet-200/50 pb-2">
                <span className="font-bold">Konstanta Berat 1 Rim Kertas Plano:</span>
                <div className="w-28">
                  <ThousandInput
                    value={customParams.konstantaBeratRim}
                    onValueChange={(val) => handleChange('konstantaBeratRim', val)}
                    className="w-full py-1 px-2 text-xs font-mono font-bold bg-white border border-violet-200 rounded-md text-right"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 border-b border-violet-200/50 pb-2">
                <span className="font-bold">Standar Isi 1 Rim (Lembar):</span>
                <div className="w-28">
                  <ThousandInput
                    suffix="lbr"
                    value={customParams.lembarPerRim}
                    onValueChange={(val) => handleChange('lembarPerRim', val)}
                    className="w-full pr-7 py-1 text-xs font-mono font-bold bg-white border border-violet-200 rounded-md text-right"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="font-bold block">Kapasitas Lakban per Roll:</span>
                  <span className="text-[10px] text-violet-800">8.000 cm / 60 cm keliling ikat</span>
                </div>
                <div className="w-28">
                  <ThousandInput
                    suffix="ikat"
                    value={customParams.kapasitasLakbanRoll}
                    onValueChange={(val) => handleChange('kapasitasLakbanRoll', val)}
                    className="w-full pr-8 py-1 text-xs font-mono font-bold bg-white border border-violet-200 rounded-md text-right"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Manual Pengguna & Pemetaan Excel */}
      {showManualModal && (
        <div
          onClick={() => setShowManualModal(false)}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden cursor-default"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-800/80 rounded-xl border border-emerald-700 text-emerald-200">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight">Manual Pengguna & Pemetaan Sumber Excel</h3>
                  <p className="text-xs text-emerald-200/90 mt-0.5">
                    Dokumentasi referensi letak sheet, cell, dan formula dari 72 file kalkulasi satuan percetakan
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800/60 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
              {/* Bagian 1: Pemetaan 4 Kelompok Master Parameter */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  Pemetaan 4 Bagian Master Parameter ke File Excel (Folder Source/*.xlsm)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Poin 1 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>1. Harga Bahan Kertas (Per Kg)</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Harga Dasar / Kg</strong>: <span className="font-mono text-emerald-700">Dashboard!D27</span> (HVS 70: Rp 15.700, AP 120/150: Rp 17.400).</li>
                      <li>• <strong>PPN / Margin Kertas</strong>: <span className="font-mono text-emerald-700">Dashboard!E27</span> (Nilai: 0.05 = 5%).</li>
                      <li>• <strong>Harga per Ream Plano</strong>: <span className="font-mono text-slate-600">KALENDER!BE29</span> = <code className="text-[10px] bg-white px-1 py-0.5 rounded border">[(L*P*GSM)/20.000] * (Tarif * 1.05)</code>.</li>
                    </ul>
                  </div>

                  {/* Poin 2 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span>2. Standar Mesin Cetak & Tarif</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Insheet Plat</strong>: <span className="font-mono text-blue-700">Dashboard!D29</span> (Oliver: 100 lbr, SM: 300 lbr).</li>
                      <li>• <strong>Biaya Plat CTP / Unit</strong>: <span className="font-mono text-blue-700">KALENDER!BG6</span> (Oliver: Rp 45.000, SM: Rp 78.000).</li>
                      <li>• <strong>Ongkos Cetak Min Order</strong>: <span className="font-mono text-blue-700">KALENDER!BJ6</span> (Oliver: Rp 90.000, SM: Rp 310.000).</li>
                      <li>• <strong>Batas Min Drek (Kapasitas)</strong>: <span className="font-mono text-blue-700">KALENDER!BM7</span> (Oliver: 1.000 drek, SM: 3.000 drek).</li>
                      <li>• <strong>Tarif Drek Over</strong>: <span className="font-mono text-blue-700">KALENDER!BK7</span> (Oliver: Rp 40, SM: Rp 100).</li>
                      <li>• <strong>Biaya Transport Mesin</strong>: <span className="font-mono text-blue-700">KALENDER!CU6</span> (Oliver: Rp 100.000, SM: Rp 50.000).</li>
                    </ul>
                  </div>

                  {/* Poin 3 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>3. Ongkos Finishing & Jasa Cetak</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Desain Kalender</strong>: <span className="font-mono text-amber-700">Dashboard!D30</span> (Rp 30.000 per lembar kalender).</li>
                      <li>• <strong>Almanak Desain</strong>: <span className="font-mono text-amber-700">KALENDER!CF6</span> (Rp 30.000 setting almanak).</li>
                      <li>• <strong>Royalty Kalender</strong>: <span className="font-mono text-amber-700">Dashboard!D41</span> (Rp 150 per pcs / eksemplar).</li>
                      <li>• <strong>Ongkos Potong Dasar</strong>: <span className="font-mono text-amber-700">KALENDER!CT6</span> (Rp 2.000 per lembar potong).</li>
                      <li>• <strong>Susun / Colator</strong>: <span className="font-mono text-amber-700">KALENDER!CW6</span> (32x48: Rp 40, 38x54: Rp 55, 46x64: Rp 70, 48x64: Rp 75).</li>
                      <li>• <strong>Spiral Per Lubang & Min</strong>: <span className="font-mono text-amber-700">Dashboard!D39 & KALENDER!CX6</span> (Rp 150/cm lubang, min Rp 250rb).</li>
                      <li>• <strong>Lakban & Packing</strong>: <span className="font-mono text-amber-700">Dashboard!D40</span> (Rp 9.600 per roll lakban).</li>
                    </ul>
                  </div>

                  {/* Poin 4 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                      <span>4. Standar Ukuran Plano & Konstanta</span>
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600">
                      <li>• <strong>Plano Potong</strong>: <span className="font-mono text-violet-700">KALENDER!AX7</span> (32x48: 4 ptg, 38x54: 4 ptg, 46x64 & 48x64: 2 ptg).</li>
                      <li>• <strong>Konstanta Berat 1 Rim</strong>: <span className="font-mono text-violet-700">KALENDER!BE29</span> (Angka konversi baku: 20.000).</li>
                      <li>• <strong>Standar Isi 1 Rim</strong>: <span className="font-mono text-violet-700">KALENDER!BE32</span> (500 lembar plano).</li>
                      <li>• <strong>Kapasitas Lakban</strong>: <span className="font-mono text-violet-700">KALENDER!CV6</span> (8.000 cm / 60 cm keliling ikat = 133.33 ikat).</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Bagian 2: Tabel Pemetaan 11 Komponen Biaya Total HPP */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  Rincian 11 Komponen Pembentuk Total HPP (Rumus: KALENDER!DA7)
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100/80 border-b border-slate-200 font-bold text-slate-800 text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Komponen Biaya</th>
                        <th className="py-2.5 px-3">Cell di File Satuan (.xlsm)</th>
                        <th className="py-2.5 px-3">Formula / Logika Grafika</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-900">1. Bahan Kertas</td>
                        <td className="py-2 px-3">
                          Sheet <span className="font-mono text-emerald-700">Dashboard!D27</span> (Tarif/kg)<br />
                          Sheet <span className="font-mono text-emerald-700">Dashboard!E27</span> (PPN/Margin 5%)<br />
                          Sheet <span className="font-mono text-slate-600">KALENDER!BE29</span> (Harga per Rim)
                        </td>
                        <td className="py-2 px-3 font-mono text-[10.5px] text-slate-600">
                          [(L*P*GSM)/20.000] * (Tarif + 5% PPN) / 500 * (Oplah+Insheet)*Lbr / Potong
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-900">2. Biaya Plat CTP</td>
                        <td className="py-2 px-3">
                          Sheet <span className="font-mono text-emerald-700">KALENDER!BG6</span> (Rp 45rb Oliver / Rp 78rb SM)<br />
                          Sheet <span className="font-mono text-slate-600">KALENDER!BG7</span> (=BG6 * Jml Plat)
                        </td>
                        <td className="py-2 px-3 font-mono text-[10.5px] text-slate-600">
                          Ceil(Lembar / Area Cetak) * 4 Plat * Biaya Plat Unit
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-900">3. Ongkos Mesin Cetak</td>
                        <td className="py-2 px-3">
                          Sheet <span className="font-mono text-emerald-700">KALENDER!BJ6</span> (Min Order: Rp 90rb Oliver / Rp 310rb SM)<br />
                          Sheet <span className="font-mono text-emerald-700">KALENDER!BK7</span> (Drek Over: Rp 40 Oliver / Rp 100 SM)<br />
                          Sheet <span className="font-mono text-emerald-700">KALENDER!BM7</span> (Batas Min Drek: Oliver 1.000 / SM 3.000)
                        </td>
                        <td className="py-2 px-3 font-mono text-[10.5px] text-slate-600">
                          (Jml Plat * Min Order) + (MAX(0, Oplah+Insheet - Batas) * Over * Jml Plat)
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-900">4. Desain Kalender</td>
                        <td className="py-2 px-3">
                          Sheet <span className="font-mono text-emerald-700">Dashboard!D30</span> (Rp 30.000/lbr)<br />
                          Sheet <span className="font-mono text-slate-600">KALENDER!BD6:BD13</span>
                        </td>
                        <td className="py-2 px-3 font-mono text-[10.5px] text-slate-600">
                          Tarif Desain * Jumlah Lembar Kalender
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-900">5. Plat & Cetak Almanak</td>
                        <td className="py-2 px-3">
                          Sheet <span className="font-mono text-emerald-700">KALENDER!CF6</span> (Desain Almanak Rp 30.000)<br />
                          Sheet <span className="font-mono text-emerald-700">KALENDER!CI6</span> (1 Plat Almanak: Rp 45rb / Rp 78rb)<br />
                          Sheet <span className="font-mono text-emerald-700">KALENDER!CN6</span> (Cetak Almanak Dasar + Over)
                        </td>
                        <td className="py-2 px-3 font-mono text-[10.5px] text-slate-600">
                          Desain Almanak + 1 Plat Unit + Ongkos Min (+ Over drek)
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-900">6. Royalty Kalender</td>
                        <td className="py-2 px-3">
                          Sheet <span className="font-mono text-emerald-700">Dashboard!D41</span> (Rp 150/pcs)<br />
                          Sheet <span className="font-mono text-slate-600">KALENDER!CR6:CR13</span>
                        </td>
                        <td className="py-2 px-3 font-mono text-[10.5px] text-slate-600">
                          Tarif Royalty * Oplah
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-900">7. Potong Dasar</td>
                        <td className="py-2 px-3">
                          Sheet <span className="font-mono text-emerald-700">KALENDER!CT6</span> (Rp 2.000/lbr)
                        </td>
                        <td className="py-2 px-3 font-mono text-[10.5px] text-slate-600">
                          (Tarif * Lembar) + (Tarif * (Lembar / IF(32x48, 4, 2)))
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-900">8. Susun / Colator</td>
                        <td className="py-2 px-3">
                          Sheet <span className="font-mono text-emerald-700">KALENDER!CW6</span> (Rp 40/55/70/75 per lbr per ukuran)
                        </td>
                        <td className="py-2 px-3 font-mono text-[10.5px] text-slate-600">
                          Lembar * Tarif Colator * (Oplah + Insheet/2)
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-900">9. Spiral Kawat (Jilid)</td>
                        <td className="py-2 px-3">
                          Sheet <span className="font-mono text-emerald-700">Dashboard!D39</span> (Rp 150/lubang)<br />
                          Sheet <span className="font-mono text-slate-600">KALENDER!CX6:CX13</span> (Min Rp 250.000)
                        </td>
                        <td className="py-2 px-3 font-mono text-[10.5px] text-slate-600">
                          MAX(Min Rp 250.000, (Lebar cm * Tarif) * (Oplah + 5))
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-900">10. Lakban & Packing</td>
                        <td className="py-2 px-3">
                          Sheet <span className="font-mono text-emerald-700">Dashboard!D40</span> (Rp 9.600/roll)<br />
                          Sheet <span className="font-mono text-slate-600">KALENDER!CV6:CV13</span> (Kapasitas: 8000/60 = 133.33 ikat)
                        </td>
                        <td className="py-2 px-3 font-mono text-[10.5px] text-slate-600">
                          MAX(Tarif 1 Roll, ((Oplah / 50) / 133.33) * Tarif Roll)
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-semibold text-slate-900">11. Transportasi</td>
                        <td className="py-2 px-3">
                          Sheet <span className="font-mono text-emerald-700">KALENDER!CU6</span> (Oliver: Rp 100.000 / SM: Rp 50.000)
                        </td>
                        <td className="py-2 px-3 font-mono text-[10.5px] text-slate-600">
                          Biaya flat per job sesuai mesin cetak yang digunakan
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ringkasan Rumus Harga Jual & Nego */}
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 space-y-2">
                <h5 className="font-bold text-emerald-950 text-xs uppercase tracking-wider">
                  Rumus HPP, Harga Jual (+30%), dan Harga Nego (-4%)
                </h5>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-emerald-900 font-mono">
                  <li><span className="font-sans font-semibold">Total Biaya Produksi:</span> SUM(11 Komponen Biaya di atas)</li>
                  <li><span className="font-sans font-semibold">HPP per Exemplar:</span> Total Biaya Produksi / Oplah</li>
                  <li><span className="font-sans font-semibold">Harga Jual (+30%):</span> ROUNDUP((HPP * 1.30), -2) [dibulatkan ke atas ke ratusan terdekat]</li>
                  <li><span className="font-sans font-semibold">Harga Nego (-4%):</span> ROUNDUP((Harga Jual * 0.96), -2) [diskon 4% dibulatkan ke atas]</li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowManualModal(false)}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white transition-all cursor-pointer shadow-xs"
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
