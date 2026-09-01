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
  Bookmark,
  ArrowRight,
  Printer,
  FileText,
  Box,
} from 'lucide-react';
import {
  DEFAULT_MASTER_PARAMS,
  DEFAULT_MASTER_PARAMS_KLEM,
  SimulatorMasterParams,
} from '@/lib/pricelist-simulator';
import ThousandInput from '@/components/ThousandInput';
import { toast } from '@/lib/toast';

interface MasterParameterProps {
  customParams: SimulatorMasterParams;
  setCustomParams: React.Dispatch<React.SetStateAction<SimulatorMasterParams>>;
  activeFinishing?: 'Spiral' | 'Klem';
  onChangeFinishing?: (mode: 'Spiral' | 'Klem') => void;
  activeSimulationId?: string | null;
  activeSimulationTitle?: string | null;
  onBackToSimulator?: () => void;
}

const KALENDER_VISIBLE_KEYS: (keyof SimulatorMasterParams)[] = [
  'smMinOngkos',
  'smInsheet',
  'smPlatUnit',
  'smDrekOver',
  'smTransport',
  'smBatasDrek',
  'oliverMinOngkos',
  'oliverInsheet',
  'oliverPlatUnit',
  'oliverDrekOver',
  'oliverTransport',
  'oliverBatasDrek',
  'tarifDesain',
  'tarifAlmanakDesain',
  'tarifRoyalty',
  'tarifPotongDasar',
  'tarifSpiralLubang',
  'tarifSpiralMin',
  'klem32x48',
  'klem38x54',
  'klem46x64',
  'klem48x64',
  'potong32x48',
  'potong38x54',
  'potong46x64',
  'potong48x64',
  'konstantaBeratRim',
  'lembarPerRim',
  'kapasitasLakbanRoll',
];

