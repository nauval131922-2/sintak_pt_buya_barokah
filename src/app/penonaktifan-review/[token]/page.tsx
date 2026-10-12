import PageHeader from '@/components/PageHeader';
import ReviewTokenClient from './ReviewTokenClient';

export const dynamic = 'force-dynamic';

export default async function ReviewTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Review Usulan Penonaktifan"
        description="Periksa daftar usulan — ajukan hapus atau tambah kode beserta alasannya. Keputusan akhir di pemilik usulan."
      />
      <ReviewTokenClient token={token} />
    </div>
  );
}
