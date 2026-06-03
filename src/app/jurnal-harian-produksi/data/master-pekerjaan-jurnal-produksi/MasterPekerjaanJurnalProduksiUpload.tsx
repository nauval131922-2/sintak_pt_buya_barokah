'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileSpreadsheet, XCircle, Loader2 } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import ViewActivityLogLink from '@/components/ViewActivityLogLink';

export default function MasterPekerjaanJurnalProduksiUpload() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [dialog, setDialog] = useState<{isOpen: boolean, type: 'success' | 'error', title: string, message: string}>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });
  
  // States for password modal workflow
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [typedPassword, setTypedPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFile = async (file: File, passVal?: string) => {
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
      const formData = new FormData();
      formData.append('file', file);
      if (passVal) {
        formData.append('password', passVal);
      }

      // Kirim file ke API
      const res = await fetch('/api/master-pekerjaan-jurnal-produksi', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (res.status === 401 && (result.error === 'PASSWORD_REQUIRED' || result.error === 'PASSWORD_INCORRECT')) {
        // Simpan file untuk dikirim ulang setelah input sandi
        setPendingFile(file);
        setPasswordError(result.message);
        setStatus('idle');
        setPasswordModalOpen(true);
        return;
      }

      if (res.ok && result.success) {
        setStatus('idle');
        setDialog({
          isOpen: true,
          type: 'success',
          title: 'Berhasil',
          message: `Berhasil mengimpor ${result.imported} data Master Pekerjaan Jurnal Produksi.`,
        });
        setPendingFile(null);
        setTypedPassword('');
        setPasswordError('');
        // Notify other components to refresh
        window.dispatchEvent(new Event('sintak:data-updated'));
        localStorage.setItem('sintak_data_updated', Date.now().toString());
      } else {
        setStatus('error');
        setMessage(result.error || 'Gagal mengimpor data.');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengirim file.';
      console.error('Upload Error:', err);
      setStatus('error');
      setMessage(errorMessage);
    }

    if (fileRef.current) fileRef.current.value = '';
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingFile) {
      setPasswordModalOpen(false);
      handleFile(pendingFile, typedPassword);
    }
  };

  return (
    <div className="h-full shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="relative bg-white border border-gray-100 shadow-sm shadow-green-900/5 rounded-xl px-6 py-4 flex items-center justify-between gap-6 z-50 h-full">
        <div className="flex items-center gap-5 flex-1">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
            <Upload className="text-green-600" size={24} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-800 leading-none mb-1.5 tracking-tight">Upload Master Pekerjaan Jurnal Produksi</h3>
            <p className="text-[11px] text-gray-400 font-medium leading-tight line-clamp-2">
              Unggah file Excel 2026 JADWAL PRODUKSI HARIAN (Sheet: MASTER PEKERJAAN).
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-4">
          <ViewActivityLogLink tableName="master_pekerjaan_jurnal_produksi" />
          <input
            type="file"
            accept=".xls, .xlsx, .xlsm"
            className="hidden"
            ref={fileRef}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={status === 'loading'}
            className={`
              px-6 h-11 rounded-lg font-bold text-[13px] tracking-wide border transition-all flex items-center gap-2 shadow-sm
              ${status === 'loading' 
                ? 'bg-gray-50 text-gray-300 border-gray-100' 
                : 'bg-green-600 text-white border-green-500 hover:bg-green-700 shadow-green-100'}
            `}
          >
            {status === 'loading' ? <Loader2 size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />}
            <span>{status === 'loading' ? 'Mengunggah...' : 'Pilih & Upload Excel'}</span>
          </button>
        </div>

        {status === 'error' && (
          <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-lg shadow-sm text-[11px] font-medium flex items-start gap-2.5 animate-in slide-in-from-top-2 z-20">
            <XCircle className="w-4 h-4 shrink-0 mt-px" />
            <p>{message}</p>
          </div>
        )}
      </div>

      {/* Password Prompt Modal Dialog */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white border border-gray-100 shadow-2xl rounded-2xl p-6 w-[400px] max-w-full animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3.5 mb-4 text-amber-600">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center border border-amber-100">
                <Upload size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800 leading-tight">Dekripsi Berkas Excel</h4>
                <p className="text-[10px] text-gray-400 font-medium">Sandi diperlukan untuk memproses data</p>
              </div>
            </div>

            <p className="text-[12px] text-gray-500 font-medium mb-4 leading-relaxed bg-amber-50/50 border border-amber-100/50 rounded-lg p-3">
              {passwordError}
            </p>

            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-0.5">Sandi Berkas Excel</label>
                <input
                  type="text"
                  autoFocus
                  value={typedPassword}
                  onChange={(e) => setTypedPassword(e.target.value)}
                  placeholder="Masukkan password excel..."
                  className="h-11 px-3 bg-gray-50 border border-gray-200 rounded-lg text-[12px] font-semibold text-gray-700 focus:outline-none focus:border-green-500 focus:bg-white transition-all shadow-inner w-full"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPasswordModalOpen(false);
                    setPendingFile(null);
                    setTypedPassword('');
                  }}
                  className="px-5 h-10 bg-gray-50 border border-gray-100 hover:bg-gray-100 text-gray-500 font-bold rounded-lg text-[11px] tracking-wide uppercase transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 h-10 bg-green-600 border border-green-500 hover:bg-green-700 text-white font-bold rounded-lg text-[11px] tracking-wide uppercase transition-all shadow-sm shadow-green-900/10"
                >
                  Kirim Sandi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
