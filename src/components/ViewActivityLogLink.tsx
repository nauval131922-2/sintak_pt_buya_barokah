'use client';

import Link from 'next/link';
import { History } from 'lucide-react';
import { buildActivityLogHref } from '@/lib/activity-log-url';

export default function ViewActivityLogLink({
  tableName,
  from,
  to,
  actionType,
  className = '',
}: {
  tableName?: string;
  from?: string;
  to?: string;
  actionType?: string;
  className?: string;
}) {
  const href = buildActivityLogHref({ tableName, from, to, actionType });

  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-100 bg-white text-[10px] font-bold text-gray-600 hover:border-green-200 hover:text-green-700 hover:bg-green-50 transition-all shrink-0 ${className}`}
      title="Buka log aktivitas dengan filter tabel & tanggal hari ini"
    >
      <History size={12} className="text-green-600" />
      Log aktivitas
    </Link>
  );
}
