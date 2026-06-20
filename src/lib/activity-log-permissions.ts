import db from '@/lib/db';
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

const VIEW_KEYS = ['activity_log_view', 'activity_log'] as const;
const ADMIN_KEYS = ['activity_log_admin'] as const;

// Cek apakah satu role punya akses ke module tertentu
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

// Cek apakah array roles (multiple) punya akses — union OR
async function rolesHaveAnyModule(roles: string[], keys: readonly string[]): Promise<boolean> {
  for (const role of roles) {
    if (await roleHasAnyModule(role, keys)) return true;
  }
  return false;
}

// Menerima string (single) atau string[] (multiple) untuk backward-compat
export async function canViewActivityLog(roleOrRoles: string | string[]): Promise<boolean> {
  const roles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
  return rolesHaveAnyModule(roles, VIEW_KEYS);
}

export async function canAdminActivityLog(roleOrRoles: string | string[]): Promise<boolean> {
  const roles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
  if (roles.includes('Super Admin')) return true;
  return rolesHaveAnyModule(roles, ADMIN_KEYS);
}

export async function requireActivityLogView(): Promise<void> {
  const session = await getSession();
  if (!session?.userId) redirect('/login');
  const roles = Array.isArray(session.roles) && session.roles.length > 0
    ? session.roles
    : [session.role];
  if (!(await canViewActivityLog(roles))) redirect('/unauthorized');
}
