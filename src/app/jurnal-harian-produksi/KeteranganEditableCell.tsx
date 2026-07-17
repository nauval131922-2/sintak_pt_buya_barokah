'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, ClipboardList, Copy, Pencil } from 'lucide-react';

// Editable cell untuk kolom Keterangan di tabel Jurnal Harian Produksi.
// Diekstrak dari JurnalClient.tsx agar komponen utama lebih ramping.
// ponytail: single return agar React tidak mount/unmount node berbeda (cegah insertBefore NotFoundError).

export default function KeteranganEditableCell({
  row,
  onSave,
  canEdit,
  pasteActive = false,
  copiedValue,
  onCopyValue,
  onPasteDone,
}: {
  row: any;
  onSave: (id: number | string, value: string) => Promise<boolean>;
  canEdit: boolean;
  pasteActive?: boolean;
  copiedValue?: string | null;
  onCopyValue?: (value: string) => void;
  onPasteDone?: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState('');
  const [localVal, setLocalVal] = useState<string>(row.keterangan || '');
  const [isSaving, setIsSaving] = useState(false);
  const isSavingGuard = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync localVal jika data dari luar berubah (misal setelah refresh)
  useEffect(() => {
    setLocalVal(row.keterangan || '');
  }, [row.keterangan]);

  // Tutup editing saat mode paste aktif
  useEffect(() => {
    if (pasteActive) setIsEditing(false);
  }, [pasteActive]);

  const handleSave = useCallback(async () => {
    if (isSavingGuard.current) return;
    isSavingGuard.current = true;
    setIsEditing(false);

    // Tidak ada perubahan — tutup saja
    if (value === (row.keterangan || '')) {
      setTimeout(() => { isSavingGuard.current = false; }, 300);
      return;
    }

    setIsSaving(true);
    setLocalVal(value); // optimistic update

    const success = await onSave(row.id, value);
    if (!success) {
      setLocalVal(row.keterangan || ''); // rollback
    }

    setIsSaving(false);
    setTimeout(() => { isSavingGuard.current = false; }, 300);
  }, [value, row.id, row.keterangan, onSave]);

  // Tutup saat klik di luar
  useEffect(() => {
    if (!isEditing) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && wrapperRef.current.contains(e.target as HTMLElement)) return;
      handleSave();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isEditing, handleSave]);

  return (
    <div className="relative w-full min-h-[24px]">
      {/* Read-only */}
      {!canEdit && (
        <span className="font-medium text-gray-500 truncate block">
          {localVal || '-'}
        </span>
      )}

      {/* Saving indicator */}
      {canEdit && isSaving && (
        <div className="flex items-center gap-1.5 text-emerald-600 animate-pulse">
          <Loader2 size={12} className="animate-spin shrink-0" />
          <span className="text-[11px] font-bold">Menyimpan...</span>
        </div>
      )}

      {/* Editing input */}
      {canEdit && !isSaving && isEditing && (
        <div ref={wrapperRef} className="relative w-full z-[999]">
          <input
            ref={inputRef}
            type="text"
            autoFocus
            value={value}
            onChange={e => setValue(e.target.value)}
            onClick={e => e.stopPropagation()}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); handleSave(); }
              if (e.key === 'Escape') {
                isSavingGuard.current = true;
                setIsEditing(false);
                setTimeout(() => { isSavingGuard.current = false; }, 300);
              }
            }}
            className="w-full px-2 py-1 text-[12px] font-medium text-gray-800 bg-yellow-50 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400/40 transition-all"
            placeholder="Ketik keterangan..."
          />
        </div>
      )}

      {/* Paste mode */}
      {canEdit && !isSaving && !isEditing && pasteActive && (
        <div className="flex items-center gap-1 select-none">
          <span className={`font-medium truncate flex-1 text-[12px] ${localVal ? 'text-gray-600' : 'text-gray-300 italic'}`}>
            {localVal || '—'}
          </span>
          <button
            onClick={async e => {
              e.stopPropagation();
              if (copiedValue !== undefined && copiedValue !== null) {
                setIsSaving(true);
                setLocalVal(copiedValue);
                const success = await onSave(row.id, copiedValue);
                if (!success) setLocalVal(row.keterangan || '');
                setIsSaving(false);
              }
            }}
            className="p-1 rounded-md text-emerald-400 hover:text-emerald-600 hover:bg-emerald-100 transition-all shrink-0"
            title="Tempel keterangan yang di-copy"
            tabIndex={-1}
          >
            <ClipboardList size={11} />
          </button>
        </div>
      )}

      {/* Normal display */}
      {canEdit && !isSaving && !isEditing && !pasteActive && (
        <div
          className="group flex items-center gap-1 cursor-pointer rounded-md px-1 -mx-1 hover:bg-yellow-50 transition-colors"
          onDoubleClick={e => {
            e.stopPropagation();
            isSavingGuard.current = false;
            setValue(localVal);
            setIsEditing(true);
          }}
          title="Klik 2x untuk edit keterangan"
        >
          <span className={`font-medium truncate flex-1 text-[12px] ${localVal ? 'text-gray-600' : 'text-gray-300 italic'}`}>
            {localVal || 'klik 2x untuk isi'}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onCopyValue?.(localVal); }}
            className="p-1 rounded-md text-gray-300 hover:text-yellow-500 hover:bg-yellow-100 transition-all shrink-0"
            title="Copy keterangan"
            tabIndex={-1}
          >
            <Copy size={10} />
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              isSavingGuard.current = false;
              setValue(localVal);
              setIsEditing(true);
            }}
            className="p-1 rounded-md text-gray-300 hover:text-yellow-500 hover:bg-yellow-100 transition-all shrink-0"
            title="Edit keterangan"
            tabIndex={-1}
          >
            <Pencil size={10} />
          </button>
        </div>
      )}
    </div>
  );
}
