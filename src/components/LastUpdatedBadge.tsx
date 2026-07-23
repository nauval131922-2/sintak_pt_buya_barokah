'use client';

import { Clock } from 'lucide-react';

interface LastUpdatedBadgeProps {
  lastUpdated: Date | null;
}

export default function LastUpdatedBadge({ lastUpdated }: LastUpdatedBadgeProps) {
  if (!lastUpdated) return null;

  const timeStr = lastUpdated.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  });

  const dateStr = lastUpdated.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });

  return (
    <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-300 leading-none mt-1">
      <Clock size={8} className="shrink-0" />
      <span>{dateStr}, {timeStr}</span>
    </div>
  );
}
