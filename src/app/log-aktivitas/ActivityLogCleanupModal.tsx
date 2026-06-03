'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Database, Cpu, X } from 'lucide-react';
import { cleanupActivityLogs } from '@/lib/actions';

export default function ActivityLogCleanupModal({
  isOpen,
  onClose,
  onDone,
}: {
  isOpen: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const router = useRouter();
  const [cleanupDays, setCleanupDays] = useState(7);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<{
    deletedCount: number;
    countAfter: number;
    initialSizeMb: number;
    finalSizeMb: number;
    savedSizeMb: number;
    vacuumDurationSec: number;
  } | null>(null);
  const [cleanupError, setCleanupError] = useState<string | null>(null);
  const [cleanupProgress, setCleanupProgress] = useState(0);
  const [cleanupStatus, setCleanupStatus] = useState('Menghubungkan ke database...');
  const [cleanupTimer, setCleanupTimer] = useState(0);

  if (!isOpen) return null;

  const handleCleanup = async () => {
    setIsCleaningUp(true);
    setCleanupError(null);
    setCleanupResult(null);
    setCleanupProgress(0);
    setCleanupTimer(0);
    let currentProgress = 0;
    let secondsElapsed = 0;
    const interval = setInterval(() => {
      secondsElapsed += 0.1;
      setCleanupTimer(secondsElapsed);
      if (currentProgress < 15) currentProgress += 1.5;
      else if (currentProgress < 40) currentProgress += 0.8;
      else if (currentProgress < 65) currentProgress += 0.5;
      else if (currentProgress < 90) currentProgress += 0.2;
      else if (currentProgress < 98) currentProgress += 0.05;
      setCleanupProgress(Math.min(Math.round(currentProgress), 98));
    }, 100);

    try {
      const res = await cleanupActivityLogs(cleanupDays);
      clearInterval(interval);
      if (res.success) {
        setCleanupProgress(100);
        await new Promise((r) => setTimeout(r, 600));
        setCleanupResult(res);
        router.refresh();
        onDone();
      } else {
        setCleanupError('Terjadi kesalahan yang tidak diketahui.');
      }
    } catch (err: unknown) {
      clearInterval(interval);
      setCleanupError(err instanceof Error ? err.message : 'Gagal membersihkan log.');
    } finally {
      setIsCleaningUp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-md border border-gray-100 w-full max-w-md overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-rose-50 flex items-center justify-center text-rose-600">
              <Database size={20} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-800">Pembersihan Database</h4>
              <p className="text-[11px] text-gray-400 font-bold">Hapus log aktivitas lama</p>
            </div>
          </div>
          <button
            disabled={isCleaningUp}
            onClick={onClose}
            className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center hover:bg-red-50 text-gray-400"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {isCleaningUp ? (
            <div className="py-8 text-center">
              <p className="text-4xl font-extrabold font-mono">{cleanupProgress}%</p>
              <p className="text-xs font-bold text-gray-600 mt-2">{cleanupStatus}</p>
            </div>
          ) : !cleanupResult ? (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">
                Log lebih dari 90 hari (selain DELETE) diarsip otomatis ke <code className="text-rose-600">activity_logs_archive</code>.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[3, 7, 15, 30, 90, 0].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setCleanupDays(v)}
                    className={`p-2.5 rounded-xl border text-[11px] font-bold text-left ${
                      cleanupDays === v ? 'bg-rose-50 border-rose-300 text-rose-700' : 'border-gray-100 text-gray-600'
                    }`}
                  >
                    {v === 0 ? 'Hapus semua' : `Simpan ${v} hari`}
                  </button>
                ))}
              </div>
              {cleanupError && <p className="text-xs text-red-600 font-bold">{cleanupError}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-gray-50 rounded-xl text-xs font-bold text-gray-500">Batal</button>
                <button type="button" onClick={handleCleanup} className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold">Bersihkan</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              <Cpu size={32} className="mx-auto text-emerald-600" />
              <p className="text-sm font-bold">Selesai — {cleanupResult.deletedCount.toLocaleString('id-ID')} baris dihapus</p>
              <button type="button" onClick={onClose} className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold">Tutup</button>
            </div>
          )}
        </div>
      </div>
      {!isCleaningUp && <div className="absolute inset-0 -z-10" onClick={onClose} />}
    </div>
  );
}
