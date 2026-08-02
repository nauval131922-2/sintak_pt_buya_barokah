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
  action?: React.ReactNode;
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
    title = '',
    children,
    fetchDisabled = false,
  compact = false,
  action
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
    <div className="bg-white/80 backdrop-blur-md border border-white/20 rounded-xl shadow-sm p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
      <div className="flex items-center gap-2 flex-1">
        {hasDates ? (
          <>
            <DatePicker name="startDate" value={startDate || null} onChange={onStartDateChange} />
            <div className="w-2 h-px bg-gray-300 shrink-0"></div>
            <DatePicker name="endDate" value={endDate || null} onChange={onEndDateChange} popupAlign="right" />
          </>
        ) : null}
        {children}
      </div>

      {(isFetching && statusText) && (
        <div className="flex flex-col items-end gap-1">
          <div className="text-[11px] text-emerald-600 font-bold leading-none bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
            {statusText}
          </div>
          {progress !== undefined && (
            <div className="w-24 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      )}

      <div className="hidden sm:block w-px h-8 bg-gray-200/60"></div>

      <button
        onClick={onFetch}
        disabled={isFetching || fetchDisabled}
        className="flex items-center justify-center gap-2 px-5 h-10 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-[11px] font-bold rounded-xl transition-colors shadow-sm shrink-0"
      >
        {isFetching && progress === undefined ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            <span>Memproses...</span>
          </>
        ) : isFetching && progress !== undefined ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            <span>{progress}%</span>
          </>
        ) : (
          <>
            <DownloadCloud size={14} />
            <span>{fetchText}</span>
          </>
        )}
      </button>
      {action}
    </div>
  );
}
