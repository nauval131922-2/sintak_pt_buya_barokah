import type { Metadata } from 'next';
import { Suspense } from 'react';
import PageHeader from '@/components/PageHeader';
import ActivityLogClient from './ActivityLogClient';
import { requireActivityLogView, canAdminActivityLog } from '@/lib/activity-log-permissions';
import { getSession } from '@/lib/session';
import { getDefaultActivityLogFilters } from '@/lib/activity-log-utils';

export const metadata: Metadata = {
  title: 'SINTAK | Log Aktivitas',
};

export const dynamic = 'force-dynamic';

function LogSkeleton() {
  return (
    <div className="flex-1 min-h-[600px] bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl animate-pulse shadow-sm" />
  );
}

export default async function LogAktivitasPage() {
  await requireActivityLogView();
  const session = await getSession();
  const canAdmin = session?.role ? await canAdminActivityLog(session.role) : false;
  const dateDefaults = getDefaultActivityLogFilters();

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Log Aktivitas"
        description="Audit lengkap aktivitas sistem. Log aktif + arsip (>90 hari). Filter, export CSV, dan detail perubahan data."
      />

      <Suspense fallback={<LogSkeleton />}>
        <ActivityLogClient canAdminLogs={canAdmin} serverDateDefaults={dateDefaults} />
      </Suspense>
    </div>
  );
}
