import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import ReviewTokenClient from './ReviewTokenClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Review Usulan Penonaktifan | SINTAK',
  description: 'Periksa daftar usulan penonaktifan master barang — ajukan hapus atau tambah kode.',
};

export default async function ReviewTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
     <div className="h-[100dvh] overflow-hidden bg-slate-100 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Review Usulan Penonaktifan"
        description="Periksa daftar usulan — ajukan hapus atau tambah kode beserta alasannya. Keputusan akhir di pemilik usulan."
      />
      <ReviewTokenClient token={token} />
    </div>
  );
}
