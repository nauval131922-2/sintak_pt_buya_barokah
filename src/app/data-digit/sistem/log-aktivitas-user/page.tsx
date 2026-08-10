import { Suspense } from 'react';
import type { Metadata } from 'next';
import { requirePermission } from '@/lib/permissions';
import PageHeader from '@/components/PageHeader';
import LogAktivitasUserClient from './LogAktivitasUserClient';

export const metadata: Metadata = {
  title: 'SINTAK | Log Aktivitas User',
};

export const dynamic = 'force-dynamic';

export default async function LogAktivitasUserPage() {
  await requirePermission('usr_log_view');

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Log Aktivitas User"
        description="Riwayat aktivitas pengguna dari sistem Digit. Filter berdasarkan tanggal."
      />
      <Suspense fallback={<div className="h-40 bg-white rounded-2xl animate-pulse" />}>
        <LogAktivitasUserClient />
      </Suspense>
    </div>
  );
}
