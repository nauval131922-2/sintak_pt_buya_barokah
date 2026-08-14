import type { Metadata } from 'next';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import KonversiLaporanPekerjaanClient from './KonversiLaporanPekerjaanClient';

export const metadata: Metadata = {
  title: 'SINTAK | Konversi Data - Laporan Pekerjaan',
};

export const dynamic = 'force-dynamic';

export default async function KonversiDataLaporanPekerjaanPage() {
  const session = await getSession();
  if (!session?.userId) redirect('/login');
  if (session.role !== 'Super Admin') redirect('/unauthorized');

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Konversi Data — Laporan Pekerjaan"
        description="Ambil data fresh dari Google Spreadsheet (DATABASE_REPORT) dan timpa/reset ulang seluruh data Laporan Pekerjaan di database SINTAK."
      />
      <KonversiLaporanPekerjaanClient />
    </div>
  );
}