export default function PricelistMasterParameter({
  customParams,
  setCustomParams,
  activeFinishing = 'Spiral',
  onChangeFinishing,
  activeSimulationId,
  activeSimulationTitle,
  onBackToSimulator,
}: MasterParameterProps) {
  const [showManualModal, setShowManualModal] = useState(false);

  const handleChange = (key: keyof SimulatorMasterParams, val: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: Math.max(0, val) }));
  };

  const standardParams = React.useMemo(() => {
    return activeFinishing === 'Klem' ? DEFAULT_MASTER_PARAMS_KLEM : DEFAULT_MASTER_PARAMS;
  }, [activeFinishing]);

  const isFieldModified = (key: keyof SimulatorMasterParams) => {
    return customParams[key] !== standardParams[key];
  };

  const handleResetField = (key: keyof SimulatorMasterParams, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCustomParams((prev) => ({ ...prev, [key]: standardParams[key] }));
    toast.info(`Field dikembalikan ke standar master (${standardParams[key]}).`);
  };

  const isModified = React.useMemo(() => {
    return KALENDER_VISIBLE_KEYS.some((key) => customParams[key] !== standardParams[key]);
  }, [customParams, standardParams]);

  const handleReset = () => {
    setCustomParams((prev) => {
      const resetObj = { ...prev };
      const ref = activeFinishing === 'Klem' ? DEFAULT_MASTER_PARAMS_KLEM : DEFAULT_MASTER_PARAMS;
      KALENDER_VISIBLE_KEYS.forEach((k) => {
        (resetObj as any)[k] = ref[k];
      });
      return resetObj;
    });
    toast.success('Tarif parameter kalender berhasil dikembalikan ke standar master.');
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
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm sm:text-base font-bold text-emerald-950 tracking-tight">Master Parameter Tarif Kalender</h2>
                {isModified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                    Dimodifikasi
                  </span>
                )}
              </div>
              <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
                Tabel acuan tarif dasar bahan kertas, mesin cetak offset, ongkos finishing, ukuran plano, dan konstanta kalender.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shrink-0">
          {/* Toggle Profil Jilid */}
          {onChangeFinishing && (
            <div className="flex items-center bg-emerald-100/50 p-0.5 rounded-lg border border-emerald-300 text-xs shadow-2xs">
              <button
                type="button"
                onClick={() => onChangeFinishing('Spiral')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeFinishing === 'Spiral'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-emerald-800 hover:text-emerald-950'
                }`}
                title="Profil Tarif Jilid Spiral"
              >
                Spiral
              </button>
              <button
                type="button"
                onClick={() => onChangeFinishing('Klem')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeFinishing === 'Klem'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-emerald-800 hover:text-emerald-950'
                }`}
                title="Profil Tarif Jilid Klem Seng"
              >
                Klem
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-emerald-100/50 text-emerald-800 border border-emerald-300 transition-all cursor-pointer shadow-2xs"
          >
            <BookOpen size={13} />
            <span>Manual Pengguna</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={!isModified}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs ${
              isModified
                ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer ring-2 ring-amber-400/40'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-70'
            }`}
          >
            <RotateCcw size={13} />
            <span>Reset Standar Master</span>
          </button>
        </div>
      </div>

      {/* Banner Informasi Mode Edit Simulasi Aktif */}
      {activeSimulationId && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-200 text-amber-900 rounded-lg shrink-0">
              <Bookmark className="w-4 h-4 fill-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded">
                  Edit Parameter Riwayat Simulasi
                </span>
                <h4 className="text-xs font-bold text-amber-950">
                  {activeSimulationTitle}
                </h4>
              </div>
              <p className="text-[11px] text-amber-800/90 mt-0.5">
                Perubahan tarif di sini akan langsung mempengaruhi kalkulasi riwayat simulasi yang sedang dimuat.
              </p>
            </div>
          </div>
          {onBackToSimulator && (
            <button
              type="button"
              onClick={onBackToSimulator}
              className="px-3.5 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <span>Kembali ke Simulator</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Section: Tarif Mesin & Insheet Oliver vs SM (tabel perbandingan 50% grid) */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-3.5 shadow-2xs flex flex-col gap-2.5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
          <Printer className="w-4 h-4 text-purple-600" />
          <h3 className="text-xs font-bold text-slate-800">1. Standar Mesin Cetak & Tarif (Oliver 58 vs SM 52)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold text-[10.5px]">
                <th className="py-1.5 px-2">Parameter Mesin</th>
                <th className="py-1.5 px-2 text-center bg-blue-50/40 text-blue-900 w-28 sm:w-32">Mesin Oliver</th>
                <th className="py-1.5 px-2 text-center bg-purple-50/40 text-purple-900 w-28 sm:w-32">Mesin SM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              <tr>
                <td className="py-1 px-1.5 text-slate-700">Ongkos Min Order (4 plat)</td>
                <td className={`py-1 px-1.5 ${isFieldModified('oliverMinOngkos') ? 'bg-amber-50/70' : ''}`}>
                  <div className="flex items-center gap-1">
                    <ThousandInput
                      prefix="Rp"
                      value={customParams.oliverMinOngkos}
                      onValueChange={(val) => handleChange('oliverMinOngkos', val)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                    />
                    {isFieldModified('oliverMinOngkos') && (
                      <button
                        type="button"
                        onClick={(e) => handleResetField('oliverMinOngkos', e)}
                        title="Reset ke default"
                        className="text-[9px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1 py-0.5 rounded cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </td>
                <td className={`py-1 px-1.5 ${isFieldModified('smMinOngkos') ? 'bg-amber-50/70' : ''}`}>
                  <div className="flex items-center gap-1">
                    <ThousandInput
                      prefix="Rp"
                      value={customParams.smMinOngkos}
                      onValueChange={(val) => handleChange('smMinOngkos', val)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                    />
                    {isFieldModified('smMinOngkos') && (
                      <button
                        type="button"
                        onClick={(e) => handleResetField('smMinOngkos', e)}
                        title="Reset ke default"
                        className="text-[9px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1 py-0.5 rounded cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
              <tr>
                <td className="py-1 px-1.5 text-slate-700">Insheet Plat Cetak</td>
                <td className={`py-1 px-1.5 ${isFieldModified('oliverInsheet') ? 'bg-amber-50/70' : ''}`}>
                  <div className="flex items-center gap-1">
                    <ThousandInput
                      suffix="lbr"
                      value={customParams.oliverInsheet}
                      onValueChange={(val) => handleChange('oliverInsheet', val)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                    />
                    {isFieldModified('oliverInsheet') && (
                      <button
                        type="button"
                        onClick={(e) => handleResetField('oliverInsheet', e)}
                        title="Reset ke default"
                        className="text-[9px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1 py-0.5 rounded cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </td>
                <td className={`py-1 px-1.5 ${isFieldModified('smInsheet') ? 'bg-amber-50/70' : ''}`}>
                  <div className="flex items-center gap-1">
                    <ThousandInput
                      suffix="lbr"
                      value={customParams.smInsheet}
                      onValueChange={(val) => handleChange('smInsheet', val)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                    />
                    {isFieldModified('smInsheet') && (
                      <button
                        type="button"
                        onClick={(e) => handleResetField('smInsheet', e)}
                        title="Reset ke default"
                        className="text-[9px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1 py-0.5 rounded cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
              <tr>
                <td className="py-1 px-1.5 text-slate-700">Biaya Plat CTP / Unit</td>
                <td className={`py-1 px-1.5 ${isFieldModified('oliverPlatUnit') ? 'bg-amber-50/70' : ''}`}>
                  <div className="flex items-center gap-1">
                    <ThousandInput
                      prefix="Rp"
                      value={customParams.oliverPlatUnit}
                      onValueChange={(val) => handleChange('oliverPlatUnit', val)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                    />
                    {isFieldModified('oliverPlatUnit') && (
                      <button
                        type="button"
                        onClick={(e) => handleResetField('oliverPlatUnit', e)}
                        title="Reset ke default"
                        className="text-[9px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1 py-0.5 rounded cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </td>
                <td className={`py-1 px-1.5 ${isFieldModified('smPlatUnit') ? 'bg-amber-50/70' : ''}`}>
                  <div className="flex items-center gap-1">
                    <ThousandInput
                      prefix="Rp"
                      value={customParams.smPlatUnit}
                      onValueChange={(val) => handleChange('smPlatUnit', val)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                    />
                    {isFieldModified('smPlatUnit') && (
                      <button
                        type="button"
                        onClick={(e) => handleResetField('smPlatUnit', e)}
                        title="Reset ke default"
                        className="text-[9px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1 py-0.5 rounded cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
              <tr>
                <td className="py-1 px-1.5 text-slate-700">Batas Min Drek (Kapasitas Min)</td>
                <td className={`py-1 px-1.5 ${isFieldModified('oliverBatasDrek') ? 'bg-amber-50/70' : ''}`}>
                  <div className="flex items-center gap-1">
                    <ThousandInput
                      suffix="drek"
                      value={customParams.oliverBatasDrek}
                      onValueChange={(val) => handleChange('oliverBatasDrek', val)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                    />
                    {isFieldModified('oliverBatasDrek') && (
                      <button
                        type="button"
                        onClick={(e) => handleResetField('oliverBatasDrek', e)}
                        title="Reset ke default"
                        className="text-[9px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1 py-0.5 rounded cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </td>
                <td className={`py-1 px-1.5 ${isFieldModified('smBatasDrek') ? 'bg-amber-50/70' : ''}`}>
                  <div className="flex items-center gap-1">
                    <ThousandInput
                      suffix="drek"
                      value={customParams.smBatasDrek}
                      onValueChange={(val) => handleChange('smBatasDrek', val)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                    />
                    {isFieldModified('smBatasDrek') && (
                      <button
                        type="button"
                        onClick={(e) => handleResetField('smBatasDrek', e)}
                        title="Reset ke default"
                        className="text-[9px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1 py-0.5 rounded cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
              <tr>
                <td className="py-1 px-1.5 text-slate-700">Drek Over / Drek</td>
                <td className={`py-1 px-1.5 ${isFieldModified('oliverDrekOver') ? 'bg-amber-50/70' : ''}`}>
                  <div className="flex items-center gap-1">
                    <ThousandInput
                      prefix="Rp"
                      value={customParams.oliverDrekOver}
                      onValueChange={(val) => handleChange('oliverDrekOver', val)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                    />
                    {isFieldModified('oliverDrekOver') && (
                      <button
                        type="button"
                        onClick={(e) => handleResetField('oliverDrekOver', e)}
                        title="Reset ke default"
                        className="text-[9px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1 py-0.5 rounded cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </td>
                <td className={`py-1 px-1.5 ${isFieldModified('smDrekOver') ? 'bg-amber-50/70' : ''}`}>
                  <div className="flex items-center gap-1">
                    <ThousandInput
                      prefix="Rp"
                      value={customParams.smDrekOver}
                      onValueChange={(val) => handleChange('smDrekOver', val)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                    />
                    {isFieldModified('smDrekOver') && (
                      <button
                        type="button"
                        onClick={(e) => handleResetField('smDrekOver', e)}
                        title="Reset ke default"
                        className="text-[9px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1 py-0.5 rounded cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
              <tr>
                <td className="py-1 px-1.5 text-slate-700">Biaya Transportasi Mesin</td>
                <td className={`py-1 px-1.5 ${isFieldModified('oliverTransport') ? 'bg-amber-50/70' : ''}`}>
                  <div className="flex items-center gap-1">
                    <ThousandInput
                      prefix="Rp"
                      value={customParams.oliverTransport}
                      onValueChange={(val) => handleChange('oliverTransport', val)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                    />
                    {isFieldModified('oliverTransport') && (
                      <button
                        type="button"
                        onClick={(e) => handleResetField('oliverTransport', e)}
                        title="Reset ke default"
                        className="text-[9px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1 py-0.5 rounded cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </td>
                <td className={`py-1 px-1.5 ${isFieldModified('smTransport') ? 'bg-amber-50/70' : ''}`}>
                  <div className="flex items-center gap-1">
                    <ThousandInput
                      prefix="Rp"
                      value={customParams.smTransport}
                      onValueChange={(val) => handleChange('smTransport', val)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-1.5 py-1 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                    />
                    {isFieldModified('smTransport') && (
                      <button
                        type="button"
                        onClick={(e) => handleResetField('smTransport', e)}
                        title="Reset ke default"
                        className="text-[9px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1 py-0.5 rounded cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

        {/* Section 2: Jasa Desain & Almanak Kalender */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800">2. Jasa Desain, Almanak & Royalty</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className={`p-2.5 rounded-lg border transition-all ${
                isFieldModified('tarifDesain')
                  ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
                  : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
              }`}>
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 truncate" title="Jasa Desain">Jasa Desain</label>
                    {isFieldModified('tarifDesain') && (
                      <button
                        type="button"
                        onClick={(e) => handleResetField('tarifDesain', e)}
                        title="Reset ke default"
                        className="text-[9.5px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-2.5 h-2.5" /> Def
                      </button>
                    )}
                  </div>
                  <ThousandInput
                    prefix="Rp"
                    value={customParams.tarifDesain}
                    onValueChange={(val) => handleChange('tarifDesain', val)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                  />
                </div>
              </div>

              <div className={`p-2.5 rounded-lg border transition-all ${
                isFieldModified('tarifAlmanakDesain')
                  ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
                  : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
              }`}>
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 truncate" title="Desain Almanak">Desain Almanak</label>
                    {isFieldModified('tarifAlmanakDesain') && (
                      <button
                        type="button"
                        onClick={(e) => handleResetField('tarifAlmanakDesain', e)}
                        title="Reset ke default"
                        className="text-[9.5px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-2.5 h-2.5" /> Def
                      </button>
                    )}
                  </div>
                  <ThousandInput
                    prefix="Rp"
                    value={customParams.tarifAlmanakDesain}
                    onValueChange={(val) => handleChange('tarifAlmanakDesain', val)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                  />
                </div>
              </div>

              <div className={`p-2.5 rounded-lg border transition-all ${
                isFieldModified('tarifRoyalty')
                  ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
                  : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
              }`}>
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 truncate" title="Royalti Almanak">Royalti Almanak</label>
                    {isFieldModified('tarifRoyalty') && (
                      <button
                        type="button"
                        onClick={(e) => handleResetField('tarifRoyalty', e)}
                        title="Reset ke default"
                        className="text-[9.5px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-2.5 h-2.5" /> Def
                      </button>
                    )}
                  </div>
                  <ThousandInput
                    prefix="Rp"
                    value={customParams.tarifRoyalty}
                    onValueChange={(val) => handleChange('tarifRoyalty', val)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                  />
                </div>
              </div>
          </div>
        </div>

        {/* Section 4: Standar Plano & Konstanta */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Box className="w-4 h-4 text-rose-600" />
            <h3 className="text-xs font-bold text-slate-800">3. Standar Ukuran Plano & Konstanta</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className={`p-2.5 rounded-lg border flex items-center justify-between transition-all ${
                isFieldModified('potong32x48') ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40' : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
              }`}>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-800 block text-xs">Ukuran 32 x 48 cm</span>
                    {isFieldModified('potong32x48') && (
                      <button
                        type="button"
                        onClick={(e) => handleResetField('potong32x48', e)}
                        title="Reset ke default"
                        className="text-[9.5px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-2.5 h-2.5" /> Def
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500">Plano 65 x 100</span>
                </div>
                <div className="w-20">
                  <ThousandInput
                    suffix="ptg"
                    value={customParams.potong32x48}
                    onValueChange={(val) => handleChange('potong32x48', val)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                  />
                </div>
              </div>

              <div className={`p-2.5 rounded-lg border flex items-center justify-between transition-all ${
                isFieldModified('potong38x54') ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40' : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
              }`}>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-800 block text-xs">Ukuran 38 x 54 cm</span>
                    {isFieldModified('potong38x54') && (
                      <button
                        type="button"
                        onClick={(e) => handleResetField('potong38x54', e)}
                        title="Reset ke default"
                        className="text-[9.5px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-2.5 h-2.5" /> Def
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500">Plano 79 x 109</span>
                </div>
                <div className="w-20">
                  <ThousandInput
                    suffix="ptg"
                    value={customParams.potong38x54}
                    onValueChange={(val) => handleChange('potong38x54', val)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                  />
                </div>
              </div>

              <div className={`p-2.5 rounded-lg border flex items-center justify-between transition-all ${
                isFieldModified('potong46x64') ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40' : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
              }`}>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-800 block text-xs">Ukuran 46 x 64 cm</span>
                    {isFieldModified('potong46x64') && (
                      <button
                        type="button"
                        onClick={(e) => handleResetField('potong46x64', e)}
                        title="Reset ke default"
                        className="text-[9.5px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-2.5 h-2.5" /> Def
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500">Plano 65 x 100</span>
                </div>
                <div className="w-20">
                  <ThousandInput
                    suffix="ptg"
                    value={customParams.potong46x64}
                    onValueChange={(val) => handleChange('potong46x64', val)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                  />
                </div>
              </div>

              <div className={`p-2.5 rounded-lg border flex items-center justify-between transition-all ${
                isFieldModified('potong48x64') ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40' : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
              }`}>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-800 block text-xs">Ukuran 48 x 64 cm</span>
                    {isFieldModified('potong48x64') && (
                      <button
                        type="button"
                        onClick={(e) => handleResetField('potong48x64', e)}
                        title="Reset ke default"
                        className="text-[9.5px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-2.5 h-2.5" /> Def
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500">Plano 65 x 100</span>
                </div>
                <div className="w-20">
                  <ThousandInput
                    suffix="ptg"
                    value={customParams.potong48x64}
                    onValueChange={(val) => handleChange('potong48x64', val)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Konstanta Grafika */}
            <div className="p-3 bg-violet-50/60 rounded-lg border border-violet-100 flex flex-col gap-2.5 text-xs text-violet-950">
              <div className={`flex items-center justify-between gap-2 border-b border-violet-200/50 pb-2 p-1 rounded ${
                isFieldModified('konstantaBeratRim') ? 'bg-amber-50 border-amber-200' : ''
              }`}>
                <div className="flex items-center gap-1">
                  <span className="font-bold">Konstanta Berat 1 Rim Kertas Plano:</span>
                  {isFieldModified('konstantaBeratRim') && (
                    <button
                      type="button"
                      onClick={(e) => handleResetField('konstantaBeratRim', e)}
                      title="Reset ke default"
                      className="text-[9.5px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                    >
                      <RotateCcw className="w-2.5 h-2.5" /> Def
                    </button>
                  )}
                </div>
                <div className="w-28">
                  <ThousandInput
                    value={customParams.konstantaBeratRim}
                    onValueChange={(val) => handleChange('konstantaBeratRim', val)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                  />
                </div>
              </div>
              <div className={`flex items-center justify-between gap-2 border-b border-violet-200/50 pb-2 p-1 rounded ${
                isFieldModified('lembarPerRim') ? 'bg-amber-50 border-amber-200' : ''
              }`}>
                <div className="flex items-center gap-1">
                  <span className="font-bold">Standar Isi 1 Rim (Lembar):</span>
                  {isFieldModified('lembarPerRim') && (
                    <button
                      type="button"
                      onClick={(e) => handleResetField('lembarPerRim', e)}
                      title="Reset ke default"
                      className="text-[9.5px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                    >
                      <RotateCcw className="w-2.5 h-2.5" /> Def
                    </button>
                  )}
                </div>
                <div className="w-28">
                  <ThousandInput
                    suffix="lbr"
                    value={customParams.lembarPerRim}
                    onValueChange={(val) => handleChange('lembarPerRim', val)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                  />
                </div>
              </div>
              <div className={`flex items-center justify-between gap-2 p-1 rounded ${
                isFieldModified('kapasitasLakbanRoll') ? 'bg-amber-50 border-amber-200' : ''
              }`}>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold block">Kapasitas Lakban per Roll:</span>
                    {isFieldModified('kapasitasLakbanRoll') && (
                      <button
                        type="button"
                        onClick={(e) => handleResetField('kapasitasLakbanRoll', e)}
                        title="Reset ke default"
                        className="text-[9.5px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-2.5 h-2.5" /> Def
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-violet-800">8.000 cm / 60 cm keliling ikat</span>
                </div>
                <div className="w-28">
                  <ThousandInput
                    suffix="ikat"
                    value={customParams.kapasitasLakbanRoll}
                    onValueChange={(val) => handleChange('kapasitasLakbanRoll', val)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Section 3: Ongkos Finishing & Jasa */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layers className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-slate-800">4. Ongkos Finishing & Jasa Cetak</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Sub: Spiral & Jasa Umum */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className={`p-2.5 rounded-lg border transition-all ${
                isFieldModified('tarifSpiralLubang')
                  ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
                  : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
              }`}>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 truncate" title="Spiral (cm x Rp)">Spiral (cm x Rp)</label>
                  {isFieldModified('tarifSpiralLubang') && (
                    <button
                      type="button"
                      onClick={(e) => handleResetField('tarifSpiralLubang', e)}
                      title="Reset ke default"
                      className="text-[9.5px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                    >
                      <RotateCcw className="w-2.5 h-2.5" /> Def
                    </button>
                  )}
                </div>
                <ThousandInput
                  prefix="Rp"
                  value={customParams.tarifSpiralLubang}
                  onValueChange={(val) => handleChange('tarifSpiralLubang', val)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                />
              </div>

              <div className={`p-2.5 rounded-lg border transition-all ${
                isFieldModified('tarifSpiralMin')
                  ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
                  : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
              }`}>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 truncate" title="Spiral Min Order">Spiral Min Order</label>
                  {isFieldModified('tarifSpiralMin') && (
                    <button
                      type="button"
                      onClick={(e) => handleResetField('tarifSpiralMin', e)}
                      title="Reset ke default"
                      className="text-[9.5px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                    >
                      <RotateCcw className="w-2.5 h-2.5" /> Def
                    </button>
                  )}
                </div>
                <ThousandInput
                  prefix="Rp"
                  value={customParams.tarifSpiralMin}
                  onValueChange={(val) => handleChange('tarifSpiralMin', val)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                />
              </div>

              <div className={`p-2.5 rounded-lg border transition-all ${
                isFieldModified('tarifDesain')
                  ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
                  : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
              }`}>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 truncate" title="Desain Kalender">Desain Kalender</label>
                  {isFieldModified('tarifDesain') && (
                    <button
                      type="button"
                      onClick={(e) => handleResetField('tarifDesain', e)}
                      title="Reset ke default"
                      className="text-[9.5px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                    >
                      <RotateCcw className="w-2.5 h-2.5" /> Def
                    </button>
                  )}
                </div>
                <ThousandInput
                  prefix="Rp"
                  value={customParams.tarifDesain}
                  onValueChange={(val) => handleChange('tarifDesain', val)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                />
              </div>

              <div className={`p-2.5 rounded-lg border transition-all ${
                isFieldModified('tarifAlmanakDesain')
                  ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
                  : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
              }`}>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 truncate" title="Almanak Desain">Almanak Desain</label>
                  {isFieldModified('tarifAlmanakDesain') && (
                    <button
                      type="button"
                      onClick={(e) => handleResetField('tarifAlmanakDesain', e)}
                      title="Reset ke default"
                      className="text-[9.5px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                    >
                      <RotateCcw className="w-2.5 h-2.5" /> Def
                    </button>
                  )}
                </div>
                <ThousandInput
                  prefix="Rp"
                  value={customParams.tarifAlmanakDesain}
                  onValueChange={(val) => handleChange('tarifAlmanakDesain', val)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                />
              </div>

              <div className={`p-2.5 rounded-lg border transition-all ${
                isFieldModified('tarifRoyalty')
                  ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
                  : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
              }`}>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 truncate" title="Royalty Kalender">Royalty Kalender</label>
                  {isFieldModified('tarifRoyalty') && (
                    <button
                      type="button"
                      onClick={(e) => handleResetField('tarifRoyalty', e)}
                      title="Reset ke default"
                      className="text-[9.5px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                    >
                      <RotateCcw className="w-2.5 h-2.5" /> Def
                    </button>
                  )}
                </div>
                <ThousandInput
                  prefix="Rp"
                  value={customParams.tarifRoyalty}
                  onValueChange={(val) => handleChange('tarifRoyalty', val)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                />
              </div>

              <div className={`p-2.5 rounded-lg border transition-all ${
                isFieldModified('tarifPotongDasar')
                  ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/40'
                  : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
              }`}>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 truncate" title="Potong Dasar">Potong Dasar</label>
                  {isFieldModified('tarifPotongDasar') && (
                    <button
                      type="button"
                      onClick={(e) => handleResetField('tarifPotongDasar', e)}
                      title="Reset ke default"
                      className="text-[9.5px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                    >
                      <RotateCcw className="w-2.5 h-2.5" /> Def
                    </button>
                  )}
                </div>
                <ThousandInput
                  prefix="Rp"
                  value={customParams.tarifPotongDasar}
                  onValueChange={(val) => handleChange('tarifPotongDasar', val)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                />
              </div>
            </div>

            {/* Sub: Tarif Klem Seng per Ukuran */}
            <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200/80">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-amber-950 text-xs">Tarif Jilid Klem Seng (Jepit Kaleng / Pcs)</span>
                <span className="text-[10px] text-amber-800">Rumus: (Oplah + 5) * Tarif</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className={`p-2.5 rounded-lg border transition-all ${
                  isFieldModified('klem32x48') ? 'bg-amber-100/60 border-amber-400 ring-1 ring-amber-400/40' : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
                }`}>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 truncate" title="32 x 48 cm">32 x 48 cm</label>
                    {isFieldModified('klem32x48') && (
                      <button
                        type="button"
                        onClick={(e) => handleResetField('klem32x48', e)}
                        title="Reset ke default"
                        className="text-[9.5px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-2.5 h-2.5" /> Def
                      </button>
                    )}
                  </div>
                  <ThousandInput
                    prefix="Rp"
                    value={customParams.klem32x48}
                    onValueChange={(val) => handleChange('klem32x48', val)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                  />
                </div>
                <div className={`p-2.5 rounded-lg border transition-all ${
                  isFieldModified('klem38x54') ? 'bg-amber-100/60 border-amber-400 ring-1 ring-amber-400/40' : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
                }`}>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 truncate" title="38 x 54 cm">38 x 54 cm</label>
                    {isFieldModified('klem38x54') && (
                      <button
                        type="button"
                        onClick={(e) => handleResetField('klem38x54', e)}
                        title="Reset ke default"
                        className="text-[9.5px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-2.5 h-2.5" /> Def
                      </button>
                    )}
                  </div>
                  <ThousandInput
                    prefix="Rp"
                    value={customParams.klem38x54}
                    onValueChange={(val) => handleChange('klem38x54', val)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                  />
                </div>
                <div className={`p-2.5 rounded-lg border transition-all ${
                  isFieldModified('klem46x64') ? 'bg-amber-100/60 border-amber-400 ring-1 ring-amber-400/40' : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
                }`}>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 truncate" title="46 x 64 cm">46 x 64 cm</label>
                    {isFieldModified('klem46x64') && (
                      <button
                        type="button"
                        onClick={(e) => handleResetField('klem46x64', e)}
                        title="Reset ke default"
                        className="text-[9.5px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-2.5 h-2.5" /> Def
                      </button>
                    )}
                  </div>
                  <ThousandInput
                    prefix="Rp"
                    value={customParams.klem46x64}
                    onValueChange={(val) => handleChange('klem46x64', val)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                  />
                </div>
                <div className={`p-2.5 rounded-lg border transition-all ${
                  isFieldModified('klem48x64') ? 'bg-amber-100/60 border-amber-400 ring-1 ring-amber-400/40' : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
                }`}>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <label className="text-xs font-semibold text-slate-700 truncate" title="48 x 64 cm">48 x 64 cm</label>
                    {isFieldModified('klem48x64') && (
                      <button
                        type="button"
                        onClick={(e) => handleResetField('klem48x64', e)}
                        title="Reset ke default"
                        className="text-[9.5px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 bg-amber-100/80 px-1.5 py-0.5 rounded cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-2.5 h-2.5" /> Def
                      </button>
                    )}
                  </div>
                  <ThousandInput
                    prefix="Rp"
                    value={customParams.klem48x64}
                    onValueChange={(val) => handleChange('klem48x64', val)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 text-right focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 shadow-2xs"
                  />
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
              <div className="flex items-center gap-2.5">
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
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2.5">
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
                      <li>• <strong>Harga Dasar / Kg</strong>: <span className="font-mono text-emerald-700">Dashboard!D27</span> (HVS 70: Rp 16.500, AP 120/150: Rp 17.400).</li>
                      <li>• <strong>PPN / Margin Kertas</strong>: <span className="font-mono text-emerald-700">Dashboard!E27</span> (Spiral: 5%, Klem: HVS 3%, AP 0%).</li>
                      <li>• <strong>Harga per Ream Plano</strong>: <span className="font-mono text-slate-600">KALENDER!BE29</span> = <code className="text-[10px] bg-white px-1 py-0.5 rounded border">[(L*P*GSM)/20.000] * (Tarif * PPN) / 500</code>.</li>
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
                      <li>• <strong>Spiral Kawat & Min</strong>: <span className="font-mono text-amber-700">KALENDER!CX6</span> (Rp 150/cm lubang, min Rp 250rb).</li>
                      <li>• <strong>Klem Seng (Jepit Kaleng)</strong>: <span className="font-mono text-amber-700">KALENDER!CY6</span> (32x48: Rp 350, 38x54: Rp 350, 46x64: Rp 480, 48x64: Rp 490). Rumus: <code className="text-[10px] bg-white px-1 py-0.5 rounded border">(Oplah+5)*Tarif</code>.</li>
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
