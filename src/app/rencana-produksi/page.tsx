import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getSession } from '@/lib/session';
import { getMergedPermissions } from '@/lib/permissions';
import { redirect } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import RencanaProduksiClient from './RencanaProduksiClient';

export const metadata: Metadata = {
  title: 'SINTAK | Rencana Produksi',
};

export const dynamic = 'force-dynamic';

export default async function RencanaProduksiPage() {
  const session = await getSession();
  if (!session || !session.userId) {
    redirect('/login');
  }

  // Super Admin selalu punya akses
  if (!session.roles?.includes('Super Admin') && session.role !== 'Super Admin') {
    const roles = Array.isArray(session.roles) && session.roles.length > 0
      ? session.roles
      : [session.role];
    const permissions = await getMergedPermissions(roles);
    if (!permissions['produksi_rencana_produksi'] && !permissions['produksi_jhp_analisa'] && !permissions['produksi_jhp']) {
      redirect('/unauthorized');
    }
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Rencana Produksi"
        description="Jadwal Gantt Chart dan visualisasi alur tahapan produksi per nomor order."
      />
      <Suspense fallback={null}>
        <RencanaProduksiClient />
      </Suspense>
    </div>
  );
}
