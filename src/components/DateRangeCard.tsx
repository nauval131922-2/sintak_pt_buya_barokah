'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { DownloadCloud, Loader2 } from 'lucide-react';
import DatePicker from '@/components/DatePicker';
import { persistScraperPeriod } from '@/lib/scraper-period';

const PATH_MAP: Record<string, { stateKey: string; periodKey?: string }> = {
  '/pr': { stateKey: 'prReportState', periodKey: 'PRClient_scrapedPeriod' },
  '/spph-out': { stateKey: 'spphOutState', periodKey: 'SpphOutClient_scrapedPeriod' },
  '/sph-in': { stateKey: 'sphInState', periodKey: 'SphInClient_scrapedPeriod' },
  '/purchase-orders': { stateKey: 'poState', periodKey: 'PurchaseOrderClient_scrapedPeriod' },
  '/penerimaan-pembelian': { stateKey: 'pbState', periodKey: 'PenerimaanPembelianClient_scrapedPeriod' },
  '/rekap-pembelian-barang': { stateKey: 'rbpState', periodKey: 'RekapPembelianBarangClient_scrapedPeriod' },
  '/pelunasan-hutang': { stateKey: 'phState', periodKey: 'PelunasanHutangClient_scrapedPeriod' },
  '/bom': { stateKey: 'bomReportState', periodKey: 'BOMClient_scrapedPeriod' },
  '/orders': { stateKey: 'orderProduksiState', periodKey: 'OrderProduksiClient_scrapedPeriod' },
  '/bahan-baku': { stateKey: 'bahanBakuState', periodKey: 'BahanBakuClient_scrapedPeriod' },
  '/barang-jadi': { stateKey: 'barangJadiState', periodKey: 'BarangJadiClient_scrapedPeriod' },
  '/hpp-kalkulasi': { stateKey: 'hppKalkulasiState', periodKey: 'HppKalkulasi_scrapedPeriod' },
  '/sph-out': { stateKey: 'sphOutState', periodKey: 'SphOutClient_scrapedPeriod' },
  '/sales-orders': { stateKey: 'salesOrderState', periodKey: 'SalesOrderClient_scrapedPeriod' },
  '/sales': { stateKey: 'salesReportState', periodKey: 'SalesReportClient_scrapedPeriod' },
  '/pengiriman': { stateKey: 'shState', periodKey: 'PengirimanClient_scrapedPeriod' },
  '/pelunasan-piutang': { stateKey: 'ppState', periodKey: 'PelunasanPiutangClient_scrapedPeriod' },
  '/rekap-sales-order': { stateKey: 'rekapSalesOrderState', periodKey: 'RekapSalesOrderClient_scrapedPeriod' },
  '/akuntansi/laporan/jurnal-umum': { stateKey: 'jurnalUmumState', periodKey: 'JurnalUmumClient_scrapedPeriod' },
  '/jurnal-harian-produksi/data/excel-sopd': { stateKey: 'sopdState', periodKey: 'SopdClient_scrapedPeriod' },
  '/sync': { stateKey: 'bomReportState', periodKey: 'BOMClient_scrapedPeriod' }
};

interface DateRangeCardProps {
  startDate?: Date | null;
  endDate?: Date | null;
  onStartDateChange?: (date: Date) => void;
  onEndDateChange?: (date: Date) => void;
  onFetch: () => void;
  isFetching: boolean;
  progress?: number;
  statusText?: string;
  fetchText?: string;
  title?: string;
  children?: React.ReactNode;
  fetchDisabled?: boolean;
  compact?: boolean;
}

export default function DateRangeCard({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onFetch,
  isFetching,
  progress,
  statusText,
  fetchText = 'Tarik Data',
  title = 'Rentang Tanggal',
  children,
  fetchDisabled = false,
  compact = false
}: DateRangeCardProps) {
  const pathname = usePathname();
  const hasDates = onStartDateChange && onEndDateChange;

  useEffect(() => {
    if (typeof window !== 'undefined' && startDate && endDate && pathname) {
      const keys = PATH_MAP[pathname];
      if (keys) {
        persistScraperPeriod(keys, startDate, endDate);
      }
    }
  }, [startDate, endDate, pathname]);

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm shadow-green-900/5 shrink-0 relative z-50 min-w-0 ${compact ? 'py-2 px-4' : 'py-3.5 px-6 flex flex-col gap-4'}`}>
      <div className={`flex flex-wrap items-center justify-between relative z-10 ${compact ? 'gap-2' : 'gap-4'}`}>
        <div className="flex items-center gap-3">
          {compact ? (
            <>
              {title && <span className="text-[11px] font-semibold text-gray-500 shrink-0">{title}</span>}
              {hasDates && (
                <div className="flex items-center gap-2">
                  <div className="w-[120px] relative group">
                    <DatePicker name="startDate" value={startDate || null} onChange={onStartDateChange} />
                  </div>
                  <div className="w-3 h-0.5 bg-gray-200 rounded-full shrink-0"></div>
                  <div className="w-[120px] relative group">
                    <DatePicker name="endDate" value={endDate || null} onChange={onEndDateChange} popupAlign="right" />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-2 pl-1">
                <span className="text-[13px] font-semibold text-gray-500">{title}</span>
              </div>
              {hasDates && (
                <div className="flex items-center gap-3">
                  <div className="w-[150px] relative group">
                    <DatePicker name="startDate" value={startDate || null} onChange={onStartDateChange} />
                  </div>
                  <div className="w-4 h-0.5 bg-gray-100 rounded-full"></div>
                  <div className="w-[150px] relative group">
                    <DatePicker name="endDate" value={endDate || null} onChange={onEndDateChange} popupAlign="right" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {children && (
          <div className="flex items-center gap-4">
            {children}
          </div>
        )}

        <div className="shrink-0 flex items-center gap-3">
          {isFetching && statusText && (
             <div className="flex flex-col items-end gap-1.5">
               <div className="text-[10px] text-green-600 font-bold animate-pulse leading-none bg-green-50 px-3 py-1.5 rounded-full border border-green-100 shadow-sm">
                 {statusText}
               </div>
               {progress !== undefined && (
                 <div className="w-28 h-1.5 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
                   <div className="h-full bg-green-500 transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
                 </div>
               )}
             </div>
          )}
          <button
             onClick={onFetch}
             disabled={isFetching || fetchDisabled}
             className={`w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white rounded-xl font-bold shadow-sm shadow-emerald-900/20 hover:shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group/btn relative overflow-hidden ${compact ? 'min-w-[100px] px-3 py-1.5 text-[11px]' : 'min-w-[140px] px-5 py-2.5 text-[12px]'}`}
           >
             <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 ease-out" />
             <span className="relative z-10 flex items-center gap-2">
               {isFetching && progress === undefined ? (
                 <><Loader2 size={compact ? 13 : 16} className="animate-spin" /> {fetchText === 'Tarik Data' ? 'Sedang Menarik...' : 'Sinkronisasi...'}</>
               ) : isFetching && progress !== undefined ? (
                 <><Loader2 size={compact ? 13 : 16} className="animate-spin" /> {progress}%</>
               ) : (
                 <><DownloadCloud size={compact ? 13 : 16} className="group-hover/btn:-translate-y-0.5 transition-transform duration-300" /> {fetchText}</>
               )}
             </span>
           </button>
        </div>
      </div>
    </div>
  );
}
