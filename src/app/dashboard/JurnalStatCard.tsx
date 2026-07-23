'use client';

import { useState, useEffect, useCallback } from 'react';
import { BookOpen } from 'lucide-react';
import Link from 'next/link';
import StatCardDropdown from '@/components/StatCardDropdown';
import { useAutoRefresh } from '@/lib/hooks/useAutoRefresh';
import LastUpdatedBadge from '@/components/LastUpdatedBadge';

type Period = 'today' | 'month' | 'year';

const OPTIONS = [
  { value: 'today', label: 'Hari Ini' },
  { value: 'month', label: 'Bulan Ini' },
  { value: 'year', label: 'Tahun Ini' },
];

export default function JurnalStatCard() {
  const [period, setPeriod] = useState<Period>('today');
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback((p: Period) => {
    setLoading(true);
    fetch(`/api/dashboard/jurnal-count?period=${p}`)
      .then((r) => r.json())
      .then((data) => setCount(data.count ?? 0))
      .catch(() => setCount(0))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(period); }, [period, fetchData]);
  const lastUpdated = useAutoRefresh(() => fetchData(period));

  const subLabel = period === 'today' ? 'entri hari ini' : period === 'month' ? 'entri bulan ini' : 'entri tahun ini';

  return (
    <Link href="/jurnal-harian-produksi"
      className="group bg-white border border-gray-100 border-l-4 border-l-emerald-500 rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md hover:shadow-gray-200/60 hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 bg-emerald-50 text-emerald-600 border-emerald-100">
          <BookOpen size={17} />
        </div>
        <StatCardDropdown options={OPTIONS} value={period} onChange={(v) => setPeriod(v as Period)}
          colorClass="emerald" searchPlaceholder="Cari periode..." widthClass="w-36" loading={loading} />
      </div>
      <div>
        <div className="text-2xl font-extrabold text-gray-800 tracking-tight leading-none">
          {loading ? <span className="inline-block w-16 h-6 bg-gray-100 rounded animate-pulse" /> : (count ?? 0).toLocaleString('id-ID')}
        </div>
        <div className="text-[11px] text-gray-400 font-semibold mt-1.5 leading-none">Jurnal Produksi</div>
        <div className="text-[11px] text-gray-300 font-medium mt-0.5">{subLabel}</div>
        <LastUpdatedBadge lastUpdated={lastUpdated} />
      </div>
    </Link>
  );
}
