import PricelistClient from './PricelistClient';
import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import { requirePermission } from '@/lib/permissions';

export const metadata: Metadata = {
  title: 'SINTAK | Pricelist & Simulator',
};

export const dynamic = 'force-dynamic';

export default async function PricelistPage() {
  await requirePermission('pricelist_kalkulasi');

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Pricelist & Simulator"
        description="Simulator HPP, kalkulasi tarif, matriks harga, dan riwayat penawaran multi-produk percetakan."
      />

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <PricelistClient />
      </div>
    </div>
  );
}
