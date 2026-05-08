import type { Metadata } from 'next';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import KonversiSopdClient from './KonversiSopdClient';

export const metadata: Metadata = {
  title: 'SINTAK | Konversi Data - SOPd',
};

export const dynamic = 'force-dynamic';

export default async function KonversiDataSopdPage() {
  const session = await getSession();
  if (!session?.userId) redirect('/login');
  if (session.role !== 'Super Admin') redirect('/unauthorized');

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Konversi Data — SOPd"
        description="Upload file Excel untuk menyinkronkan data Order Produksi (SOPd) ke sistem. Gunakan fitur ini untuk sinkronisasi awal data order."
      />
      <KonversiSopdClient />
    </div>
  );
}
