'use client';

import React from 'react';
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
    </div>
  );
}
