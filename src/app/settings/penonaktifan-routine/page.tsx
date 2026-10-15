import type { Metadata } from 'next';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import dynamicImport from 'next/dynamic';

const RoutineGeneratorClient = dynamicImport(() => import('./RoutineGeneratorClient'), {
  ssr: false,
});

export const metadata: Metadata = {
  title: 'SINTAK | Generator Kode Rutin',
};

export const dynamic = 'force-dynamic';

export default async function RoutineGeneratorPage() {
  const session = await getSession();
  if (!session?.userId) redirect('/login');
  if (session.role !== 'Super Admin') redirect('/unauthorized');

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Generator Kode Rutin"
        description="Analisa frekuensi BOM per kode — pilih kode generik repeat-order untuk dilindungi dari usulan penonaktifan."
      />
      <RoutineGeneratorClient />
    </div>
  );
}
