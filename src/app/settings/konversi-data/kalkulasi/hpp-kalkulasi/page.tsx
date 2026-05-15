import type { Metadata } from 'next';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import KonversiHppClient from './KonversiHppClient';

export const metadata: Metadata = {
  title: 'SINTAK | Konversi Data - HPP Kalkulasi',
};

export const dynamic = 'force-dynamic';

export default async function KonversiDataHppPage() {
  const session = await getSession();
  if (!session?.userId) redirect('/login');
  if (session.role !== 'Super Admin') redirect('/unauthorized');

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Konversi Data — HPP Kalkulasi"
        description="Upload file Excel untuk mengimpor atau memperbarui data HPP Kalkulasi. Data yang sudah ada akan diperbarui, data baru akan ditambahkan."
      />
      <KonversiHppClient />
    </div>
  );
}
