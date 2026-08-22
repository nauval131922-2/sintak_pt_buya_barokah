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
} from 'lucide-react';
import {
  DEFAULT_MASTER_PARAMS,
  SimulatorMasterParams,
} from '@/lib/pricelist-simulator';

interface MasterParameterProps {
  customParams: SimulatorMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<SimulatorMasterParams>>;
}

export default function PricelistMasterParameter({
  customParams,
  setCustomParams,
}: MasterParameterProps) {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleChange = (key: keyof SimulatorMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
    setSuccessMsg('Parameter berhasil disesuaikan secara lokal untuk kalkulator.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleReset = () => {
    setCustomParams(DEFAULT_MASTER_PARAMS);
    setSuccessMsg('Tarif berhasil dikembalikan ke standar master grafika.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="flex flex-col gap-5 pb-8 overflow-y-auto">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-700/80 rounded-lg">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold tracking-tight">Master Parameter Tarif Grafika</h2>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Tabel basis acuan tarif dasar kertas, mesin cetak offset, ongkos finishing, standar plano, dan konstanta kalkulasi kalender dinding.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 transition-all cursor-pointer shadow-xs"
          >
            <RotateCcw size={13} />
            <span>Reset Standar Master</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium animate-in fade-in duration-300">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

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
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    value={customParams.tarifHvs70}
                    onChange={(e) => handleChange('tarifHvs70', Number(e.target.value))}
                    className="w-full pl-8 pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md"
                  />
                </div>
                <span className="block text-[10px] text-slate-500 mt-1">Ekonomis</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Art Paper 120</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    value={customParams.tarifAp120}
                    onChange={(e) => handleChange('tarifAp120', Number(e.target.value))}
                    className="w-full pl-8 pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md"
                  />
                </div>
                <span className="block text-[10px] text-slate-500 mt-1">Standar Kilap</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Art Paper 150</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                  <input
                    type="number"
                    value={customParams.tarifAp150}
                    onChange={(e) => handleChange('tarifAp150', Number(e.target.value))}
                    className="w-full pl-8 pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md"
                  />
                </div>
                <span className="block text-[10px] text-slate-500 mt-1">Tebal & Premium</span>
              </div>
            </div>
            <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 text-[11px] text-emerald-900">
              💡 <em>Perhitungan otomatis ditambahkan faktor PPN / margin distributor sebesar <strong>+5%</strong> (faktor 1.05).</em>
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
                  <th className="py-1.5 px-2.5">Parameter Mesin</th>
                  <th className="py-1.5 px-2.5 text-center bg-blue-50/40 text-blue-900">Mesin Oliver</th>
                  <th className="py-1.5 px-2.5 text-center bg-purple-50/40 text-purple-900">Mesin SM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11.5px]">
                <tr>
                  <td className="py-2 px-2.5 text-slate-700">Ongkos Min Order (4 plat)</td>
                  <td className="py-2 px-2.5 text-center font-mono font-bold text-slate-800">Rp 90.000 (s/d 1.000 drek)</td>
                  <td className="py-2 px-2.5 text-center font-mono font-bold text-slate-800">Rp 310.000 (s/d 3.000 drek)</td>
                </tr>
                <tr>
                  <td className="py-2 px-2.5 text-slate-700">Insheet Plat Cetak</td>
                  <td className="py-2 px-2.5 text-center font-mono text-slate-700">100 lbr</td>
                  <td className="py-2 px-2.5 text-center font-mono text-slate-700">300 lbr</td>
                </tr>
                <tr>
                  <td className="py-2 px-2.5 text-slate-700">Biaya Plat CTP / Unit</td>
                  <td className="py-2 px-2.5 text-center font-mono text-slate-700">Rp 45.000 / plat</td>
                  <td className="py-2 px-2.5 text-center font-mono text-slate-700">Rp 78.000 / plat</td>
                </tr>
                <tr>
                  <td className="py-2 px-2.5 text-slate-700">Drek Over / Drek</td>
                  <td className="py-2 px-2.5 text-center font-mono text-slate-700">Rp 40 / drek</td>
                  <td className="py-2 px-2.5 text-center font-mono text-slate-700">Rp 100 / drek</td>
                </tr>
                <tr>
                  <td className="py-2 px-2.5 text-slate-700">Biaya Transportasi Mesin</td>
                  <td className="py-2 px-2.5 text-center font-mono text-slate-700">Rp 100.000 / job</td>
                  <td className="py-2 px-2.5 text-center font-mono text-slate-700">Rp 50.000 / job</td>
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
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                <input
                  type="number"
                  value={customParams.tarifSpiralLubang}
                  onChange={(e) => handleChange('tarifSpiralLubang', Number(e.target.value))}
                  className="w-full pl-7 pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md"
                />
              </div>
              <span className="block text-[9.5px] text-slate-500 mt-1">Per lubang spiral</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <label className="block text-[10.5px] font-bold text-slate-700 mb-1">Spiral Min Order</label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                <input
                  type="number"
                  value={customParams.tarifSpiralMin}
                  onChange={(e) => handleChange('tarifSpiralMin', Number(e.target.value))}
                  className="w-full pl-7 pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md"
                />
              </div>
              <span className="block text-[9.5px] text-slate-500 mt-1">Batas minimum</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <label className="block text-[10.5px] font-bold text-slate-700 mb-1">Desain Kalender</label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                <input
                  type="number"
                  value={customParams.tarifDesain}
                  onChange={(e) => handleChange('tarifDesain', Number(e.target.value))}
                  className="w-full pl-7 pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md"
                />
              </div>
              <span className="block text-[9.5px] text-slate-500 mt-1">Per lembar kalender</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <label className="block text-[10.5px] font-bold text-slate-700 mb-1">Almanak Desain</label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                <input
                  type="number"
                  value={customParams.tarifAlmanakDesain}
                  onChange={(e) => handleChange('tarifAlmanakDesain', Number(e.target.value))}
                  className="w-full pl-7 pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md"
                />
              </div>
              <span className="block text-[9.5px] text-slate-500 mt-1">Biaya setting almanak</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <label className="block text-[10.5px] font-bold text-slate-700 mb-1">Royalty Kalender</label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                <input
                  type="number"
                  value={customParams.tarifRoyalty}
                  onChange={(e) => handleChange('tarifRoyalty', Number(e.target.value))}
                  className="w-full pl-7 pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md"
                />
              </div>
              <span className="block text-[9.5px] text-slate-500 mt-1">Per pcs kalender</span>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
              <label className="block text-[10.5px] font-bold text-slate-700 mb-1">Potong Dasar</label>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                <input
                  type="number"
                  value={customParams.tarifPotongDasar}
                  onChange={(e) => handleChange('tarifPotongDasar', Number(e.target.value))}
                  className="w-full pl-7 pr-2 py-1 text-xs font-mono font-bold bg-white border border-slate-200 rounded-md"
                />
              </div>
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
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="font-bold text-slate-800 block">Ukuran 32 x 48 cm</span>
                <span className="text-[11px] text-slate-600">Plano 65 x 100 → <strong>Bagi 4 potong</strong></span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="font-bold text-slate-800 block">Ukuran 38 x 54 cm</span>
                <span className="text-[11px] text-slate-600">Plano 79 x 109 → <strong>Bagi 4 potong</strong></span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="font-bold text-slate-800 block">Ukuran 46 x 64 cm</span>
                <span className="text-[11px] text-slate-600">Plano 65 x 100 → <strong>Bagi 2 potong</strong></span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="font-bold text-slate-800 block">Ukuran 48 x 64 cm</span>
                <span className="text-[11px] text-slate-600">Plano 65 x 100 → <strong>Bagi 2 potong</strong></span>
              </div>
            </div>

            <div className="p-3 bg-violet-50/60 rounded-lg border border-violet-100 text-[11px] text-violet-950 space-y-1">
              <p className="font-bold">Konstanta Berat 1 Rim Kertas Plano (20.000):</p>
              <p className="text-[10.5px] text-violet-900 leading-relaxed">
                Rumus: <code>(Lebar x Panjang x GSM) / 20.000</code> menghasilkan Berat 1 Rim (500 Lembar) dalam satuan Kilogram (Kg).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
