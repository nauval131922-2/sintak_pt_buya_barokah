import PricelistClient from './PricelistClient';
import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import { requirePermission } from '@/lib/permissions';

export const metadata: Metadata = {
  title: 'SINTAK | Kalkulasi Harga',
};

export const dynamic = 'force-dynamic';

export default async function PricelistPage() {
  await requirePermission('pricelist_kalkulasi');

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden h-full">
      <PageHeader
        title="Kalkulasi Harga"
        description="Simulator HPP, kalkulasi tarif, matriks harga, dan riwayat penawaran multi-produk percetakan."
      />

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <PricelistClient />
      </div>
    </div>
  );
}
