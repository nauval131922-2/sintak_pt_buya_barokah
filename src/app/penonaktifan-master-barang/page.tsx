import type { Metadata } from 'next';
import { Suspense } from 'react';
import { requirePermission } from '@/lib/permissions';
import PageHeader from '@/components/PageHeader';
import PenonaktifanMasterClient from './PenonaktifanMasterClient';

export const metadata: Metadata = {
  title: 'SINTAK | Lap. Penonaktifan Master Barang Jadi',
};

export const dynamic = 'force-dynamic';

export default async function PenonaktifanMasterPage() {
  await requirePermission('produksi_penonaktifan_master');
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Lap. Penonaktifan Master Barang Jadi"
         description="Generate usulan Excel barang jadi pesanan bersaldo nol yang aman dinonaktifkan (4 tahap). File usulan untuk PPIC — tanpa mengubah data."
      />
      <Suspense fallback={<div className="h-40 bg-white rounded-2xl animate-pulse" />}>
        <PenonaktifanMasterClient />
      </Suspense>
    </div>
  );
}
