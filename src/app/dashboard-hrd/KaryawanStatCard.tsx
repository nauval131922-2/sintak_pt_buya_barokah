'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users } from 'lucide-react';
import Link from 'next/link';
import StatCardDropdown, { type DropdownOption } from '@/components/StatCardDropdown';
import { useAutoRefresh } from '@/lib/hooks/useAutoRefresh';
import LastUpdatedBadge from '@/components/LastUpdatedBadge';

type Filter = 'all' | 'active';

const OPTIONS: DropdownOption[] = [
  { value: 'all', label: 'Semua' },
  { value: 'active', label: 'Aktif' },
];

export default function KaryawanStatCard() {
  const [filter, setFilter] = useState<Filter>('all');
  const [counts, setCounts] = useState<{ all: number; active: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    fetch('/api/dashboard/karyawan-count')
      .then((r) => r.json())
      .then((data) => setCounts({ all: data.all ?? 0, active: data.active ?? 0 }))
      .catch(() => setCounts({ all: 0, active: 0 }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const lastUpdated = useAutoRefresh(fetchData);

  const displayCount = counts?.[filter] ?? 0;
  const subLabel = filter === 'active' ? 'karyawan aktif' : 'semua karyawan terdaftar';

  return (
    <Link href="/employees"
      className="group bg-white border border-gray-100 border-l-4 border-l-blue-500 rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md hover:shadow-gray-200/60 hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 bg-blue-50 text-blue-600 border-blue-100">
          <Users size={17} />
        </div>
        <StatCardDropdown options={OPTIONS} value={filter} onChange={(v) => setFilter(v as Filter)}
          colorClass="blue" searchPlaceholder="Cari filter..." widthClass="w-32" loading={loading} />
      </div>
      <div>
        <div className="text-2xl font-extrabold text-gray-800 tracking-tight leading-none">
          {loading ? <span className="inline-block w-16 h-6 bg-gray-100 rounded animate-pulse" /> : displayCount.toLocaleString('id-ID')}
        </div>
        <div className="text-[11px] text-gray-400 font-semibold mt-1.5 leading-none">Total Karyawan</div>
        <div className="text-[10px] text-gray-300 font-medium mt-0.5">{subLabel}</div>
        <LastUpdatedBadge lastUpdated={lastUpdated} />
      </div>
    </Link>
  );
}
