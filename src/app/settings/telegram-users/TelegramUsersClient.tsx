'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, CheckCircle, XCircle, RefreshCw, MessageSquare } from 'lucide-react';
import Toast from '@/components/Toast';

interface TelegramUser {
  id: number;
  telegram_id: string;
  telegram_username: string;
  nama_karyawan: string;
  posisi: string;
  absensi: string;
  bagian: string;
  is_active: number;
  requested_at: string;
  approved_at: string;
  approved_by: string;
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return '-';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function TelegramUsersClient() {
  const [users, setUsers] = useState<TelegramUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/telegram-users/list');
      const json = await res.json();
      if (json.success) {
        setUsers(json.data);
      } else {
        setToast({ type: 'error', message: json.error || 'Gagal memuat data' });
      }
    } catch {
      setToast({ type: 'error', message: 'Terjadi kesalahan sistem' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleApprove = async (telegramId: string, nama: string) => {
    setActionLoading(telegramId);
    try {
      const res = await fetch('/api/telegram-users/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: telegramId }),
      });
      const json = await res.json();
      if (json.success) {
        setToast({ type: 'success', message: `${nama} berhasil di-approve. Notifikasi dikirim.` });
        fetchUsers();
      } else {
        setToast({ type: 'error', message: json.error || 'Gagal approve' });
      }
    } catch {
      setToast({ type: 'error', message: 'Terjadi kesalahan sistem' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (telegramId: string, nama: string) => {
    if (!window.confirm(`Tolak permintaan akses dari ${nama}? Data akan dihapus.`)) return;
    setActionLoading(telegramId);
    try {
      const res = await fetch('/api/telegram-users/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegram_id: telegramId }),
      });
      const json = await res.json();
      if (json.success) {
        setToast({ type: 'success', message: `Permintaan dari ${nama} ditolak.` });
        fetchUsers();
      } else {
        setToast({ type: 'error', message: json.error || 'Gagal reject' });
      }
    } catch {
      setToast({ type: 'error', message: 'Terjadi kesalahan sistem' });
    } finally {
      setActionLoading(null);
    }
  };

  const pendingUsers = users.filter(u => u.is_active === 0);
  const activeUsers = users.filter(u => u.is_active === 1);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6 space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-amber-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <MessageSquare size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-amber-600 uppercase">Menunggu Persetujuan</p>
              <p className="text-2xl font-black text-amber-700">{pendingUsers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-emerald-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-emerald-600 uppercase">User Aktif</p>
              <p className="text-2xl font-black text-emerald-700">{activeUsers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Requests */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-gray-800">Permintaan Pending</h2>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-[13px]">Tidak ada permintaan pending.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {pendingUsers.map(user => (
              <div key={user.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-amber-700">{user.nama_karyawan.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-gray-800 truncate">{user.nama_karyawan}</p>
                  <p className="text-[11px] text-gray-500 truncate">
                    @{user.telegram_username || user.telegram_id} · {user.bagian} · {user.posisi}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    Request: {formatDateTime(user.requested_at)}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleApprove(user.telegram_id, user.nama_karyawan)}
                    disabled={actionLoading === user.telegram_id}
                    className="px-3 py-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {actionLoading === user.telegram_id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(user.telegram_id, user.nama_karyawan)}
                    disabled={actionLoading === user.telegram_id}
                    className="px-3 py-1.5 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {actionLoading === user.telegram_id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                    Tolak
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Users */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-[14px] font-bold text-gray-800">User Aktif</h2>
        </div>

        {activeUsers.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-[13px]">Belum ada user aktif.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {activeUsers.map(user => (
              <div key={user.id} className="px-5 py-3 flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-emerald-700">{user.nama_karyawan.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-gray-800 truncate">{user.nama_karyawan}</p>
                  <p className="text-[10px] text-gray-500 truncate">
                    @{user.telegram_username || user.telegram_id} · {user.bagian} · {user.posisi}
                  </p>
                </div>
                {user.approved_at && (
                  <p className="text-[10px] text-gray-400 shrink-0 text-right">
                    Approved: {formatDateTime(user.approved_at)}<br />
                    by {user.approved_by}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
