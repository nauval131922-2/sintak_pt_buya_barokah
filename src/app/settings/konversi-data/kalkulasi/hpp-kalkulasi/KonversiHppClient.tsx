'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileSpreadsheet, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function KonversiHppClient() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [dialog, setDialog] = useState<{ isOpen: boolean; type: 'success' | 'error'; title: string; message: string }>({
    isOpen: false, type: 'success', title: '', message: '',
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFile = async (file: File) => {
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xls', 'xlsx', 'xlsm'].includes(ext || '')) {
      setStatus('error');
      setMessage('Format file tidak didukung. Gunakan .xls, .xlsx, atau .xlsm');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const XLSX = await import('xlsx');
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, {
        cellFormula: false, cellHTML: false, cellStyles: false, cellText: false, cellDates: false,
      });

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (rawData.length === 0) throw new Error('File Excel kosong atau format tidak sesuai.');

      const res = await fetch('/api/hpp-kalkulasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, data: rawData }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('idle');
        setDialog({
          isOpen: true, type: 'success', title: 'Berhasil',
          message: `Berhasil mengimpor ${data.imported} data HPP Kalkulasi.`,
        });
      } else {
        setStatus('error');
        setMessage(data.error || data.details || 'Gagal mengimpor data.');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Terjadi kesalahan saat memproses file.');
    }

    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle size={20} className="text-amber-600" />
        </div>
        <div>
          <h4 className="text-[13px] font-bold text-amber-800 mb-1">Perhatian — Perilaku Upload (Upsert)</h4>
          <p className="text-[12px] text-amber-700 leading-relaxed">
            Upload file Excel akan <strong>memperbarui data yang sudah ada</strong> berdasarkan Nama Order,
            dan <strong>menambahkan data baru</strong> yang belum ada. Data HPP yang sudah diisi manual
            dan tidak ada di file Excel <strong>tetap tersimpan dan tidak akan terhapus</strong>.
          </p>
        </div>
      </div>

      {/* Upload card */}
      <div className="relative bg-white border border-gray-100 shadow-sm rounded-xl px-6 py-4 flex items-center justify-between gap-6">
        <div className="flex items-center gap-5 flex-1">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Upload size={24} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-800 leading-none mb-1.5 tracking-tight">Upload HPP Kalkulasi</h3>
            <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
              Unggah file Excel (.xls / .xlsx / .xlsm) yang berisi kolom <strong>Nama Order</strong> dan <strong>HPP Kalkulasi</strong>.
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <input
            type="file"
            accept=".xls,.xlsx,.xlsm"
            className="hidden"
            ref={fileRef}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          <button
            onClick={() => { if (fileRef.current) fileRef.current.value = ''; fileRef.current?.click(); }}
            disabled={status === 'loading'}
            className="px-6 h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold rounded-lg transition-all flex items-center gap-2 disabled:opacity-70 shadow-sm"
          >
            {status === 'loading' ? <Loader2 size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />}
            <span>{status === 'loading' ? 'Mengunggah...' : 'Pilih & Upload Excel'}</span>
          </button>
        </div>

        {status === 'error' && (
          <div className="absolute top-full left-0 right-0 mt-3 p-4 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-[11px] font-bold flex items-start gap-3 animate-in slide-in-from-top-2 z-20">
            <XCircle className="w-4 h-4 shrink-0" />
            <p>{message}</p>
          </div>
        )}
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
          router.refresh();
        }}
      />
    </div>
  );
}
