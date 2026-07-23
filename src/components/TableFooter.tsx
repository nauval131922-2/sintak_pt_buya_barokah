'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TableFooterProps {
  totalCount: number;
  currentCount: number;
  label: string;
  selectedCount?: number;
  onClearSelection?: () => void;
  loadTime?: number | null;
  // Pagination props
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export default function TableFooter({
  totalCount,
  currentCount,
  label,
  selectedCount = 0,
  onClearSelection,
  loadTime,
  page,
  totalPages,
  onPageChange
}: TableFooterProps) {
  return (
    <div className="flex items-center justify-between shrink-0 px-2 min-h-[30px]">
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-bold text-gray-400 tracking-wide">
          {totalCount === 0 ? `Tidak ada ${label}` : `Menampilkan ${currentCount} dari ${totalCount} ${label}`}
        </span>

        {loadTime !== null && loadTime !== undefined && (
          <div className={`text-[9px] px-2 py-1 rounded-full font-bold flex items-center gap-1.5 border tracking-wide shadow-sm ${
            loadTime < 300  ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
            loadTime < 1000 ? 'bg-amber-50 text-amber-600 border-amber-100' :
                              'bg-red-50 text-red-600 border-red-100'
          }`}>
            <span className="animate-pulse">⚡</span>
            <span className="leading-none">{(loadTime / 1000).toFixed(2)}s</span>
          </div>
        )}
        
        {selectedCount > 0 && (
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 tracking-wide shadow-sm">
              {selectedCount} dipilih
            </span>
            <button 
              onClick={onClearSelection}
              className="text-[11px] font-bold text-gray-400 hover:text-red-600 tracking-wide transition-colors"
            >
              Batal
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        {/* Pagination Controls */}
        {page !== undefined && totalPages !== undefined && onPageChange && (
          <div className="flex items-center gap-1">
            {/* First + Prev */}
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(1)}
              suppressHydrationWarning
              className="min-w-[32px] h-8 px-2 flex items-center justify-center text-[12px] font-bold border border-gray-100 bg-white hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 rounded-lg disabled:opacity-30 transition-all shadow-sm"
              title="Halaman Pertama"
            >«</button>
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="w-8 h-8 flex items-center justify-center border border-gray-100 bg-white hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 rounded-lg disabled:opacity-30 transition-all shadow-sm"
              title="Halaman Sebelumnya"
            ><ChevronLeft size={14} /></button>

            {/* Page number buttons */}
            {(() => {
              const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [];
              const delta = 2; // pages around current
              const rangeStart = Math.max(2, page - delta);
              const rangeEnd = Math.min(totalPages - 1, page + delta);

              pages.push(1);
              if (rangeStart > 2) pages.push('ellipsis-start');
              for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
              if (rangeEnd < totalPages - 1) pages.push('ellipsis-end');
              if (totalPages > 1) pages.push(totalPages);

              return pages.map((p, i) => {
                if (p === 'ellipsis-start' || p === 'ellipsis-end') {
                  return (
                    <span key={`${p}-${i}`} className="min-w-[32px] h-8 flex items-center justify-center text-[12px] text-gray-400 font-bold">
                      …
                    </span>
                  );
                }
                const isActive = p === page;
                return (
                  <button
                    key={p}
                    onClick={() => onPageChange(p as number)}
                    suppressHydrationWarning
                    className={`min-w-[32px] h-8 px-2 flex items-center justify-center text-[12px] font-bold rounded-lg border transition-all shadow-sm ${
                      isActive
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-100'
                        : 'bg-white border-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100'
                    }`}
                  >
                    {p}
                  </button>
                );
              });
            })()}

            {/* Next + Last */}
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="w-8 h-8 flex items-center justify-center border border-gray-100 bg-white hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 rounded-lg disabled:opacity-30 transition-all shadow-sm"
              title="Halaman Berikutnya"
            ><ChevronRight size={14} /></button>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(totalPages)}
              suppressHydrationWarning
              className="min-w-[32px] h-8 px-2 flex items-center justify-center text-[12px] font-bold border border-gray-100 bg-white hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100 rounded-lg disabled:opacity-30 transition-all shadow-sm"
              title="Halaman Terakhir"
            >»</button>
          </div>
        )}


      </div>
    </div>

  );
}



