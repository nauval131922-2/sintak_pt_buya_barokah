'use client';

import React, { useMemo } from 'react';
import {
  FileSpreadsheet,
  BookOpen,
} from 'lucide-react';
import {
  calculateYasinSimulator,
  DEFAULT_YASIN_PARAMS,
  YasinMasterParams,
} from '@/lib/yasin-calculator';

interface YasinMatrixViewProps {
  customParams?: YasinMasterParams;
}

const OPLAH_TIERS = [20, 30, 50, 70, 100, 125, 150, 175, 200, 250, 300, 400, 500, 600, 700, 800, 900, 1000];

const YASIN_VARIANTS: Array<{ hal: 64 | 96 | 112 | 128 | 144 | 192; title: string }> = [
  { hal: 64, title: 'Yasin 64 Halaman' },
  { hal: 96, title: 'Yasin 96 Halaman (Populer)' },
  { hal: 128, title: 'Yasin 128 Halaman' },
  { hal: 192, title: 'Yasin 192 Halaman (Majmu Syarif)' },
];

export default function YasinMatrixView({
  customParams = DEFAULT_YASIN_PARAMS,
}: YasinMatrixViewProps) {
  const matrixData = useMemo(() => {
    return YASIN_VARIANTS.map(({ hal, title }) => {
      const rows = OPLAH_TIERS.map((oplah) => {
        // Model 1: Softcover Standar (2 Lembar Foto + 2 Lembar Doa/Keluarga)
        const soft = calculateYasinSimulator(
          {
            oplah,
            tipeCover: 'Softcover',
            ukuran: '11.7 x 15',
            jumlahHalamanIsi: hal,
            lembarSisipanFoto: 2,
            lembarSisipanKeluarga: 2,
            laminasiCover: 'Glossy',
            opsiPitaRumbai: false,
            opsiSikuEmas: false,
            opsiPlastikOpp: true,
            marginPct: 30,
            negoDiskonPct: 0,
          },
          customParams
        );

        // Model 2: Hardcover Mewah (Foil Emas + Siku Emas + Pita Rumbai)
        const hard = calculateYasinSimulator(
          {
            oplah,
            tipeCover: 'Hardcover',
            ukuran: '11.7 x 15',
            jumlahHalamanIsi: hal,
            lembarSisipanFoto: 2,
            lembarSisipanKeluarga: 2,
            laminasiCover: 'Glossy',
            opsiPitaRumbai: true,
            opsiSikuEmas: true,
            opsiPlastikOpp: true,
            marginPct: 30,
            negoDiskonPct: 0,
          },
          customParams
        );

        return {
          oplah,
          softHpp: soft.summary.hppPerPcs,
          softJual: soft.summary.hargaJualPerPcs,
          hardHpp: hard.summary.hppPerPcs,
          hardJual: hard.summary.hargaJualPerPcs,
        };
      });

      return {
        hal,
        title,
        rows,
      };
    });
  }, [customParams]);

  return (
    <div className="space-y-6">
      <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100/80 text-emerald-800 rounded-xl border border-emerald-200">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-emerald-950 flex items-center gap-2">
              Pricelist Matriks Buku Surat Yasin & Tahlil
            </h3>
            <p className="text-[11.5px] text-emerald-800/80 mt-0.5">
              Tabel perbandingan harga jual Softcover vs Hardcover (+ 2 lbr Foto FC & 2 lbr Doa Keluarga, Plastik OPP).
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {matrixData.map((section) => (
          <div
            key={section.hal}
            className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden"
          >
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                {section.title} (11.7 x 15 cm)
              </h4>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="p-2.5 pl-4">Oplah (Buku)</th>
                    <th className="p-2.5 text-right">Soft Cover (AC 230)</th>
                    <th className="p-2.5 text-right pr-4">Hard Cover (Mewah)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {section.rows.map((row) => (
                    <tr
                      key={row.oplah}
                      className="hover:bg-emerald-50/40 transition-colors"
                    >
                      <td className="p-2.5 pl-4 font-bold text-slate-800">
                        {row.oplah.toLocaleString('id-ID')} pcs
                      </td>
                      <td className="p-2.5 text-right font-bold text-slate-900">
                        Rp {row.softJual.toLocaleString('id-ID')}
                        <span className="block text-[9px] text-slate-400 font-normal">
                          HPP: Rp {row.softHpp.toLocaleString('id-ID')}
                        </span>
                      </td>
                      <td className="p-2.5 text-right pr-4 font-bold text-emerald-800 bg-emerald-50/30">
                        Rp {row.hardJual.toLocaleString('id-ID')}
                        <span className="block text-[9px] text-emerald-700/70 font-normal">
                          HPP: Rp {row.hardHpp.toLocaleString('id-ID')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
