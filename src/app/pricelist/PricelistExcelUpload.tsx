'use client';

import { useState } from 'react';
import ConfirmDialog from '@/components/ConfirmDialog';
import ExcelUploadCard from '@/components/ExcelUploadCard';
import { parsePricelistWorkbook } from '@/lib/pricelist-parser';
import { formatLastUpdate } from '@/lib/date-utils';
import { Clock, FileText } from 'lucide-react';

interface PricelistExcelUploadProps {
  lastExcelUpdate?: string | null;
  fileName?: string | null;
  onUploadSuccess: () => void;
}

export default function PricelistExcelUpload({ lastExcelUpdate, fileName, onUploadSuccess }: PricelistExcelUploadProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });

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
        cellFormula: false,
        cellHTML: false,
        cellStyles: false,
        cellText: false,
        cellDates: false,
      });

      const parsed = parsePricelistWorkbook(workbook);

      if (parsed.records.length === 0) {
        throw new Error('Tidak ada data tarif yang valid ditemukan pada sheet HARGA.');
      }

      const res = await fetch('/api/pricelist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          records: parsed.records,
          title: parsed.title,
          lastUpdatedDate: parsed.lastUpdatedDate,
          notes: parsed.notes,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('idle');
        setDialog({
          isOpen: true,
          type: 'success',
          title: 'Berhasil',
          message: `Berhasil mengimpor ${data.imported} data Pricelist dari ${file.name}.`,
        });
        onUploadSuccess();
      } else {
        setStatus('error');
        setMessage(data.error || 'Gagal mengimpor data.');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Terjadi kesalahan saat memproses file Excel.');
    }
  };

  return (
    <div className="shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <ExcelUploadCard
        title="Upload Pricelist Excel"
        mobileCollapsedExtra={
          lastExcelUpdate ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex-wrap max-w-full">
              <Clock size={10} className="shrink-0" />
              <span>Update: {formatLastUpdate(lastExcelUpdate)}</span>
            </span>
          ) : null
        }
        description={
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-gray-500">Unggah file Excel pricelist (.xlsx / .xlsm) yang memiliki sheet <strong>HARGA</strong>.</span>
            {lastExcelUpdate && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex-wrap max-w-full leading-normal">
                <Clock size={11} className="shrink-0" />
                <span>Update: {formatLastUpdate(lastExcelUpdate)}</span>
                {fileName && (
                  <>
                    <span className="text-emerald-300">•</span>
                    <FileText size={11} className="shrink-0" />
                    <span className="font-bold text-emerald-800 break-all">{fileName}</span>
                  </>
                )}
              </span>
            )}
          </div>
        }
        status={status}
        errorMessage={message}
        onFileSelect={handleFile}
      />

      <ConfirmDialog
        isOpen={dialog.isOpen}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        onConfirm={() => setDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
