'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import StatCardDropdown, { type DropdownOption } from '@/components/StatCardDropdown';
import { useAutoRefresh } from '@/lib/hooks/useAutoRefresh';
import LastUpdatedBadge from '@/components/LastUpdatedBadge';

type RoleData = { role: string; count: number };
const ALL_VALUE = '__all__';

export default function UsersStatCard() {
  const [total, setTotal] = useState<number | null>(null);
  const [options, setOptions] = useState<DropdownOption[]>([]);
  const [selected, setSelected] = useState<string>(ALL_VALUE);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    fetch('/api/dashboard/users-count')
      .then((r) => r.json())
      .then((data: { total: number; roles: RoleData[] }) => {
        setTotal(data.total ?? 0);
        const roleOpts: DropdownOption[] = (data.roles ?? []).map((r) => ({
          value: r.role, label: r.role, count: r.count,
        }));
        setOptions([{ value: ALL_VALUE, label: 'Semua Role', count: data.total }, ...roleOpts]);
      })
      .catch(() => { setTotal(0); setOptions([{ value: ALL_VALUE, label: 'Semua Role', count: 0 }]); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const lastUpdated = useAutoRefresh(fetchData);

  const displayCount = selected === ALL_VALUE ? (total ?? 0) : (options.find((o) => o.value === selected)?.count ?? 0);
  const subLabel = selected === ALL_VALUE ? 'pengguna terdaftar' : `pengguna role ${selected}`;

  return (
    <Link href="/users"
      className="group bg-white border border-gray-100 border-l-4 border-l-indigo-500 rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md hover:shadow-gray-200/60 hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 bg-indigo-50 text-indigo-600 border-indigo-100">
          <ShieldCheck size={17} />
        </div>
        <StatCardDropdown options={options} value={selected} onChange={setSelected}
          colorClass="indigo" searchPlaceholder="Cari role..." widthClass="w-48" loading={loading} />
      </div>
      <div>
        <div className="text-2xl font-extrabold text-gray-800 tracking-tight leading-none">
          {loading ? <span className="inline-block w-16 h-6 bg-gray-100 rounded animate-pulse" /> : displayCount.toLocaleString('id-ID')}
        </div>
        <div className="text-[11px] text-gray-400 font-semibold mt-1.5 leading-none">Pengguna Sistem</div>
        <div className="text-[10px] text-gray-300 font-medium mt-0.5">{subLabel}</div>
        <LastUpdatedBadge lastUpdated={lastUpdated} />
      </div>
    </Link>
  );
}
