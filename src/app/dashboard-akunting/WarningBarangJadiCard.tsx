'use client';

import { useState, useCallback, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAutoRefresh } from '@/lib/hooks/useAutoRefresh';
import LastUpdatedBadge from '@/components/LastUpdatedBadge';
import StatCardDropdown, { type DropdownOption } from '@/components/StatCardDropdown';

type Period = 'today' | 'this_month' | 'this_year';

interface WarningData {
  today: number;
  this_month: number;
  this_year: number;
}

const OPTIONS: DropdownOption[] = [
  { value: 'today',      label: 'Hari Ini' },
  { value: 'this_month', label: 'Bulan Ini' },
  { value: 'this_year',  label: 'Tahun Ini' },
];

export default function WarningBarangJadiCard() {
  const [period, setPeriod]   = useState<Period>('today');
  const [data, setData]       = useState<WarningData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    fetch('/api/dashboard/barang-jadi-warning', { cache: 'no-store' })
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setData({ today: json.today, this_month: json.this_month, this_year: json.this_year });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Fetch awal saat mount
  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh setiap 2 menit, hanya saat tab aktif
  const lastUpdated = useAutoRefresh(fetchData);

  const count      = data ? data[period] : null;
  const hasWarning = count !== null && count > 0;

  return (
    <div
      className={`group bg-white border border-gray-100 border-l-4 rounded-2xl p-5 flex flex-col gap-3 shadow-sm transition-all duration-200 ${
        hasWarning
          ? 'border-l-rose-500 hover:shadow-rose-100/60 hover:shadow-md hover:-translate-y-0.5'
          : 'border-l-emerald-500 hover:shadow-md hover:shadow-gray-200/60 hover:-translate-y-0.5'
      }`}
    >
      {/* Baris atas: ikon + dropdown */}
      <div className="flex items-center justify-between">
        <div
          className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
            hasWarning
              ? 'bg-rose-50 text-rose-500 border-rose-100'
              : 'bg-emerald-50 text-emerald-600 border-emerald-100'
          }`}
        >
          <AlertTriangle size={17} />
        </div>
        {/* StatCardDropdown — sudah handle z-index & overflow sendiri */}
        <div onClick={e => e.preventDefault()}>
          <StatCardDropdown
            options={OPTIONS}
            value={period}
            onChange={v => setPeriod(v as Period)}
            colorClass={hasWarning ? 'indigo' : 'emerald'}
            searchPlaceholder="Cari periode..."
            widthClass="w-32"
            loading={loading}
          />
        </div>
      </div>

      {/* Angka + label */}
      <div>
        <div className="text-2xl font-extrabold text-gray-800 tracking-tight leading-none">
          {loading
            ? <span className="inline-block w-16 h-6 bg-gray-100 rounded animate-pulse" />
            : <span className={hasWarning ? 'text-rose-600' : 'text-emerald-600'}>
                {count?.toLocaleString('id-ID') ?? '—'}
              </span>
          }
        </div>
        <div className="text-[11px] text-gray-400 font-semibold mt-1.5 leading-none">
          Peringatan Harga
        </div>
        <div className="text-[11px] text-gray-300 font-medium mt-0.5">
          Data SO di bawah HPP · Penerimaan Barang Jadi
        </div>
        <LastUpdatedBadge lastUpdated={lastUpdated} />
      </div>

    </div>
  );
}
