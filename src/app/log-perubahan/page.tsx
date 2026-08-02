import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import { getSession } from '@/lib/session';
import { getMergedPermissions } from '@/lib/permissions';
import { listChangelogsForUser } from '@/lib/page-changelogs';
import LogPerubahanClient from './LogPerubahanClient';

export const metadata: Metadata = {
  title: 'SINTAK | Log Perubahan',
};

export const dynamic = 'force-dynamic';

export default async function LogPerubahanPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const roles = session.roles?.length
    ? session.roles
    : session.role
      ? [session.role]
      : [];
  const isSuperAdmin = roles.includes('Super Admin');
  const permissions = roles.length > 0 ? await getMergedPermissions(roles) : {};
  const entries = listChangelogsForUser(permissions, { isSuperAdmin });

  return (
    <div className="flex flex-col gap-6 pb-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Log Perubahan"
        description="Dikelompokkan per tanggal, lalu per menu yang Anda bisa akses. Yang terbaru di atas."
        showHelp={false}
      />
      <LogPerubahanClient entries={entries} />
    </div>
  );
}
