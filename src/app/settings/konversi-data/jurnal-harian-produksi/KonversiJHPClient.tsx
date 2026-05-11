'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '@/components/ConfirmDialog';
import ExcelUploadCard from '@/components/ExcelUploadCard';
import { AlertTriangle, FileSpreadsheet, Info, Trash2 } from 'lucide-react';
import { formatLastUpdate } from '@/lib/date-utils';

export default function KonversiJHPClient() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [dialog, setDialog] = useState<{isOpen: boolean, type: 'success' | 'error' | 'alert', title: string, message: string}>({
    isOpen: false, type: 'success', title: '', message: ''
  });
  const [progress, setProgress] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [currentRows, setCurrentRows] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchMetadata() {
      try {
        const res = await fetch('/api/jurnal-harian-produksi?page=1&limit=1');
        const json = await res.json();
        if (json.success && json.lastUpdated) {
          setLastUpdate(json.lastUpdated);
        }
      } catch (e) {}
    }
    fetchMetadata();
  }, []);

  useEffect(() => {
    let interval: any;
    if (status === 'loading' && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else if (status !== 'loading') {
      setElapsedTime(0);
      setStartTime(null);
    }
    return () => clearInterval(interval);
  }, [status, startTime]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleClearData = async () => {
    setIsDeleting(true);
    try {
      const [resJhp, resSopd] = await Promise.all([
        fetch('/api/jurnal-harian-produksi', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clearAll: true })
        }),
        fetch('/api/sopd', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clearAll: true })
        })
      ]);

      if (resJhp.ok && resSopd.ok) {
        setDialog({
          isOpen: true,
          type: 'success',
          title: 'Berhasil',
          message: 'Seluruh data SOPd dan Jurnal Harian Produksi berhasil dikosongkan.'
        });
        setLastUpdate(null);
      } else {
        throw new Error('Gagal mengosongkan salah satu atau seluruh data.');
      }
    } catch (e: any) {
      setDialog({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: e.message || 'Terjadi kesalahan sistem'
      });
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(false);
    }
  };

  const runWorker = (worker: Worker, file: File, arrayBuffer: ArrayBuffer, name: string): Promise<{ status: string, totalImported?: number, reason?: string }> => {
    return new Promise((resolve, reject) => {
      worker.postMessage({ arrayBuffer, filename: file.name, origin: window.location.origin, workerType: name }, [arrayBuffer]);

      worker.onmessage = (e) => {
        const { type, message: workerMsg, error, totalImported, reason, totalRows: rTotal, currentRows: rCurr, progress: p } = e.data;
        if (type === 'status') {
          setMessage(`[${name}] ${workerMsg}`);
          if (rTotal !== undefined) setTotalRows(rTotal);
          if (rCurr !== undefined) setCurrentRows(rCurr);
          if (p !== undefined) setProgress(p);
        } else if (type === 'skip') {
          resolve({ status: 'skipped', reason });
          worker.terminate();
        } else if (type === 'done') {
          resolve({ status: 'success', totalImported });
          worker.terminate();
        } else if (type === 'error') {
          reject(new Error(`[${name}] ${error}`));
          worker.terminate();
        }
      };

      worker.onerror = (err) => {
        reject(new Error(`[${name}] Kesalahan fatal pada worker.`));
        worker.terminate();
      };
    });
  };

  const handleFile = async (file: File) => {
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xls', 'xlsx', 'xlsm'].includes(ext || '')) {
      setStatus('error');
      setMessage('Format file tidak didukung. Gunakan .xls, .xlsx, atau .xlsm');
      return;
    }

    setStatus('loading');
    setMessage('Membaca file Excel (proses ini mungkin memakan waktu)...');
    const startTimeInternal = Date.now();
    setStartTime(startTimeInternal);
    setProgress(0);
    setTotalRows(0);
    setCurrentRows(0);

    try {
      await new Promise(resolve => setTimeout(resolve, 50));
      const arrayBuffer = await file.arrayBuffer();

      // Run SOPD Worker first
      const sopdWorker = new Worker(new URL('../../../jurnal-harian-produksi/excel-worker.ts', import.meta.url));
      const sopdBuffer = arrayBuffer.slice(0); // Create a copy for the first worker
      setProgress(0); setTotalRows(0); setCurrentRows(0);
      const sopdResult = await runWorker(sopdWorker, file, sopdBuffer, 'SOPD');

      // Run JHP Worker next
      const jhpWorker = new Worker(new URL('../../../jurnal-harian-produksi/excel-worker.ts', import.meta.url));
      const jhpBuffer = arrayBuffer.slice(0); // Create another copy
      setProgress(0); setTotalRows(0); setCurrentRows(0);
      const jhpResult = await runWorker(jhpWorker, file, jhpBuffer, 'JURNAL');

      setStatus('idle');
      const finalDuration = formatTime(Math.floor((Date.now() - startTimeInternal) / 1000));
      
      let msg = '';
      if (sopdResult.status === 'success') msg += `✅ ${sopdResult.totalImported} data SOPd berhasil diimpor.\n`;
      else msg += `⚠️ SOPd: ${sopdResult.reason}\n`;

      if (jhpResult.status === 'success') msg += `✅ ${jhpResult.totalImported} data Jurnal Harian berhasil diimpor.\n`;
      else msg += `⚠️ Jurnal: ${jhpResult.reason}\n`;

      msg += `\nDurasi Total: ${finalDuration}`;

      setDialog({
        isOpen: true,
        type: (sopdResult.status === 'skipped' && jhpResult.status === 'skipped') ? 'error' : 'success',
        title: 'Hasil Impor',
        message: msg
      });

      // Refresh metadata
      fetch('/api/jurnal-harian-produksi?page=1&limit=1').then(r => r.json()).then(j => { if (j.success && j.lastUpdated) setLastUpdate(j.lastUpdated); });

    } catch (err: any) {
      console.error('Upload Error:', err);
      setStatus('error');
      setMessage(err.message || 'Terjadi kesalahan saat memproses file.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Warning Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle size={20} className="text-amber-600" />
        </div>
        <div>
          <h4 className="text-[13px] font-bold text-amber-800 mb-1">Perhatian — Fitur Cut-off Data</h4>
          <p className="text-[12px] text-amber-700 leading-relaxed">
            Upload file Excel di sini akan <strong>menghapus seluruh data Jurnal Harian Produksi</strong> yang ada di sistem dan menggantinya dengan isi file yang diupload.
            Gunakan fitur ini hanya saat proses cut-off data (misal: migrasi data historis sebelum Juni 2026).
            Setelah cut-off selesai, input data jurnal harian dilakukan langsung di halaman Jurnal Harian Produksi.
          </p>
        </div>
      </div>

      {/* Info cara penggunaan */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
          <Info size={20} className="text-blue-600" />
        </div>
        <div>
          <h4 className="text-[13px] font-bold text-blue-800 mb-2">Cara Penggunaan (Multi-Sheet)</h4>
          <ol className="text-[12px] text-blue-700 leading-relaxed list-decimal list-inside space-y-1">
            <li>Anda dapat mengunggah satu file Excel yang berisi sheet <strong>SOPD</strong> dan/atau sheet <strong>JURNAL</strong></li>
            <li>Sistem akan memproses sheet SOPD terlebih dahulu (jika ada), lalu melanjutkan ke sheet JURNAL (jika ada)</li>
            <li>Jika salah satu sheet tidak ditemukan, sistem akan melewatinya dan melaporkannya pada hasil akhir</li>
            <li>Upload file Excel (.xls, .xlsx, atau .xlsm) dan tunggu proses selesai</li>
          </ol>
        </div>
      </div>

      {/* Upload Card */}
      <div className="h-[120px] shrink-0">
        <ExcelUploadCard
          title="Upload Master Data (SOPd & Jurnal)"
          description={
            <div className="flex flex-col gap-0.5">
              <span>{status === 'loading' ? `Durasi: ${formatTime(elapsedTime)}` : "Unggah file Excel untuk mengganti data SOPD dan/atau Jurnal Harian Produksi sekaligus."}</span>
              {lastUpdate && status !== 'loading' && (
                <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 leading-none mt-1.5">
                  <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0"></span>
                  <span>Update: {formatLastUpdate(new Date(lastUpdate))}</span>
                </div>
              )}
            </div>
          }

          status={status}
          errorMessage={message}
          onFileSelect={handleFile}
          progress={progress}
          currentRows={currentRows}
          totalRows={totalRows}
          extraAction={
            <button
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 h-11 bg-white border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 hover:text-rose-700 transition-colors text-[13px] font-bold shadow-sm"
            >
              <Trash2 size={16} />
              Kosongkan Data
            </button>
          }
        />
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm}
        type="danger"
        title="Kosongkan Data"
        message="Apakah Anda yakin ingin mengosongkan data SOPd sekaligus Jurnal Harian Produksi? Seluruh rekaman yang ada akan terhapus permanen dan tidak dapat dibatalkan."
        confirmLabel={isDeleting ? "Menghapus..." : "Ya, Kosongkan"}
        cancelLabel="Batal"
        onConfirm={handleClearData}
        onCancel={() => !isDeleting && setDeleteConfirm(false)}
      />

      <ConfirmDialog
        isOpen={dialog.isOpen}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        onConfirm={() => {
          setDialog(prev => ({ ...prev, isOpen: false }));
          router.refresh();
        }}
      />
    </div>
  );
}
