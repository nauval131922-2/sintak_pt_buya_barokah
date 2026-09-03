'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home, Loader2 } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Global Error Boundary caught an error:', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-900/10 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="max-w-lg w-full bg-white border border-slate-200/80 shadow-2xl rounded-2xl overflow-hidden">
        {/* Header Strip */}
        <div className="h-2 bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500" />
        
        <div className="p-6 sm:p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-5 border border-rose-200/60 shadow-xs">
            <AlertTriangle className="w-8 h-8 stroke-[2.2]" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight mb-2">
            Terjadi Kendala Teknis
          </h2>
          
          <p className="text-slate-500 font-medium text-xs sm:text-sm mb-6 max-w-sm leading-relaxed">
            Sistem mendeteksi kendala pada halaman ini. Anda dapat mencoba memuat ulang data atau kembali ke Dashboard.
          </p>

          {process.env.NODE_ENV === 'development' && (
            <div className="w-full bg-slate-950 rounded-xl p-4 mb-6 text-left overflow-auto max-h-40 border border-slate-800 shadow-inner">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
                <span className="text-[10px] font-bold text-rose-400 font-mono">DEBUG ERROR LOG</span>
                <span className="text-[10px] text-slate-500 font-mono">{error.name || 'Error'}</span>
              </div>
              <p className="text-[11px] font-mono text-rose-300/90 whitespace-pre-wrap break-words leading-relaxed">
                {error.message}
                {error.digest && `\nDigest: ${error.digest}`}
              </p>
            </div>
          )}

          <div className="w-full flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="w-full sm:flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs text-xs cursor-pointer active:scale-98"
            >
              <RefreshCw className="w-4 h-4" />
              Coba Muat Ulang
            </button>

            <button
              type="button"
              onClick={() => window.location.href = '/dashboard'}
              className="w-full sm:flex-1 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2 text-xs cursor-pointer active:scale-98"
            >
              <Home className="w-4 h-4 text-slate-500" />
              Ke Dashboard
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 w-full flex items-center justify-between text-[10.5px] font-semibold text-slate-400">
            <span>SINTAK &bull; PT Buya Barokah</span>
            <span>Pricelist & ERP System</span>
          </div>
        </div>
      </div>
    </div>
  );
}



