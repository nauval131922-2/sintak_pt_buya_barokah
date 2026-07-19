'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, CheckCircle, XCircle, RefreshCw, MessageSquare, Bell, BellOff } from 'lucide-react';
import { toast } from '@/lib/toast';
import ConfirmDialog, { DialogType } from '@/components/ConfirmDialog';

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
  const normalized = dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T');
  // DB stores UTC (CURRENT_TIMESTAMP) → parse as UTC → display WIB
  const d = new Date(normalized.endsWith('Z') || normalized.includes('+') ? normalized : normalized + 'Z');
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' }) +
    ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
}

const REFRESH_INTERVAL = 2 * 60; // seconds

export default function TelegramUsersClient() {
  const [users, setUsers] = useState<TelegramUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const lastPendingCountRef = useRef<number>(0);
  const [pushSubscribed, setPushSubscribed] = useState(false);

  const showToast = useCallback((type: 'success' | 'error' | 'warning', message: string) => {
    toast.show(type, message);
  }, []);

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [dialogConfig, setDialogConfig] = useState<{ isOpen: boolean; type: DialogType; title: string; message: string; confirmLabel?: string; onConfirm?: () => void }>({ isOpen: false, type: 'confirm', title: '', message: '' });
  const closeDialog = () => setDialogConfig(prev => ({ ...prev, isOpen: false }));

  const subscribePush = async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission !== 'granted') {
        showToast('error', 'Izin notifikasi ditolak');
        return;
      }

      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        showToast('error', 'Service Worker atau Push tidak didukung browser');
        return;
      }

      await navigator.serviceWorker.register('/sw.js');
      const registration = await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'BGR9pZCmLIDbpXJG7Epd53mpac_BMToDQkhutZEvs4vR6VQpLDABLWRxhvcfbp0ZK-UC5T-luVxbqmfbVQSn2Ss'
      });

      // Send subscription to server
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription })
      });

      const json = await res.json();
      if (json.success) {
        setPushSubscribed(true);
        showToast('success', 'Notifikasi push aktif (bahkan saat tab ditutup)');
      } else {
        showToast('error', 'Gagal subscribe: ' + json.error);
      }
    } catch (err: any) {
      console.error('[PUSH] Subscribe failed:', err);
      showToast('error', 'Gagal subscribe notifikasi: ' + err.message);
    }
  };

  const unsubscribePush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }
      await fetch('/api/push/subscribe', { method: 'DELETE' });
      setPushSubscribed(false);
      showToast('success', 'Notifikasi push dinonaktifkan');
    } catch (err: any) {
      console.error('[PUSH] Unsubscribe failed:', err);
      showToast('error', 'Gagal nonaktifkan: ' + err.message);
    }
  };

  const requestNotificationPermission = subscribePush;

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(async (registration) => {
        const sub = await registration.pushManager.getSubscription();
        if (!sub) return;
        const res = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: sub })
        });
        const json = await res.json();
        if (json.success) setPushSubscribed(true);
      }).catch(() => {});
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/telegram-users/list');
      const json = await res.json();
      if (json.success) {
        setUsers(json.data);
        setLastUpdated(new Date());
        setCountdown(REFRESH_INTERVAL);
      } else {
        showToast('error', json.error || 'Gagal memuat data');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, REFRESH_INTERVAL * 1000);
    return () => clearInterval(interval);
  }, [fetchUsers]);

  // ponytail: countdown tick, separate from fetch interval
  useEffect(() => {
    const tick = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(tick);
  }, []);

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
        showToast('success', `${nama} berhasil di-approve. Notifikasi dikirim.`);
        fetchUsers();
      } else {
        showToast('error', json.error || 'Gagal approve');
      }
    } catch {
      showToast('error', 'Terjadi kesalahan sistem');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = (telegramId: string, nama: string, isPending: boolean) => {
    const msg = isPending
      ? `Tolak permintaan akses dari ${nama}? Data akan dihapus.`
      : `Hapus user ${nama}? Data akan dihapus permanen.`;
    setDialogConfig({
      isOpen: true,
      type: 'danger',
      title: 'Konfirmasi',
      message: msg,
      confirmLabel: 'Ya, Hapus',
      onConfirm: async () => {
        setActionLoading(telegramId);
        try {
          const res = await fetch('/api/telegram-users/reject', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telegram_id: telegramId }),
          });
          const json = await res.json();
          if (json.success) {
            showToast('success', isPending ? `Permintaan dari ${nama} ditolak.` : `${nama} berhasil dihapus.`);
            fetchUsers();
          } else {
            showToast('error', json.error || 'Gagal memproses');
          }
        } catch {
          showToast('error', 'Terjadi kesalahan sistem');
        } finally {
          setActionLoading(null);
        }
        closeDialog();
      }
    });
  };

  const pendingUsers = users.filter(u => u.is_active === 0);
  const activeUsers = users.filter(u => u.is_active === 1);

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-5 border-amber-200/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <MessageSquare size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-amber-600 uppercase leading-tight">Menunggu Persetujuan</p>
              <p className="text-2xl font-black text-amber-700 leading-tight">{pendingUsers.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-5 border-emerald-200/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-emerald-600 uppercase leading-tight">User Aktif</p>
              <p className="text-2xl font-black text-emerald-700 leading-tight">{activeUsers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Permission */}
      {!pushSubscribed && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <Bell size={20} className="text-blue-600 shrink-0" />
          <div className="flex-1">
            <p className="text-[13px] font-bold text-blue-800">Aktifkan Notifikasi Push</p>
            <p className="text-[11px] text-blue-600">Terima notifikasi otomatis bahkan saat tab ditutup</p>
          </div>
          <button
            onClick={requestNotificationPermission}
            className="px-3 py-1.5 text-[11px] font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors shrink-0"
          >
            Aktifkan
          </button>
        </div>
      )}
      {pushSubscribed && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <Bell size={20} className="text-emerald-600 shrink-0" />
          <p className="text-[11px] text-emerald-700 flex-1">✅ Notifikasi push aktif · Anda akan menerima notif bahkan saat tab ditutup</p>
          <button
            onClick={unsubscribePush}
            className="px-3 py-1.5 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors shrink-0"
          >
            Nonaktifkan
          </button>
        </div>
      )}

      {/* Pending Requests */}
      <div className="card overflow-hidden border-gray-200/60 shadow-sm rounded-xl">
        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between gap-3">
          <h2 className="text-[14px] font-bold text-gray-800">Permintaan Pending</h2>
          <div className="flex items-center gap-2 ml-auto">
            <div className="text-right">
              {lastUpdated && (
                <p className="text-[10px] text-gray-400">
                   Update: {lastUpdated.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              )}
              <p className="text-[10px] text-gray-400">
                Refresh dalam: <span className={countdown <= 10 ? 'text-amber-500 font-bold' : ''}>{Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}</span>
              </p>
            </div>
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="p-2 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors shrink-0"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-[13px]">Tidak ada permintaan pending.</div>
        ) : (
          <div className="divide-y divide-gray-50" key={'pending-' + pendingUsers.length + '-' + (pendingUsers[0]?.id || 'none')}>
            {pendingUsers.map(user => (
              <div key={user.telegram_id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50/60 transition-colors">
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <span className="text-[13px] font-bold text-amber-700">{user.nama_karyawan.charAt(0)}</span>
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
                    onClick={() => handleDelete(user.telegram_id, user.nama_karyawan, true)}
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
      <div className="card overflow-hidden border-gray-200/60 shadow-sm rounded-xl">
        <div className="px-4 py-2.5 border-b border-gray-100">
          <h2 className="text-[14px] font-bold text-gray-800">User Aktif</h2>
        </div>

        {activeUsers.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-[13px]">Belum ada user aktif.</div>
        ) : (
          <div className="divide-y divide-gray-50" key={'active-' + activeUsers.length + '-' + (activeUsers[0]?.id || 'none')}>
            {activeUsers.map(user => (
              <div key={user.telegram_id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50/60 transition-colors">
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
                <button
                  onClick={() => handleDelete(user.telegram_id, user.nama_karyawan, false)}
                  disabled={actionLoading === user.telegram_id}
                  className="px-3 py-1.5 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors disabled:opacity-50 flex items-center gap-1 shrink-0"
                >
                  {actionLoading === user.telegram_id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                  Hapus
                </button>
              </div>
            ))}
          </div>
        )}
      <ConfirmDialog
        isOpen={dialogConfig.isOpen}
        type={dialogConfig.type}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmLabel={dialogConfig.confirmLabel}
        onConfirm={() => dialogConfig.onConfirm?.()}
        onCancel={closeDialog}
      />
      </div>
    </div>
  );
}
