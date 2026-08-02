import { useRef } from 'react';
import { Upload, FileSpreadsheet, XCircle, Loader2 } from 'lucide-react';

interface ExcelUploadCardProps {
  title: string;
  description: React.ReactNode;
  status: 'idle' | 'loading' | 'success' | 'error';
  errorMessage?: string;
  onFileSelect: (file: File) => void;
  acceptedFormats?: string;
  progress?: number;
  currentRows?: number;
  totalRows?: number;
  extraAction?: React.ReactNode;
}

export default function ExcelUploadCard({
  title,
  description,
  status,
  errorMessage,
  onFileSelect,
  acceptedFormats = ".xls, .xlsx, .xlsm",
  progress = 0,
  currentRows = 0,
  totalRows = 0,
  extraAction
}: ExcelUploadCardProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      if (fileRef.current) fileRef.current.value = ''; // Reset input so same file can be uploaded again if needed
    }
  };

  return (
    <div className="relative bg-white/80 backdrop-blur-md border border-white/20 shadow-sm rounded-xl px-4 py-3 flex items-center justify-between gap-6 z-50 h-full">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <Upload size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[12px] font-bold text-gray-800 leading-none mb-1 tracking-tight">{title}</h3>
          <div className="text-[11px] text-gray-400 font-medium leading-relaxed">
            {description}
          </div>

          {status === 'loading' && (
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold tracking-tight">
                <span className="text-emerald-600">
                  Data: {currentRows.toLocaleString('id-ID')} / {totalRows.toLocaleString('id-ID')}
                </span>
                <span className="text-gray-400">{progress}% Selesai</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300 ease-out shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-3">
        {extraAction && (
          <div className="flex items-center">
            {extraAction}
          </div>
        )}
        <input 
          type="file" 
          accept={acceptedFormats}
          className="hidden" 
          ref={fileRef}
          onChange={onFileChange}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={status === 'loading'}
          className="px-5 h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm tracking-wide"
        >
          {status === 'loading' ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <FileSpreadsheet size={16} />
          )}
          <span>{status === 'loading' ? 'Mengunggah...' : 'Pilih & Upload Excel'}</span>
        </button>
      </div>

      {status === 'error' && errorMessage && (
        <div className="absolute top-full left-0 right-0 mt-3 p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl shadow-sm shadow-rose-900/5 text-[11px] font-bold flex items-start gap-2 animate-in slide-in-from-top-2 z-20">
          <XCircle className="w-4 h-4 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}
    </div>
  );
}



