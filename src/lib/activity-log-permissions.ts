import db from '@/lib/db';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

const VIEW_KEYS = ['activity_log_view', 'activity_log'] as const;
const ADMIN_KEYS = ['activity_log_admin'] as const;

async function roleHasAnyModule(role: string, keys: readonly string[]): Promise<boolean> {
  if (role === 'Super Admin') return true;
  for (const key of keys) {
    const result = await db.execute({
      sql: 'SELECT can_access FROM role_permissions WHERE role = ? AND module_key = ?',
      args: [role, key],
    });
    const row = result.rows[0];
    if (row && Number(row.can_access) === 1) return true;
  }
  return false;
}

export async function canViewActivityLog(role: string): Promise<boolean> {
  return roleHasAnyModule(role, VIEW_KEYS);
}

export async function canAdminActivityLog(role: string): Promise<boolean> {
  if (role === 'Super Admin') return true;
  return roleHasAnyModule(role, ADMIN_KEYS);
}

export async function requireActivityLogView(): Promise<void> {
  const session = await getSession();
  if (!session?.userId) redirect('/login');
  if (!(await canViewActivityLog(session.role))) redirect('/unauthorized');
}
