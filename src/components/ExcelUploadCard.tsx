import { useState, useRef, useEffect } from 'react';
import { Upload, FileSpreadsheet, XCircle, Loader2, ChevronDown } from 'lucide-react';

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
  storageKey?: string;
  mobileCollapsedExtra?: React.ReactNode;
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
  extraAction,
  storageKey,
  mobileCollapsedExtra,
}: ExcelUploadCardProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const effectiveKey = storageKey ? `upload_card_open_${storageKey}` : `upload_card_open_${title.toLowerCase().replace(/\s+/g, '_')}`;

  // Default mobile: collapse (false)
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(effectiveKey);
      if (saved !== null) {
        setIsOpenMobile(saved === 'true');
      }
    } catch (_) {}
  }, [effectiveKey]);

  const toggleOpenMobile = () => {
    setIsOpenMobile((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(effectiveKey, String(next));
      } catch (_) {}
      return next;
    });
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      if (fileRef.current) fileRef.current.value = ''; // Reset input so same file can be uploaded again if needed
    }
  };

  return (
    <div className="relative bg-white/80 backdrop-blur-md border border-white/20 shadow-sm rounded-xl p-3 sm:px-4 sm:py-3 z-50 h-full">
      {/* Mobile Header / Toggle Bar */}
      <div
        onClick={toggleOpenMobile}
        className="flex items-center justify-between gap-3 sm:hidden cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Upload size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[13px] font-bold text-gray-800 leading-tight">{title}</h3>
            {!isOpenMobile && mobileCollapsedExtra && (
              <div className="mt-1">
                {mobileCollapsedExtra}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          aria-label="Toggle upload card"
          className="p-1 text-gray-400 hover:text-gray-700 bg-gray-50 rounded-lg border border-gray-100 shrink-0 transition-transform duration-200"
        >
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${isOpenMobile ? 'rotate-180 text-emerald-600' : ''}`}
          />
        </button>
      </div>

      {/* Accordion Content on Mobile, Always visible on Desktop/Tablet */}
      <div
        className={`${
          isOpenMobile ? 'flex' : 'hidden'
        } sm:flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6 mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100`}
      >
        <div className="hidden sm:flex items-start sm:items-center gap-3 sm:gap-4 flex-1">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Upload size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[13px] sm:text-[14px] font-bold text-gray-800 leading-snug sm:leading-none mb-1 sm:mb-1.5 tracking-tight">
              {title}
            </h3>
            <div className="text-[11px] sm:text-[12px] text-gray-500 font-medium leading-relaxed">
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

        {/* Mobile Description & Progress inside Accordion */}
        <div className="sm:hidden min-w-0 flex-1 space-y-2">
          <div className="text-[11px] text-gray-500 font-medium leading-relaxed">
            {description}
          </div>

          {status === 'loading' && (
            <div className="space-y-1.5">
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

        <div className="shrink-0 flex items-center gap-2 sm:gap-3 w-full sm:w-auto pt-1 sm:pt-0">
          {extraAction && (
            <div className="flex items-center flex-1 sm:flex-initial">
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
            className="w-full sm:w-auto px-4 sm:px-5 h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm tracking-wide"
          >
            {status === 'loading' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FileSpreadsheet size={16} />
            )}
            <span>{status === 'loading' ? 'Mengunggah...' : 'Pilih & Upload Excel'}</span>
          </button>
        </div>
      </div>

      {status === 'error' && errorMessage && (
        <div className="mt-3 p-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl shadow-sm shadow-rose-900/5 text-[11px] font-bold flex items-start gap-2 animate-in slide-in-from-top-2 z-20">
          <XCircle className="w-4 h-4 shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}
    </div>
  );
}
