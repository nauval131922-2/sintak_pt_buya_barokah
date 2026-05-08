'use client';

import { useState, useEffect } from 'react';
import ConfirmDialog from '@/components/ConfirmDialog';
import ExcelUploadCard from '@/components/ExcelUploadCard';
import { AlertTriangle, Info } from 'lucide-react';
import { formatLastUpdate } from '@/lib/date-utils';

export default function KonversiSopdClient() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [dialog, setDialog] = useState<{isOpen: boolean, type: 'success' | 'error', title: string, message: string}>({
    isOpen: false, type: 'success', title: '', message: ''
  });
  const [progress, setProgress] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [currentRows, setCurrentRows] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMetadata() {
      try {
        const res = await fetch('/api/sopd?page=1&limit=1');
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

  const handleFile = async (file: File) => {
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xls', 'xlsx', 'xlsm'].includes(ext || '')) {
      setStatus('error');
      setMessage('Format file tidak didukung. Gunakan .xls, .xlsx, atau .xlsm');
      return;
    }

    setStatus('loading');
    setMessage('Membaca file Excel...');
    const startTimeInternal = Date.now();
    setStartTime(startTimeInternal);
    setProgress(0);
    setTotalRows(0);
    setCurrentRows(0);

    try {
      await new Promise(resolve => setTimeout(resolve, 50));

      const arrayBuffer = await file.arrayBuffer();
      const worker = new Worker(
        new URL('./sopd-excel-worker.ts', import.meta.url)
      );

      worker.postMessage({ arrayBuffer, filename: file.name, origin: window.location.origin }, [arrayBuffer]);

      worker.onmessage = (e) => {
        const { type, message, error, totalImported, totalRows: rowsTotal, currentRows: rowsCurrent, progress: p } = e.data;

        if (type === 'status') {
          if (message) setMessage(message);
          if (rowsTotal) setTotalRows(rowsTotal);
          if (rowsCurrent) setCurrentRows(rowsCurrent);
          if (p !== undefined) setProgress(p);
        } else if (type === 'done') {
          setStatus('idle');
          const finalDuration = formatTime(Math.floor((Date.now() - startTimeInternal) / 1000));
          setDialog({
            isOpen: true,
            type: 'success',
            title: 'Berhasil',
            message: `Berhasil mengimpor ${totalImported} data SOPd dalam waktu ${finalDuration}.`
          });
          fetch('/api/sopd?page=1&limit=1')
            .then(r => r.json())
            .then(j => { if (j.success && j.lastUpdated) setLastUpdate(j.lastUpdated); });
          worker.terminate();
        } else if (type === 'error') {
          setStatus('error');
          setMessage(error || 'Gagal memproses file Excel');
          worker.terminate();
        }
      };

      worker.onerror = (err) => {
        console.error('Worker Error:', err);
        setStatus('error');
        setMessage('Terjadi kesalahan fatal pada sistem upload background.');
        worker.terminate();
      };

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
          <h4 className="text-[13px] font-bold text-amber-800 mb-1">Perhatian — Sinkronisasi Database SOPd</h4>
          <p className="text-[12px] text-amber-700 leading-relaxed">
            Upload file Excel di sini akan <strong>menghapus seluruh database SOPd yang ada</strong> dan menggantinya dengan isi file yang diupload.
            Pastikan file yang diupload adalah versi terbaru untuk menjaga konsistensi referensi nomor order di sistem.
          </p>
        </div>
      </div>

      {/* Info cara penggunaan */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
          <Info size={20} className="text-blue-600" />
        </div>
        <div>
          <h4 className="text-[13px] font-bold text-blue-800 mb-2">Cara Penggunaan</h4>
          <ol className="text-[12px] text-blue-700 leading-relaxed list-decimal list-inside space-y-1">
            <li>Pastikan file Excel memiliki sheet bernama <strong>SOPD</strong></li>
            <li>Sheet harus memiliki baris header pada baris ke-5 yang mengandung kolom <strong>No. Order</strong> dan <strong>Nama Order</strong></li>
            <li>Sistem juga akan mengambil kolom <strong>Jumlah Order, Satuan, Perkiraan Harga, Keterangan, Deadline,</strong> dan <strong>Selesai</strong></li>
            <li>Upload file Excel (.xls, .xlsx, atau .xlsm)</li>
            <li>Seluruh database SOPd akan diganti dengan isi file yang diupload</li>
          </ol>
        </div>
      </div>

      {/* Upload Card */}
      <div className="h-[120px] shrink-0">
        <ExcelUploadCard
          title="Sinkronisasi Data SOPd"
          description={
            <div className="flex flex-col gap-0.5">
              <span>{status === 'loading' ? `Durasi: ${formatTime(elapsedTime)}` : 'Unggah file Excel untuk memperbarui database Order Produksi sebagai referensi Jurnal Harian.'}</span>
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
          progress={progress}
          currentRows={currentRows}
          totalRows={totalRows}
          onFileSelect={handleFile}
        />
      </div>

      <ConfirmDialog 
        isOpen={dialog.isOpen}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        onConfirm={() => {
          setDialog(prev => ({ ...prev, isOpen: false }));
          window.dispatchEvent(new Event('sintak:data-updated'));
          localStorage.setItem('sintak_data_updated', Date.now().toString());
        }}
      />
    </div>
  );
}
