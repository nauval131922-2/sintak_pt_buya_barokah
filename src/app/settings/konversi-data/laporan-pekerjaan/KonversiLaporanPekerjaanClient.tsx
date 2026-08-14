'use client';

import { useState } from 'react';
import { RefreshCw, FileSpreadsheet, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function KonversiLaporanPekerjaanClient() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);

  const handleSyncFresh = async () => {
    if (!confirm('PERINGATAN: Tindakan ini akan MENGHAPUS seluruh data Laporan Pekerjaan saat ini di database SINTAK dan menggantikannya 100% dengan data fresh dari Google Spreadsheet. Yakin ingin melanjutkan?')) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/settings/konversi-data/laporan-pekerjaan', {
        method: 'POST',
      });
      const json = await res.json();
      if (json.success) {
        setResult({
          success: true,
          message: json.message || 'Berhasil mengimpor data fresh dari Google Spreadsheet!',
          count: json.count,
        });
      } else {
        setResult({
          success: false,
          message: json.error || 'Gagal mengimpor data dari Google Spreadsheet.',
        });
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: err.message || 'Terjadi kesalahan jaringan/server.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-6 overflow-y-auto custom-scrollbar p-1">
      {/* Card Utama */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-gray-800">
              Reset & Sync Fresh Data dari Google Spreadsheet
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed max-w-2xl">
              Gunakan fitur ini jika Anda ingin mengosongkan seluruh data Laporan Pekerjaan yang ada di SINTAK dan menarik ulang seluruh data terbaru dari Google Spreadsheet (<code className="text-emerald-700 font-mono bg-emerald-50 px-1 py-0.5 rounded">DATABASE_REPORT</code>).
            </p>
          </div>
        </div>

        {/* Peringatan bahaya */}
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-3 text-amber-800 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Perhatian Penting:</p>
            <ul className="list-disc list-inside space-y-0.5 text-amber-700">
              <li>Semua data Laporan Pekerjaan saat ini di database SINTAK akan dihapus total.</li>
              <li>Sistem akan mendownload CSV live terbaru dari tab <b>DATABASE_REPORT</b>.</li>
              <li>Gunakan fitur ini hanya jika diperlukan untuk reset/cut-off data.</li>
            </ul>
          </div>
        </div>

        {/* Result Message */}
        {result && (
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 text-xs animate-in fade-in duration-300 ${
              result.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {result.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">{result.success ? 'Proses Berhasil!' : 'Proses Gagal'}</p>
              <p className="mt-0.5">{result.message}</p>
              {result.count !== undefined && (
                <p className="mt-1 font-semibold text-emerald-900">
                  Total Data Diimpor: {result.count.toLocaleString('id-ID')} baris.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tombol Eksekusi */}
        <div className="pt-2 flex items-center justify-between border-t border-gray-100">
          <span className="text-xs text-gray-400 font-medium">
            Khusus Super Admin
          </span>
          <button
            type="button"
            onClick={handleSyncFresh}
            disabled={loading}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Sedang Mengimpor Data Fresh...' : 'Tarik Data Fresh Google Spreadsheet'}
          </button>
        </div>
      </div>
    </div>
  );
}
