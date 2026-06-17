import type { Metadata } from 'next';
import { Suspense } from 'react';
import { requirePermission } from '@/lib/permissions';
import PageHeader from '@/components/PageHeader';
import AnalisaClient from './AnalisaClient';

export const metadata: Metadata = {
  title: 'SINTAK | Analisa Produksi',
};

export const dynamic = 'force-dynamic';

export default async function AnalisaProduksiPage() {
  await requirePermission('produksi_jhp_analisa');

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Analisa Produksi"
        description="Eksplorasi tahapan produksi per order."
      />
      <Suspense fallback={null}>
        <AnalisaClient />
      </Suspense>
    </div>
  );
}
