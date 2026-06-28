import type { Metadata } from 'next';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { canAccess } from '@/lib/permissions';
import PageHeader from '@/components/PageHeader';
import TelegramUsersClient from './TelegramUsersClient';

export const metadata: Metadata = {
  title: 'SINTAK | Telegram Users',
};

export const dynamic = 'force-dynamic';

export default async function TelegramUsersPage() {
  const session = await getSession();
  if (!session?.userId) redirect('/login');

  const hasAccess = session.role === 'Super Admin' || await canAccess('telegram_users');
  if (!hasAccess) redirect('/unauthorized');

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-700">
      <PageHeader
        title="Telegram Users"
        description="Kelola registrasi user untuk Telegram Bot. Approve atau tolak permintaan akses."
      />
      <TelegramUsersClient />
    </div>
  );
}
