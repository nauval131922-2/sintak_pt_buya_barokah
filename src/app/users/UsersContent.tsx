'use client';

import { useState, useEffect, useMemo, useTransition, useCallback } from 'react';
import {
  ShieldCheck, UserCog, Plus, Search,
  Edit2, Trash2,
  Filter, X,
  RefreshCw
} from 'lucide-react';
import SquareDropdown, { type SquareDropdownOption } from '@/components/SquareDropdown';
import { getUsers, deleteUser, updateUser } from '@/lib/users';
import UserFormModal from './UserFormModal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { DataTable } from '@/components/ui/DataTable';
import TableFooter from '@/components/TableFooter';
import { toast } from '@/lib/toast';

interface User {
  id: number;
  username: string;
  name: string;
  roles: string[];
  role: string;
  photo?: string | null;
  is_active: number;
  employee_id?: number | null;
  employee_name?: string | null;
  employee_position?: string | null;
  created_at?: string | null;
}

export default function UsersContent({
  currentUser,
  currentUserId,
  customRoles = [],
}: {
  currentUser: string;
  currentUserId: number;
  customRoles?: string[];
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchImmediate, setSearchImmediate] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');

  const [, startTransition] = useTransition();
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<number | null>(null);
  const [loadTime, setLoadTime] = useState<number | null>(null);

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user_columnWidths');
      if (saved) return JSON.parse(saved);
    }
    return { profile: 380, roles: 250, status: 120, action: 150 };
  });

  const handleResize = useCallback((widths: any) => {
    setColumnWidths(widths);
    localStorage.setItem('user_columnWidths', JSON.stringify(widths));
  }, []);

  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'danger' | 'confirm' | 'alert';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ isOpen: false, type: 'confirm', title: '', message: '' });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const startTime = performance.now();
    try {
      const res = await getUsers();
      setLoadTime(Math.round(performance.now() - startTime));
      if (res.success && res.users) {
        setUsers(res.users as User[]);
      } else {
        toast.error(res.message || 'Gagal memuat data user.');
      }
    } catch {
      toast.error('Gagal memuat data user.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sintak_data_updated') loadUsers();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadUsers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => setSearchDebounced(searchImmediate));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchImmediate]);

  const filteredUsers = useMemo(() => {
    const query = searchDebounced.toLowerCase().trim();
    return users.filter(user => {
      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query) ||
        user.roles.some(r => r.toLowerCase().includes(query));
      // Filter role: cocok jika salah satu role user sama dengan filter
      const matchesRole = !roleFilter || user.roles.includes(roleFilter);
      // Filter status: cocok dengan status aktif/nonaktif
      const matchesStatus =
        !statusFilter ||
        (statusFilter === 'Aktif' && user.is_active !== 0) ||
        (statusFilter === 'Nonaktif' && user.is_active === 0);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchDebounced, roleFilter, statusFilter]);

  const handleToggleStatus = useCallback(async (user: User) => {
    if (user.id === currentUserId) {
      toast.error('Anda tidak dapat menonaktifkan akun Anda sendiri.');
      return;
    }
    const newStatus = user.is_active === 1 ? 0 : 1;
    try {
      const res = await updateUser(user.id, {
        name: user.name,
        username: user.username,
        roles: user.roles,
        is_active: newStatus,
      });
      if (res.success) {
        localStorage.setItem('sintak_data_updated', Date.now().toString());
        toast.success(`Status user "${user.username}" berhasil diubah menjadi ${newStatus === 1 ? 'Aktif' : 'Nonaktif'}.`);
        loadUsers();
      } else {
        toast.error(res.message || 'Gagal memperbarui status user.');
      }
    } catch {
      toast.error('Terjadi kesalahan sistem.');
    }
  }, [currentUserId, loadUsers]);

  const getInitials = (name: string) =>
    (name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  const columns = useMemo(() => [
    {
      id: 'action',
      header: 'Manajemen',
      size: columnWidths.action,
      cell: (info: any) => {
        const user = info.row.original as User;
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={e => { e.stopPropagation(); handleEdit(user); }}
              className="p-2.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
              title="Edit User"
            >
              <Edit2 size={16} />
            </button>
            {user.id !== currentUserId && (
              <button
                onClick={e => { e.stopPropagation(); handleDelete(user.id, user.username); }}
                className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                title="Hapus User"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'name',
      id: 'profile',
      header: 'Profil Pengguna',
      size: columnWidths.profile,
      cell: (info: any) => {
        const user = info.row.original as User;
        return (
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-[12px] shrink-0 overflow-hidden border border-emerald-100">
              {user.photo ? (
                <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
              ) : getInitials(user.name)}
            </div>
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="text-[13px] font-bold text-gray-800 truncate mb-1 tracking-tight">{user.name}</span>
              <div className="flex items-center gap-2 truncate">
                <span className="text-[11px] text-gray-400 font-semibold truncate">@{user.username}</span>
                {user.employee_position && (
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 font-medium truncate">
                    {user.employee_position}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'roles',
      id: 'roles',
      header: 'Jabatan / Peran',
      size: columnWidths.roles,
      cell: (info: any) => {
        const user = info.row.original as User;
        const roles: string[] = user.roles?.length ? user.roles : (user.role ? [user.role] : []);
        return (
          <div className="flex flex-wrap gap-1.5">
            {roles.map(r => (
              <span
                key={r}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 leading-none border ${
                  r === 'Super Admin'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm'
                    : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                }`}
              >
                {r === 'Super Admin' ? <ShieldCheck size={10} /> : <UserCog size={10} />}
                {r}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: 'is_active',
      id: 'status',
      header: 'Status',
      size: columnWidths.status || 120,
      cell: (info: any) => {
        const user = info.row.original as User;
        const isActive = user.is_active !== 0;
        const isSelf = user.id === currentUserId;
        return (
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => handleToggleStatus(user)}
              disabled={isSelf}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                isActive ? 'bg-emerald-600' : 'bg-gray-200'
              }`}
              title={isSelf ? 'Anda tidak dapat menonaktifkan akun sendiri' : `Klik untuk ${isActive ? 'nonaktifkan' : 'aktifkan'}`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isActive ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-[11px] font-bold ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
              {isActive ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>
        );
      },
    },
  ], [columnWidths, currentUserId, handleToggleStatus]);

  const handleDelete = (id: number, username: string) => {
    if (id === currentUserId || username === currentUser) {
      setDialog({ isOpen: true, type: 'error', title: 'Akses Ditolak', message: 'Anda tidak dapat menghapus akun Anda sendiri.' });
      return;
    }
    setDialog({
      isOpen: true,
      type: 'confirm',
      title: 'Hapus User',
      message: `Apakah Anda yakin ingin menghapus user "${username}"? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: async () => {
        setDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const result = await deleteUser(id);
          if (result.success) {
            localStorage.setItem('sintak_data_updated', Date.now().toString());
            toast.success('User berhasil dihapus.');
            loadUsers();
          } else {
            toast.error(result.message || 'Gagal menghapus user.');
          }
        } catch {
          toast.error('Terjadi kesalahan sistem.');
        }
      },
    });
  };

  const handleEdit = (user: User) => { setEditingUser(user); setShowModal(true); };
  const handleCreate = () => { setEditingUser(null); setShowModal(true); };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3 animate-in fade-in duration-500 overflow-hidden">
      {/* Filter & Search Bar */}
      <div className="shrink-0 bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="flex items-center gap-2 flex-1 w-full">
          <button
            type="button"
            onClick={loadUsers}
            disabled={loading}
            className="h-8 px-3 text-xs font-bold text-slate-700 hover:text-emerald-800 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer shadow-sm"
            title="Reload Data Users"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            <span className="hidden sm:inline">Reload</span>
          </button>
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari user berdasarkan nama, username, atau role..."
              value={searchImmediate}
              onChange={(e) => setSearchImmediate(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto min-w-0">
          <div className="flex items-center text-xs text-slate-500 font-medium shrink-0">
            <Filter className="w-3.5 h-3.5 mr-1 text-slate-400" /> Filter:
          </div>

          {(roleFilter !== '' || statusFilter !== '' || searchImmediate !== '') && (
            <button
              type="button"
              onClick={() => {
                setRoleFilter('');
                setStatusFilter('');
                setSearchImmediate('');
              }}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors shrink-0"
              title="Reset Semua Filter"
            >
              <X size={12} /> Reset
            </button>
          )}

          <SquareDropdown
            options={[{ value: '', label: 'Semua Jabatan' }, ...customRoles.map(r => ({ value: r, label: r }))]}
            value={roleFilter}
            onChange={val => startTransition(() => setRoleFilter(val))}
            searchPlaceholder="Cari Jabatan..."
            widthClass="w-44"
          />

          <SquareDropdown
            options={[{ value: '', label: 'Semua Status' }, { value: 'Aktif', label: 'Aktif' }, { value: 'Nonaktif', label: 'Nonaktif' }]}
            value={statusFilter}
            onChange={val => startTransition(() => setStatusFilter(val))}
            searchPlaceholder="Cari Status..."
            widthClass="w-36"
          />

          <button
            onClick={handleCreate}
            className="flex items-center justify-center gap-1.5 px-4 h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors shadow-sm shrink-0"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Tambah Akun</span>
            <span className="sm:hidden">Tambah</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredUsers}
          isLoading={loading}
          selectedIds={selectedIds}
          onRowClick={(id: any, e: any) => {
            setSelectedIds(prev => {
              const next = new Set(prev);
              if (e.shiftKey && lastSelectedId !== null) {
                const currentIndex = filteredUsers.findIndex(u => u.id === id);
                const lastIndex = filteredUsers.findIndex(u => u.id === lastSelectedId);
                if (currentIndex !== -1 && lastIndex !== -1) {
                  const start = Math.min(currentIndex, lastIndex);
                  const end = Math.max(currentIndex, lastIndex);
                  for (let i = start; i <= end; i++) next.add(filteredUsers[i].id);
                }
              } else if (e.ctrlKey || e.metaKey) {
                if (next.has(id)) next.delete(id);
                else next.add(id);
              } else {
                if (next.has(id) && next.size === 1) {
                  if (e.detail === 1) next.clear();
                } else {
                  next.clear();
                  next.add(id);
                }
              }
              setLastSelectedId(id);
              return next;
            });
          }}
          onRowDoubleClick={id => {
            const user = users.find(u => u.id === id);
            if (user) handleEdit(user);
          }}
          columnWidths={columnWidths}
          onColumnWidthChange={handleResize}
          rowHeight="h-16"
        />
      </div>

      <TableFooter
        totalCount={users.length}
        currentCount={filteredUsers.length}
        label="pengguna"
        selectedCount={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        loadTime={loadTime}
      />

      {showModal && (
        <UserFormModal
          user={editingUser}
          customRoles={customRoles}
          currentUserId={currentUserId}
          onClose={refresh => {
            setShowModal(false);
            if (refresh) {
              loadUsers();
              toast.success(`Data user berhasil ${editingUser ? 'diperbarui' : 'ditambahkan'}.`);
            }
          }}
        />
      )}

      <ConfirmDialog
        isOpen={dialog.isOpen}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        onConfirm={dialog.onConfirm || (() => setDialog(prev => ({ ...prev, isOpen: false })))}
        onCancel={() => setDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
